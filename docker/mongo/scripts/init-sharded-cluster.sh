#!/bin/bash
# Инициализация шардированного кластера MongoDB:
# - config server replica set (3 контейнера)
# - 2 shard replica set по 3 реплики в каждом
# - mongos + включение шардирования коллекций shop
set -euo pipefail

MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-admin}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-password}"
INIT_MARKER="/tmp/.mongo_cluster_initialized"
MAX_WAIT_SEC="${MONGO_INIT_MAX_WAIT_SEC:-180}"

if [[ -f "${INIT_MARKER}" ]]; then
  echo "MongoDB cluster already initialized, skipping."
  exit 0
fi

wait_host() {
  local host="$1"
  local deadline=$((SECONDS + MAX_WAIT_SEC))
  echo "Waiting for ${host}..."
  until mongosh --host "${host}" --quiet --eval "db.adminCommand('ping').ok" >/dev/null 2>&1; do
    if (( SECONDS >= deadline )); then
      echo "Timeout waiting for ${host}" >&2
      exit 1
    fi
    sleep 2
  done
}

wait_rs_primary() {
  local host="$1"
  local deadline=$((SECONDS + MAX_WAIT_SEC))
  echo "Waiting for PRIMARY on ${host}..."
  until mongosh --host "${host}" --quiet --eval "rs.isMaster().ismaster" 2>/dev/null | grep -q "true"; do
    if (( SECONDS >= deadline )); then
      echo "Timeout waiting for PRIMARY on ${host}" >&2
      exit 1
    fi
    sleep 2
  done
}

init_rs() {
  local host="$1"
  local js="$2"
  mongosh --host "${host}" --quiet --eval "${js}"
}

echo "=== MongoDB cluster init (max ${MAX_WAIT_SEC}s) ==="

for host in mongo-cfg-0 mongo-cfg-1 mongo-cfg-2 \
  mongo-shard1-0 mongo-shard1-1 mongo-shard1-2 \
  mongo-shard2-0 mongo-shard2-1 mongo-shard2-2; do
  wait_host "${host}"
done

echo "Initializing config server replica set cfgRS..."
init_rs mongo-cfg-0 '
try { rs.status(); } catch (e) {
  rs.initiate({
    _id: "cfgRS",
    configsvr: true,
    members: [
      { _id: 0, host: "mongo-cfg-0:27017" },
      { _id: 1, host: "mongo-cfg-1:27017" },
      { _id: 2, host: "mongo-cfg-2:27017" }
    ]
  });
}
'
wait_rs_primary mongo-cfg-0

echo "Initializing shard1 replica set shard1RS..."
init_rs mongo-shard1-0 '
try { rs.status(); } catch (e) {
  rs.initiate({
    _id: "shard1RS",
    members: [
      { _id: 0, host: "mongo-shard1-0:27017" },
      { _id: 1, host: "mongo-shard1-1:27017" },
      { _id: 2, host: "mongo-shard1-2:27017" }
    ]
  });
}
'
wait_rs_primary mongo-shard1-0

echo "Initializing shard2 replica set shard2RS..."
init_rs mongo-shard2-0 '
try { rs.status(); } catch (e) {
  rs.initiate({
    _id: "shard2RS",
    members: [
      { _id: 0, host: "mongo-shard2-0:27017" },
      { _id: 1, host: "mongo-shard2-1:27017" },
      { _id: 2, host: "mongo-shard2-2:27017" }
    ]
  });
}
'
wait_rs_primary mongo-shard2-0

wait_host mongos

echo "Creating admin user on mongos..."
mongosh --host mongos --quiet --eval "
const adminDb = db.getSiblingDB('admin');
const existing = adminDb.getUser('${MONGO_USER}');
if (!existing) {
  adminDb.createUser({
    user: '${MONGO_USER}',
    pwd: '${MONGO_PASS}',
    roles: [{ role: 'root', db: 'admin' }]
  });
  print('Admin user created.');
} else {
  print('Admin user already exists.');
}
"

if ! mongosh --host mongos -u "${MONGO_USER}" -p "${MONGO_PASS}" --authenticationDatabase admin \
  --quiet --eval "db.adminCommand({ ping: 1 }).ok" | grep -q "1"; then
  echo "Admin authentication on mongos failed (check MONGO_INITDB_ROOT_* in .env)" >&2
  exit 1
fi

echo "Adding shards to cluster..."
mongosh --host mongos -u "${MONGO_USER}" -p "${MONGO_PASS}" --authenticationDatabase admin --quiet --eval '
const shards = [
  "shard1RS/mongo-shard1-0:27017,mongo-shard1-1:27017,mongo-shard1-2:27017",
  "shard2RS/mongo-shard2-0:27017,mongo-shard2-1:27017,mongo-shard2-2:27017"
];
for (const s of shards) {
  try { sh.addShard(s); } catch (e) { if (!String(e).includes("already")) throw e; }
}
'

echo "Loading shop database seed..."
mongosh --host mongos -u "${MONGO_USER}" -p "${MONGO_PASS}" --authenticationDatabase admin \
  /docker-entrypoint-initdb.d/01-init-shop.js

echo "Enabling sharding for shop database..."
mongosh --host mongos -u "${MONGO_USER}" -p "${MONGO_PASS}" --authenticationDatabase admin --quiet --eval '
sh.enableSharding("shop");
sh.shardCollection("shop.products", { categoryId: 1 });
sh.shardCollection("shop.orders", { customerId: 1 });
sh.shardCollection("shop.customers", { email: 1 });
'

touch "${INIT_MARKER}"
echo "MongoDB sharded cluster is ready."
