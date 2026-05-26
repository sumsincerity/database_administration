# Monitoring (Grafana + Prometheus)

Проект включает метрики Prometheus из FastAPI и поднятие Grafana/Prometheus.

## Метрики приложения

Эндпоинт: `GET /metrics`

Прометеусные метрики (минимальный набор):
- `http_requests_total{method,path,status_code}`
- `http_request_duration_seconds_bucket{method,path,...}`

## Docker Compose

После `docker compose up --build`:
- Grafana: `http://localhost:3000` (admin/admin)
- Prometheus: `http://localhost:9090`

## Kubernetes (Helm)

В чартe `charts/shop-console/` включите мониторинг через:
- `monitoring.enabled=true` (в `values.yaml` включено по умолчанию)

Grafana доступен через `kubectl port-forward` на сервис:
`<release>-shop-console-grafana:3000`.

