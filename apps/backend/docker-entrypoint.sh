#!/bin/sh
set -e

# Only the server migrates, so the worker never races it on boot.
if [ "${RUN_MIGRATIONS:-false}" = "true" ] && [ "${MEDUSA_WORKER_MODE:-shared}" != "worker" ]; then
  echo "==> Running migrations"
  npx medusa db:migrate
fi

exec "$@"
