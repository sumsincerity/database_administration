# MongoDB Administration (Shop Console)

FastAPI + MongoDB + PostgreSQL app with a small web console (served from the same API container).

## Local (Docker Compose)

```bash
cp .env.example .env
docker compose down -v   # при первом запуске или после смены схемы
docker compose up --build
```

Первый запуск MongoDB занимает **2–4 минуты**. Дождитесь в логах:
`mongo-cluster-init | MongoDB sharded cluster is ready.`

Если порты заняты локально: Postgres `54320`, MongoDB (mongos) `27018`.

Open: `http://localhost:8000`

### Monitoring (Grafana + Prometheus)
Grafana: `http://localhost:3000` (admin/admin)
Prometheus: `http://localhost:9090`
Метрики API доступны по: `http://localhost:8000/metrics`

### Базы данных (репликация, шардирование, бэкапы)
- MongoDB: шардированный кластер (9 реплик в шардах + 3 config + `mongos`) — см. [DATABASE.md](docs/DATABASE.md)
- PostgreSQL: филиалы/отделы/зоны/персонал + реплика `postgres-replica:5433`
- Бэкап: `docker compose --profile backup run --rm backup` — см. [BACKUP.md](docs/BACKUP.md)

## Kubernetes (Helm)

Упрощённый стек в кластере: API (2 Pod), Mongo, Postgres, мониторинг.  
Шардирование Mongo — только в Docker Compose выше.

```bash
docker build -t mongodb_administration_api:latest -f docker/Dockerfile .
kubectl create namespace shop-dev
helm upgrade --install shop-dev ./charts/shop-console \
  --namespace shop-dev \
  -f charts/shop-console/values-dev.yaml \
  --set image.api.repository=mongodb_administration_api \
  --set image.api.tag=latest
```

После `kubectl get pods -n shop-dev` → **http://localhost:30080** (NodePort), Swagger: `/docs`.

Подробно: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/SECURITY.md](docs/SECURITY.md), [docs/RUNBOOK.md](docs/RUNBOOK.md).

## CI/CD (GitHub Actions)

Workflow: [`.github/workflows/main.yml`](.github/workflows/main.yml)

**Базы данных в CI не нужны** — только статические проверки (код, OpenAPI, `docker compose config`, Helm).

| Job | Когда | Что делает |
|-----|--------|------------|
| `ci` | push / PR в `main` | compileall, OpenAPI, compose config, `helm lint` |
| `build-and-push` | push в `main` (после `ci`) | Push образа в **GHCR** |

Бейдж (подставьте `USER/REPO`):

```markdown
![CI](https://github.com/USER/REPO/actions/workflows/main.yml/badge.svg)
```

Деплой в K8s с образом из registry:

```bash
helm upgrade --install shop-dev ./charts/shop-console \
  --namespace shop-dev \
  -f charts/shop-console/values-dev.yaml \
  --set image.api.repository=ghcr.io/<owner>/mongodb_administration \
  --set image.api.tag=latest \
  --set image.api.pullPolicy=Always
```

Для приватного пакета в кластере создайте `imagePullSecret` с доступом к GHCR.

