// Страница "Мои промты"
// Отображает список промтов текущего пользователя с возможностью создания новых

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { UI_MESSAGES, SUCCESS_MESSAGES, CONFIRMATION_MESSAGES } from '@/lib/error-messages'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth/auth-context'

// Тип промта для отображения
interface Prompt {
  id: string
  title: string
  description: string | null
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function MyPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  // Загрузка промтов при монтировании и при изменении поискового запроса
  useEffect(() => {
    loadPrompts()
  }, [searchQuery, user])

  // Функция загрузки промтов с сервера
  const loadPrompts = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      
      // Формируем URL с query параметрами
      const params = new URLSearchParams({
        owner_id: user.id,
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
      console.error('Ошибка загрузки промтов:', error)
      toast.error('Не удалось загрузить промты')
    } finally {
      setIsLoading(false)
    }
  }

  // Обработчик создания нового промта
  const handleCreatePrompt = () => {
    router.push('/prompts/new')
  }

  // Обработчик редактирования промта
  const handleEditPrompt = (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/prompts/${promptId}/edit`)
  }

  // Обработчик просмотра промта
  const handleViewPrompt = (promptId: string) => {
    router.push(`/prompts/${promptId}`)
  }

  // Открытие диалога удаления
  const handleDeleteClick = (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPromptToDelete(promptId)
    setDeleteDialogOpen(true)
  }

  // Удаление промта
  const handleDeleteConfirm = async () => {
    if (!promptToDelete) return
    
    try {
      const response = await fetch(`/api/prompts/${promptToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Ошибка удаления промта')
      }
      
      toast.success(SUCCESS_MESSAGES.PROMPT_DELETED)
      setDeleteDialogOpen(false)
      setPromptToDelete(null)
      loadPrompts() // Перезагружаем список
    } catch (error) {
      console.error('Ошибка удаления промта:', error)
      toast.error('Не удалось удалить промт')
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Мои промты
          </h1>
          <p className="text-gray-600">
            Управляйте своими промтами
          </p>
        </div>
        <Button onClick={handleCreatePrompt} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Создать промт
        </Button>
      </div>

      {/* Поисковая панель */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={UI_MESSAGES.SEARCH_PLACEHOLDER}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-gray-600">
              {searchQuery ? UI_MESSAGES.NO_SEARCH_RESULTS : UI_MESSAGES.NO_PROMPTS}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreatePrompt}>
                <Plus className="h-4 w-4 mr-2" />
                Создать первый промт
              </Button>
            )}
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
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-2 flex-1">{prompt.title}</CardTitle>
                  {prompt.is_public && (
                    <Badge variant="default" className="ml-2">Публичный</Badge>
                  )}
                </div>
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
                  
                  {/* Действия */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(prompt.updated_at).toLocaleDateString('ru-RU')}
                    </span>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => handleViewPrompt(prompt.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => handleEditPrompt(prompt.id, e)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => handleDeleteClick(prompt.id, e)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удаление промта</DialogTitle>
            <DialogDescription>
              {CONFIRMATION_MESSAGES.DELETE_PROMPT}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

