# Deployment

One server, one instance of every service, behind Traefik with Let's Encrypt.
Images are built in GitHub Actions and pulled on the server; the server never builds.

| Service | Image | Public |
| --- | --- | --- |
| `traefik` | `traefik:v3.6` | 80, 443 |
| `frontend` | `ghcr.io/halalsam/d-store/frontend` | `https://$STORE_DOMAIN` |
| `medusa-server` | `ghcr.io/halalsam/d-store/medusa` (API + admin at `/app`, runs migrations on start) | `https://$API_DOMAIN` |
| `medusa-worker` | same image, `MEDUSA_WORKER_MODE=worker` (subscribers, jobs, search indexing) | no |
| `postgres` | `postgres:16-alpine` | no |
| `redis` | `redis:7-alpine` (event bus, workflows, locking) | no |
| `meilisearch` | `getmeili/meilisearch:v1.56` (product search, queried through Medusa `/store/search`) | no |
| `backup` | `ghcr.io/halalsam/d-store/backup` (nightly `pg_dump`, optional S3 copy) | no |

Compose files: `docker-compose.yml` is production, `docker-compose.dev.yml` is local infra for `pnpm dev`.

## 1. Server setup (once)

1. Ubuntu 24.04 with Docker Engine and the compose plugin. Open ports 22, 80, 443.
2. DNS: `A` records for `STORE_DOMAIN`, `www.STORE_DOMAIN` and `API_DOMAIN` pointing to the server.
3. Clone the repo where the workflow expects it (`SERVER_PATH`):

```bash
git clone git@github.com:halalsam/D-STORE.git /srv/d-store
```

```bash
cd /srv/d-store && cp .env.example .env && cp .env.backend.example .env.backend
```

4. Fill `.env` (domains, Postgres password, `JWT_SECRET`, `COOKIE_SECRET`, `MEILI_MASTER_KEY`; generate each with `openssl rand -hex 32`) and `.env.backend` (integration keys; leave empty what you don't have yet).
5. Log in to GHCR with a token that has `read:packages`:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u <github-user> --password-stdin
```

## 2. GitHub configuration

Repository **secrets** (`main` deploys to `SERVER_*`, `dev` to `DEV_SERVER_*`):

| Secret | Value |
| --- | --- |
| `SERVER_HOST`, `SERVER_USER`, `SERVER_PORT`, `SERVER_PATH`, `SSH_PRIVATE_KEY` | Live box |
| `DEV_SERVER_HOST`, `DEV_SERVER_USER`, `DEV_SERVER_PORT`, `DEV_SERVER_PATH`, `DEV_SSH_PRIVATE_KEY` | Dev box |
| `GHCR_PULL_USER`, `GHCR_PULL_TOKEN` | Account + token with `read:packages` |

Environment **variables** in the `production` and `dev` environments (baked into images at build time):

| Variable | Example |
| --- | --- |
| `MEDUSA_BACKEND_URL` | `https://api.dstore.in` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_...` from admin, Settings, Publishable API Keys |
| `NEXT_PUBLIC_SITE_URL` | `https://dstore.in` |
| `NEXT_PUBLIC_DEFAULT_REGION` | `in` |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | `true` once Google keys are set |

## 3. First deploy

The storefront build prerenders the catalog from the live backend, so the backend goes first.

1. On the server, start the infrastructure (the workflow recreates app services with `--no-deps`):

```bash
docker compose up -d traefik postgres redis meilisearch
```

2. Run the **Deploy** workflow manually with `medusa-server medusa-worker backup`, then check the API:

```bash
curl -fsS https://api.dstore.in/health
```

3. Seed the catalog, connect integrations and create an admin user:

```bash
docker compose exec medusa-server npx medusa exec ./src/scripts/seed-dstore.js
```

```bash
docker compose exec medusa-server npx medusa exec ./src/scripts/setup-integrations.js
```

```bash
docker compose exec medusa-server npx medusa user -e admin@dstore.in -p '<strong-password>'
```

4. In the admin (`https://api.dstore.in/app`), copy the publishable key into `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, then run **Deploy** with `frontend`.

## 4. Everyday deploys

Push deploys are currently off (`deploy.yml` only has `workflow_dispatch`); re-enable the `push` trigger once the server is ready. With it on, pushing to `main` (live) or `dev` (dev box) runs the workflow, which builds only images whose paths changed
(`apps/backend/**`, `apps/storefront/**`, `backup/**`; lockfile changes rebuild both apps),
pins `<branch>-<sha>` tags in the server's `.env`, pulls, and recreates the services.
A `docker-compose.yml` change alone recreates the app services without rebuilding.

Manual run: **Actions, Deploy, Run workflow**, with services such as `frontend medusa-server`.

## 5. Rollback

```bash
cd /srv/d-store && grep _TAG .env
```

Set `MEDUSA_TAG`, `FRONTEND_TAG` or `BACKUP_TAG` to an earlier `<branch>-<sha>` (see the package versions on GitHub), then:

```bash
docker compose pull frontend && docker compose up -d --no-deps frontend
```

Migrations only move forward, so rolling the backend back past a migration needs a database restore.

## 6. Integrations

Each integration is off until its keys are in `.env.backend`. After adding keys, recreate the backend and re-run the setup script:

```bash
docker compose up -d --no-deps medusa-server medusa-worker
```

```bash
docker compose exec medusa-server npx medusa exec ./src/scripts/setup-integrations.js
```

| Integration | Keys | Also configure |
| --- | --- | --- |
| Razorpay (UPI, cards, netbanking, wallets) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Dashboard webhook `https://$API_DOMAIN/hooks/payment/razorpay_razorpay`, events `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid` |
| PhonePe PG v2 | `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION`, `PHONEPE_ENV`, `PHONEPE_WEBHOOK_USERNAME/PASSWORD` | Dashboard webhook `https://$API_DOMAIN/hooks/payment/phonepe_phonepe` with the same username and password |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google Cloud OAuth client, authorized redirect URI `https://$STORE_DOMAIN/auth/google/callback`; set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` and redeploy `frontend` |
| Resend | `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_SEGMENT_ID` | Verify the sending domain in Resend; create a segment for marketing contacts |
| Shiprocket | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION`, `SHIPROCKET_PICKUP_POSTCODE` | Use a dedicated API user (Settings, API); the pickup location name must match the panel exactly |
| S3 / R2 for images | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FILE_URL` (+ `S3_ENDPOINT`, `S3_ACL=false` for R2) | Bucket must allow public reads on `S3_FILE_URL` |

Emails sent: order confirmation, shipped (with tracking), cancelled, welcome, password reset, newsletter welcome.
Without Resend they are logged by the worker instead.

## 7. Backups and restore

`backup` dumps Postgres nightly to the `backups` volume (kept `BACKUP_KEEP_DAYS`) and copies to `BACKUP_S3_BUCKET` when set. Run one now:

```bash
docker compose exec backup backup.sh
```

Restore (stops the apps, overwrites the database):

```bash
docker compose stop medusa-server medusa-worker frontend
```

```bash
docker compose exec -T postgres pg_restore -U dstore -d dstore --clean --if-exists < ./dstore-YYYYMMDDTHHMMSSZ.dump
```

```bash
docker compose up -d medusa-server medusa-worker frontend
```

Meilisearch needs no backup: the worker rebuilds the index from Postgres when it is empty.

## 8. Useful commands

```bash
docker compose ps
```

```bash
docker compose logs -f --tail=200 medusa-server medusa-worker
```

```bash
docker compose exec postgres psql -U dstore dstore
```
