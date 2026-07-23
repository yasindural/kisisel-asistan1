# plan.md — ARIA (AI Executive Assistant) Rebuild Plan

## 1) Objectives
- Rebuild ARIA end-to-end in this workspace (/app) with a brand-new premium UI (light/dark, mobile-first) while delivering the full MVP scope.
- Prove the **core workflow** first: (1) LLM SSE streaming works reliably with Emergent LLM key + latest available OpenAI GPT model, (2) Turkish NL → structured intent → real MongoDB task creation.
- Implement secure multi-tenant data isolation (user_id), UUID ids, timezone-aware datetimes, and zero `_id` leakage.
- Ship a cohesive product-quality UX: onboarding → dashboard → chat-driven actions → tasks/calendar/CRM/memory/search + integrations hub.

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation: LLM SSE + Intent → Task)
**User stories (POC):**
1. As a user, I want the assistant to stream responses token-by-token so I can trust it’s working.
2. As a user, I want to type “Yarın Burak’ı ara” and see a real task created.
3. As a user, I want failed AI calls to return a clear error event (SSE) without breaking the UI.
4. As a user, I want the assistant to use my approved memories and open tasks as context.
5. As a developer, I want a single script to validate model availability and streaming behavior quickly.

Steps:
1. Create integration playbook notes (in-repo) for emergentintegrations + SSE patterns + model selection; confirm latest available OpenAI model mapping for `AI_MODEL`.
2. Implement `backend/poc_core.py` (standalone script):
   - Calls emergentintegrations with `AI_PROVIDER`, `AI_MODEL`, `EMERGENT_LLM_KEY`.
   - Validates streaming semantics (or simulated chunking if provider returns full text; still emitted as SSE chunks).
3. Implement minimal FastAPI POC endpoints (temporary or behind flag):
   - `POST /api/poc/chat/stream` SSE with `meta/delta/done/error`.
   - `POST /api/poc/intent` that parses Turkish commands → normalized `TaskCreate` payload.
4. Implement `execute_intent` POC logic:
   - Recognize simple patterns (date words like yarın/bugün, time “18:00”, “ara”, “uyar”).
   - Output either `action=task_create` with fields or `action=none`.
5. Run POC tests locally (curl + python): verify SSE correctness, Mongo insert correctness, no `_id` leakage.
6. Only after POC is stable, proceed to full app build.

### Phase 2 — V1 App Development (Full MVP, New Premium Design)
**User stories (V1):**
1. As a new user, I want to sign up and complete onboarding in 4 short steps so ARIA feels personalized.
2. As a user, I want a dashboard that instantly shows my day (tasks + events + CRM) so I know what matters.
3. As a user, I want chat to create tasks for me from natural language so I save time.
4. As a user, I want to manage tasks (filters, status, due dates) fast with a clean UI.
5. As a user, I want calendar day/week/month views with quick event creation and drag-to-move.
6. As a user, I want a CRM with interaction timeline so I don’t lose relationship context.
7. As a user, I want to store “approved” memories that ARIA uses, and disable them anytime.
8. As a user, I want global search to jump to tasks/contacts/events/memories instantly.

Backend (FastAPI + Motor):
1. Create proper project structure in `/app/backend` (modules for auth, onboarding, dashboard, chat, tasks, events, crm, memories, search).
2. Implement auth:
   - Email/password register/login/me/logout with PBKDF2-SHA256, JWT (sub/role/sid/exp), server sessions in `auth_sessions`.
   - Cookie support + Bearer sessionStorage fallback.
   - Emergent managed Google OAuth flow (fragment `session_id` → backend validation endpoint).
3. Implement domain collections with strict rules:
   - Every query scoped by `user_id`; UUID ids; `datetime.now(timezone.utc)`; projections `{"_id":0}`.
4. Implement MVP endpoints per spec:
   - onboarding, dashboard, chat (threads/messages + SSE), tasks, events, contacts/interactions, memories, search.
5. Replace POC intent code with production `execute_intent` used inside chat stream (task creation confirmation message persisted).

Frontend (React 19 + Tailwind + shadcn/ui):
1. Run design_agent to produce: color system, typography, spacing, components, motion rules (light/dark), and a refreshed layout concept.
2. Build app shell:
   - Desktop sidebar + top bar global search + theme toggle; mobile drawer + hamburger; responsive grids.
