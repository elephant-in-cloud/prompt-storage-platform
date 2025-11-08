-- Миграция для исправления бесконечной рекурсии в RLS политиках profiles
-- Проблема: политики обращаются к другим таблицам, которые обращаются обратно к profiles

-- Удаляем все существующие политики для profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Public prompt owners visible to all" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Profiles with public prompts visible to all" on public.profiles;

-- Создаем безопасную функцию для проверки админа без RLS
-- SECURITY DEFINER означает, что функция выполняется с правами владельца (обходит RLS)
create or replace function public.is_current_user_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$ language sql security definer stable;

-- Создаем ПРОСТЫЕ политики без рекурсии
-- 1. Пользователи могут видеть свой профиль
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 2. Админы могут видеть все профили (используем безопасную функцию)
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_current_user_admin());

-- 3. Пользователи могут обновлять свой профиль
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Примечание: публичные профили будут видны через LEFT JOIN в запросах к prompts,
-- не нужна отдельная политика, которая создает рекурсию

