# PRD — Платформа хранения и тестирования промтов (полная спецификация)

**Версия:** 1.0
**Дата:** 2025-11-08
**Контекст (вводные):**

* Это single-workspace веб-приложение: фронтенд — Next.js + shadcn/ui (Tailwind); бэкенд — Supabase (Postgres, Auth, Edge Functions) на бесплатном тарифе; деплой фронтенда — Vercel (free).
* Доступ к LLM — через OpenRouter (платный аккаунт, без ограничений по моделям).
* Ограничение времени выполнения серверных функций (Supabase free): **150 секунд** — фиксируем в PRD как ограничение MVP.
* В продовой платформе **нет встроенных агентов**; MCP (Cursor + MCP-серверы: supabase, shadcn, context7, github, vercel) используется **только** в процессе разработки/тестирования и не фигурирует в пользовательском UX.
* Вы даёте агенту в Cursor полный доступ на этапе разработки — это управляется отдельно и не описывается в UI/PRD.
* Требование к LLM-ассистенту (если он пишет код): **много комментариев на русском языке**, код понятный новичку.

---

# 1. Цель проекта и ключевые задачи

**Цель:** сделать удобное хранилище промтов с возможностью тестирования их на выбранной LLM, с минимально-необходимыми командными и административными инструментами, и с чётким контролем сохранения результатов.

**Ключевые задачи MVP:**

1. CRUD промтов (создать/редактировать/удалить/пометить публичным).
2. Каталог промтов + поиск и фильтрация по тегам/названию.
3. Playground: запуск промта на выбранной модели/температуре; отображение ответа в markdown (поддержка таблиц и кода).
4. «Сохранённые ответы» — per-prompt лента ответов пользователя (admin видит все). Удобный интерфейс просмотра внутри страницы промта.
5. Админ: управление списком доступных моделей (строка формата `vendor/model`), выбор глобальной рекомендованной модели/температуры; управление аккаунтами.
6. Простое логирование действий (audit) — кто/когда/какая модель/промт/температура/duration/status и ошибки.
7. Валидация форм и показ понятных сообщений об ошибках (на русском).
8. Возможность агенту (Cursor) автоматически генерировать тестовые данные для демонстрации (исполняется в dev workflow, не в проде).

---

# 2. Роли и права доступа (RBAC)

1. **Admin**

   * Права: просматривать/редактировать/удалять любые промты; управлять аккаунтами; добавлять/удалять модели в глобальный список; задавать глобальные рекомендованные модель/температуру; просматривать admin-логи (audit); просматривать все сохранённые ответы.
2. **User**

   * Права: регистрироваться/логиниться; создавать промты; редактировать/удалять свои промты; запускать промты; просматривать свою ленту сохранённых ответов; отмечать промты публичными; делиться ссылкой на публичные промты; настроить личную рекомендованную модель/температуру.
3. **Guest (не используется)** — в MVP не предусмотрен (пользователи обязаны авторизоваться).

**Правила специальных случаев**

* Если пользователь редактирует публичный промт, который он не создал — при сохранении автоматически **создаётся копия** в его аккаунте (owner = текущий user). После создания копии UI показывает уведомление и спрашивает: «Хотите сделать новый промт публичным как и старый?» (кнопки: Сделать публичным / Оставить приватным).

---

# 3. Функциональные требования (подробно)

## 3.1. Промты — структура и поведение в UI

**Поля промта:**

* `id` (uuid), `title` (string, обязательное), `body` (text, обязательное), `description` (string, опционально), `tags` (array<string>), `recommended_model` (string, формат `vendor/model`), `recommended_temperature` (number, 0.0–2.0), `is_public` (bool), `owner_id`, `created_at`, `updated_at`.

**Поведение:**

* В редакторе промта отдельно отображаются:

  * "Рекомендуемая модель (для промта)" — ввод/выбор значения (строка).
  * "Рекомендуемая температура (для промта)" — число (0–2).
    Эти поля — часть метаданных промта и **НЕ** заменяют элементы интерфейса отправки запроса (см. §3.3).
* При сохранении: если `title` пустой — валидировать и показать ошибку (см. §6).
* При попытке редактирования чужого публичного промта: сохранение создаёт копию в личной коллекции; UI спрашивает разрешение на автоматическое публичное выставление копии.