3. Implement pages:
   - Login (email/pass + Google), Onboarding (4-step), Dashboard, Chat (streaming), Tasks, Calendar, CRM, Memory, Integrations.
4. Implement `src/lib/api.js` with TanStack Query hooks and auth header handling (sessionStorage Bearer fallback).
5. Add Sonner toasts for success/error, Framer Motion for subtle transitions, Lucide icons.
6. Add unique `data-testid` to all interactive/critical elements.

Testing & stabilization (end of Phase 2):
1. Backend: run pytest and add/adjust tests to cover all MVP endpoints and `_id`/user isolation invariants.
2. Frontend: production build, basic lint, and Playwright-style critical flow checks (login → onboarding → dashboard → chat → create task).
3. Fix regressions until green.

### Phase 3 — Hardening + UX Polish (No New Integrations Yet)
**User stories (hardening):**
1. As a user, I want empty states that guide me so the product never feels broken.
2. As a user, I want optimistic UI for small edits (task status/progress) so it feels fast.
3. As a user, I want undo for destructive actions so I feel safe.
4. As a user, I want consistent loading/skeleton states so the app feels premium.
5. As a user, I want accessibility-friendly navigation (keyboard/focus) so it’s usable everywhere.

Steps:
1. Audit all pages for loading/error/empty states; add skeletons and safe retries.
2. Add undo flows (Sonner action) for deletes where feasible.
3. Improve calendar DnD edge cases + mobile usability.
4. Chat polish: thread naming, message grouping, “task created” inline cards.
5. Re-run full testing_agent_v3 and fix until stable.

### Phase 4 — Future Backlog (Spec-aligned)
- P0: real Gmail OAuth, Google Calendar 2-way sync, Drive picker + object storage, risky-AI-action approval queue, verify Google OAuth E2E.
- P1/P2: voice, transcription, summaries, notifications, attachments, semantic search, advanced memory extraction, settings, more integrations.

## 3) Next Actions (Immediate)
1. Inspect current `/app` template; create folder structure + baseline env usage (no env changes).
2. Fetch emergentintegrations playbook + confirm latest OpenAI model name for `AI_MODEL`.
3. Implement and run Phase 1 POC scripts/endpoints until streaming + intent→task is verified.
4. Run design_agent and lock the new premium design system.
5. Implement Phase 2 MVP backend + frontend in minimal large patches; then run testing_agent_v3.

## 4) Success Criteria
- Core POC:
  - SSE emits `meta`, multiple `delta`, and `done` (or `error`) reliably; no broken connections.
  - Turkish intent examples create real tasks in MongoDB with correct UUID ids and timezone-aware timestamps.
- MVP V1:
  - All specified endpoints implemented and working; user_id isolation everywhere; no `_id` in any response.
  - Auth (email/password + Google managed flow) works with preview-safe Bearer fallback.
  - Full UI: onboarding, dashboard, chat, tasks, calendar, CRM, memory, search, integrations hub; light/dark; responsive at 390px with no horizontal overflow.
  - Tests pass: backend pytest green; frontend build succeeds; E2E critical paths verified.
- Product quality:
  - Premium visual design with consistent components, motion, typography; fast perceived performance and clear empty/error states.

---
## STATUS UPDATE (Phase 1 + Phase 2 COMPLETE)
- Phase 1 POC: PASSED (backend/test_core.py — GPT-5.4 streaming, Turkish intent extraction, Mongo task execution)
- Phase 2 MVP: COMPLETE. New premium design (warm-neutral + ink navy + copper, Space Grotesk/IBM Plex). All pages built: Login, Onboarding (4 steps), Dashboard, Chat (SSE + action cards), Tasks, Calendar (day/week/month + DnD), CRM, Memory, Integrations, Global search (⌘K), light/dark theme, mobile responsive.
- Testing (iteration_1.json): Backend 34/34 PASS, Frontend 65/66 (only minor mobile drawer animation timing in automation, not a user-facing bug). Registration→onboarding→dashboard flow verified manually.
- Next: Phase 3 polish or P0 backlog (real Gmail OAuth, Google Calendar sync, Drive, approval queue) on user request.
