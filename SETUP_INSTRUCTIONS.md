# Инструкция по настройке проекта

## ✅ Что уже настроено

1. **Next.js проект** создан и настроен
2. **Supabase проект** создан успешно
   - ID проекта: `jpmfdearmohggpwzwhiw`
   - URL: `https://jpmfdearmohggpwzwhiw.supabase.co`
   - Region: `us-east-1`
3. **Зависимости** установлены
4. **shadcn/ui** инициализирован

## 🔧 Что нужно сделать вручную

### 1. Получить Service Role Key из Supabase

1. Перейдите по ссылке: https://supabase.com/dashboard/project/jpmfdearmohggpwzwhiw/settings/api
2. В разделе **Project API keys** найдите ключ `service_role`
3. Нажмите кнопку "Reveal" чтобы показать ключ
4. Скопируйте ключ
5. Откройте файл `.env.local` в корне проекта
6. Замените `your-service-role-key-here` на скопированный ключ

### 2. Добавить OpenRouter API Key

1. Получите ваш API ключ с OpenRouter (https://openrouter.ai/keys)
2. Откройте файл `.env.local`  
3. Замените `your-openrouter-api-key-here` на ваш ключ

### 3. Проверить .env.local

После выполнения шагов выше, файл `.env.local` должен выглядеть так:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jpmfdearmohggpwzwhiw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (ваш реальный ключ)
OPENROUTER_API_KEY=sk-or-v1-... (ваш реальный ключ)
NODE_ENV=development
```

## 🚀 Запуск проекта

После настройки ключей:

```bash
npm run dev
```

Проект будет доступен по адресу: http://localhost:3000

## 📝 Следующие шаги

После настройки ключей будут созданы:
- Миграции базы данных
- Аутентификация
- UI компоненты
- API endpoints
- Edge Functions

## ⚠️ Важно

- **НИКОГДА** не коммитить файл `.env.local` в git
- `.env.local` уже добавлен в `.gitignore`
- Service Role Key имеет полный доступ к БД - хранить в безопасности!

