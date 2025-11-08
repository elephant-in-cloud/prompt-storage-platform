// API Route для работы с промтами: GET (список) и POST (создание)
// Поддерживает фильтрацию по query параметрам и полнотекстовый поиск

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { promptSchema } from '@/lib/validations'
import { logPromptCreate } from '@/lib/audit-logger'
import { ERROR_MESSAGES, formatSupabaseError } from '@/lib/error-messages'

// ====================================
// GET /api/prompts - Получение списка промтов
// ====================================

/**
 * GET обработчик для получения списка промтов с фильтрацией
 * Query параметры:
 * - q: поисковый запрос (ищет в title и body)
 * - tag: фильтр по тегу
 * - public_only: показать только публичные промты (true/false)
 * - owner_id: фильтр по владельцу (для админов)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const tag = searchParams.get('tag')
    const publicOnly = searchParams.get('public_only') === 'true'
    const ownerId = searchParams.get('owner_id')
    
    // Создание серверного клиента с auth контекстом
    const supabase = await createServerClient()
    
    // Получение текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 401 }
      )
    }
    
    // Построение запроса с join к profiles для получения информации о владельце
    let queryBuilder = supabase
      .from('prompts')
      .select(`
        *,
        profiles:owner_id (
          id,
          display_name
        ),
        prompt_tags (
          tag
        )
      `)
      .order('created_at', { ascending: false })
    
    // Применение фильтров
    
    // Фильтр по публичности
    if (publicOnly) {
      queryBuilder = queryBuilder.eq('is_public', true)
    }
    
    // Фильтр по владельцу (для админов)
    if (ownerId) {
      queryBuilder = queryBuilder.eq('owner_id', ownerId)
    }
    
    // Полнотекстовый поиск (если есть query параметр)
    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,body.ilike.%${query}%`
      )
    }
    
    // Выполнение запроса
    const { data, error } = await queryBuilder
    
    if (error) {
      console.error('Ошибка получения промтов:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 }
      )
    }
    
    // Фильтрация по тегу (если указан)
    let filteredData = data
    if (tag) {
      filteredData = data.filter(prompt => 
        prompt.prompt_tags?.some((t: any) => t.tag === tag)
      )
    }
    
    // Форматирование данных для ответа
    const formattedData = filteredData.map(prompt => ({
      ...prompt,
      owner: prompt.profiles,
      tags: prompt.prompt_tags?.map((t: any) => t.tag) || [],
    }))
    
    return NextResponse.json({ data: formattedData })
  } catch (error) {
    console.error('Неожиданная ошибка в GET /api/prompts:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}

// ====================================
// POST /api/prompts - Создание нового промта
// ====================================

/**
 * POST обработчик для создания нового промта
 * Body: { title, body, description?, tags?, recommended_model?, recommended_temperature?, is_public? }
 */
export async function POST(request: NextRequest) {
  try {
    // Получение и валидация данных из тела запроса
    const body = await request.json()
    
    // Валидация с помощью zod
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
    
    // Подготовка данных для вставки
    const promptData = {
      title: validatedData.title,
      body: validatedData.body,
      description: validatedData.description || null,
      owner_id: user.id, // Текущий пользователь - владелец
      recommended_model: validatedData.recommended_model || null,
      recommended_temperature: validatedData.recommended_temperature || null,
      is_public: validatedData.is_public || false,
    }
    
    // Вставка промта в базу данных
    const { data, error } = await supabase
      .from('prompts')
      .insert(promptData)
      .select()
      .single()
    
    if (error) {
      console.error('Ошибка создания промта:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 }
      )
    }
    
    // Добавление тегов (если есть)
    if (validatedData.tags && validatedData.tags.length > 0) {
      const tagsData = validatedData.tags.map(tag => ({
        prompt_id: data.id,
        tag: tag.trim(),
      }))
      
      const { error: tagsError } = await supabase
        .from('prompt_tags')
        .insert(tagsData)
      
      if (tagsError) {
        console.error('Ошибка добавления тегов:', tagsError)
        // Не возвращаем ошибку, так как промт уже создан
      }
    }
    
    // Логирование создания промта
    await logPromptCreate(data.id)
    
    return NextResponse.json(
      { 
        data,
        message: 'Промт успешно создан'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Неожиданная ошибка в POST /api/prompts:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}

