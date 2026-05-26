# Базы данных: репликация, шардирование, модель PostgreSQL

## MongoDB (Docker Compose)

Кластер в `docker-compose.mongodb.yml`:

| Компонент | Контейнеры | Назначение |
|-----------|------------|------------|
| Config Server RS | `mongo-cfg-0..2` | Метаданные шардов (3 реплики) |
| Shard 1 RS | `mongo-shard1-0..2` | Данные сегмента 1 (3 реплики) |
| Shard 2 RS | `mongo-shard2-0..2` | Данные сегмента 2 (3 реплики) |
| Router | `mongos` | Единая точка входа для API |

Инициализация: сервис `mongo-cluster-init` (скрипт `docker/mongo/scripts/init-sharded-cluster.sh`).

Шардирование коллекций `shop`:
- `products` — по `categoryId`
- `orders` — по `customerId`
- `customers` — по `email`

Подключение API: `MONGO_URL=mongodb://admin:password@mongos:27017/?authSource=admin`

## MongoDB (Kubernetes / Helm)

Упрощённая схема (как в учебном `practice-shop`): **один Pod MongoDB** (`Deployment`), seed через `/docker-entrypoint-initdb.d/01-init-shop.js`.

- Сервис: `ClusterIP` (внутри кластера)
- Шардирование и multi-replica **не** в K8s — они в Docker Compose (`docker-compose.mongodb.yml`)

Полное шардирование для отчёта/ТЗ — только **Docker Compose**.

## PostgreSQL — модель «персонал и устройство магазинов»

| Таблица | Описание |
|---------|----------|
| `branches` | Филиалы (адрес, телефон, дата открытия) |
| `departments` | Отделы внутри филиала |
| `store_zones` | Зоны/этажи (sales, warehouse, service, office) |
| `employees` | Сотрудники, привязка к филиалу и отделу |

API:
- `GET/POST /branches`, `GET /branches/{id}/structure`
- `GET/POST /departments`, `GET/POST /store-zones`
- `GET/POST /employees`

## PostgreSQL — репликация (Docker)

- `postgres-primary` — запись (порт 5432)
- `postgres-replica` — потоковая реплика (порт 5433), `pg_basebackup` + standby

Пользователь репликации: `replicator` / `replicator` (создаётся в `01-init.sql`).

## Резервное копирование

См. [BACKUP.md](BACKUP.md).
