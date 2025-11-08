-- Миграция для исправления проблем с профилями и RLS политиками
-- Создает профили для всех существующих пользователей и упрощает RLS

-- Создаем профили для всех существующих пользователей, у которых их нет
insert into public.profiles (id, display_name, created_at)
select 
  id,
  email as display_name,
  created_at
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

-- Удаляем старые политики для profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Profiles visible for public prompt owners" on public.profiles;

-- Создаем упрощенные политики
-- 1. Пользователи могут видеть свой профиль
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 2. Пользователи могут видеть профили владельцев публичных промтов
create policy "Public prompt owners visible to all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.prompts
      where prompts.owner_id = profiles.id
      and prompts.is_public = true
    )
  );

-- 3. Админы видят все профили
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.is_admin = true
    )
  );

-- Пользователи могут обновлять свой профиль (уже существует, но проверим)
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

