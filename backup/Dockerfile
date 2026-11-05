ARG PG_IMAGE=postgres:16-alpine
FROM ${PG_IMAGE}
RUN apk add --no-cache aws-cli tini
COPY backup.sh entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/sbin/tini", "--", "entrypoint.sh"]
