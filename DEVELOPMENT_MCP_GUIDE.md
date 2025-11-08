Короткая инструкция (что LLM-агент должен делать при работе с MCP):

Контекст → context7: перед написанием кода запроси свежую документацию через context7 (max_age_days=30) и процитируй источник/URL.

UI → shadcn: при добавлении UI-компонента сначала запроси shadcn MCP, получи примеры использования и структуру props; предлагай конкретные файлы/патчи.

DB/Functions → supabase MCP: изменения в схеме — генерируй migration-файл (SQL) и PR; любые update/delete/alter помечай как requires_approval в PR (в PRD согласовано: ты даешь агенту полномочия, но PR должен включать тесты и описание).

Code → github MCP: создавай ветку feature/..., добавляй тесты, делай commit + PR; PR должен содержать checklist (lint, tests).

Deploy → vercel MCP: генерация preview — допустима; production deploy — выполняется по запросу (админ/владелец или по отдельной команде).

Формат действий: agent формирует структурированный tool-call JSON: mcp, action, payload, summary, requires_approval, risk_score. Всегда включать sources[] (context7/shadcn urls) и test_plan (как проверить изменения).