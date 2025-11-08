// Страница каталога публичных промтов
// Отображает список публичных промтов с поиском и фильтрацией

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Eye } from 'lucide-react'
import { UI_MESSAGES } from '@/lib/error-messages'
import { createClient } from '@/lib/supabase/client'

// Тип промта для отображения
interface Prompt {
  id: string
  title: string
  description: string | null
  tags: string[]
  owner: {
    display_name: string | null
  }
  created_at: string
}

export default function CatalogPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  // Загрузка промтов при монтировании и при изменении поискового запроса
  useEffect(() => {
    loadPrompts()
  }, [searchQuery])

  // Функция загрузки промтов с сервера
  const loadPrompts = async () => {
    try {
      setIsLoading(true)
      
      // Формируем URL с query параметрами
      const params = new URLSearchParams({
        public_only: 'true',
      })
      
      if (searchQuery.trim()) {
        params.append('q', searchQuery)
      }
      
      const response = await fetch(`/api/prompts?${params}`)
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки промтов')
      }
      
      const { data } = await response.json()
      setPrompts(data || [])
    } catch (error) {
      console.error('Ошибка загрузки каталога:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Обработчик поиска
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadPrompts()
  }

  // Обработчик просмотра промта
  const handleViewPrompt = (promptId: string) => {
    router.push(`/prompts/${promptId}`)
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Каталог промтов
        </h1>
        <p className="text-gray-600">
          Изучите публичные промты, созданные сообществом
        </p>
      </div>

      {/* Поисковая панель */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={UI_MESSAGES.SEARCH_PLACEHOLDER}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">
              Искать
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Список промтов */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{UI_MESSAGES.LOADING}</p>
        </div>
      ) : prompts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">
              {searchQuery ? UI_MESSAGES.NO_SEARCH_RESULTS : UI_MESSAGES.NO_PUBLIC_PROMPTS}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Card 
              key={prompt.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleViewPrompt(prompt.id)}
            >
              <CardHeader>
                <CardTitle className="line-clamp-2">{prompt.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {prompt.description || 'Без описания'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Теги */}
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      {prompt.tags.length > 3 && (
                        <Badge variant="outline">
                          +{prompt.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Автор и дата */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Автор: {prompt.owner?.display_name || 'Аноним'}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewPrompt(prompt.id)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Просмотр
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

