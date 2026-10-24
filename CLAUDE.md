# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Elber is a personal, Jarvis-like assistant (a learning project): a chat with Claude that gains "skills" over time (weather, and later finances, tasks...). It runs locally only (maybe in Docker), it is never deployed. Two independent npm projects, each with its own `package.json`, Node 24 (`.nvmrc`):

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

Environment: copy `.env.example` in each project. The backend validates every variable at startup in `src/config/env.ts` and exits if one is missing. Set `VITE_CHAT_MOCK=true` to use the chat UI with a canned demo, without the backend.

## Backend architecture

A modular monolith. `src/main.ts` creates the Socket.IO server, then `src/app.ts` builds every module and hands `io` to the ones that have real-time features.

Rules enforced by `npm run lint:arch` (`backEnd/.dependency-cruiser.cjs`):
- Outside a module, only its `index.ts` (public API) may be imported.
- Modules never import each other. They talk through the event bus (`src/shared/events`), e.g. `users` emits `users.password_reset_requested` and `notifications` sends the email.
- `src/shared/` never imports from modules.
- Modules with clean architecture (`chat`, `weather`, `notifications`) use `domain/` → `application/` → `infrastructure/` + `presentation/`. `domain/` imports nothing outward, and `application/` reaches the outside only through ports defined in `domain/`. `users` is simpler (controller/service/routes).

### Chat and the agent

- `modules/chat` uses the Claude Agent SDK (`infrastructure/claude-agent-assistant.ts`), behind the `Assistant` port so the agent framework can be swapped.
- The agent is locked down on purpose: only `WebSearch`/`WebFetch` plus Elber's skill tools, `permissionMode: 'dontAsk'`, `settingSources: []` (no CLAUDE.md or ~/.claude), `skills: []`, `strictMcpConfig`, an empty `cwd` in tmp, and a minimal `env`. In the SDK, `tools` decides which built-in tools exist, while `allowedTools` only auto-approves them. Never add Bash/Read/Write.
- Sessions: the SDK stores one `.jsonl` per conversation in `CLAUDE_CONFIG_DIR=~/.elber/agent`. It is set both in the child's env and in `process.env`, because `getSessionInfo`/`deleteSession` run in-process. Conversations live in Firestore (`users/{uid}/conversations/{id}` + `messages`), each linked to its SDK session through `resume`.
- Transport: Socket.IO namespace `/chat`, with the Firebase ID token verified in the handshake. History uses REST under `/api/v1/chat/conversations` (Bearer token). Event types are deliberately duplicated in the backend and the web.
- `ELBER_SYSTEM_PROMPT` (`infrastructure/elber-system-prompt.ts`) stays static (no dates or per-user data) so it can be prompt-cached.
- Sources: a `PostToolUse` hook numbers the WebSearch/WebFetch results so the model cites them as `[n]` (`web-sources.ts`).

### Skills (pattern for new ones)

A skill is a module that exports a `Skill` (`src/shared/skills/skill.ts`, framework-agnostic contract): its `tools`, built with `defineTool`, and optionally `context(uid)`, text about the user that is appended to the system prompt on every answer, after the fixed prompt (e.g. the memory profile). `app.ts` passes the skills to `createChatModule`, which serves their tools through an in-process MCP server named `elber`, one per reply. The model sees them as `mcp__elber__<name>`; the UI sees the bare name. A tool's `SkillContext` gives it `uid`, `signal`, `locate()` (asks the device for its location over the socket) and `show(widget)`.

Widgets: `show({type, data})` is stored with the message and sent as `chat:widget`. Each `type` needs its own component in `web/src/chat/widgets/` (dispatcher: `Widgets.tsx`). Use `modules/weather` as the reference implementation, and tell the model about new tools in the system prompt.

### Tests

Vitest, in `backEnd/test/`, mirroring `src/`. External dependencies (Firebase, Gmail, OpenWeather, the SDK) are faked, never called.

## Web architecture

- `src/chat/` is the whole chat feature. `useChat` owns the conversation state and the reconnection (Socket.IO's own reconnection is off). `transport.ts` adapts the `/chat` socket, with a mock transport for `VITE_CHAT_MOCK`. The route is `/chat/:conversationId?`, and the URL is the source of truth for the open conversation.
- `src/components/` is the design system (Button, Card, TextField...). Use these components and the CSS custom properties from `src/styles/tokens.css`, never hardcoded colors (see `web/.design-sync/conventions.md`).
- UI text is in Spanish.

## Working style

- Prefer simple solutions. Work one step at a time and check in between steps.
- The user commits and starts the dev servers themselves.
- Comments are always in English, in both projects, and explain the why. UI text stays in Spanish.
