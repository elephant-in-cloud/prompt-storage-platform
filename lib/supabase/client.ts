// Supabase клиент для client-side использования
// Этот клиент используется в React компонентах на стороне клиента

import { createClient } from '@supabase/supabase-js'

// Получаем URL и анонимный ключ из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Создаем и экспортируем клиента Supabase
// Этот клиент безопасно использовать на клиенте, так как использует анонимный ключ
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Экспортируем также функцию создания клиента для использования в разных контекстах
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

