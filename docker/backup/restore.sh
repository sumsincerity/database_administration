#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
SOURCE="${1:-${BACKUP_DIR}/latest}"
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-admin}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-password}"
MONGO_HOST="${MONGO_HOST:-mongos}"
MONGO_PORT="${MONGO_PORT:-27017}"
PG_HOST="${POSTGRES_HOST:-postgres-primary}"
PG_USER="${POSTGRES_USER:-postgres}"
PG_DB="${POSTGRES_DB:-shop_postgres}"

if [[ ! -d "${SOURCE}/mongo" || ! -f "${SOURCE}/postgres/shop.dump" ]]; then
  echo "Backup not found at ${SOURCE}" >&2
  exit 1
fi

echo "[restore] MongoDB from ${SOURCE}/mongo"
mongorestore \
  --host="${MONGO_HOST}" \
  --port="${MONGO_PORT}" \
  --username="${MONGO_USER}" \
  --password="${MONGO_PASS}" \
  --authenticationDatabase=admin \
  --drop \
  "${SOURCE}/mongo"

echo "[restore] PostgreSQL from ${SOURCE}/postgres/shop.dump"
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
pg_restore -h "${PG_HOST}" -U "${PG_USER}" -d "${PG_DB}" --clean --if-exists "${SOURCE}/postgres/shop.dump"

echo "[restore] Done"
