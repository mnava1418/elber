# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Elber is a personal, Jarvis-like assistant (a learning project): a chat with Claude that gains "skills" over time (weather, and later finances, tasks...). The backend runs on an EC2 instance (Docker, behind Caddy for HTTPS); the web is deployed on Vercel. Two independent npm projects, each with its own `package.json`, Node 24 (`.nvmrc`):

- `backEnd/`: Express 5 + Socket.IO + TypeScript 7, Firebase Admin (Auth + Firestore).
- `web/`: React 19 + Vite + React Router 7, Firebase client auth, socket.io-client.

## Commands

Run them from inside each project.

`backEnd/`:
- `npm run dev` (tsx watch), `npm run build`, `npm start`
- `npm test`, or a single file: `npx vitest run test/modules/chat/application/send-message.use-case.test.ts` (`-t "<name>"` for one test)
- `npm run lint` (oxlint), `npm run lint:arch` (dependency-cruiser), `npm run typecheck` (src + test)

`web/`:
- `npm run dev`, `npm run build` (`tsc -b && vite build`, also the typecheck), `npm run lint`
- `npm run build:ds`: separate design-system bundle for Claude Design; see `web/.design-sync/NOTES.md` before touching it.
- No tests yet. When adding them, also add an `npm test` step to the Web job in `.github/workflows/ci.yml`.

CI (`.github/workflows/ci.yml`) runs, for the backend: lint, lint:arch, typecheck, test, build; for the web: lint and build.

Docker (`docker compose up -d --build` from the root) runs the built backend behind Caddy (`Caddyfile`), which serves it over HTTPS on `ELBER_API_DOMAIN` from the root `.env` and gets its certificate from Let's Encrypt; the backend publishes no ports and `app.ts` trusts the proxy's `X-Forwarded-For` (private IPs only) so the per-IP rate limit sees real clients. The web is not in compose: it is deployed on Vercel. Compose overrides the host paths of `backEnd/.env` (service account as a secret, vault mounted at `/vault` from `ELBER_VAULT_PATH` in the root `.env`) and keeps the agent's sessions in the `agent-sessions` volume. Dependencies are installed inside the image because the Agent SDK ships a per-platform binary.

Environment: copy `.env.example` in each project. The backend validates every variable at startup in `src/config/env.ts` and exits if one is missing. Set `VITE_CHAT_MOCK=true` to use the chat UI with a canned demo, without the backend.

## Backend architecture

A modular monolith. `src/main.ts` creates the Socket.IO server, then `src/app.ts` builds every module and hands `io` to the ones that have real-time features.

A module is something that could become its own service: its own data and its own entry point (routes, sockets or events). Today: `chat`, `users`, `notifications`, `voice` and `training`. Skills are not modules: they are plugins of the chat (see Skills below).

Rules enforced by `npm run lint:arch` (`backEnd/.dependency-cruiser.cjs`):
- Outside a module, only its `index.ts` (public API) may be imported.
- Modules never import each other. They talk through the event bus (`src/shared/events`), e.g. `users` emits `users.password_reset_requested` and `notifications` sends the email. When one needs an answer (the bus is fire-and-forget), it declares a port with the shape it needs and `app.ts` plugs in an object another module exposes from its `index.ts`, e.g. the chat's training skill declares `TrainingCoach` and `app.ts` passes it `training.coach`. TypeScript checks at `app.ts` that both shapes still fit.
- `src/shared/` never imports from modules.
- Every module uses clean architecture: `domain/` → `application/` → `infrastructure/` + `presentation/`. `domain/` imports nothing outward, and `application/` reaches the outside only through ports defined in `domain/`.
- Skills (`modules/chat/skills/<skill>/`) have the same layers, never import each other, and from the chat reach only the `Skill` contract (`chat/domain/skill.ts`). The chat core never imports a concrete skill: only `chat/index.ts` does, through the skill's `index.ts`, and it never exports them.

### Chat and the agent

The `chat` module builds its own **sections** in `chat/index.ts`, its whole public API (`app.ts` only mounts their routers); `chat/section.ts` builds one from a `ChatSection` (namespace, Firestore collection, prompt, skills, `webTools`, `canUse`, `daily`). Today: the chat (`/chat`, `conversations`, everything) and the diary (`/diary`, `diary`, owner only, one conversation per day whose id is its date, 4:00 cutoff via `shared/dates/journal-day.ts`). Sections share no data: the diary's privacy comes from this construction (its own collection, routes and tools), not from prompts. Everything lives under `Elber/` in the vault. The chat's memory only reaches its own files there (`Perfil.md`, `Pendientes.md`, `Notas/`); only the diary's `journal` skill reaches `Elber/Diario/`.

