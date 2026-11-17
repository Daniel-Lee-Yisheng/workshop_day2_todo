# Todo App

A passwordless (WebAuthn) todo app built from `PRPs/00-one-shot-implementation.md`
(AI-SDLC Workshop). Everything runs on Singapore time.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · better-sqlite3 ·
SimpleWebAuthn · JWT (jose) in an HTTP-only cookie · zod · Playwright

## Getting started

```bash
npm install
cp .env.example .env.local      # then set JWT_SECRET
npm run dev                     # http://localhost:3000
```

The SQLite database is created automatically at `data/todos.db` on first run.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (no `console.log` allowed in app code) |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm test` | Playwright end-to-end tests (run `npx playwright install chromium` once first) |
| `npm run seed:holidays` | Seed Singapore public holidays (Phase 11) |

## Project rules

- **Time:** never call `new Date()` directly. Use `lib/timezone.ts`
  (`getSingaporeNow()`, `formatSingaporeDate()`, `toSingaporeISO()`, `parseSingaporeDate()`).
- **API routes:** check the session first (401 `Not authenticated`), scope every query to
  `session.userId`, and `await params`.
- **Route protection** lives in `proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`).

## Progress

- [x] Phase 0: setup, schema, types, timezone helpers, Playwright config
- [ ] Phase 1: authentication
- [ ] Phase 2: todo CRUD
- [ ] Phase 3: priority
- [ ] Phase 4: recurring todos
- [ ] Phase 5: reminders & notifications
- [ ] Phase 6: subtasks & progress
- [ ] Phase 7: tags
- [ ] Phase 8: templates
- [ ] Phase 9: search & filtering
- [ ] Phase 10: export & import
- [ ] Phase 11: calendar view
- [ ] Phase 12: final verification
