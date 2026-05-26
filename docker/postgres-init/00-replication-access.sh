#!/bin/bash
set -euo pipefail
# Разрешить потоковую репликацию для пользователя replicator (создаётся в 01-init.sql)
echo "host replication replicator 0.0.0.0/0 scram-sha-256" >> "${PGDATA}/pg_hba.conf"
