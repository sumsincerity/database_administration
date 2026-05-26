# Runbook (Operations)

## Verify deployment

1. Check pods:
```bash
kubectl get pods -n <namespace>
```

2. Check API health endpoints:
```bash
kubectl port-forward -n <namespace> deploy/<release>-shop-console-api 8000:8000
curl -u <user>:<password> http://localhost:8000/health
curl http://localhost:8000/livez
curl http://localhost:8000/readyz
```

> Note: `/livez` and `/readyz` are unauthenticated.

## Logs

API logs:
```bash
kubectl logs -n <namespace> -l app.kubernetes.io/component=api --tail=200 -f
```

MongoDB logs:
```bash
kubectl logs -n <namespace> statefulset/<release>-mongodb --tail=200 -f
```

PostgreSQL logs:
```bash
kubectl logs -n <namespace> statefulset/<release>-postgresql --tail=200 -f
```

## Scaling API

API is scaled by:
- Kubernetes HPA (CPU utilization)
- `UVICORN_WORKERS` inside the container (configured in Helm values)

To change HPA bounds:
```bash
helm upgrade <release> ./charts/shop-console -n <namespace> -f charts/shop-console/values-<env>.yaml
```

## Updates

Safe update flow:
1. Build/push new API image to your registry.
2. Update Helm values (`image.api.tag`) for the release.
3. Run:
```bash
helm upgrade <release> ./charts/shop-console -n <namespace> -f charts/shop-console/values-<env>.yaml
```

## Database initialization issues

If MongoDB or PostgreSQL pods remain in `CrashLoopBackOff`:
1. Check init script errors in pod logs.
2. Verify storage is correctly provisioned for PVCs.
3. Confirm Secret values are present and not empty.

If you need to reinitialize data, do it explicitly by deleting PVCs for the release (destructive).