## 3.2. Каталог и поиск

* Каталог публичных промтов (фильтрация по тегам, поиск по title/body).
* Личный каталог (все промты, owner = user).
* Сортировка: по дате, alfabet, популярности (опционально в будущем).

## 3.3. Playground — запуск промта

* Компоненты интерфейса на странице промта:

  1. **Editor pane** (title, body, description, tags, поля recommended_model/temperature).
  2. **Run pane** (отдельный элемент):

     * Dropdown «Модель» — список моделей, доступных по админской конфигурации (ключи вида `vendor/model`). Поле редактируемое: пользователь может выбрать любую модель из списка; поле может быть пустым — в этом случае применяется логика дефолтных значений.
     * Input «Температура» — число, допустимый диапазон 0.0–2.0 (шаг 0.1).
     * Кнопка **Run**.
     * Кнопка **Сохранённые ответы** — открывает ленту сохранённых ответов (см. §3.4).
     * Checkbox **Save response** (по умолчанию false) — при отмеченном чекбоксе результат сохраняется в `saved_responses`. Также в ответе пользователь может нажать «Сохранить» уже после получения результата.
* Логика выбора модели/температуры при открытии страницы промта (при подготовке формы отправки):

  1. Если в самом промте заполнены `recommended_model`/`recommended_temperature` — они используются по умолчанию в Run pane.
  2. Иначе, если пользователь в профиле указал `preferred_model`/`preferred_temperature` — они используются.
  3. Иначе — используются глобальные админские значения (если заданы).
* Пользователь в Run pane может вручную изменить модель/температуру перед отправкой — эти изменения действуют только для текущего запуска и не меняют поля промта.

## 3.4. Сохранённые ответы — per-prompt лента

* Кнопка **Сохранённые ответы** открывает модальное окно / боковую панель в Run pane (встроенный компонент в модельном окне).
* Лента показывает сохранённые ответы **именно для данного промта** и **для текущего пользователя**. Для админа лента показывает все сохранённые ответы для данного промта (включая других пользователей).
* Элемент ленты (карточка) содержит: `номер (id)`, `дата/время`, `пользователь (display_name)`, `модель`, `температура`, `duration_ms`, `status` (ok/error), краткий preview (первая строка/параграф, рендер в markdown), и кнопки: `View full` / `Delete` (только для автора ответа или admin).
* Возможность фильтрации/поиска по ленте (по модели, дате).
* UX требования: лента должна быть компактной, пролистываемой, поддерживать lazy load (пагинация, infinite scroll).

## 3.5. Сохранённые ответы — хранение

* Таблица `saved_responses` содержит: `id, prompt_id, user_id, model, temperature, output_markdown, metadata (json: duration_ms, openrouter_resp_id, tokens_estimate optional), created_at`.
* По умолчанию храним **полную** `output_markdown` только когда пользователь явно сохранил ответ (чекбокс или кнопка Save). Мы **не** сохраняем все Run-запросы.

## 3.6. Админские возможности моделей

* Таблица `admin_models` (ключ = `vendor/model`): `key, display_name, description, added_by, created_at`.
* UI: админ может добавить/удалить модель; изменение списка мгновенно влияет на dropdown в Run pane (список доступных моделей).
* Админ задаёт глобальные `admin_default_model` и `admin_default_temperature`.

## 3.7. Audit / логи

* Таблица `audit_logs` записывает события: `create` / `edit` / `delete` / `run` / `save_response` / `change_settings`. Поля: `id, actor_id, action, target_table, target_id, created_at, model (если применимо), temperature (если применимо), duration_ms (если применимо), status, error_message (если есть)`. **Краткое описание ответов в логах не требуется.**
* Админская страница «Логи» — показывает эти записи. Логи не содержат полный текст сохранённых ответов (если они сохранены — админ может открыть полную запись через saved_responses).

---

# 4. Нефункциональные требования

## 4.1. Валидация и обработка ошибок (обязательные правила)

