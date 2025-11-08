// Supabase клиент для server-side использования
// Этот клиент используется в Server Components, API Routes и Server Actions

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// Создание серверного клиента с правильной работой с cookies через @supabase/ssr
// Это необходимо для работы Row Level Security (RLS) политик
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Создание admin клиента с service_role ключом
// ВНИМАНИЕ: использовать ТОЛЬКО на сервере, НИКОГДА не экспозить на клиенте!
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  // Service role ключ обходит все RLS политики - использовать осторожно!
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  })
}

