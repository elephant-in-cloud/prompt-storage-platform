// Упрощенная админ панель
// Управление моделями и просмотр audit логов (только для администраторов)

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { UI_MESSAGES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/error-messages'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'

interface Model {
  key: string
  display_name: string
  description: string | null
  created_at: string
}

interface AuditLog {
  id: string
  actor_id: string
  action: string
  target_table: string | null
  target_id: string | null
  model: string | null
  temperature: number | null
  duration_ms: number | null
  status: string
  error_message: string | null
  created_at: string
  profiles: {
    display_name: string | null
  }
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Состояния моделей
  const [models, setModels] = useState<Model[]>([])
  const [newModelKey, setNewModelKey] = useState('')
  const [newModelName, setNewModelName] = useState('')
  const [newModelDescription, setNewModelDescription] = useState('')
  
  // Состояния логов
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [logsLimit, setLogsLimit] = useState(50)

  // Проверка прав администратора
  useEffect(() => {
    checkAdminAccess()
  }, [user])

  const checkAdminAccess = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        toast.error(ERROR_MESSAGES.ADMIN_ACCESS_DENIED)
        router.push('/my-prompts')
        return
      }

      setIsAdmin(true)
      loadModels()
      loadAuditLogs()
    } catch (error) {
      console.error('Ошибка проверки прав:', error)
      toast.error(ERROR_MESSAGES.ADMIN_ACCESS_DENIED)
      router.push('/my-prompts')
    } finally {
      setIsLoading(false)
    }
  }

  // Загрузка списка моделей
  const loadModels = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('admin_models')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setModels(data || [])
    } catch (error) {
      console.error('Ошибка загрузки моделей:', error)
      toast.error('Не удалось загрузить модели')
    }
  }

  // Добавление новой модели
  const handleAddModel = async () => {
    if (!newModelKey.trim() || !newModelName.trim()) {
      toast.error('Ключ и название модели обязательны')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('admin_models')
        .insert({
          key: newModelKey.trim(),
          display_name: newModelName.trim(),
          description: newModelDescription.trim() || null,
        })

      if (error) throw error

      toast.success(SUCCESS_MESSAGES.MODEL_ADDED)
      setNewModelKey('')
      setNewModelName('')
      setNewModelDescription('')
      loadModels()
    } catch (error: any) {
      console.error('Ошибка добавления модели:', error)
      toast.error(error.message || 'Не удалось добавить модель')
    }
  }

  // Удаление модели
  const handleDeleteModel = async (key: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту модель?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('admin_models')
        .delete()
        .eq('key', key)

      if (error) throw error

      toast.success(SUCCESS_MESSAGES.MODEL_DELETED)
      loadModels()
    } catch (error: any) {
      console.error('Ошибка удаления модели:', error)
      toast.error(error.message || 'Не удалось удалить модель')
    }
  }

  // Загрузка audit логов
  const loadAuditLogs = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:actor_id (
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(logsLimit)

      if (error) throw error
      setAuditLogs(data || [])
    } catch (error) {
      console.error('Ошибка загрузки логов:', error)
      toast.error('Не удалось загрузить логи')
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

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900">Админ панель</h1>
      </div>

      {/* Табы */}
      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">Модели</TabsTrigger>
          <TabsTrigger value="logs">Audit логи</TabsTrigger>
        </TabsList>

        {/* Вкладка: Модели */}
        <TabsContent value="models" className="space-y-4">
          {/* Форма добавления модели */}
          <Card>
            <CardHeader>
              <CardTitle>Добавить модель</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Ключ модели*</Label>
                  <Input
                    value={newModelKey}
                    onChange={(e) => setNewModelKey(e.target.value)}
                    placeholder="google/gemini-2.0-flash"
                  />
                </div>
                <div>
                  <Label>Название*</Label>
                  <Input
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="Gemini 2.0 Flash"
                  />
                </div>
                <div>
                  <Label>Описание</Label>
                  <Input
                    value={newModelDescription}
                    onChange={(e) => setNewModelDescription(e.target.value)}
                    placeholder="Быстрая и эффективная модель"
                  />
                </div>
              </div>
              <Button onClick={handleAddModel}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить модель
              </Button>
            </CardContent>
          </Card>

          {/* Список моделей */}
          <Card>
            <CardHeader>
              <CardTitle>Доступные модели ({models.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {models.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  {UI_MESSAGES.NO_MODELS}
                </p>
              ) : (
                <div className="space-y-3">
                  {models.map((model) => (
                    <div
                      key={model.key}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">{model.display_name}</div>
                        <div className="text-sm text-gray-600">{model.key}</div>
                        {model.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {model.description}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModel(model.key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка: Audit логи */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Последние {logsLimit} логов</CardTitle>
                <Button onClick={loadAuditLogs} variant="outline" size="sm">
                  Обновить
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Нет логов для отображения
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-3 border rounded-lg text-sm"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={log.status === 'ok' ? 'default' : 'destructive'}>
                            {log.action}
                          </Badge>
                          <span className="text-gray-600">
                            {log.profiles?.display_name || 'Аноним'}
                          </span>
                        </div>
                        {log.target_table && (
                          <div className="text-gray-600">
                            Таблица: {log.target_table}
                            {log.target_id && ` (ID: ${log.target_id})`}
                          </div>
                        )}
                        {log.model && (
                          <div className="text-gray-600">
                            Модель: {log.model} | Температура: {log.temperature}
                            {log.duration_ms && ` | ${log.duration_ms}ms`}
                          </div>
                        )}
                        {log.error_message && (
                          <div className="text-red-600">
                            Ошибка: {log.error_message}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

