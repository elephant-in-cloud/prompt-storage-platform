// Supabase клиент для server-side использования
// Этот клиент используется в Server Components, API Routes и Server Actions

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Создание серверного клиента с auth контекстом из cookies
// Это необходимо для работы Row Level Security (RLS) политик
export async function createClient() {
  const cookieStore = await cookies() // В Next.js 15 требуется await
  
  // Получаем session cookie для аутентификации
  const session = cookieStore.get('supabase-auth-token')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Создаем клиента с auth контекстом
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: session ? {
        Authorization: `Bearer ${session.value}`
      } : {}
    }
  })
}

// Создание admin клиента с service_role ключом
// ВНИМАНИЕ: использовать ТОЛЬКО на сервере, НИКОГДА не экспозить на клиенте!
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  // Service role ключ обходит все RLS политики - использовать осторожно!
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  })
}

