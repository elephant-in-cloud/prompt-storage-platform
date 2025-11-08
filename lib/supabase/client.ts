// Supabase клиент для client-side использования
// Этот клиент используется в React компонентах на стороне клиента

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Экспортируем функцию создания клиента для использования в разных контекстах
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

