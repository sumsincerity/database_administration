#!/bin/bash
set -euo pipefail

PRIMARY_HOST="${POSTGRES_PRIMARY_HOST:-postgres-primary}"
PRIMARY_PORT="${POSTGRES_PRIMARY_PORT:-5432}"
REPLICATOR_USER="${POSTGRES_REPLICATION_USER:-replicator}"
REPLICATOR_PASSWORD="${POSTGRES_REPLICATION_PASSWORD:-replicator}"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"

if [ ! -s "${PGDATA}/PG_VERSION" ]; then
  echo "Initializing replica from ${PRIMARY_HOST}:${PRIMARY_PORT}..."
  until pg_isready -h "${PRIMARY_HOST}" -p "${PRIMARY_PORT}" -U "${POSTGRES_USER}"; do
    sleep 2
  done
  rm -rf "${PGDATA:?}"/*
  PGPASSWORD="${REPLICATOR_PASSWORD}" pg_basebackup \
    -h "${PRIMARY_HOST}" -p "${PRIMARY_PORT}" -U "${REPLICATOR_USER}" \
    -D "${PGDATA}" -Fp -Xs -P -R
  chown -R postgres:postgres "${PGDATA}"
fi

exec docker-entrypoint.sh postgres
