# ARIA — AI Executive Assistant (PRD)

## Vision
Premium Turkish-language "digital employee" that performs real work: plans the user's day, creates/tracks tasks, manages calendar, remembers relationships (CRM), converts natural-language commands into real actions, and uses user-controlled persistent AI memory.

## Tech Stack
- Frontend: React 19 (CRA + craco, "@"=src alias), Tailwind, shadcn/ui, Framer Motion, Lucide, Sonner, date-fns (tr locale)
- Backend: FastAPI, Motor (MongoDB), PyJWT, PBKDF2-SHA256, SSE streaming
- AI: emergentintegrations LlmChat — provider-agnostic via env: AI_PROVIDER=openai, AI_MODEL=gpt-5.4, EMERGENT_LLM_KEY
- Auth: email/password (JWT sub/role/sid/exp + server sessions in auth_sessions) + Emergent managed Google OAuth (session_id fragment → /api/auth/google/session)

## Design System (v2 — brand new, replaces old green/mint)
- Identity: warm-neutral (sand/oat) + ink navy + copper accent (#C97532)
- Fonts: Space Grotesk (headings, .font-heading), IBM Plex Sans (body), IBM Plex Mono
- Light + dark themes (CSS HSL tokens in index.css; .dark class, localStorage "aria_theme")
- Full guidelines: /app/design_guidelines.md

## Implemented (MVP v1)
- Auth: register/login/me/logout, Google (Emergent) exchange endpoint, cookie + Bearer (sessionStorage) fallback, session revocation on logout
- Onboarding: 4 steps (profile, AI preferences, integration interests, initial memory) → GET/PUT /api/onboarding; complete sets users.onboarding_complete + creates initial memory record
- Dashboard: GET /api/dashboard (counts, today's tasks, upcoming events, weekly progress, heuristic ARIA suggestion, quick-ask → chat)
- AI Chat: POST /api/chat/stream (SSE: meta/action/delta/done/error), GET /api/chat/threads, GET/DELETE thread messages. Context includes profile, prefs, approved memories, open tasks, last 12 messages. Intent extraction (Turkish NL → task_create JSON) creates REAL tasks + inline "Görev oluşturuldu" action card
- Tasks: full CRUD, quick add (priority + due), status filter tabs, complete/reopen, status select, delete
- Calendar: day/week/month views, event CRUD, prev/next/today, HTML5 drag-drop move to another day, click-day quick create
- CRM: contacts CRUD, interaction timeline (note/call/email/meeting/message), ARIA summary block, search, ?contact= deep link
- Memory: CRUD, category + importance (1-5 dots), active/passive switch (approved), onboarding source
- Global search: GET /api/search?q= across tasks/contacts/events/memories; ⌘K dialog in topbar, results navigate
- Integrations hub: honest "Yakında" cards (Gmail, Calendar, Drive, Slack, Telegram, Notion) — NO fake connections
- Theme toggle light/dark; responsive (desktop sidebar, mobile hamburger + sheet drawer)

## Data Rules (enforced)
- Every query scoped by user_id; projections {"_id": 0}; UUID string ids (user_id, task_id, event_id, contact_id, interaction_id, memory_id, thread_id, message_id, sid)
- datetime.now(timezone.utc), ISO strings in Mongo
- insert_one receives dict copy (no _id mutation of returned payload)

## Env (backend/.env)
MONGO_URL, DB_NAME, CORS_ORIGINS, EMERGENT_LLM_KEY, AI_PROVIDER, AI_MODEL, JWT_SECRET — never hardcode

## Backlog
- P0: real Gmail OAuth, Google Calendar 2-way sync, Drive picker + object storage, risky-AI-action approval queue, verify Google OAuth E2E with real account
- P1: voice notes, transcription, AI summaries, evening digest, notifications, attachments, semantic search, advanced memory extraction, settings page
- P2: Slack/Telegram/Notion/Trello/ClickUp/Asana, Zoom/Outlook, WhatsApp Business, subscriptions, admin, analytics, AI agent modules

## Test Status
- POC (backend/test_core.py): LLM streaming + intent extraction + task execution — ALL PASS
- Backend smoke (curl): auth, onboarding, tasks, dashboard, search, chat SSE — PASS
- UI smoke: login → dashboard verified via screenshot
