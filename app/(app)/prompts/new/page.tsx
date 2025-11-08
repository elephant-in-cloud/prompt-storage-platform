// Страница создания нового промта
// Форма с полями для ввода данных промта

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { SUCCESS_MESSAGES } from '@/lib/error-messages'

export default function NewPromptPage() {
  const router = useRouter()

  // Состояния формы
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [recommendedModel, setRecommendedModel] = useState('')
  const [recommendedTemperature, setRecommendedTemperature] = useState('0.7')
  const [isSaving, setIsSaving] = useState(false)

  // Обработчик сохранения
  const handleSave = async () => {
    // Валидация
    if (!title.trim() || !body.trim()) {
      toast.error('Заголовок и текст промта обязательны')
      return
    }

    try {
      setIsSaving(true)
      
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          description: description || null,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          is_public: isPublic,
          recommended_model: recommendedModel || null,
          recommended_temperature: parseFloat(recommendedTemperature) || null,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Ошибка создания промта')
      }

      const { data } = await response.json()
      toast.success(SUCCESS_MESSAGES.PROMPT_CREATED)
      router.push(`/prompts/${data.id}`)
    } catch (error: any) {
      console.error('Ошибка создания промта:', error)
      toast.error(error.message || 'Не удалось создать промт')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Навигация */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
      </div>

      {/* Форма создания */}
      <Card>
        <CardHeader>
          <CardTitle>Создание нового промта</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Заголовок */}
          <div>
            <Label htmlFor="title">
              Заголовок<span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Создание README файла для проекта"
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              {title.length}/200 символов
            </p>
          </div>

          {/* Описание */}
          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание промта (необязательно)"
              rows={2}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              {description.length}/500 символов
            </p>
          </div>

          {/* Текст промта */}
          <div>
            <Label htmlFor="body">
              Текст промта<span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Введите текст промта. Например: 'Создай подробный README файл для проекта на Python, включающий...'"
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-1">
              {body.length} символов
            </p>
          </div>

          {/* Теги */}
          <div>
            <Label htmlFor="tags">Теги</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="python, documentation, readme (через запятую)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Разделяйте теги запятыми
            </p>
          </div>

          {/* Публичность */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is_public" className="cursor-pointer">
              Сделать промт публичным (будет виден в каталоге)
            </Label>
          </div>

          <Separator />

          {/* Рекомендуемые параметры */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Рекомендуемые параметры</h3>
            <p className="text-sm text-gray-600">
              Эти параметры будут использоваться по умолчанию при запуске промта
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Модель */}
              <div>
                <Label htmlFor="model">Модель</Label>
                <Input
                  id="model"
                  value={recommendedModel}
                  onChange={(e) => setRecommendedModel(e.target.value)}
                  placeholder="google/gemini-2.0-flash"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Формат: vendor/model-name
                </p>
              </div>

              {/* Температура */}
              <div>
                <Label htmlFor="temperature">Температура (0.0 - 2.0)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={recommendedTemperature}
                  onChange={(e) => setRecommendedTemperature(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Креативность модели (0.7 по умолчанию)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Кнопка сохранения */}
          <Button 
            onClick={handleSave} 
            className="w-full" 
            size="lg"
            disabled={isSaving || !title.trim() || !body.trim()}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Сохранение...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Создать промт
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