- `modules/chat` uses the Claude Agent SDK (`infrastructure/claude-agent-assistant.ts`), behind the `Assistant` port so the agent framework can be swapped.
- The agent is locked down on purpose: only `WebSearch`/`WebFetch` plus Elber's skill tools, `permissionMode: 'dontAsk'`, `settingSources: []` (no CLAUDE.md or ~/.claude), `skills: []`, `strictMcpConfig`, an empty `cwd` in tmp, and a minimal `env`. In the SDK, `tools` decides which built-in tools exist, while `allowedTools` only auto-approves them. Never add Bash/Read/Write.
- Sessions: the SDK stores one `.jsonl` per conversation in `CLAUDE_CONFIG_DIR=~/.elber/agent`. It is set both in the child's env and in `process.env`, because `getSessionInfo`/`deleteSession` run in-process. Conversations live in Firestore (`users/{uid}/conversations/{id}` + `messages`), each linked to its SDK session through `resume`.
- Transport: one Socket.IO namespace per section (`/chat`, `/diary`), with the Firebase ID token verified in the handshake (`canUse` rejects with `FORBIDDEN`). History uses REST under `/api/v1/<section>/conversations` (Bearer token), plus `GET /api/v1/diary/today`. Event types are deliberately duplicated in the backend and the web.
- `ELBER_SYSTEM_PROMPT` (`infrastructure/elber-system-prompt.ts`) and `DIARY_SYSTEM_PROMPT` (`infrastructure/diary-system-prompt.ts`, the diary section's prompt) stay static (no dates or per-user data) so it can be prompt-cached.
- Prompts and guides for the model are `.md` files next to the code that uses them (e.g. `chat/infrastructure/prompts/`), never strings in code. They are loaded at import time with `readPrompt(new URL('./x.md', import.meta.url))` (`shared/prompts/read-prompt.ts`), and `npm run build` copies every `.md` under `src/` to `dist/` (`scripts/copy-prompts.mjs`). Our code reads them, never the agent.
- Sources: a `PostToolUse` hook numbers the WebSearch/WebFetch results so the model cites them as `[n]` (`web-sources.ts`).

### Voice calls

A call is the chat spoken, not a skill. The web (`src/chat/call/`) listens with the browser's speech recognition (Web Speech API, es-MX) and sends what it hears as a normal `chat:message` with `voice: true`, which appends `VOICE_CONTEXT` (short spoken answers, no Markdown) after the other contexts. It cuts the streamed answer into sentences, strips Markdown and citations, and plays each piece from `POST /api/v1/voice/speech` (`modules/voice`: Amazon Polly behind the `SpeechSynthesizer` port, max 1000 chars per piece, its own per-user rate limit outside the API's). Half duplex: the microphone is off while Elber talks.

### Skills (pattern for new ones)

A skill is a folder in `src/modules/chat/skills/` (weather, memory, bugs, journal, training) whose `index.ts` exports a `create*Skill()` that returns a `Skill` (`src/modules/chat/domain/skill.ts`, framework-agnostic contract): its `tools`, built with `defineTool`, and optionally `context(uid)`, text about the user that is appended to the system prompt on every answer, after the fixed prompt (e.g. the memory profile). Its tests go in `test/modules/chat/skills/<skill>/`. `chat/index.ts` picks which section gets which and passes them to `createSection` (`chat/section.ts`), which serves their tools through an in-process MCP server named `elber`, one per reply. The model sees them as `mcp__elber__<name>`; the UI sees the bare name. A tool's `SkillContext` gives it `uid`, `signal`, `locate()` (asks the device for its location over the socket) and `show(widget)`.

Widgets: `show({type, data})` is stored with the message and sent as `chat:widget`. Each `type` needs its own component in `web/src/chat/widgets/` (dispatcher: `Widgets.tsx`). Use `modules/chat/skills/weather` as the reference implementation, and tell the model about new tools in the system prompt.

In the web, each new tool also needs: its `ToolKind` (`src/chat/types.ts`), its entry in `TOOL_KIND` (`src/chat/tools.ts`), and its `LABEL`, `ICON` and `stepsSummary` line in `src/chat/ElberMessage.tsx`. Otherwise its step shows as a web search.

