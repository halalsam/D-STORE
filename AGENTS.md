# AGENTS.md

## Overview

D-STORE: a pnpm + Turborepo monorepo for a clothing store.

- `apps/backend` (`@d-store/backend`): Medusa 2.22.2 server and admin dashboard. Based on Medusa's `dtc-starter` backend.
- `apps/storefront` (`@d-store/storefront`): custom Next.js 16 App Router storefront, Tailwind CSS v4, Radix UI primitives (`radix-ui` package). Not based on the Medusa Next.js starter; UI is our own design system.
- `docker-compose.yml`: PostgreSQL 16 and Redis 7 for local development.

Package manager is **pnpm** (see `packageManager` in root `package.json`). Never create another lockfile. Install deps inside the app that needs them (`cd apps/<app> && pnpm add <pkg>`).

## Where to look

| Task | Location |
| --- | --- |
| Store/admin API route | `apps/backend/src/api/{store,admin}/<path>/route.ts` |
| Middlewares | `apps/backend/src/api/middlewares.ts` |
| Business logic | `apps/backend/src/workflows/` (reuse `@medusajs/medusa/core-flows`) |
| Custom modules | `apps/backend/src/modules/<name>/` |
| Module links | `apps/backend/src/links/` |
| Subscribers / jobs | `apps/backend/src/subscribers/`, `apps/backend/src/jobs/` |
| Admin customizations | `apps/backend/src/admin/` |
| Medusa config (DB, Redis, CORS) | `apps/backend/medusa-config.ts` |
| Storefront Medusa client | `apps/storefront/src/lib/medusa.ts` |
| Storefront API calls | `apps/storefront/src/lib/data/` (server-side, via the SDK client) |
| Storefront routes | `apps/storefront/src/app/` |
| Design system (tokens, rules, layout spec) | `apps/storefront/DESIGN.md`, `apps/storefront/src/styles/` |

## Commands (from repo root)

```bash
pnpm infra:up          # Postgres + Redis
pnpm dev               # all apps
pnpm backend:dev       # http://localhost:9000, admin at /app
pnpm storefront:dev    # http://localhost:8000
pnpm lint
pnpm build
pnpm backend:migrate   # medusa db:migrate (+ migration-scripts seed)
```

Backend tests: `cd apps/backend && pnpm run test:unit` (also `test:integration:http`, `test:integration:modules`; these need a live Postgres).

Custom module migrations: `cd apps/backend && pnpm exec medusa db:generate <module>`.

## Medusa package docs

Medusa packages ship an `AGENTS.md` for the installed version. Prefer them over memory:

```bash
find node_modules -maxdepth 6 -path "*/@medusajs/*/AGENTS.md" 2>/dev/null
```

In the backend, import from `@medusajs/framework/*` subpaths, not `@medusajs/utils` etc.

## Next.js

Next.js 16 differs from older versions. Read `apps/storefront/AGENTS.md` and the docs in `apps/storefront/node_modules/next/dist/docs/` before writing storefront code.

## Code style

- Backend must pass `@medusajs/eslint-plugin` recommended rules (`pnpm lint`). Fix code, don't disable rules.
- No semicolons, double quotes, 2-space indent.
- Files kebab-case, types PascalCase, functions camelCase, DB columns snake_case.
- No emojis in code, comments or commit messages.

## Off-limits

- Build output: `apps/backend/.medusa/`, `.next/`, `dist/`, `.turbo/`.
- `node_modules/`, lockfile hand-edits.
- `.env` / `.env.local`: never commit or print secrets. Document new vars in `.env.template`.
- Existing migrations: add new ones instead of rewriting.
- Destructive DB commands without explicit confirmation.
