# TaskFlow Architecture Plan

## Stack Overview
- **Frontend/UI**: Next.js App Router (TS, Tailwind, shadcn-style primitives) with React Server Components for data hydration and TanStack Query for client caching.
- **Backend/API**: Next.js server actions + route handlers. Prisma as ORM, PostgreSQL as DB, NextAuth credentials provider for auth.
- **Realtime**: Pusher Channels. Shared helper to publish events for task instances, manager notes, task list CRUD.
- **AI Services**: OpenAI official SDK via helper in `lib/ai/openai.ts` powering import, quick-add, daily summary endpoints.

## Folder Structure
```
app/
  today/
  task-lists/
  ai/
  api/
components/
lib/
  auth/
  realtime/
  ai/
  utils.ts
prisma/
  schema.prisma
  seed.ts
scripts/
  generate-taskinstances.ts
```

## Key Flows
1. **Today view** loads server-rendered tasks + manager note filtered by company/date and subscribes to realtime channel for updates.
2. **Task list management** uses nested layouts and client dialogs to CRUD TaskLists + Tasks, with helper to generate TaskInstances.
3. **AI import + quick add** accept uploads/text, call OpenAI with strict prompts, preview JSON tasks, then persist via transactional server action.
4. **Daily summary** collects TaskInstances for day, prompts OpenAI to summarize, stores in `ManagerNote` extension field or separate log.

## Environment Variables
`DATABASE_URL`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`, `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`.

## Tooling
ESLint, Prettier, TypeScript strict, Prisma migrate + seed, Playwright smoke tests.
