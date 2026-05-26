# Security Notes

## Authentication & Authorization (HTTP Basic)

The API uses HTTP Basic authentication and checks roles in application code.

- Implementation: `app/auth.py` (`require_roles(...)` + `get_current_user(...)`)
- Role checks: applied per-endpoint in `app/main.py`
- Frontend can still switch roles locally, but the server enforces access.

### Role matrix (as implemented)

From `app/main.py` the following access is enforced:
- `guest`
  - allowed: read-only catalog (`/categories`, `/products*`)
  - denied: cart, orders, reports, employee/branch management
- `user`
  - allowed: `guest` plus cart and viewing own orders endpoints (by URL `customer_id`)
  - denied: changing order status, reports, employee/product management
- `manager`
  - allowed: `user` plus order status updates and reports
  - allowed: manage products (create/update/delete)
  - denied: nothing beyond full admin
- `admin`
  - allowed: everything

## Secrets management

Helm chart creates a Kubernetes Secret:
- `shop-console-*-secrets` (name is `{{release}}-<chart>-secrets`)

The API pod reads from it:
- `MONGO_URL`, `MONGO_DB_NAME`
- `POSTGRES_*`
- `AUTH_*` (Basic auth credentials)

For production:
- store Secrets in Kubernetes Secret objects (or external secret managers)
- do not rely on chart default values for passwords

## Pod security

API Deployment sets:
- `runAsNonRoot` with UID/GID `10001`
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`
- writable `emptyDir` mounted at `/tmp`

Docker image updates are in `docker/Dockerfile`.

## NetworkPolicy (egress hardening)

Chart enables NetworkPolicy for the API pod:
- Allows egress only to:
  - MongoDB pod(s) on `27017`
  - PostgreSQL pod(s) on `5432`
  - Kubernetes DNS on `53`
- Blocks other outbound traffic by default (within the namespace)

Note: TLS is expected to be terminated at Ingress (if enabled).