* Все формы имеют валидацию на клиенте и на сервере. Ошибки показываются пользователю на русском языке и логируются.
* Основные проверки:

  * `title` при создании/сохранении промта — обязательное поле. Ошибка: `«Заголовок обязателен»`.
  * `body` (тело промта) — обязательное поле. Ошибка: `«Текст промта не может быть пустым»`.
  * `recommended_temperature` / «температура в Run pane»: число ∈ [0.0, 2.0]. При вводе отрицательной температуры — ошибка: `«Температура должна быть числом от 0.0 до 2.0»`.
  * `model` — если выбран, должен быть в админском списке (если админ не добавил модель, то при ручном вводе модель не принимается). Ошибка: `«Выбранная модель недоступна. Обратитесь к администратору»`.
  * При попытке сохранить публичный промт без title — блокировать и показывать вышеуказанную ошибку.
* Серверные ошибки (тайм-аут функция >150s, ошибка OpenRouter, некорректная конфигурация) — отображать пользователю понятное сообщение и Log ID; в логах записывать полную информацию о ошибке. Пример: `«Произошла ошибка при выполнении запроса (timeout). ID ошибки: abc123. Пожалуйста, повторите позже или свяжитесь с администратором.»`

## 4.2. UX-правила и доступность

* Интерфейс минималистичный в стиле shadcn + серые тона, адаптирован под мобильные устройства.
* Все критические элементы — большие кнопки, четкие подписи.
* Кодовые блоки и таблицы рендерятся с подсветкой синтаксиса.
* Обязательные элементы форм отмечены звёздочкой и имеют подсказки.

## 4.3. Производительность и лимиты

* Supabase free DB: ограничение объёма — учитывать ретеншн. Для сохранённых ответов — предусмотреть автоматическую архивацию/удаление старых записей (опция admin).
* Таймауты: все серверные вызовы к LLM через Supabase Edge Function ограничены 150s. Если операция ожидаемо дольше — использовать асинхронный flow (run → run_id → polling), но для MVP достаточно синхронного ожидания с таймаут-сообщением.

---

# 5. API / контракт (подробно)

> Примечание: все эндпоинты предполагают использование Supabase Auth. Для привилегированных операций (admin) — проверка прав на сервере.

## 5.1. Prompts

### `GET /api/prompts`

**Query params:** `q`, `tag`, `owner_id`, `public_only`
**Response:** list of prompts (мини-инфо: id, title, description, tags, owner_id, is_public, recommended_model, recommended_temperature, created_at)

### `POST /api/prompts`

**Body:**

```json
{
  "title": "string",
  "body": "string",
  "description": "string|null",
  "tags": ["a","b"],
  "recommended_model": "google/gemini-2.5-flash|null",
  "recommended_temperature": 0.2,
  "is_public": false
}
```

**Validation errors:** 400 + `{ "error": "Заголовок обязателен" }`

**Behavior on edit of others' public prompt:** If requestor != owner and target.is_public == true and updating body/title → create copy: new prompt with current user as owner; server returns `{copied: true, new_prompt_id: "...", message: "Создана копия. Хотите сделать копию публичной как оригинал?"}`

### `PUT /api/prompts/:id`

* Same body as POST. If updating other's public prompt → see above.

### `DELETE /api/prompts/:id`

* Only owner or admin. Logs audit event.

## 5.2. Run (Playground)

### `POST /api/run`

**Body:**

```json
{
  "prompt_id": "uuid",
  "inputs": { "var1": "value" },   // optional; platform may render placeholders client-side
  "model": "vendor/model|null",    // optional; if null, resolve defaults
  "temperature": 0.2|null,
  "save_response": false
}
```

**Server behavior:**

1. Resolve `model`/`temperature` with priority: prompt → user → admin defaults.
2. Validate `model` is in admin list (or null). Validate temperature in [0.0,2.0].
3. Log audit event `run` with meta `{model, temperature, start_time}`.
4. Call OpenRouter server→server (secret in env). Wait up to 150s.
5. On success: return

```json
{
  "status": "ok",
  "output_markdown": "string (markdown)",
  "meta": {
    "duration_ms": 432,
    "log_id": "uuid"
  }
}
```

6. If `save_response: true` — persist to `saved_responses` and return saved id.

**Errors:**

* `400` validation (e.g., invalid temperature).
* `504` if timeout >150s with message `{"status":"error","error":"timeout","log_id":"..."}`.

## 5.3. Saved Responses

