#!/bin/sh
# Nightly pg_dump to /backups, optionally copied to S3 (BACKUP_S3_BUCKET).
set -eu
stamp=$(date -u +%Y%m%dT%H%M%SZ)
file="/backups/${PGDATABASE}-${stamp}.dump"

pg_dump --format=custom --no-owner --file="$file"
echo "Dumped $file ($(du -h "$file" | cut -f1))"

if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  AWS_ACCESS_KEY_ID="${BACKUP_S3_ACCESS_KEY_ID:-${S3_ACCESS_KEY_ID:-}}" \
  AWS_SECRET_ACCESS_KEY="${BACKUP_S3_SECRET_ACCESS_KEY:-${S3_SECRET_ACCESS_KEY:-}}" \
  AWS_DEFAULT_REGION="${BACKUP_S3_REGION:-${S3_REGION:-ap-south-1}}" \
  aws s3 cp "$file" "s3://${BACKUP_S3_BUCKET}/postgres/$(basename "$file")" \
    ${BACKUP_S3_ENDPOINT:+--endpoint-url "$BACKUP_S3_ENDPOINT"} --only-show-errors
  echo "Uploaded to s3://${BACKUP_S3_BUCKET}/postgres/"
fi

find /backups -name '*.dump' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
