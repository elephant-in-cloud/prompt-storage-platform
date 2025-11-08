// Edge Function для запуска промтов через OpenRouter API
// Поддерживает timeout 150 секунд, логирование и сохранение ответов

import { createClient } from 'npm:@supabase/supabase-js@2'

// Типы для запроса и ответа
interface RunPromptRequest {
  prompt_id: string
  model?: string
  temperature?: number
  save_response?: boolean
}

interface RunPromptResponse {
  status: 'ok' | 'error'
  output_markdown?: string
  meta?: {
    duration_ms: number
    log_id?: string
  }
  error?: string
  log_id?: string
}

// CORS заголовки для разрешения запросов с фронтенда
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ====================================
// MAIN HANDLER
// ====================================

Deno.serve(async (req: Request): Promise<Response> => {
  // Обработка preflight CORS запроса
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // КРИТИЧНО: Создание Supabase клиента с auth контекстом пользователя
    // Это необходимо для применения RLS политик
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')!
        }
      }
    })

    // Получение и проверка текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: 'Необходима авторизация' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Парсинг тела запроса
    const requestBody: RunPromptRequest = await req.json()
    const { prompt_id, model, temperature, save_response = false } = requestBody

    // Валидация обязательных параметров
    if (!prompt_id) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: 'Отсутствует prompt_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Загрузка промта из базы данных (RLS применяется автоматически)
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', prompt_id)
      .single()

    if (promptError || !prompt) {
      console.error('Prompt fetch error:', promptError)
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: 'Промт не найден или недоступен' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Определение модели и температуры с приоритетами: запрос → промт → пользователь → глобальные
    let finalModel = model || prompt.recommended_model
    let finalTemperature = temperature ?? prompt.recommended_temperature

    // Если модель/температура не указаны, загружаем из профиля пользователя
    if (!finalModel || finalTemperature === null || finalTemperature === undefined) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_model, preferred_temperature')
        .eq('id', user.id)
        .single()

      if (!finalModel) {
        finalModel = profile?.preferred_model
      }
      if (finalTemperature === null || finalTemperature === undefined) {
        finalTemperature = profile?.preferred_temperature
      }
    }

    // Если всё ещё не указаны, загружаем глобальные настройки
    if (!finalModel || finalTemperature === null || finalTemperature === undefined) {
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['default_model', 'default_temperature'])

      const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || [])
      
      if (!finalModel) {
        finalModel = settingsMap.get('default_model') || 'google/gemini-2.0-flash'
      }
      if (finalTemperature === null || finalTemperature === undefined) {
        finalTemperature = parseFloat(settingsMap.get('default_temperature') || '0.7')
      }
    }

    // Генерация уникального log_id для отслеживания
    const logId = crypto.randomUUID()
    const startTime = Date.now()

    try {
      // Вызов OpenRouter API с timeout 150 секунд
      const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')
      
      if (!openrouterKey) {
        throw new Error('OPENROUTER_API_KEY не настроен')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 150000) // 150 секунд

      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': supabaseUrl,
          'X-Title': 'Prompt Storage Platform',
        },
        body: JSON.stringify({
          model: finalModel,
          messages: [
            {
              role: 'user',
              content: prompt.body
            }
          ],
          temperature: finalTemperature,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!openrouterResponse.ok) {
        const errorText = await openrouterResponse.text()
        throw new Error(`OpenRouter API error: ${openrouterResponse.status} - ${errorText}`)
      }

      const result = await openrouterResponse.json()
      const outputMarkdown = result.choices?.[0]?.message?.content || ''
      const durationMs = Date.now() - startTime

      // Логирование успешного выполнения
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'run',
        target_table: 'prompts',
        target_id: prompt_id,
        model: finalModel,
        temperature: finalTemperature,
        duration_ms: durationMs,
        status: 'ok',
        meta: { log_id: logId },
      })

      // Сохранение ответа (если запрошено)
      let savedResponseId: string | null = null
      if (save_response && outputMarkdown) {
        const { data: savedResponse } = await supabase
          .from('saved_responses')
          .insert({
            prompt_id,
            user_id: user.id,
            model: finalModel!,
            temperature: finalTemperature!,
            output_markdown: outputMarkdown,
            metadata: {
              duration_ms: durationMs,
              openrouter_id: result.id,
            },
          })
          .select('id')
          .single()

        savedResponseId = savedResponse?.id || null

        // Логирование сохранения ответа
        if (savedResponseId) {
          await supabase.from('audit_logs').insert({
            actor_id: user.id,
            action: 'save_response',
            target_table: 'saved_responses',
            target_id: savedResponseId,
            meta: { prompt_id },
            status: 'ok',
          })
        }
      }

      // Успешный ответ
      const response: RunPromptResponse = {
        status: 'ok',
        output_markdown: outputMarkdown,
        meta: {
          duration_ms: durationMs,
          log_id: logId,
        },
      }

      if (savedResponseId) {
        response.meta!['saved_response_id'] = savedResponseId
      }

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } catch (error) {
      const durationMs = Date.now() - startTime
      let errorMessage = 'Неизвестная ошибка'

      // Обработка разных типов ошибок
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = `Превышено время ожидания ответа (150 сек). ID: ${logId}`
        } else {
          errorMessage = `Ошибка: ${error.message}. ID: ${logId}`
        }
      }

      console.error('Run error:', error)

      // Логирование ошибки
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'run',
        target_table: 'prompts',
        target_id: prompt_id,
        model: finalModel,
        temperature: finalTemperature,
        duration_ms: durationMs,
        status: 'error',
        error_message: errorMessage,
        meta: { log_id: logId },
      })

      return new Response(
        JSON.stringify({
          status: 'error',
          error: errorMessage,
          log_id: logId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error instanceof Error ? error.message : 'Неожиданная ошибка',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

