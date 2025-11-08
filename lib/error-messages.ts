// Централизованные сообщения об ошибках на русском языке
// Все сообщения соответствуют требованиям PRD §8

// ====================================
// ОШИБКИ ВАЛИДАЦИИ ФОРМ
// ====================================

export const ERROR_MESSAGES = {
  // Общие ошибки
  REQUIRED_FIELD: 'Это поле обязательно для заполнения',
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка. Попробуйте позже.',
  
  // Аутентификация
  AUTH_INVALID_CREDENTIALS: 'Неверный email или пароль',
  AUTH_EMAIL_ALREADY_EXISTS: 'Пользователь с таким email уже существует',
  AUTH_WEAK_PASSWORD: 'Пароль должен содержать минимум 6 символов',
  AUTH_INVALID_EMAIL: 'Неверный формат email',
  AUTH_REQUIRED_EMAIL: 'Email обязателен',
  AUTH_REQUIRED_PASSWORD: 'Пароль обязателен',
  AUTH_PASSWORDS_NOT_MATCH: 'Пароли не совпадают',
  AUTH_SESSION_EXPIRED: 'Ваша сессия истекла. Пожалуйста, войдите снова.',
  AUTH_UNAUTHORIZED: 'Необходимо авторизоваться для выполнения этого действия',
  
  // Промты
  PROMPT_TITLE_REQUIRED: 'Заголовок обязателен',
  PROMPT_BODY_REQUIRED: 'Текст промта не может быть пустым',
  PROMPT_TEMPERATURE_INVALID: 'Температура должна быть числом от 0.0 до 2.0',
  PROMPT_MODEL_UNAVAILABLE: 'Выбранная модель недоступна. Обратитесь к администратору',
  PROMPT_NOT_FOUND: 'Промт не найден',
  PROMPT_ACCESS_DENIED: 'У вас нет доступа к этому промту',
  PROMPT_DELETE_FAILED: 'Не удалось удалить промт',
  
  // Запуск промтов (Playground)
  RUN_PROMPT_NOT_FOUND: 'Промт не найден или недоступен',
  RUN_TIMEOUT: (logId: string) => 
    `Превышено время ожидания ответа (150 сек). Попробуйте снова или уменьшите сложность запроса. ID: ${logId}`,
  RUN_NETWORK_ERROR: (logId: string, error: string) => 
    `Ошибка сети при обращении к LLM: ${error}. ID: ${logId}`,
  RUN_SERVER_ERROR: (logId: string) => 
    `Произошла ошибка на сервере. Пожалуйста, сообщите администратору. ID: ${logId}`,
  RUN_MODEL_NOT_AVAILABLE: 'Выбранная модель недоступна',
  RUN_INVALID_PARAMETERS: 'Неверные параметры запуска',
  
  // Сохраненные ответы
  SAVED_RESPONSE_NOT_FOUND: 'Сохраненный ответ не найден',
  SAVED_RESPONSE_ACCESS_DENIED: 'У вас нет доступа к этому ответу',
  SAVED_RESPONSE_SAVE_FAILED: 'Не удалось сохранить ответ',
  SAVED_RESPONSE_DELETE_FAILED: 'Не удалось удалить сохраненный ответ',
  
  // Профиль
  PROFILE_UPDATE_FAILED: 'Не удалось обновить профиль',
  PROFILE_NAME_TOO_SHORT: 'Имя должно содержать минимум 2 символа',
  PROFILE_NAME_TOO_LONG: 'Имя не должно превышать 50 символов',
  
  // Админка
  ADMIN_ACCESS_DENIED: 'Только администраторы могут выполнять это действие',
  ADMIN_MODEL_ALREADY_EXISTS: 'Модель с таким ключом уже существует',
  ADMIN_MODEL_INVALID_FORMAT: 'Ключ модели должен быть в формате vendor/model',
  ADMIN_MODEL_ADD_FAILED: 'Не удалось добавить модель',
  ADMIN_MODEL_DELETE_FAILED: 'Не удалось удалить модель',
  
  // Общие ошибки базы данных
  DB_CONNECTION_ERROR: 'Ошибка подключения к базе данных',
  DB_QUERY_ERROR: 'Ошибка выполнения запроса к базе данных',
  
  // Валидация температуры
  TEMPERATURE_OUT_OF_RANGE: 'Температура должна быть числом от 0.0 до 2.0',
  TEMPERATURE_INVALID: 'Некорректное значение температуры',
} as const

// ====================================
// УСПЕШНЫЕ СООБЩЕНИЯ
// ====================================

