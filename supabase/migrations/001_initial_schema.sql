-- ====================================
-- Миграция 001: Начальная схема базы данных
-- Создание всех таблиц и настройка RLS политик
-- ====================================

-- Включение необходимых расширений
create extension if not exists "uuid-ossp";

-- ====================================
-- ТАБЛИЦА: profiles
-- Расширение таблицы auth.users для хранения дополнительных данных пользователя
-- ====================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_model text, -- Предпочитаемая модель пользователя (формат: vendor/model)
  preferred_temperature numeric, -- Предпочитаемая температура (0.0-2.0)
  is_admin boolean default false, -- Флаг администратора
  created_at timestamptz default now()
);

-- Комментарии к таблице profiles
comment on table public.profiles is 'Профили пользователей с дополнительными данными';
comment on column public.profiles.preferred_model is 'Предпочитаемая LLM модель пользователя';
comment on column public.profiles.preferred_temperature is 'Предпочитаемая температура для генерации (0.0-2.0)';

-- ====================================
-- ТАБЛИЦА: prompts
-- Хранение промтов пользователей
-- ====================================
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null, -- Заголовок промта (обязательное поле)
  body text not null, -- Тело промта (обязательное поле)
  description text, -- Описание промта (опционально)
  owner_id uuid references public.profiles(id) on delete set null, -- Владелец промта
  recommended_model text, -- Рекомендуемая модель для этого промта
  recommended_temperature numeric check (recommended_temperature >= 0 and recommended_temperature <= 2), -- Рекомендуемая температура (0.0-2.0)
  is_public boolean default false, -- Флаг публичности промта
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Комментарии к таблице prompts
comment on table public.prompts is 'Хранилище промтов пользователей';
comment on column public.prompts.is_public is 'Публичные промты видны всем пользователям';
comment on column public.prompts.recommended_temperature is 'Рекомендуемая температура для данного промта';

-- Индексы для оптимизации поиска
create index if not exists prompts_owner_id_idx on public.prompts(owner_id);
create index if not exists prompts_is_public_idx on public.prompts(is_public);
create index if not exists prompts_title_idx on public.prompts using gin(to_tsvector('russian', title));
create index if not exists prompts_body_idx on public.prompts using gin(to_tsvector('russian', body));
create index if not exists prompts_created_at_idx on public.prompts(created_at desc);

-- Триггер для автоматического обновления updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prompts_updated_at
  before update on public.prompts
  for each row
  execute function public.update_updated_at_column();

-- ====================================
-- ТАБЛИЦА: prompt_tags
-- Join-таблица для тегов промтов
-- ====================================
create table if not exists public.prompt_tags (
  prompt_id uuid references public.prompts(id) on delete cascade,
  tag text not null,
  primary key (prompt_id, tag)
);

-- Комментарии к таблице prompt_tags
comment on table public.prompt_tags is 'Теги для промтов (many-to-many связь)';

-- Индекс для поиска по тегам
create index if not exists prompt_tags_tag_idx on public.prompt_tags(tag);

-- ====================================
-- ТАБЛИЦА: saved_responses
-- Сохраненные ответы от LLM для промтов
-- ====================================
create table if not exists public.saved_responses (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references public.prompts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  model text not null, -- Модель, использованная для генерации ответа
  temperature numeric not null, -- Температура, использованная для генерации
  output_markdown text not null, -- Результат генерации в markdown формате
  metadata jsonb, -- Дополнительные метаданные (duration_ms, tokens, и т.д.)
  created_at timestamptz default now()
);

-- Комментарии к таблице saved_responses
comment on table public.saved_responses is 'Сохраненные ответы от LLM';
comment on column public.saved_responses.output_markdown is 'Результат генерации в markdown формате';
comment on column public.saved_responses.metadata is 'Метаданные: duration_ms, openrouter_resp_id, tokens_estimate';