### `GET /api/prompts/:id/saved_responses?offset=0&limit=20`

* Returns list of saved responses for prompt id filtered by current user (or all if admin).

### `POST /api/prompts/:id/saved_responses` (server side used when save_response=true)

**Body:** `{ "output_markdown": "...", "model": "...", "temperature": 0.2, "meta": {...}}`
**Response:** saved id.

## 5.4. Admin models

* `GET /api/admin/models` — список моделей.
* `POST /api/admin/models` — добавить модель `{key:"vendor/model","display_name":"","description":""}`
* `DELETE /api/admin/models/:key`

## 5.5. Audit logs

* `GET /api/admin/logs?from=&to=&actor_id=&action=` — admin only. Returns audit entries (see schema §7).

---

# 6. Data model (SQL DDL — полная версия)

```sql
-- Profiles (extend auth.users)
create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  preferred_model text,
  preferred_temperature numeric,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Prompts
create table prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  description text,
  owner_id uuid references profiles(id),
  recommended_model text,
  recommended_temperature numeric,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tags as join
create table prompt_tags (
  prompt_id uuid references prompts(id) on delete cascade,
  tag text,
  primary key (prompt_id, tag)
);

-- Saved responses
create table saved_responses (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references prompts(id) on delete cascade,
  user_id uuid references profiles(id),
  model text,
  temperature numeric,
  output_markdown text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Admin models list
create table admin_models (
  key text primary key, -- "google/gemini-2.5-flash"
  display_name text,
  description text,
  added_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Audit logs minimal
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text, -- create/edit/delete/run/save_response/change_settings
  target_table text, -- prompts/saved_responses/admin_models/profiles
  target_id text, -- uuid or textual identifier
  model text, -- optional
  temperature numeric, -- optional
  duration_ms int, -- optional for run
  status text, -- ok/error
  error_message text, -- if error
  meta jsonb, -- optional
  created_at timestamptz default now()
);
```

---

# 7. UI-спецификация — экраны и компоненты (детально)

> Визуальный стиль: shadcn/ui, минимализм, серые тона, элементы в стиле chatGPT. Компоненты должны иметь комментарии на русском языке в коде.

## 7.1. Главная / Landing

* Описание продукта, кнопки Sign up / Login, CTA к каталогу промтов.

## 7.2. Каталог промтов

* Список карточек: `title`, `short description`, `tags`, `author`, `Run` (preview) кнопка. Панель фильтров (tags), строка поиска.

## 7.3. My Prompts

* Таблица/карточки промтов, кнопки Edit / Run / Duplicate / Delete.

## 7.4. Prompt Page (ключевой экран)

Layout: две колонки (десктоп) / стэк (моб):

* **Левая колонка / верх (Editor pane):**

  * Title (input) — обязательное.
  * Body (textarea / rich text / markdown) — обязательное.
  * Description (input).
  * Tags (chips, add).
  * Recommended model (input/select) — отдельный элемент.
  * Recommended temperature (number input) — отдельный элемент.
  * Save / Cancel buttons.
* **Правая колонка / ниже (Run pane):**

  * Dropdown «Модель» (список админских моделей; editable selection).
  * Input «Температура» (0.0–2.0).
  * Кнопка **Run**.
  * Чекбокс **Save response**.
  * Кнопка **Сохранённые ответы** — открывает ленту (внутри модели).
  * Поле состояния — при запуске: большой баннер `Обработка запроса...` (spinner) — если выполнено успешно — отображается markdown-ответ.
  * Под ответом кнопки: `Сохранить ответ` (если не сохранен), `Скопировать`, `Создать Issue` (опционально).
* **Поведение при редактировании чужого публичного промта:** при Save, возгорается modal: «Вы редактируете публичный промт, который не принадлежит вам. Сохранение создаст копию в вашем аккаунте. Хотите сделать копию публичной?» — кнопки: [Создать копию и сделать публичной] / [Создать копию и оставить приватной] / [Отмена].

## 7.5. Saved Responses panel (встроенная в Prompt Page)

* Ожидаемый дизайн: боковая панель, лента карточек (preview), каждый элемент с meta (пользователь, модель, температура, дата, duration, статус). Поддержка пагинации/загрузки следующей страницы. Карточка раскрывается в modal для просмотра полного output (markdown).

