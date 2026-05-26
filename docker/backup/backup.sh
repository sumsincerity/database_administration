#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="${BACKUP_DIR}/${STAMP}"
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-admin}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-password}"
MONGO_HOST="${MONGO_HOST:-mongos}"
MONGO_PORT="${MONGO_PORT:-27017}"
PG_HOST="${POSTGRES_HOST:-postgres-primary}"
PG_USER="${POSTGRES_USER:-postgres}"
PG_DB="${POSTGRES_DB:-shop_postgres}"

mkdir -p "${TARGET}/mongo" "${TARGET}/postgres"

echo "[backup] MongoDB dump -> ${TARGET}/mongo"
mongodump \
  --host="${MONGO_HOST}" \
  --port="${MONGO_PORT}" \
  --username="${MONGO_USER}" \
  --password="${MONGO_PASS}" \
  --authenticationDatabase=admin \
  --out="${TARGET}/mongo"

echo "[backup] PostgreSQL dump -> ${TARGET}/postgres"
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
pg_dump -h "${PG_HOST}" -U "${PG_USER}" -d "${PG_DB}" -Fc -f "${TARGET}/postgres/shop.dump"

cat > "${TARGET}/manifest.json" <<EOF
{"created_at":"${STAMP}","mongo_host":"${MONGO_HOST}","postgres_host":"${PG_HOST}"}
EOF

ln -sfn "${TARGET}" "${BACKUP_DIR}/latest"
echo "[backup] Done: ${TARGET}"
