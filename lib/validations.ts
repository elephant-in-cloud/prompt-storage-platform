// Схемы валидации с использованием zod
// Все схемы используют сообщения об ошибках на русском языке согласно PRD

import { z } from 'zod'

// ====================================
// СХЕМЫ АУТЕНТИФИКАЦИИ
// ====================================

// Схема для входа пользователя
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Неверный формат email'),
  password: z
    .string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
})

// Схема для регистрации пользователя
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Неверный формат email'),
  password: z
    .string()
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: z
    .string()
    .min(1, 'Подтвердите пароль')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword']
})

// ====================================
// СХЕМЫ ДЛЯ ПРОМТОВ
// ====================================

// Схема для создания/обновления промта
export const promptSchema = z.object({
  title: z
    .string()
    .min(1, 'Заголовок обязателен')
    .max(200, 'Заголовок не должен превышать 200 символов'),
  body: z
    .string()
    .min(1, 'Текст промта не может быть пустым')
    .max(10000, 'Текст промта не должен превышать 10000 символов'),
  description: z
    .string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional()
    .nullable(),
  tags: z
    .array(z.string())
    .max(10, 'Максимум 10 тегов')
    .optional()
    .default([]),
  recommended_model: z
    .string()
    .optional()
    .nullable(),
  recommended_temperature: z
    .number()
    .min(0, 'Температура должна быть от 0.0 до 2.0')
    .max(2, 'Температура должна быть от 0.0 до 2.0')
    .optional()
    .nullable(),
  is_public: z
    .boolean()
    .optional()
    .default(false)
})

// ====================================
// СХЕМЫ ДЛЯ ЗАПУСКА ПРОМТОВ
// ====================================

// Схема для запуска промта через Playground
export const runPromptSchema = z.object({
  prompt_id: z
    .string()
    .uuid('Неверный ID промта'),
  model: z
    .string()
    .min(1, 'Модель обязательна')
    .regex(/^[\w-]+\/[\w-]+$/, 'Модель должна быть в формате vendor/model')
    .optional()
    .nullable(),
  temperature: z
    .number()
    .min(0, 'Температура должна быть числом от 0.0 до 2.0')
    .max(2, 'Температура должна быть числом от 0.0 до 2.0')
    .optional()
    .nullable(),
  save_response: z
    .boolean()
    .optional()
    .default(false)
})

// ====================================
// СХЕМЫ ДЛЯ ПРОФИЛЯ
// ====================================

// Схема для обновления профиля пользователя
export const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя не должно превышать 50 символов')
    .optional()
    .nullable(),
  preferred_model: z
    .string()
    .optional()
    .nullable(),
  preferred_temperature: z
    .number()
    .min(0, 'Температура должна быть от 0.0 до 2.0')
    .max(2, 'Температура должна быть от 0.0 до 2.0')
    .optional()
    .nullable()
})

// ====================================
// СХЕМЫ ДЛЯ АДМИНКИ
// ====================================

// Схема для добавления модели
export const adminModelSchema = z.object({
  key: z
    .string()
    .min(1, 'Ключ модели обязателен')
    .regex(/^[\w-]+\/[\w-.]+$/, 'Ключ должен быть в формате vendor/model'),
  display_name: z
    .string()
    .min(1, 'Отображаемое имя обязательно')
    .max(100, 'Имя не должно превышать 100 символов'),
  description: z
    .string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional()
    .nullable()
})

// ====================================
// ТИПЫ, ВЫВЕДЕННЫЕ ИЗ СХЕМ
// ====================================

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type PromptInput = z.infer<typeof promptSchema>
export type RunPromptInput = z.infer<typeof runPromptSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type AdminModelInput = z.infer<typeof adminModelSchema>

