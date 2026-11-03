# D-STORE

Clothing e-commerce monorepo.

| App | Path | Stack | URL |
| --- | --- | --- | --- |
| Backend + Admin | `apps/backend` | Medusa 2.22.2 (server + admin dashboard) | http://localhost:9000 (admin at `/app`) |
| Storefront | `apps/storefront` | Next.js 16, React 19, Tailwind CSS v4, Radix UI | http://localhost:8000 |
| Infra | `docker-compose.yml` | PostgreSQL 16, Redis 7 | `5432`, `6379` |

Tooling: pnpm workspaces + Turborepo. Node >= 22.22.

## First-time setup

```bash
pnpm install
pnpm infra:up                                   # start Postgres + Redis in Docker
cp apps/backend/.env.template apps/backend/.env
pnpm backend:migrate                            # run migrations + initial data seed
pnpm backend:seed:dstore                        # D-STORE catalog: India region (INR), products, shipping, WELCOME10
pnpm backend:user -e admin@dstore.local -p supersecret
```

Then get the publishable key from the admin (**Settings -> Publishable API Keys**) and put it in the storefront env:

```bash
cp apps/storefront/.env.template apps/storefront/.env.local
# edit NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in apps/storefront/.env.local
```

## Daily commands

```bash
pnpm dev               # backend + storefront
pnpm backend:dev       # backend only
pnpm storefront:dev    # storefront only
pnpm lint              # lint everything
pnpm build             # build everything
pnpm infra:down        # stop Postgres + Redis (data persists in Docker volumes)
```

Optional Medusa demo products: `pnpm backend:seed`.

## How the storefront talks to Medusa

- Catalog pages are prerendered from the Store API and refresh about every minute (`"use cache"`).
- Bag = Medusa cart (cart id in an httpOnly cookie). Sign in = Medusa email/password auth (JWT in an httpOnly cookie).
- Checkout: address -> shipping options -> payment session (system provider for now) -> `cart.complete`.
- The storefront build needs the backend running when `MEDUSA_BACKEND_URL` is set.
- **Demo mode:** with `MEDUSA_BACKEND_URL` unset (e.g. a Vercel deploy without a backend), the storefront serves a bundled catalog of real BLUORNG collections (`apps/storefront/src/lib/mock/catalog.json`, photos from cdn.shopify.com) and keeps cart, account and orders in cookies. A footer badge and a checkout note mark it as a demo.

## Redis

When `REDIS_URL` is set, the backend uses Redis for the event bus, workflow engine and locking (see `apps/backend/medusa-config.ts`). Without it Medusa falls back to in-memory modules.
