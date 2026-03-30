# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (Next.js on port 3000)
npm run build        # Generate Prisma client + run migrations + build
npm run start        # Run production server
```

Database commands:
```bash
npx prisma migrate dev --name <name>   # Create new migration
npx prisma migrate deploy              # Apply pending migrations
npx prisma studio                      # Open Prisma Studio GUI
npx prisma generate                    # Regenerate Prisma client after schema changes
```

There are no test or lint scripts configured.

## Architecture

**Stack**: Next.js App Router (React 19, TypeScript), Tailwind CSS v4, Prisma + PostgreSQL (Neon), Clerk auth, optional Ollama for AI suggestions.

This is a personal budget/expense tracker with trip management. Key concepts:

- **Budget** — one per user per month, contains categories and monthly income
- **Category** — "weekly" (budget per week, supports rollover debt) or "monthly" (fixed amount); system categories (like "Trips") are auto-created
- **Expense** — assigned to a category; can be recurring (weekly/monthly); optionally linked to a Trip
- **Trip** — groups expenses for travel/outings; auto-assigned to the "Trips" system category

## Key Files & Patterns

**Auth**: All API routes call `await getAuthedUserId()` from `@/lib/auth/server` — returns 401 if unauthenticated. UserId scopes all data queries.

**Database**: `@/lib/prisma.ts` exports a Prisma singleton. Schemas are in `prisma/schema.prisma`. Two DB URLs required: `DATABASE_URL` (pooled via PgBouncer) and `DIRECT_URL` (direct, for migrations).

**Business logic utilities**:
- `@/lib/weekUtils.ts` — week boundary calculations (Sun–Sat), weekly spend tracking, rollover debt
- `@/lib/recurringUtils.ts` — lazily generates recurring expense entries on budget fetch (idempotent)
- `@/lib/budgetCache.ts` — 30-second client-side cache to reduce API calls
- `@/lib/ollama.ts` — calls local Ollama (llama3) for AI budget suggestions; falls back to proportional distribution

**API routes** live in `src/app/api/`. Main endpoints: `/api/budget`, `/api/expenses`, `/api/expenses/[id]`, `/api/categories/[id]`, `/api/trips`, `/api/trips/[id]`, `/api/history`, `/api/ai/suggest`.

**Path alias**: `@/*` maps to `./src/*`.

## Environment Variables

```
DATABASE_URL=               # Neon pooled connection (PgBouncer)
DIRECT_URL=                 # Neon direct connection (for Prisma migrations)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
OLLAMA_URL=http://localhost:11434   # Optional
OLLAMA_MODEL=llama3                 # Optional
```
