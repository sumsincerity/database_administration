# Deployment (Kubernetes + Helm)

Простая схема в кластере (как `practice-shop`): **API ×2**, **Mongo ×1**, **Postgres ×1**, Prometheus, Grafana.

Шардированный MongoDB и реплика Postgres — в **Docker Compose** ([DATABASE.md](DATABASE.md)).

## Prerequisites

- Kubernetes (Docker Desktop → Enable Kubernetes)
- `kubectl`, Helm 3+
- Образ API собран локально: `docker build -t mongodb_administration_api:latest -f docker/Dockerfile .`

## Chart

`charts/shop-console/`

| Компонент | Тип в K8s |
|-----------|-----------|
| API + UI | `Deployment` (2 реплики в dev) |
| MongoDB | `Deployment` + seed ConfigMap |
| PostgreSQL | `Deployment` + init ConfigMap |
| Prometheus / Grafana | `Deployment` |
| HPA | опционально (`hpa.enabled`) |

## Dev (Docker Desktop)

```bash
kubectl create namespace shop-dev

helm upgrade --install shop-dev ./charts/shop-console \
  --namespace shop-dev \
  -f charts/shop-console/values-dev.yaml \
  --set image.api.repository=mongodb_administration_api \
  --set image.api.tag=latest \
  --set image.api.pullPolicy=IfNotPresent
```

Дождитесь `Running` (первый старт Mongo/Postgres ~1–2 мин):

```bash
kubectl get pods -n shop-dev -w
```

### Доступ (NodePort в values-dev)

| Сервис | URL |
|--------|-----|
| API + UI + `/docs` | http://localhost:30080 |
| Grafana | http://localhost:30300 (admin/admin) |
| Prometheus | http://localhost:30090 |

Альтернатива:

```bash
kubectl port-forward -n shop-dev svc/shop-dev-shop-console-api 8000:8000
```

Логин API/UI: `shop_admin` / `admin123`

### Сброс dev-окружения

```bash
helm uninstall shop-dev -n shop-dev
kubectl delete namespace shop-dev
```

## Staging / Prod

Отдельные namespace: `shop-staging`, `shop-prod`.

```bash
helm upgrade --install shop-staging ./charts/shop-console \
  --namespace shop-staging \
  -f charts/shop-console/values-staging.yaml
```

В prod задайте пароли через `values-prod.yaml` или `--set`, включите `backup.enabled`.

## Isolated environments

Каждая среда — свой namespace + Secret + PVC (если persistence включён).

## Probes

- API: `GET /livez`, `GET /readyz` (с ping Mongo/Postgres)
- Mongo/Postgres: exec-probes в Pod’ах БД

## Scaling

- API: `replicaCount`, HPA по CPU
- БД в K8s: один инстанс; горизонтальное масштабирование данных — в Docker Compose