-- Индексы для оптимизации запросов
create index if not exists saved_responses_prompt_id_idx on public.saved_responses(prompt_id);
create index if not exists saved_responses_user_id_idx on public.saved_responses(user_id);
create index if not exists saved_responses_created_at_idx on public.saved_responses(created_at desc);
create index if not exists saved_responses_model_idx on public.saved_responses(model);

-- ====================================
-- ТАБЛИЦА: admin_models
-- Список доступных LLM моделей (управляется администратором)
-- ====================================
create table if not exists public.admin_models (
  key text primary key, -- Ключ модели в формате "vendor/model"
  display_name text not null, -- Отображаемое имя модели
  description text, -- Описание модели
  added_by uuid references public.profiles(id) on delete set null, -- Кто добавил модель
  created_at timestamptz default now()
);

-- Комментарии к таблице admin_models
comment on table public.admin_models is 'Список доступных LLM моделей';
comment on column public.admin_models.key is 'Ключ модели в формате vendor/model (например: google/gemini-2.0-flash)';

-- ====================================
-- ТАБЛИЦА: admin_settings
-- Глобальные настройки администратора
-- ====================================
create table if not exists public.admin_settings (
  key text primary key, -- Ключ настройки (например: default_model, default_temperature)
  value text not null, -- Значение настройки
  description text, -- Описание настройки
  updated_at timestamptz default now()
);

comment on table public.admin_settings is 'Глобальные настройки системы';

-- Вставка дефолтных настроек
insert into public.admin_settings (key, value, description) values
  ('default_model', 'google/gemini-2.0-flash', 'Глобальная дефолтная модель'),
  ('default_temperature', '0.7', 'Глобальная дефолтная температура')
on conflict (key) do nothing;

-- ====================================
-- ТАБЛИЦА: audit_logs
-- Логирование всех действий пользователей
-- ====================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null, -- Кто выполнил действие
  action text not null, -- Тип действия: create, edit, delete, run, save_response, change_settings
  target_table text, -- Таблица, над которой выполнено действие
  target_id text, -- ID записи, над которой выполнено действие
  model text, -- Модель (если применимо для action=run)
  temperature numeric, -- Температура (если применимо для action=run)
  duration_ms int, -- Длительность операции в миллисекундах
  status text, -- Статус: ok, error
  error_message text, -- Сообщение об ошибке (если status=error)
  meta jsonb, -- Дополнительные метаданные (log_id, и т.д.)
  created_at timestamptz default now()
);

-- Комментарии к таблице audit_logs
comment on table public.audit_logs is 'Журнал аудита всех действий пользователей';
comment on column public.audit_logs.action is 'Тип действия: create, edit, delete, run, save_response, change_settings';
comment on column public.audit_logs.meta is 'Дополнительные метаданные (log_id для отслеживания ошибок)';

-- Индексы для оптимизации запросов к логам
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists audit_logs_action_idx on public.audit_logs(action);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_status_idx on public.audit_logs(status);

-- ====================================
-- ФУНКЦИЯ: Автоматическое создание профиля при регистрации
-- ====================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Триггер на создание нового пользователя
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ====================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- КРИТИЧНО: используем (SELECT auth.uid()) для кэширования
-- ====================================

-- Включение RLS для всех таблиц
alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_tags enable row level security;
alter table public.saved_responses enable row level security;
alter table public.admin_models enable row level security;
alter table public.admin_settings enable row level security;
alter table public.audit_logs enable row level security;

-- ====================================
-- RLS POLICIES: profiles
-- ====================================

-- Пользователи видят свой профиль
create policy "Users can view own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

-- Пользователи могут обновлять свой профиль
create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- Админы видят все профили
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and is_admin = true
    )
  );

-- ====================================
-- RLS POLICIES: prompts
-- ====================================

-- Публичные промты видны всем авторизованным пользователям
create policy "Public prompts visible to authenticated"
  on public.prompts for select
  using (is_public = true);

-- Пользователи видят свои промты
create policy "Users see own prompts"
  on public.prompts for select
  using ((select auth.uid()) = owner_id);

-- Админы видят все промты
create policy "Admins see all prompts"
  on public.prompts for select
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and is_admin = true
    )
  );