## 7.6. Admin pages

* Models management UI (add/remove models).
* Users management UI (list, deactivate, set admin).
* Audit logs UI: таблица с фильтрами (action, actor, date range).

## 7.7. Настройки пользователя

* Профиль: display_name, preferred_model (dropdown), preferred_temperature (0–2).
* Кнопка «Заполнить демонстрационные данные» — запускает (при разрешении) скрипт, который использует Cursor-generated seed data (только в dev).

---

# 8. Validations / Сообщения об ошибках (точные формулировки на русском)

**Формы (клиент + сервер):**

* Title пустой → `«Заголовок обязателен»`
* Body пустой → `«Текст промта не может быть пустым»`
* Temperature вне диапазона → `«Температура должна быть числом от 0.0 до 2.0»`
* Модель не в списке → `«Выбранная модель недоступна. Обратитесь к администратору»`
* Сохранение публичного промта чужим пользователем — modal предупреждение и выбор действий (см. §7.4).
* При таймауте LLM → `«Превышено время ожидания ответа (150 сек). Попробуйте снова или уменьшите сложность запроса. ID: <log_id>»`
* При ошибке сети / OpenRouter → `«Ошибка сети при обращении к LLM: <короткое описание>. ID: <log_id>»`
* Общая server error → `«Произошла ошибка на сервере. Пожалуйста, сообщите администратору. ID: <log_id>»`

---

# 9. Acceptance Criteria и тест-кейсы (детально)

## 9.1. CRUD и поведение копирования публичного промта

* AC1: Создать промт с title/body/tags → промт виден в My Prompts.
* AC2: Попытка сохранить промта без title → отклоняется с сообщением `Заголовок обязателен`.
* AC3: Редактирование чужого публичного промта → при сохранении создаётся копия с owner=current user; сервер отвечает `{copied:true,new_prompt_id:"..."}`; UI показывает modal с вопросом о публичности.

## 9.2. Поиск/фильтрация

* AC4: По tag=marketing → возвращает промты с этим тегом.
* AC5: Поиск по названию возвращает релевантные промты.

## 9.3. Playground и Saved responses

* AC6: Открыть промт, нажать Run — UI показывает `Обработка запроса`; результат приходит <150s; если чекбокс Save_response=true — ответ сохраняется (row in saved_responses).
* AC7: Нажать `Сохранённые ответы` — отображается лента сохранённых ответов для данного промта, показываются только ответы текущего пользователя; для admin — все ответы.
* AC8: Карточка ответа содержит model, temperature, duration, status, created_at; кнопка View full открывает полный markdown.

## 9.4. Модели и приоритеты

* AC9: При открытии промта модель/температура поля Run pane выставляются согласно приоритету: prompt → user → admin defaults.
* AC10: Пользователь может вручную выбрать модель/температуру из dropdown; выбранное значение не изменяет промт.

## 9.5. Логирование и admin-логи

* AC11: Любое create/edit/delete/run/save_response записывается в audit_logs с полными полями (actor_id, action, target_table, target_id, model, temperature, duration_ms, status, error_message if any).
* AC12: Admin может просматривать логи с фильтрацией и видеть ошибки с log IDs.

## 9.6. Validation and Errors

* AC13: Негативные сценарии (некорректные данные/timeout/OpenRouter error) возвращают понятные сообщения на русском с log_id и соответствующим статусом.

---

# 10. Тестовые данные и автоматическое заполнение

* В профиле пользователя добавить кнопку `Fill demo data` (dev feature). При нажатии Cursor-agent или встроенный seed script генерируют:

  * ~10 sample prompts разных типов (instructional, creative, code snippets).
  * ~5 сохранённых ответов для нескольких промтов.
* Генерация тестовых данных доступна только в dev-режиме или по разрешению админа.

---

# 11. Dev/Deploy & операционный процесс

## 11.1. Локальная разработка

