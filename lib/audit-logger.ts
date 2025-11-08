// Утилита для логирования действий пользователей в audit_logs
// Все действия логируются с детальной информацией для отслеживания

import { createClient } from './supabase/server'
import { TablesInsert } from '@/types/database'

// Типы действий для логирования
export type AuditAction = 
  | 'create'
  | 'edit'
  | 'delete'
  | 'run'
  | 'save_response'
  | 'change_settings'

// Интерфейс для параметров логирования
export interface AuditLogParams {
  action: AuditAction
  targetTable?: string
  targetId?: string
  model?: string
  temperature?: number
  durationMs?: number
  status?: 'ok' | 'error'
  errorMessage?: string
  meta?: Record<string, any>
}

/**
 * Логирует действие пользователя в таблицу audit_logs
 * @param params - Параметры для логирования
 * @returns ID созданной записи лога или null в случае ошибки
 */
export async function logAudit(params: AuditLogParams): Promise<string | null> {
  try {
    // Создание серверного клиента для получения текущего пользователя
    const supabase = await createClient()
    
    // Получение текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('Попытка логирования без аутентифицированного пользователя')
      return null
    }
    
    // Подготовка данных для вставки
    const logData: TablesInsert<'audit_logs'> = {
      actor_id: user.id,
      action: params.action,
      target_table: params.targetTable || null,
      target_id: params.targetId || null,
      model: params.model || null,
      temperature: params.temperature || null,
      duration_ms: params.durationMs || null,
      status: params.status || 'ok',
      error_message: params.errorMessage || null,
      meta: params.meta ? JSON.parse(JSON.stringify(params.meta)) : null,
    }
    
    // Вставка лога в базу данных
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(logData)
      .select('id')
      .single()
    
    if (error) {
      console.error('Ошибка при логировании действия:', error)
      return null
    }
    
    return data.id
  } catch (error) {
    console.error('Неожиданная ошибка при логировании:', error)
    return null
  }
}

/**
 * Логирует создание промта
 * @param promptId - ID созданного промта
 * @returns ID лога
 */
export async function logPromptCreate(promptId: string): Promise<string | null> {
  return logAudit({
    action: 'create',
    targetTable: 'prompts',
    targetId: promptId,
    status: 'ok',
  })
}

/**
 * Логирует обновление промта
 * @param promptId - ID обновленного промта
 * @returns ID лога
 */
export async function logPromptEdit(promptId: string): Promise<string | null> {
  return logAudit({
    action: 'edit',
    targetTable: 'prompts',
    targetId: promptId,
    status: 'ok',
  })
}

/**
 * Логирует удаление промта
 * @param promptId - ID удаленного промта
 * @returns ID лога
 */
export async function logPromptDelete(promptId: string): Promise<string | null> {
  return logAudit({
    action: 'delete',
    targetTable: 'prompts',
    targetId: promptId,
    status: 'ok',
  })
}

/**
 * Логирует запуск промта
 * @param promptId - ID запущенного промта
 * @param model - Использованная модель
 * @param temperature - Использованная температура
 * @param durationMs - Длительность выполнения в миллисекундах
 * @param status - Статус выполнения ('ok' или 'error')
 * @param errorMessage - Сообщение об ошибке (если есть)
 * @param logId - Дополнительный ID для отслеживания (добавляется в meta)
 * @returns ID лога
 */
export async function logPromptRun(
  promptId: string,
  model: string,
  temperature: number,
  durationMs: number,
  status: 'ok' | 'error',
  errorMessage?: string,
  logId?: string
): Promise<string | null> {
  return logAudit({
    action: 'run',
    targetTable: 'prompts',
    targetId: promptId,
    model,
    temperature,
    durationMs,
    status,
    errorMessage,
    meta: logId ? { log_id: logId } : undefined,
  })
}

/**
 * Логирует сохранение ответа
 * @param responseId - ID сохраненного ответа
 * @param promptId - ID промта
 * @returns ID лога
 */
export async function logResponseSave(
  responseId: string,
  promptId: string
): Promise<string | null> {
  return logAudit({
    action: 'save_response',
    targetTable: 'saved_responses',
    targetId: responseId,
    meta: { prompt_id: promptId },
    status: 'ok',
  })
}

/**
 * Логирует удаление сохраненного ответа
 * @param responseId - ID удаленного ответа
 * @returns ID лога
 */
export async function logResponseDelete(responseId: string): Promise<string | null> {
  return logAudit({
    action: 'delete',
    targetTable: 'saved_responses',
    targetId: responseId,
    status: 'ok',
  })
}

/**
 * Логирует изменение настроек
 * @param settingKey - Ключ изменяемой настройки
 * @param oldValue - Старое значение
 * @param newValue - Новое значение
 * @returns ID лога
 */
export async function logSettingsChange(
  settingKey: string,
  oldValue: string,
  newValue: string
): Promise<string | null> {
  return logAudit({
    action: 'change_settings',
    targetTable: 'admin_settings',
    targetId: settingKey,
    meta: {
      old_value: oldValue,
      new_value: newValue,
    },
    status: 'ok',
  })
}