-- Пользователи могут создавать промты
create policy "Users can insert own prompts"
  on public.prompts for insert
  with check ((select auth.uid()) = owner_id);

-- Пользователи могут обновлять свои промты
create policy "Users can update own prompts"
  on public.prompts for update
  using ((select auth.uid()) = owner_id);

-- Пользователи могут удалять свои промты
create policy "Users can delete own prompts"
  on public.prompts for delete
  using ((select auth.uid()) = owner_id);

-- Админы могут удалять любые промты
create policy "Admins can delete any prompts"
  on public.prompts for delete
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and is_admin = true
    )
  );

-- ====================================
-- RLS POLICIES: prompt_tags
-- ====================================

-- Теги видны если сам промт доступен (через RLS на prompts)
create policy "Tags visible with prompts"
  on public.prompt_tags for select
  using (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_tags.prompt_id
    )
  );

-- Владельцы промтов могут управлять тегами
create policy "Prompt owners can manage tags"
  on public.prompt_tags for all
  using (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_tags.prompt_id
        and prompts.owner_id = (select auth.uid())
    )
  );

-- ====================================
-- RLS POLICIES: saved_responses
-- ====================================

-- Пользователи видят свои сохраненные ответы
create policy "Users see own saved responses"
  on public.saved_responses for select
  using ((select auth.uid()) = user_id);

-- Админы видят все сохраненные ответы
create policy "Admins see all saved responses"
  on public.saved_responses for select
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and is_admin = true
    )
  );

-- Пользователи могут создавать свои сохраненные ответы
create policy "Users can insert own saved responses"
  on public.saved_responses for insert
  with check ((select auth.uid()) = user_id);

-- Пользователи могут удалять свои сохраненные ответы
create policy "Users can delete own saved responses"
  on public.saved_responses for delete
  using ((select auth.uid()) = user_id);

-- Админы могут удалять любые сохраненные ответы
create policy "Admins can delete any saved responses"
  on public.saved_responses for delete
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and is_admin = true
    )
  );

-- ====================================
-- RLS POLICIES: admin_models
-- ====================================

-- Все авторизованные пользователи могут видеть список моделей
create policy "All users can view models"
  on public.admin_models for select
  to authenticated
  using (true);

-- Только админы могут управлять моделями
create policy "Only admins can manage models"
  on public.admin_models for all
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and is_admin = true
    )
  );

-- ====================================
-- RLS POLICIES: admin_settings
-- ====================================

-- Все авторизованные пользователи могут читать настройки
create policy "All users can read settings"
  on public.admin_settings for select
  to authenticated
  using (true);

-- Только админы могут изменять настройки
create policy "Only admins can manage settings"
  on public.admin_settings for all
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and is_admin = true
    )
  );

-- ====================================
-- RLS POLICIES: audit_logs
-- ====================================

-- Пользователи видят свои логи
create policy "Users see own logs"
  on public.audit_logs for select
  using ((select auth.uid()) = actor_id);

-- Админы видят все логи
create policy "Admins see all logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and is_admin = true
    )
  );

-- Все авторизованные пользователи могут создавать логи
create policy "All users can insert logs"
  on public.audit_logs for insert
  to authenticated
  with check (true);

-- ====================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ====================================

-- Добавление нескольких популярных моделей по умолчанию
insert into public.admin_models (key, display_name, description) values
  ('google/gemini-2.0-flash', 'Gemini 2.0 Flash', 'Быстрая и эффективная модель от Google'),
  ('google/gemini-1.5-pro', 'Gemini 1.5 Pro', 'Продвинутая модель с большим контекстом'),
  ('openai/gpt-4', 'GPT-4', 'Мощная модель от OpenAI'),
  ('openai/gpt-3.5-turbo', 'GPT-3.5 Turbo', 'Быстрая и недорогая модель от OpenAI'),
  ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Сбалансированная модель от Anthropic')
on conflict (key) do nothing;

-- Миграция завершена успешно

