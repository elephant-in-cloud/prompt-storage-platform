'use client'

// Страница регистрации нового пользователя
// Использует shadcn/ui Form с валидацией через zod и react-hook-form

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupInput } from '@/lib/validations'
import { signup } from '@/lib/auth/actions'
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

export default function SignupPage() {
  // Состояние для отображения ошибок и успешных сообщений
  const [serverError, setServerError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  // Состояние загрузки
  const [isLoading, setIsLoading] = useState(false)

  // Инициализация формы с валидацией
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Обработчик отправки формы
  async function onSubmit(values: SignupInput) {
    try {
      setIsLoading(true)
      setServerError('')
      setSuccessMessage('')
      
      // Создание FormData для Server Action
      const formData = new FormData()
      formData.append('email', values.email)
      formData.append('password', values.password)
      formData.append('confirmPassword', values.confirmPassword)
      
      // Вызов Server Action
      const result = await signup(formData)
      
      if (!result.success) {
        // Обработка ошибок от сервера
        if (result.errors) {
          // Установка ошибок для конкретных полей
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof SignupInput, {
              message: messages[0],
            })
          })
        } else if (result.message) {
          setServerError(result.message)
        }
      } else {
        // Успешная регистрация
        if (result.message) {
          setSuccessMessage(result.message)
        }
      }
      // Если успешно, Server Action может выполнить редирект
    } catch (error) {
      console.error('Ошибка при регистрации:', error)
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
            Создать аккаунт
          </CardTitle>
          <CardDescription className="text-center">
            Заполните форму для регистрации в системе
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Отображение ошибки сервера */}
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {serverError}
                </div>
              )}
              
              {/* Отображение успешного сообщения */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                  {successMessage}
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
                        placeholder="Минимум 6 символов"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Поле Подтверждение пароля */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подтвердите пароль *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Повторите пароль"
                        autoComplete="new-password"
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
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-600">
            Уже есть аккаунт?{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Войти
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

