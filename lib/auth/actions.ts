'use server'

// Server Actions для аутентификации
// Эти функции выполняются на сервере и обрабатывают вход/регистрацию

import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'
import { loginSchema, signupSchema } from '../validations'
import { ERROR_MESSAGES } from '../error-messages'

// ====================================
// ТИПЫ ДЛЯ ОТВЕТОВ
// ====================================

type ActionResult = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

// ====================================
// SERVER ACTION: ВХОД (LOGIN)
// ====================================

/**
 * Server Action для входа пользователя в систему
 * @param formData - Данные формы (email, password)
 * @returns Результат операции с сообщением или ошибками
 */
export async function login(formData: FormData): Promise<ActionResult> {
  try {
    // Получение данных из формы
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    // Валидация данных с помощью zod
    const validationResult = loginSchema.safeParse({ email, password })
    
    if (!validationResult.success) {
      // Возврат ошибок валидации
      return {
        success: false,
        errors: validationResult.error.flatten().fieldErrors
      }
    }
    
    // Создание серверного клиента Supabase
    const supabase = await createClient()
    
    // Попытка входа
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validationResult.data.email,
      password: validationResult.data.password,
    })
    
    if (error) {
      console.error('Ошибка входа:', error)
      return {
        success: false,
        message: ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS
      }
    }
    
    // При успешном входе редирект на главную страницу
    if (data.session) {
      redirect('/prompts')
    }
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Неожиданная ошибка при входе:', error)
    return {
      success: false,
      message: ERROR_MESSAGES.UNKNOWN_ERROR
    }
  }
}

// ====================================
// SERVER ACTION: РЕГИСТРАЦИЯ (SIGNUP)
// ====================================

/**
 * Server Action для регистрации нового пользователя
 * @param formData - Данные формы (email, password, confirmPassword)
 * @returns Результат операции с сообщением или ошибками
 */
export async function signup(formData: FormData): Promise<ActionResult> {
  try {
    // Получение данных из формы
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    // Валидация данных с помощью zod
    const validationResult = signupSchema.safeParse({
      email,
      password,
      confirmPassword
    })
    
    if (!validationResult.success) {
      // Возврат ошибок валидации
      return {
        success: false,
        errors: validationResult.error.flatten().fieldErrors
      }
    }
    
    // Создание серверного клиента Supabase
    const supabase = await createClient()
    
    // Попытка регистрации
    const { data, error } = await supabase.auth.signUp({
      email: validationResult.data.email,
      password: validationResult.data.password,
      options: {
        // Дополнительные метаданные пользователя
        data: {
          display_name: validationResult.data.email.split('@')[0]
        }
      }
    })
    
    if (error) {
      console.error('Ошибка регистрации:', error)
      
      // Обработка специфичных ошибок
      if (error.message.includes('already registered')) {
        return {
          success: false,
          message: ERROR_MESSAGES.AUTH_EMAIL_ALREADY_EXISTS
        }
      }
      
      return {
        success: false,
        message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR
      }
    }
    
    // При успешной регистрации (и если не требуется подтверждение email)
    if (data.session) {
      redirect('/prompts')
    }
    
    // Если требуется подтверждение email
    if (data.user && !data.session) {
      return {
        success: true,
        message: 'Проверьте ваш email для подтверждения регистрации'
      }
    }
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Неожиданная ошибка при регистрации:', error)
    return {
      success: false,
      message: ERROR_MESSAGES.UNKNOWN_ERROR
    }
  }
}

// ====================================
// SERVER ACTION: ВЫХОД (LOGOUT)
// ====================================

/**
 * Server Action для выхода пользователя из системы
 * @returns Результат операции
 */
export async function logout(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Ошибка выхода:', error)
      return {
        success: false,
        message: ERROR_MESSAGES.UNKNOWN_ERROR
      }
    }
    
    // Редирект на страницу входа
    redirect('/login')
  } catch (error) {
    console.error('Неожиданная ошибка при выходе:', error)
    return {
      success: false,
      message: ERROR_MESSAGES.UNKNOWN_ERROR
    }
  }
}

