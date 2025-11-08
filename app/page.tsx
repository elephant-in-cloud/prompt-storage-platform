// Главная страница (Landing Page) приложения
// Приветствует пользователей и предлагает войти или зарегистрироваться

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Zap, Users, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero секция */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            📝 Хранилище промтов
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Создавайте, храните и тестируйте промты для различных LLM моделей. 
            Делитесь лучшими решениями с сообществом.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg">
                Начать бесплатно
              </Button>
            </Link>
            <Link href="/catalog">
              <Button size="lg" variant="outline" className="text-lg">
                Посмотреть каталог
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Особенности */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Функция 1 */}
          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Организация промтов</CardTitle>
              <CardDescription>
                Храните все ваши промты в одном месте с удобной системой тегов и поиска
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Функция 2 */}
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Playground</CardTitle>
              <CardDescription>
                Тестируйте промты с различными LLM моделями и параметрами в реальном времени
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Функция 3 */}
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Публичный каталог</CardTitle>
              <CardDescription>
                Делитесь своими лучшими промтами и изучайте решения других пользователей
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Функция 4 */}
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>История ответов</CardTitle>
              <CardDescription>
                Сохраняйте и сравнивайте результаты выполнения промтов
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Призыв к действию */}
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Готовы начать работу с промтами?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Создайте аккаунт за несколько секунд и начните организовывать свои промты
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg">
                Зарегистрироваться бесплатно
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Футер */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Хранилище промтов. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}
