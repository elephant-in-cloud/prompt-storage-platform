// Supabase клиент для client-side использования
// Этот клиент используется в React компонентах на стороне клиента

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Получаем URL и анонимный ключ из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Экспортируем функцию создания клиента для использования в разных контекстах
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

