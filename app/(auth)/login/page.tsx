'use client'

// Страница входа в систему
// Использует shadcn/ui Form с валидацией через zod и react-hook-form

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { login } from '@/lib/auth/actions'
import { ERROR_MESSAGES } from '@/lib/error-messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  // Состояние для отображения ошибок сервера
  const [serverError, setServerError] = useState<string>('')
  // Состояние загрузки
  const [isLoading, setIsLoading] = useState(false)

  // Инициализация формы с валидацией
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Обработчик отправки формы
  async function onSubmit(values: LoginInput) {
    try {
      setIsLoading(true)
      setServerError('')
      
      // Создание FormData для Server Action
      const formData = new FormData()
      formData.append('email', values.email)
      formData.append('password', values.password)
      
      // Вызов Server Action
      const result = await login(formData)
      
      if (!result.success) {
        // Обработка ошибок от сервера
        if (result.errors) {
          // Установка ошибок для конкретных полей
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof LoginInput, {
              message: messages[0],
            })
          })
        } else if (result.message) {
          setServerError(result.message)
        }
      }
      // Если успешно, Server Action выполнит редирект
    } catch (error) {
      // Если это NEXT_REDIRECT, пробрасываем дальше (не перехватываем!)
      if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error
      }
      
      console.error('Ошибка при входе:', error)
      setServerError(ERROR_MESSAGES.UNKNOWN_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Вход в систему
          </CardTitle>
          <CardDescription className="text-center">
            Введите ваш email и пароль для входа
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Отображение общей ошибки сервера */}
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {serverError}
                </div>
              )}
              
              {/* Поле Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Поле Пароль */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Кнопка отправки */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-600">
            Нет аккаунта?{' '}
            <Link
              href="/signup"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Зарегистрироваться
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

