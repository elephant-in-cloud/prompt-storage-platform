// Скрипт для наполнения базы данных демо-данными
// Создает модели, промты, настройки и тестового администратора
// Запуск: tsx scripts/seed.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Загрузка переменных окружения
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Ошибка: Необходимы SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Создание клиента с service role для обхода RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ====================================
// DEMO ДАННЫЕ
// ====================================

// Популярные LLM модели
const DEMO_MODELS = [
  {
    key: 'google/gemini-2.0-flash',
    display_name: 'Gemini 2.0 Flash',
    description: 'Быстрая и эффективная модель от Google',
  },
  {
    key: 'anthropic/claude-3-5-sonnet',
    display_name: 'Claude 3.5 Sonnet',
    description: 'Продвинутая модель от Anthropic',
  },
  {
    key: 'openai/gpt-4o',
    display_name: 'GPT-4o',
    description: 'Мультимодальная модель от OpenAI',
  },
  {
    key: 'meta-llama/llama-3.3-70b',
    display_name: 'Llama 3.3 70B',
    description: 'Открытая модель от Meta',
  },
]

// Глобальные настройки
const DEMO_SETTINGS = [
  {
    key: 'default_model',
    value: 'google/gemini-2.0-flash',
    description: 'Модель по умолчанию',
  },
  {
    key: 'default_temperature',
    value: '0.7',
    description: 'Температура по умолчанию',
  },
]

// Публичные промты
const DEMO_PROMPTS = [
  {
    title: 'Создание README для проекта',
    body: `Создай подробный README.md файл для проекта на основе следующего описания:

[ОПИСАНИЕ ПРОЕКТА]

README должен включать:
- Краткое описание проекта
- Требования и зависимости
- Инструкции по установке
- Примеры использования
- Структуру проекта
- Информацию о вкладе в проект

Используй markdown форматирование и эмодзи для улучшения читаемости.`,
    description: 'Генерирует профессиональный README файл для любого проекта',
    tags: ['documentation', 'readme', 'markdown'],
    is_public: true,
    recommended_model: 'google/gemini-2.0-flash',
    recommended_temperature: 0.7,
  },
  {
    title: 'Рефакторинг кода на TypeScript',
    body: `Проанализируй следующий код и предложи улучшения с учетом best practices TypeScript:

[КОД]

Обрати внимание на:
- Типизацию (избегай any)
- Читаемость и структуру
- Обработку ошибок
- Производительность
- Соблюдение принципов SOLID

Объясни каждое изменение.`,
    description: 'Помогает улучшить качество TypeScript кода',
    tags: ['typescript', 'refactoring', 'best-practices'],
    is_public: true,
    recommended_model: 'anthropic/claude-3-5-sonnet',
    recommended_temperature: 0.5,
  },
  {
    title: 'Генерация тестов для функции',
    body: `Напиши unit тесты для следующей функции используя Jest/Vitest:

[ФУНКЦИЯ]

Тесты должны покрывать:
- Основные сценарии использования (happy path)
- Граничные случаи (edge cases)
- Обработку ошибок
- Различные типы входных данных

Используй describe/it структуру и содержательные названия тестов.`,
    description: 'Создает комплексные unit тесты для любой функции',
    tags: ['testing', 'jest', 'unit-tests'],
    is_public: true,
    recommended_model: 'openai/gpt-4o',
    recommended_temperature: 0.6,
  },
  {
    title: 'Объяснение кода для новичка',
    body: `Объясни следующий код простым языком, как будто рассказываешь новичку в программировании:

[КОД]

Структура объяснения:
1. Что делает код в целом
2. Разбор по строкам с комментариями
3. Концепции, которые нужно знать
4. Аналогия из реальной жизни

Используй простой язык и избегай жаргона где возможно.`,
    description: 'Делает сложный код понятным для начинающих',
    tags: ['education', 'explain', 'beginner-friendly'],
    is_public: true,
    recommended_model: 'google/gemini-2.0-flash',
    recommended_temperature: 0.8,
  },
  {
    title: 'SQL запрос по описанию',
    body: `Напиши SQL запрос для следующей задачи:

[ОПИСАНИЕ ЗАДАЧИ]

Учти:
- Используй правильные JOIN операции
- Оптимизируй производительность
- Добавь комментарии
- Используй alias для читаемости
- Обработай возможные NULL значения

Если нужны индексы - укажи их.`,
    description: 'Генерирует оптимизированные SQL запросы',
    tags: ['sql', 'database', 'query'],
    is_public: true,
    recommended_model: 'anthropic/claude-3-5-sonnet',
    recommended_temperature: 0.4,
  },
]

