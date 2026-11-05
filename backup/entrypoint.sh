#!/bin/sh
set -e
echo "${BACKUP_SCHEDULE:-0 3 * * *} /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
echo "Backups scheduled: ${BACKUP_SCHEDULE:-0 3 * * *}"
exec crond -f -l 8
