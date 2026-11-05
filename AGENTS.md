# AGENTS.md

## Overview

D-STORE: a pnpm + Turborepo monorepo for a clothing store.

- `apps/backend` (`@d-store/backend`): Medusa 2.22.2 server and admin dashboard. Based on Medusa's `dtc-starter` backend.
- `apps/storefront` (`@d-store/storefront`): custom Next.js 16 App Router storefront, Tailwind CSS v4, Radix UI primitives (`radix-ui` package). Not based on the Medusa Next.js starter; UI is our own design system.
- `docker-compose.dev.yml`: PostgreSQL 16, Redis 7 and Meilisearch for local development.
- `docker-compose.yml`: production stack (Traefik, Postgres, Redis, Meilisearch, Medusa server + worker, storefront, backup). Deploy flow in `DEPLOYMENT.md` and `.github/workflows/deploy.yml`.

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
| Medusa config (DB, Redis, CORS, every integration, gated on env) | `apps/backend/medusa-config.ts` |
| Integration providers (Meilisearch, Razorpay, PhonePe, Resend, Shiprocket) | `apps/backend/src/modules/<name>/` |
| Emails and Resend contact sync | `apps/backend/src/subscribers/`, `apps/backend/src/lib/notify.ts`, `apps/backend/src/modules/resend/templates.ts` |
| Link providers to region / shipping options | `apps/backend/src/scripts/setup-integrations.ts` |
| Checkout payment gateways (storefront) | `apps/storefront/src/lib/data/cart.ts` (`setPaymentMethod`), `components/checkout/razorpay.ts` |
| Google OAuth (storefront) | `apps/storefront/src/lib/data/oauth.ts`, `src/app/auth/google/callback/route.ts` |
| Dockerfiles | `apps/backend/Dockerfile`, `apps/storefront/Dockerfile`, `backup/Dockerfile` (build context: repo root) |
| Storefront Medusa client (server only, no stored tokens) | `apps/storefront/src/lib/medusa.ts` |
| Storefront API calls | `apps/storefront/src/lib/data/`: `catalog.ts` (cached reads, `"use cache"`), `cart.ts` + `customer.ts` (server actions), `adapters.ts` (Medusa -> view models), `cookies.ts` (JWT + cart id cookies) |
| View model types / static config | `apps/storefront/src/lib/types.ts`, `apps/storefront/src/lib/site.ts` |
| Menu, footer and SEO links (derived from catalog) | `apps/storefront/src/lib/data/navigation.ts` |
| Storefront routes | `apps/storefront/src/app/` |
| Product search (Medusa `/store/search` + demo matcher) | `apps/storefront/src/lib/data/search.ts`, `apps/storefront/src/app/(store)/search/` |
| UI primitives / store / account / checkout components | `apps/storefront/src/components/{ui,store,account,checkout}/` |
| Client stores: bag mirror of the Medusa cart, saved items (localStorage) | `apps/storefront/src/lib/stores/` |
| D-STORE catalog seed (India/INR, products, shipping, WELCOME10) | `apps/backend/src/scripts/seed-dstore.ts` + `data/dstore-catalog.json` |
| Custom store route: order payment method | `apps/backend/src/api/store/orders/[id]/payment-method/route.ts` |
| Guest orders into accounts (email verification, order transfer) | `apps/backend/src/lib/guest-orders.ts`, `src/workflows/link-order-to-customer.ts`, `src/subscribers/link-guest-order.ts`, `src/api/store/email-verification/`, `src/api/store/customers/me/{guest-orders,email-verification}/`; storefront `lib/data/customer.ts` (`linkGuestOrders`), `app/(auth)/verify-email/` |
| Design system (tokens, rules, layout spec) | `apps/storefront/DESIGN.md`, `apps/storefront/src/styles/` |

## Commands (from repo root)

```bash
pnpm infra:up          # Postgres, Redis, Meilisearch (docker-compose.dev.yml)
pnpm dev               # all apps
pnpm backend:dev       # http://localhost:9000, admin at /app
pnpm storefront:dev    # http://localhost:8000
pnpm lint
pnpm build
pnpm backend:migrate   # medusa db:migrate (+ migration-scripts seed)
pnpm backend:seed:dstore  # D-STORE catalog, India region, shipping, promo (idempotent)
```

Backend tests: `cd apps/backend && pnpm run test:unit` (also `test:integration:http`, `test:integration:modules`; these need a live Postgres).

Custom module migrations: `cd apps/backend && pnpm exec medusa db:generate <module>`.

## Medusa package docs

Medusa packages ship an `AGENTS.md` for the installed version. Prefer them over memory:

```bash
find node_modules -maxdepth 6 -path "*/@medusajs/*/AGENTS.md" 2>/dev/null
```

In the backend, import from `@medusajs/framework/*` subpaths, not `@medusajs/utils` etc.

## Storefront data rules

- Catalog reads go through `lib/data/catalog.ts` and use `"use cache"` + `cacheTag`. Never read cookies inside them.
- Anything per-user (cart, customer, orders) reads cookies and must render inside `<Suspense>` (Cache Components).
- Dynamic routes read `params` inside a `<Suspense>` child, or runtime regeneration fails.
- The storefront build needs the backend running when `MEDUSA_BACKEND_URL` is set. Unset = demo mode (`lib/data/mode.ts`, `lib/data/mock-backend.ts`, bundled `lib/mock/catalog.json`, real BLUORNG products with Shopify-hosted photos); every exported data function checks `DEMO_MODE` first, so keep new data functions in both paths.

## Next.js

Next.js 16 differs from older versions. Read `apps/storefront/AGENTS.md` and the docs in `apps/storefront/node_modules/next/dist/docs/` before writing storefront code.

## Code style

- Backend must pass `@medusajs/eslint-plugin` recommended rules (`pnpm lint`). Fix code, don't disable rules.
- No semicolons, double quotes, 2-space indent.
- Files kebab-case, types PascalCase, functions camelCase, DB columns snake_case.
- No emojis in code, comments or commit messages.
- Minimal comments: only a non-obvious why, never what the code does.

## Off-limits

- Build output: `apps/backend/.medusa/`, `.next/`, `dist/`, `.turbo/`.
- `node_modules/`, lockfile hand-edits.
- `.env` / `.env.local`: never commit or print secrets. Document new vars in `.env.template`.
- Existing migrations: add new ones instead of rewriting.
- Destructive DB commands without explicit confirmation.