* Frontend: `pnpm dev` (Next.js).
* Supabase: облачный dev project (рекомендуется) + `supabase` CLI для функций. Для integration tests — `supabase start` (локально, через Docker).
* Secrets: `.env.local` (в `.gitignore`) содержит `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (только для локального dev of functions), `OPENROUTER_API_KEY`. Никогда не пушить service key в репозиторий.

## 11.2. CI / CD

* GitHub Actions: on PR → run lint/tests → run `supabase db push` (если есть миграции / optional) → create preview.
* Vercel: подключение репозитория; preview deploy per PR; production deploy on merge to `main` (по запросу / manual). Cursor-agent может создавать PR и триггерить deploys через Vercel MCP (на этапе разработки).

## 11.3. Monitoring & Alerts

* Логи ошибок (Supabase function errors, OpenRouter failures) — записываются в audit_logs с `log_id`. Админ получает email alert если % failed_runs > threshold (опционально).

---

# 12. Безопасность и приватность

* **Secrets**: OPENROUTER_API_KEY и SUPABASE_SERVICE_ROLE_KEY хранятся только в Supabase Secrets / Vercel Env; нигде не в клиенте.
* **RLS**: row level security для Prompts/SavedResponses — по умолчанию anon key может SELECT public prompts; write/delete — только через авторизованного пользователя или через Edge Function.
* **Audit**: логирование действий — обязательное. Логи не содержат полных raw outputs, только метаданные.
* **MCP & Cursor**: MCP используются только в разработке; в production MCP-интеграции не включать.

---

# 13. Метрики успеха (KPI)

* **Функциональные KPI**:

  * Успешный deploy в Vercel (preview/production) + зелёный CI.
  * 90% acceptance tests green (из раздела 9).
* **Оценка LLM в рамках проекта**:

  * Достигнута способность LLM выдавать приемлемые ответы по тест-набору (оценка вручную, >X из Y примеров).
* **Операционные**:

  * Количество сохранённых ответов и общего объёма хранения (контроль для free планов).
  * Количество ошибок run (должно быть <5% в стабильной фазе тестирования).

---

# 14. Roadmap (после MVP — предложения)

1. Phase 1 (MVP) — все пункты PRD.
2. Phase 2 — аналитика эффективности промтов (выборки сохранённых ответов → метрики по качеству, сравнение моделей).
3. Phase 3 — side-by-side сравнение моделей (если нужно), и возможно платные/маркетплейс-фичи.

---

# 15. Руководство для LLM-ассистента (при генерации кода/комментариев)

> Требование: богатые комментарии на русском языке, код понятный новичку.

**Стиль комментирования:**

* Комментарии к каждому файлу: короткое назначение файла.
* Комментарии внутри функций: что делает шаг и почему (на русском).
* Пример:

  ```ts
  // Функция runPrompt:
  // 1) Валидация входных данных (температура, id промта)
  // 2) Разрешение модели (prompt → user → admin)
  // 3) Вызов OpenRouter и обработка результата
  // 4) Логирование (audit_logs) и опциональное сохранение
  ```
* Код должен использовать понятные имена переменных и детальные ошибки на русском.

---

# 16. Acceptance checklist перед релизом

* [ ] Все acceptance tests (раздел 9) зеленые.
* [ ] UI: Prompt page + Saved Responses panel — протестированы на мобилках.
* [ ] Валидация форм — пройдена.
* [ ] Audit logging — работает для всех типов действий.
* [ ] Secrets защищены, RLS настроен.
* [ ] CI → Vercel deploy проверен (preview + manual prod).
* [ ] Демонстрационные данные (seed) загружены и доступны в dev.
* [ ] Документация: `.env.example`, README с run/deploy инструкциями, `DEVELOPMENT_MCP_GUIDE.md` (для dev use).

---

# 17. Примеры сообщений в интерфейсе (русский язык) — для разработчиков UI

* Успех сохранения промта: `«Промт успешно сохранён»`
* При создании копии чужого публичного промта: `«Вы редактируете публичный промт. Сохранение создаст копию в вашем аккаунте. Сделать копию публичной?»` (кнопки: `Сделать публичной`, `Оставить приватной`, `Отмена`)
* Ошибка валидации title: `«Заголовок обязателен»`
* Ошибка валидации температуры: `«Температура должна быть числом от 0.0 до 2.0»`
* При таймауте LLM: `«Превышено время ожидания ответа (150 сек). ID ошибки: abc123»`
* Обработка запроса (spinner): `«Обработка запроса… Подождите, это может занять до 150 секунд.»`
