# Architecture

## High-level diagram

```mermaid
flowchart TD
  Client[Client/WebUI] -->|HTTPS| Ingress[Ingress]
  Ingress --> Api[API pods (FastAPI)]
  Api --> Mongo[(MongoDB StatefulSet)]
  Api --> Postgres[(PostgreSQL StatefulSet)]

  Api --> Auth[HTTP Basic + role checks]
```

## Components

- **API (FastAPI)**: serves the static UI from `app/static/` and exposes business endpoints.
- **MongoDB**: stores catalog, carts, customers, and orders collections.
- **PostgreSQL**: stores employees and branches tables.

## Request flow (simplified)

1. Client calls an endpoint under the same origin (UI calls `/categories`, `/products`, etc.).
2. FastAPI authenticates request via HTTP Basic.
3. FastAPI authorizes request based on role and endpoint (`app/main.py`).
4. The handler reads/writes to MongoDB (Motor) and/or PostgreSQL (SQLAlchemy).
5. Returned DTOs are serialized via `app/schemas.py`.

