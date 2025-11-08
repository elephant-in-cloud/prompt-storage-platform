// API Route для работы с конкретным промтом: GET, PUT, DELETE
// Поддерживает логику копирования публичных промтов при редактировании

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { promptSchema } from '@/lib/validations'
import { logPromptEdit, logPromptDelete } from '@/lib/audit-logger'
import { ERROR_MESSAGES, formatSupabaseError, CONFIRMATION_MESSAGES } from '@/lib/error-messages'

// ====================================
// GET /api/prompts/[id] - Получение конкретного промта
// ====================================

/**
 * GET обработчик для получения промта по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Создание серверного клиента
    const supabase = await createServerClient()
    
    // Получение текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 401 }
      )
    }
    
    // Получение промта с информацией о владельце и тегах
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        profiles:owner_id (
          id,
          display_name,
          is_admin
        ),
        prompt_tags (
          tag
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: ERROR_MESSAGES.PROMPT_NOT_FOUND },
          { status: 404 }
        )
      }
      console.error('Ошибка получения промта:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 }
      )
    }
    
    // Форматирование ответа
    const formattedData = {
      ...data,
      owner: data.profiles,
      tags: data.prompt_tags?.map((t: any) => t.tag) || [],
    }
    
    return NextResponse.json({ data: formattedData })
  } catch (error) {
    console.error('Неожиданная ошибка в GET /api/prompts/[id]:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}

// ====================================
// PUT /api/prompts/[id] - Обновление промта
// ====================================

/**
 * PUT обработчик для обновления промта
 * Если пользователь редактирует чужой публичный промт - создается копия
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Получение и валидация данных
    const body = await request.json()
    
    const validationResult = promptSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Ошибка валидации',
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }
    
    const validatedData = validationResult.data
    
    // Создание серверного клиента
    const supabase = await createServerClient()
    
    // Получение текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 401 }
      )
    }
    
    // Получение существующего промта
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingPrompt) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PROMPT_NOT_FOUND },
        { status: 404 }
      )
    }
    
    // Проверка: редактирует ли пользователь чужой публичный промт
    const isOwner = existingPrompt.owner_id === user.id
    const isPublic = existingPrompt.is_public
    
    if (!isOwner && isPublic) {
      // ЛОГИКА КОПИРОВАНИЯ: создание копии промта
      const copyData = {
        title: validatedData.title,
        body: validatedData.body,
        description: validatedData.description || null,
        owner_id: user.id, // Новый владелец - текущий пользователь
        recommended_model: validatedData.recommended_model || null,
        recommended_temperature: validatedData.recommended_temperature || null,
        is_public: false, // По умолчанию копия приватная
      }
      
      // Создание копии
      const { data: newPrompt, error: copyError } = await supabase
        .from('prompts')
        .insert(copyData)
        .select()
        .single()
      
      if (copyError) {
        console.error('Ошибка создания копии промта:', copyError)
        return NextResponse.json(
          { error: formatSupabaseError(copyError) },
          { status: 500 }
        )
      }
      
      // Копирование тегов
      if (validatedData.tags && validatedData.tags.length > 0) {
        const tagsData = validatedData.tags.map(tag => ({
          prompt_id: newPrompt.id,
          tag: tag.trim(),
        }))
        
        await supabase.from('prompt_tags').insert(tagsData)
      }
      
      // Логирование создания копии
      await logPromptCreate(newPrompt.id)
      
      // Возврат специального ответа с информацией о копировании
      return NextResponse.json({
        copied: true,
        new_prompt_id: newPrompt.id,
        message: CONFIRMATION_MESSAGES.COPY_PUBLIC_PROMPT_MESSAGE,
        data: newPrompt,
      }, { status: 201 })
    }
    
    // Обычное обновление (пользователь - владелец)
    if (!isOwner) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PROMPT_ACCESS_DENIED },
        { status: 403 }
      )
    }
    
    // Подготовка данных для обновления
    const updateData = {
      title: validatedData.title,
      body: validatedData.body,
      description: validatedData.description || null,
      recommended_model: validatedData.recommended_model || null,
      recommended_temperature: validatedData.recommended_temperature || null,
      is_public: validatedData.is_public ?? existingPrompt.is_public,
    }
    
    // Обновление промта
    const { data, error } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Ошибка обновления промта:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 }
      )
    }
    
    // Обновление тегов (удалить старые, добавить новые)
    await supabase.from('prompt_tags').delete().eq('prompt_id', id)
    
    if (validatedData.tags && validatedData.tags.length > 0) {
      const tagsData = validatedData.tags.map(tag => ({
        prompt_id: id,
        tag: tag.trim(),
      }))
      
      await supabase.from('prompt_tags').insert(tagsData)
    }
    
    // Логирование обновления
    await logPromptEdit(id)
    
    return NextResponse.json({
      data,
      message: 'Промт успешно обновлен'
    })
  } catch (error) {
    console.error('Неожиданная ошибка в PUT /api/prompts/[id]:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}

// ====================================
// DELETE /api/prompts/[id] - Удаление промта
// ====================================

/**
 * DELETE обработчик для удаления промта
 * Могут удалять только владельцы или админы
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Создание серверного клиента
    const supabase = await createServerClient()
    
    // Получение текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 401 }
      )
    }
    
    // Получение промта для проверки прав
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('*, profiles:owner_id(is_admin)')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingPrompt) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PROMPT_NOT_FOUND },
        { status: 404 }
      )
    }
    
    // Получение профиля текущего пользователя для проверки admin прав
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    const isOwner = existingPrompt.owner_id === user.id
    const isAdmin = userProfile?.is_admin === true
    
    // Проверка прав на удаление
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PROMPT_ACCESS_DENIED },
        { status: 403 }
      )
    }
    
    // Удаление промта (теги удалятся автоматически через CASCADE)
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Ошибка удаления промта:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 }
      )
    }
    
    // Логирование удаления
    await logPromptDelete(id)
    
    return NextResponse.json({
      message: 'Промт успешно удален'
    })
  } catch (error) {
    console.error('Неожиданная ошибка в DELETE /api/prompts/[id]:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}

