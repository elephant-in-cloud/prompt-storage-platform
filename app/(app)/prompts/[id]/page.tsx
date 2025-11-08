// Страница просмотра и редактирования промта с двухколоночным layout
// Левая колонка: редактор промта, правая колонка: Run Pane для тестирования

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Save, Play, ArrowLeft, Eye, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth/auth-context'
import { UI_MESSAGES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/error-messages'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface Prompt {
  id: string
  title: string
  body: string
  description: string | null
  tags: string[]
  owner_id: string
  is_public: boolean
  recommended_model: string | null
  recommended_temperature: number | null
}

export default function PromptViewPage() {
  const params = useParams()
  const promptId = params.id as string
  const router = useRouter()
  const { user } = useAuth()

  // Состояния промта
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Состояния редактирования
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(false)
  const [editModel, setEditModel] = useState('')
  const [editTemperature, setEditTemperature] = useState('0.7')

  // Состояния Run Pane
  const [runModel, setRunModel] = useState('')
  const [runTemperature, setRunTemperature] = useState('0.7')
  const [isRunning, setIsRunning] = useState(false)
  const [runOutput, setRunOutput] = useState('')
  const [runError, setRunError] = useState('')

  // Загрузка промта при монтировании
  useEffect(() => {
    loadPrompt()
  }, [promptId, user])

  // Загрузка промта с сервера
  const loadPrompt = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/prompts/${promptId}`)
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки промта')
      }
      
      const { data } = await response.json()
      setPrompt(data)
      
      // Проверка владения
      if (user && data.owner_id === user.id) {
        setIsOwner(true)
      }
      
      // Инициализация полей редактирования
      setEditTitle(data.title)
      setEditBody(data.body)
      setEditDescription(data.description || '')
      setEditTags(data.tags?.join(', ') || '')
      setEditIsPublic(data.is_public || false)
      setEditModel(data.recommended_model || '')
      setEditTemperature(data.recommended_temperature?.toString() || '0.7')
      
      // Инициализация Run Pane
      setRunModel(data.recommended_model || '')
      setRunTemperature(data.recommended_temperature?.toString() || '0.7')
    } catch (error) {
      console.error('Ошибка загрузки промта:', error)
      toast.error(ERROR_MESSAGES.PROMPT_NOT_FOUND)
      router.push('/my-prompts')
    } finally {
      setIsLoading(false)
    }
  }

  // Сохранение промта
  const handleSave = async () => {
    if (!editTitle.trim() || !editBody.trim()) {
      toast.error('Заголовок и текст промта обязательны')
      return
    }

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          body: editBody,
          description: editDescription || null,
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          is_public: editIsPublic,
          recommended_model: editModel || null,
          recommended_temperature: parseFloat(editTemperature) || null,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Ошибка сохранения')
      }

      const result = await response.json()
      
      // Обработка копирования публичного промта
      if (result.copied) {
        toast.success(result.message)
        router.push(`/prompts/${result.new_prompt_id}`)
        return
      }

      toast.success(SUCCESS_MESSAGES.PROMPT_UPDATED)
      setEditMode(false)
      loadPrompt()
    } catch (error: any) {
      console.error('Ошибка сохранения промта:', error)
      toast.error(error.message || 'Не удалось сохранить промт')
    }
  }

  // Запуск промта через Edge Function
  const handleRun = async () => {
    if (!prompt) return

    try {
      setIsRunning(true)
      setRunOutput('')
      setRunError('')
      
      toast.info(UI_MESSAGES.RUN_PROCESSING)

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/run-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          prompt_id: promptId,
          model: runModel || undefined,
          temperature: parseFloat(runTemperature) || undefined,
          save_response: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка выполнения')
      }

      const result = await response.json()
      
      if (result.status === 'ok') {
        setRunOutput(result.output_markdown || '')
        toast.success('Промт успешно выполнен')
      } else {
        throw new Error(result.error || 'Неизвестная ошибка')
      }
    } catch (error: any) {
      console.error('Ошибка запуска промта:', error)
      setRunError(error.message || 'Не удалось выполнить промт')
      toast.error(error.message || 'Не удалось выполнить промт')
    } finally {
      setIsRunning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{UI_MESSAGES.LOADING}</p>
        </div>
      </div>
    )
  }

  if (!prompt) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Навигация */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        {isOwner && (
          <Button onClick={() => setEditMode(!editMode)} variant={editMode ? 'default' : 'outline'}>
            {editMode ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {editMode ? 'Просмотр' : 'Редактировать'}
          </Button>
        )}
      </div>

      {/* Двухколоночный layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левая колонка: Редактор */}
        <Card>
          <CardHeader>
            <CardTitle>
              {editMode ? 'Редактирование промта' : 'Просмотр промта'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editMode ? (
              <>
                <div>
                  <Label>Заголовок*</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Название промта"
                  />
                </div>
                
                <div>
                  <Label>Описание</Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Краткое описание промта"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label>Текст промта*</Label>
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    placeholder="Введите текст промта"
                    rows={12}
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <Label>Теги (через запятую)</Label>
                  <Input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="python, coding, tutorial"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={editIsPublic}
                    onChange={(e) => setEditIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="is_public">Сделать публичным</Label>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Рекомендуемая модель</Label>
                    <Input
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      placeholder="google/gemini-2.0-flash"
                    />
                  </div>
                  
                  <div>
                    <Label>Температура</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={editTemperature}
                      onChange={(e) => setEditTemperature(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSave} className="w-full" size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-bold">{prompt.title}</h2>
                  {prompt.description && (
                    <p className="text-gray-600 mt-2">{prompt.description}</p>
                  )}
                </div>
                
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <Label className="text-sm text-gray-500">Текст промта:</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md border">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {prompt.body}
                    </pre>
                  </div>
                </div>
                
                {(prompt.recommended_model || prompt.recommended_temperature) && (
                  <>
                    <Separator />
                    <div className="text-sm text-gray-600 space-y-1">
                      {prompt.recommended_model && (
                        <p><strong>Модель:</strong> {prompt.recommended_model}</p>
                      )}
                      {prompt.recommended_temperature !== null && (
                        <p><strong>Температура:</strong> {prompt.recommended_temperature}</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Правая колонка: Run Pane */}
        <Card>
          <CardHeader>
            <CardTitle>Run Pane</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Модель</Label>
                <Input
                  value={runModel}
                  onChange={(e) => setRunModel(e.target.value)}
                  placeholder="google/gemini-2.0-flash"
                />
              </div>
              
              <div>
                <Label>Температура</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={runTemperature}
                  onChange={(e) => setRunTemperature(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleRun} 
              className="w-full" 
              size="lg"
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {UI_MESSAGES.RUN_BUTTON_LOADING}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {UI_MESSAGES.RUN_BUTTON}
                </>
              )}
            </Button>
            
            <Separator />
            
            <div>
              <Label className="text-sm text-gray-500">Вывод:</Label>
              {runError ? (
                <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                  {runError}
                </div>
              ) : runOutput ? (
                <div className="mt-2 p-4 bg-white border rounded-md prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {runOutput}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="mt-2 p-4 bg-gray-50 border rounded-md text-gray-500 text-center">
                  Результат выполнения появится здесь
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

