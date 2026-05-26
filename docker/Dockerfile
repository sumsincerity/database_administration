FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN useradd -u 10001 -r -s /sbin/nologin appuser \
    && mkdir -p /tmp /app \
    && chown -R appuser:appuser /app /tmp

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

USER 10001:10001

# `UVICORN_WORKERS` can be overridden from Kubernetes for horizontal scaling.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS:-1}"]
