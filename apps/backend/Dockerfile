# syntax=docker/dockerfile:1.7
# Build context: repo root. One image runs both medusa-server and medusa-worker.

ARG NODE_IMAGE=node:22.22-alpine

FROM ${NODE_IMAGE} AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/backend/package.json apps/backend/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @d-store/backend...

FROM deps AS build
# The admin dashboard is a static bundle that calls this URL.
ARG MEDUSA_BACKEND_URL
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
COPY apps/backend apps/backend
RUN pnpm --filter @d-store/backend build \
 && pnpm --filter @d-store/backend deploy --prod --legacy /deps \
 && mkdir /out \
 && cp -r apps/backend/.medusa/server/. /out/ \
 && mv /deps/node_modules /out/node_modules

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=9000
RUN addgroup -S app && adduser -S app -G app && apk add --no-cache tini
COPY --from=build --chown=app:app /out ./
COPY --chown=app:app apps/backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /app/static && chown app:app /app/static
USER app
EXPOSE 9000
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://127.0.0.1:9000/health >/dev/null || exit 1
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
CMD ["npx", "medusa", "start"]