export const SUCCESS_MESSAGES = {
  // Промты
  PROMPT_CREATED: 'Промт успешно создан',
  PROMPT_UPDATED: 'Промт успешно обновлен',
  PROMPT_DELETED: 'Промт успешно удален',
  PROMPT_COPIED: 'Создана копия промта в вашем аккаунте',
  
  // Аутентификация
  LOGIN_SUCCESS: 'Вы успешно вошли в систему',
  SIGNUP_SUCCESS: 'Регистрация прошла успешно',
  LOGOUT_SUCCESS: 'Вы успешно вышли из системы',
  
  // Профиль
  PROFILE_UPDATED: 'Профиль успешно обновлен',
  
  // Сохраненные ответы
  RESPONSE_SAVED: 'Ответ успешно сохранен',
  RESPONSE_DELETED: 'Сохраненный ответ удален',
  
  // Админка
  MODEL_ADDED: 'Модель успешно добавлена',
  MODEL_DELETED: 'Модель успешно удалена',
  SETTINGS_UPDATED: 'Настройки успешно обновлены',
} as const

// ====================================
// ПОДТВЕРЖДАЮЩИЕ СООБЩЕНИЯ
// ====================================

export const CONFIRMATION_MESSAGES = {
  // Удаление
  DELETE_PROMPT: 'Вы уверены, что хотите удалить этот промт?',
  DELETE_RESPONSE: 'Вы уверены, что хотите удалить этот сохраненный ответ?',
  DELETE_MODEL: 'Вы уверены, что хотите удалить эту модель из списка?',
  
  // Копирование публичного промта
  COPY_PUBLIC_PROMPT_TITLE: 'Копирование публичного промта',
  COPY_PUBLIC_PROMPT_MESSAGE: 'Вы редактируете публичный промт, который не принадлежит вам. Сохранение создаст копию в вашем аккаунте. Хотите сделать копию публичной?',
  COPY_PUBLIC_PROMPT_MAKE_PUBLIC: 'Создать копию и сделать публичной',
  COPY_PUBLIC_PROMPT_KEEP_PRIVATE: 'Создать копию и оставить приватной',
  COPY_PUBLIC_PROMPT_CANCEL: 'Отмена',
} as const

// ====================================
// СОСТОЯНИЯ UI
// ====================================

export const UI_MESSAGES = {
  // Загрузка
  LOADING: 'Загрузка...',
  PROCESSING: 'Обработка...',
  SAVING: 'Сохранение...',
  DELETING: 'Удаление...',
  
  // Playground
  RUN_PROCESSING: 'Обработка запроса... Подождите, это может занять до 150 секунд.',
  RUN_BUTTON: 'Запустить',
  RUN_BUTTON_LOADING: 'Выполнение...',
  
  // Пустые состояния
  NO_PROMPTS: 'У вас пока нет промтов',
  NO_PUBLIC_PROMPTS: 'Публичных промтов пока нет',
  NO_SAVED_RESPONSES: 'Нет сохраненных ответов для этого промта',
  NO_MODELS: 'Нет доступных моделей',
  
  // Поиск
  SEARCH_PLACEHOLDER: 'Поиск промтов...',
  NO_SEARCH_RESULTS: 'Ничего не найдено',
} as const

// ====================================
// ХЕЛПЕР ФУНКЦИИ
// ====================================

/**
 * Форматирует ошибку Supabase в понятное сообщение на русском
 * @param error - Ошибка от Supabase
 * @param logId - ID лога для отслеживания (опционально)
 * @returns Сообщение об ошибке на русском языке
 */
export function formatSupabaseError(error: any, logId?: string): string {
  // Проверка на известные коды ошибок Supabase
  if (error?.code === '23505') {
    return ERROR_MESSAGES.ADMIN_MODEL_ALREADY_EXISTS
  }
  
  if (error?.code === '23503') {
    return 'Ошибка связи данных в базе'
  }
  
  if (error?.message?.includes('JWT')) {
    return ERROR_MESSAGES.AUTH_SESSION_EXPIRED
  }
  
  if (error?.message?.includes('timeout')) {
    return logId ? ERROR_MESSAGES.RUN_TIMEOUT(logId) : 'Превышено время ожидания'
  }
  
  // Если есть logId, используем серверную ошибку
  if (logId) {
    return ERROR_MESSAGES.RUN_SERVER_ERROR(logId)
  }
  
  // Возвращаем сообщение ошибки или дефолтное
  return error?.message || ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Генерирует уникальный ID для логирования ошибок
 * @returns UUID v4
 */
export function generateLogId(): string {
  return crypto.randomUUID()
}

