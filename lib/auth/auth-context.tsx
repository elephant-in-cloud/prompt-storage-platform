'use client'

// Auth Context Provider для управления состоянием аутентификации
// Предоставляет информацию о текущем пользователе и функции auth

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '../supabase/client'
import { Tables } from '@/types/database'

// Тип для профиля пользователя
type Profile = Tables<'profiles'>

// Интерфейс контекста аутентификации
interface AuthContextType {
  user: User | null // Текущий пользователь из Supabase Auth
  profile: Profile | null // Профиль пользователя из таблицы profiles
  loading: boolean // Флаг загрузки состояния аутентификации
  signOut: () => Promise<void> // Функция выхода из системы
  refreshProfile: () => Promise<void> // Функция обновления профиля
}

// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ====================================
// AUTH PROVIDER КОМПОНЕНТ
// ====================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Создаем клиент Supabase один раз с помощью useMemo
  const supabase = useMemo(() => createClient(), [])

  // Функция загрузки профиля пользователя
  const loadProfile = async (userId: string) => {
    try {
      console.log('Загрузка профиля для userId:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log('Результат загрузки профиля:', { data, error })
      
      if (error) {
        console.error('Ошибка Supabase при загрузке профиля:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      setProfile(null)
    }
  }

  // Функция обновления профиля (для вызова извне)
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id)
    }
  }

  // Функция выхода из системы
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  // Эффект для инициализации и подписки на изменения auth
  useEffect(() => {
    // Проверка текущей сессии при загрузке
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      }
      setLoading(false)
    })

    // Подписка на изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    // Отписка при размонтировании
    return () => {
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Предоставление контекста
  const value: AuthContextType = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ====================================
// ХЕЛПЕР ХУК ДЛЯ ИСПОЛЬЗОВАНИЯ AUTH CONTEXT
// ====================================

/**
 * Хук для доступа к контексту аутентификации
 * @throws Ошибка, если используется вне AuthProvider
 * @returns Контекст аутентификации с информацией о пользователе
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Хук для проверки, является ли пользователь администратором
 * @returns true если пользователь - администратор, иначе false
 */
export function useIsAdmin() {
  const { profile } = useAuth()
  return profile?.is_admin === true
}

/**
 * Хук для получения текущего пользователя (с проверкой на наличие)
 * @throws Ошибка, если пользователь не авторизован
 * @returns Текущий пользователь
 */
export function useRequireAuth() {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      // Редирект на страницу входа
      window.location.href = '/login'
    }
  }, [user, loading])
  
  return { user, loading }
}