### Training (the coach)

The `training` module owns the training data (`users/{uid}/training/profile`, `training/readyPlan`, `trainingPlans` with their routines embedded, `trainingSessions/{YYYY-MM-DD}`, `bodyMeasurements`), for every user, and serves it to the training page under `/api/v1/training`. Its domain holds the rules: one active plan at a time (checked in a transaction), at most one plan ready to start (a separate document with no dates, which the streak, charts and history never see; the user starts it from the page, which closes the active plan that day if they agree), routines in rotation whose array order is the suggested order, a streak counted in weeks that met the weekly target (`daysPerWeek` of the plan active that week, else the profile's), and progress charts that follow an exercise from plan to plan by its normalized name. Days are always the user's, sent by their device (`today`); the server never decides them, except the `preparedOn` of a plan Elber prepares (the server's day, like `todayContext`).

The chat's `training` skill is Elber as coach: it reads and writes the profile, prepares the ready plan (`create_plan`) and edits it or the active one (`update_plan` with `which`) through `training.coach`, reads the progress, and shows saved plans as a `training_plan` widget (status `ready` for the one not started). Elber can't start or close plans, mark days or add measurements: only the page does, and the coach has no method for it. It has no `context(uid)`; the long coaching guide (`skills/training/infrastructure/coaching-guide.md`) is served on demand by `get_coaching_guide`.

Owner-only skills (memory, bugs) check `MEMORY_OWNER_UID` in the use case and return an error result (e.g. `BUG_REPORTS_UNAVAILABLE`) for anyone else, so the model explains it instead of failing.

### Tests

Vitest, in `backEnd/test/`, mirroring `src/`. External dependencies (Firebase, Gmail, OpenWeather, the SDK) are faked, never called.

## Web architecture

- `src/chat/` is the whole chat feature, shared by every section (`src/chat/section.ts`: `CHAT` and `DIARY`, each with its path, API, transport and texts). `useChat` owns the conversation state and the reconnection (Socket.IO's own reconnection is off). `transport.ts` adapts a section's socket, with a mock transport for `VITE_CHAT_MOCK`. The routes are `/chat/:conversationId?` and `/diario/:conversationId?` (without an id it opens today's), and the URL is the source of truth for the open conversation.
- The landing (`/`, `src/pages/Home.tsx`) is for signed-out visitors: what Elber does and a way to sign in, no sign-up.
- After sign-in the user lands on `/inicio` (`src/pages/Inicio.tsx`, cards in `src/inicio/`): a card per section showing how the day goes there (the latest chats, whether the diary was talked today and its last 7 days, today's routine and the streak). `useInicio` loads each card on its own, in parallel, from the sections' existing APIs (`/chat/conversations`, `/diary/today` + `/diary/conversations`, `/training/summary`), so a failing card doesn't hide the others; a 403 hides that card (the diary for non-owners). A new section needs its card there. The API's per-IP rate limit (300 per 15 minutes, `app.ts`) was raised for these requests: keep new pages frugal.
- `src/training/` is the training page (`/entrenamiento`, `src/pages/Training.tsx`, on the dashboard's `.inicio` shell): the day card plus a 4-week calendar to mark past days, the streak, the plan ready to start (start, edit, discard), the active plan (edit and close), progress charts, measurements with the monthly reminder, the profile and the history. `useTraining` loads everything in one request (`GET /training/page`, so reloads stay within the API's per-IP rate limit) and reloads it after each change, since the backend computes the streak and the rest; "today" comes from the device. Charts are hand-rolled SVG (`LineChart.tsx`), one series each. `training/plan.ts` holds the plan types shared with the chat's `training_plan` widget.
- `src/components/` is the design system (Button, Card, TextField...). Use these components and the CSS custom properties from `src/styles/tokens.css`, never hardcoded colors (see `web/.design-sync/conventions.md`).
- Chat widgets (`src/chat/widgets/`) are styled with the chat's own tokens (`--chat-*`, `--display`, defined on `.chat` in `src/styles/Chat.css`), not with `Card`.
- UI text is in Spanish.

## Working style

- Prefer simple solutions. Work one step at a time and check in between steps.
- The user commits and starts the dev servers themselves.
- Comments are always in English, in both projects, and explain the why. UI text stays in Spanish.
