# 📝 Хранилище промтов

Платформа для создания, хранения и тестирования промтов для различных LLM моделей через OpenRouter API.

## ✨ Особенности

- **🔐 Аутентификация**: Регистрация и вход через Supabase Auth
- **📚 Управление промтами**: CRUD операции с вашими промтами
- **🌐 Публичный каталог**: Делитесь промтами с сообществом
- **⚡ Playground**: Тестируйте промты с различными моделями в реальном времени
- **💾 История ответов**: Сохраняйте и сравнивайте результаты выполнения
- **🏷️ Система тегов**: Организуйте промты с помощью тегов
- **🔍 Поиск**: Полнотекстовый поиск по промтам
- **👑 Админ панель**: Управление моделями и просмотр audit логов
- **🛡️ Row Level Security**: Безопасность данных на уровне базы
- **📊 Audit Logging**: Детальное логирование всех действий

## 🛠️ Технологии

### Frontend
- **Next.js 14+** (App Router) - React фреймворк
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **shadcn/ui** - UI компоненты
- **React Hook Form** - Управление формами
- **Zod** - Валидация схем
- **React Markdown** - Рендеринг markdown ответов

### Backend
- **Supabase** - Backend-as-a-Service
  - **Postgres** - База данных
  - **Auth** - Аутентификация
  - **Edge Functions** - Serverless функции (Deno)
  - **Row Level Security** - Политики доступа
- **OpenRouter API** - Доступ к различным LLM моделям

## 📦 Установка

### Предварительные требования

- Node.js 18+
- npm или yarn
- Аккаунт Supabase
- Ключ OpenRouter API

### Шаги установки

1. **Клонирование репозитория**
```bash
git clone https://github.com/elephant-in-cloud/prompt-storage-platform.git
cd prompt-storage-platform
```

2. **Установка зависимостей**
```bash
npm install
```

3. **Настройка переменных окружения**

Создайте файл `.env.local` в корне проекта:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key
```

4. **Настройка базы данных**

Примените миграцию к вашему Supabase проекту:

```bash
# Миграция находится в supabase/migrations/001_initial_schema.sql
# Выполните её через Supabase Dashboard > SQL Editor
```

5. **Деплой Edge Functions**

Edge Function уже задеплоена, но если нужно обновить:

```bash
# Используйте Supabase CLI или MCP инструменты
```

6. **Наполнение демо-данными (опционально)**

```bash
npm run seed
```

7. **Запуск проекта**

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

## 📁 Структура проекта

```
prompt-storage/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Защищенные страницы
│   │   ├── admin/                # Админ панель
│   │   ├── catalog/              # Каталог публичных промтов
│   │   ├── my-prompts/           # Личные промты
│   │   ├── prompts/              # Страницы промтов
│   │   │   ├── [id]/             # Просмотр/редактирование
│   │   │   └── new/              # Создание промта
│   │   └── layout.tsx            # Layout с навигацией
│   ├── (auth)/                   # Аутентификация
│   │   ├── login/                # Страница входа
│   │   └── signup/               # Страница регистрации
│   ├── api/                      # API Routes
│   │   ├── prompts/              # CRUD для промтов
│   │   └── saved-responses/      # API для ответов
│   ├── layout.tsx                # Корневой layout
│   └── page.tsx                  # Landing page
├── components/                   # React компоненты
│   ├── ui/                       # shadcn/ui компоненты
│   └── navigation.tsx            # Навигация
├── lib/                          # Утилиты и хелперы
│   ├── auth/                     # Auth контекст и actions
│   ├── supabase/                 # Supabase клиенты
│   ├── audit-logger.ts           # Логирование
│   ├── error-messages.ts         # Сообщения об ошибках
│   └── validations.ts            # Zod схемы
├── supabase/
│   ├── functions/                # Edge Functions
│   │   └── run-prompt/           # Выполнение промтов
│   └── migrations/               # SQL миграции
│       └── 001_initial_schema.sql
├── scripts/                      # Утилиты
│   └── seed.ts                   # Скрипт для демо-данных
├── types/                        # TypeScript типы
│   └── database.ts               # Типы БД
└── public/                       # Статические файлы
```

## 🚀 Деплой

### Vercel (рекомендуется)

1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения в настройках проекта
3. Деплой происходит автоматически при push в main

### Переменные окружения для Vercel

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENROUTER_API_KEY
```

## 📖 Использование

### Для пользователей

1. **Регистрация**: Создайте аккаунт на странице `/signup`
2. **Создание промта**: Перейдите в "Мои промты" → "Создать промт"
3. **Тестирование**: Используйте Run Pane для запуска промтов
4. **Публикация**: Сделайте промт публичным для добавления в каталог
5. **Каталог**: Изучайте публичные промты других пользователей

### Для администраторов

1. Установите `is_admin = true` в таблице `profiles` для вашего пользователя
2. Перейдите в `/admin` для доступа к админ панели
3. Управляйте доступными моделями
4. Просматривайте audit логи

## 🔒 Безопасность

- **RLS (Row Level Security)**: Все таблицы защищены RLS политиками
- **Аутентификация**: JWT токены через Supabase Auth
- **Валидация**: Zod схемы для всех форм
- **Санитизация**: Защита от XSS через React
- **Audit Logging**: Логирование всех действий пользователей

## 🗄️ Схема базы данных

### Таблицы

- **profiles** - Профили пользователей
- **prompts** - Промты
- **prompt_tags** - Теги промтов (many-to-many)
- **saved_responses** - Сохраненные ответы от LLM
- **admin_models** - Доступные модели
- **admin_settings** - Глобальные настройки
- **audit_logs** - Логи действий пользователей

Детальная схема доступна в `supabase/migrations/001_initial_schema.sql`

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

MIT License - смотрите файл LICENSE для деталей

## 🐛 Известные проблемы

- Edge Functions требуют OPENROUTER_API_KEY в Supabase Secrets
- Первый запуск промта может занять дольше из-за cold start
- Максимальное время выполнения промта: 150 секунд

## 📞 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте [Issues](https://github.com/elephant-in-cloud/prompt-storage-platform/issues)
2. Создайте новый Issue с подробным описанием
3. Проверьте логи в Supabase Dashboard → Logs

## 🙏 Благодарности

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenRouter](https://openrouter.ai/)
- [Vercel](https://vercel.com/)

---

Создано с ❤️ для разработчиков, работающих с LLM промтами
