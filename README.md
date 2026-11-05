# D-STORE

Clothing e-commerce monorepo.

| App | Path | Stack | URL |
| --- | --- | --- | --- |
| Backend + Admin | `apps/backend` | Medusa 2.22.2 (server + admin dashboard) | http://localhost:9000 (admin at `/app`) |
| Storefront | `apps/storefront` | Next.js 16, React 19, Tailwind CSS v4, Radix UI | http://localhost:8000 |
| Dev infra | `docker-compose.dev.yml` | PostgreSQL 16, Redis 7, Meilisearch | `5432`, `6379`, `7700` |
| Production | `docker-compose.yml` | Traefik, Postgres, Redis, Meilisearch, Medusa server + worker, storefront, backups | see [DEPLOYMENT.md](./DEPLOYMENT.md) |

Tooling: pnpm workspaces + Turborepo. Node >= 22.22.

## First-time setup

```bash
pnpm install
pnpm infra:up                                   # start Postgres, Redis and Meilisearch in Docker
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
pnpm infra:down        # stop dev infra (data persists in Docker volumes)
pnpm backend:setup:integrations  # link configured payment/shipping providers to the India region
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

## Integrations

All optional; each turns on when its keys are set in `apps/backend/.env` (see `.env.template`).

| Integration | Module | Notes |
| --- | --- | --- |
| Meilisearch | `apps/backend/src/modules/meilisearch` | Search Module provider; storefront `/search` queries Medusa `/store/search`. Unset = Postgres search |
| S3 / R2 | `@medusajs/medusa/file-s3` | Product images and uploads. Unset = local disk |
| Razorpay | `apps/backend/src/modules/razorpay` | UPI, cards, netbanking, wallets via Razorpay Checkout |
| PhonePe | `apps/backend/src/modules/phonepe` | PG v2 hosted checkout, returns to `/checkout/payment-return` |
| Google sign-in | `@medusajs/medusa/auth-google` | Storefront callback `/auth/google/callback`; set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` |
| Resend | `apps/backend/src/modules/resend`, `src/subscribers/` | Order, shipping, account emails; contacts synced from marketing consent and newsletter |
| Shiprocket | `apps/backend/src/modules/shiprocket` | Live courier rates at checkout; creating a fulfillment books the shipment, AWB and label |