// ====================================
// ФУНКЦИИ SEED
// ====================================

async function seedModels() {
  console.log('\n📦 Добавление моделей...')
  
  for (const model of DEMO_MODELS) {
    const { error } = await supabase
      .from('admin_models')
      .upsert(model, { onConflict: 'key' })
    
    if (error) {
      console.error(`  ❌ Ошибка добавления ${model.key}:`, error.message)
    } else {
      console.log(`  ✅ ${model.display_name}`)
    }
  }
}

async function seedSettings() {
  console.log('\n⚙️  Добавление настроек...')
  
  for (const setting of DEMO_SETTINGS) {
    const { error } = await supabase
      .from('admin_settings')
      .upsert(setting, { onConflict: 'key' })
    
    if (error) {
      console.error(`  ❌ Ошибка добавления ${setting.key}:`, error.message)
    } else {
      console.log(`  ✅ ${setting.key}: ${setting.value}`)
    }
  }
}

async function seedPrompts(userId: string) {
  console.log('\n📝 Добавление демо-промтов...')
  
  for (const promptData of DEMO_PROMPTS) {
    // Создание промта
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert({
        ...promptData,
        owner_id: userId,
        tags: undefined, // Удаляем tags из основных данных
      })
      .select()
      .single()
    
    if (promptError) {
      console.error(`  ❌ Ошибка добавления "${promptData.title}":`, promptError.message)
      continue
    }
    
    // Добавление тегов
    if (promptData.tags && promptData.tags.length > 0) {
      const tagsData = promptData.tags.map(tag => ({
        prompt_id: prompt.id,
        tag,
      }))
      
      const { error: tagsError } = await supabase
        .from('prompt_tags')
        .insert(tagsData)
      
      if (tagsError) {
        console.error(`  ⚠️  Ошибка добавления тегов для "${promptData.title}":`, tagsError.message)
      }
    }
    
    console.log(`  ✅ ${promptData.title}`)
  }
}

async function findOrCreateDemoUser() {
  console.log('\n👤 Проверка демо-пользователя...')
  
  // Попытка найти существующего пользователя
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .single()
  
  if (existingProfile) {
    console.log('  ℹ️  Найден существующий админ:', existingProfile.id)
    return existingProfile.id
  }
  
  console.log('  ℹ️  Для создания промтов необходим существующий пользователь.')
  console.log('  ℹ️  Пожалуйста, создайте аккаунт через UI, затем запустите seed снова.')
  console.log('  ℹ️  Либо промты будут пропущены.')
  
  return null
}

// ====================================
// ГЛАВНАЯ ФУНКЦИЯ
// ====================================

async function main() {
  console.log('🌱 Начало seeding базы данных...')
  console.log('=' .repeat(50))
  
  try {
    // 1. Добавление моделей
    await seedModels()
    
    // 2. Добавление настроек
    await seedSettings()
    
    // 3. Поиск или создание демо-пользователя
    const userId = await findOrCreateDemoUser()
    
    // 4. Добавление промтов (только если есть пользователь)
    if (userId) {
      await seedPrompts(userId)
    } else {
      console.log('\n⚠️  Пропуск добавления промтов (нет пользователя)')
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Seeding завершен успешно!')
    console.log('\n💡 Рекомендации:')
    console.log('  1. Зарегистрируйтесь в приложении')
    console.log('  2. Посетите /catalog для просмотра публичных промтов')
    console.log('  3. Создайте свои промты в /my-prompts')
    console.log('  4. Для доступа к админ панели установите is_admin=true в таблице profiles')
    
  } catch (error) {
    console.error('\n❌ Ошибка при seeding:', error)
    process.exit(1)
  }
}

// Запуск
main()

