// API Route для работы с конкретным сохраненным ответом: GET, DELETE

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logResponseDelete } from '@/lib/audit-logger'
import { ERROR_MESSAGES, formatSupabaseError } from '@/lib/error-messages'

/**
 * GET /api/saved-responses/[id]
 * Получение конкретного сохраненного ответа по ID
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
    
    // Получение сохраненного ответа с информацией о промте
    const { data, error } = await supabase
      .from('saved_responses')
      .select(`
        *,
        prompts:prompt_id (
          id,
          title,
          body,
          owner_id
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: ERROR_MESSAGES.SAVED_RESPONSE_NOT_FOUND },
          { status: 404 }
        )
      }
      console.error('Ошибка получения сохраненного ответа:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 }
      )
    }
    
    // Проверка прав доступа (только владелец может просматривать)
    if (data.user_id !== user.id) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.SAVED_RESPONSE_ACCESS_DENIED },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Неожиданная ошибка в GET /api/saved-responses/[id]:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/saved-responses/[id]
 * Удаление сохраненного ответа
 * Могут удалять только владельцы
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
    
    // Получение сохраненного ответа для проверки прав
    const { data: existingResponse, error: fetchError } = await supabase
      .from('saved_responses')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingResponse) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.SAVED_RESPONSE_NOT_FOUND },
        { status: 404 }
      )
    }
    
    // Проверка прав на удаление (только владелец)
    if (existingResponse.user_id !== user.id) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.SAVED_RESPONSE_ACCESS_DENIED },
        { status: 403 }
      )
    }
    
    // Удаление сохраненного ответа
    const { error } = await supabase
      .from('saved_responses')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Ошибка удаления сохраненного ответа:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 }
      )
    }
    
    // Логирование удаления
    await logResponseDelete(id)
    
    return NextResponse.json({
      message: 'Сохраненный ответ успешно удален'
    })
  } catch (error) {
    console.error('Неожиданная ошибка в DELETE /api/saved-responses/[id]:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}

