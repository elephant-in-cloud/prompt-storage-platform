-- Миграция для разрешения анонимного доступа к публичным промтам
-- Это необходимо для страницы каталога, доступной без авторизации

-- Удаляем старую политику для публичных промтов
drop policy if exists "Public prompts visible to authenticated" on public.prompts;

-- Создаем новую политику, разрешающую всем (включая анонимов) видеть публичные промты
create policy "Public prompts visible to all"
  on public.prompts for select
  using (is_public = true);

-- Также обновляем политику для prompt_tags, чтобы теги публичных промтов были видны всем
drop policy if exists "Tags visible for accessible prompts" on public.prompt_tags;

create policy "Tags visible for public and own prompts"
  on public.prompt_tags for select
  using (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_tags.prompt_id
      and (
        prompts.is_public = true
        or prompts.owner_id = (select auth.uid())
      )
    )
  );

-- Обновляем политику для profiles - имена авторов публичных промтов должны быть видны всем
create policy "Profiles visible for public prompt owners"
  on public.profiles for select
  using (
    exists (
      select 1 from public.prompts
      where prompts.owner_id = profiles.id
      and prompts.is_public = true
    )
  );

