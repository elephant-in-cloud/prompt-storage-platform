// API Route для работы с сохраненными ответами: GET (список)
// Поддерживает фильтрацию по промту и пагинацию

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES, formatSupabaseError } from '@/lib/error-messages'

/**
 * GET /api/saved-responses
 * Получение списка сохраненных ответов с фильтрацией
 * Query параметры:
 * - prompt_id: фильтр по промту
 * - limit: количество записей (по умолчанию 20)
 * - offset: смещение для пагинации (по умолчанию 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('prompt_id')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    // Создание серверного клиента
    const supabase = await createClient()
    
    // Получение текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 401 }
      )
    }
    
    // Построение запроса с join к промту
    let queryBuilder = supabase
      .from('saved_responses')
      .select(`
        *,
        prompts:prompt_id (
          id,
          title,
          owner_id
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Фильтр по промту (если указан)
    if (promptId) {
      queryBuilder = queryBuilder.eq('prompt_id', promptId)
    }
    
    // Выполнение запроса
    const { data, error, count } = await queryBuilder
    
    if (error) {
      console.error('Ошибка получения сохраненных ответов:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      data,
      count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Неожиданная ошибка в GET /api/saved-responses:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}

