# Резервное копирование и восстановление

## Docker Compose

Создать бэкап (MongoDB + PostgreSQL):

```bash
docker compose --profile backup run --rm backup
```

Архивы сохраняются в volume `backup_data` (каталог `/backups/<timestamp>/`).

Восстановление (пример, подставьте путь к бэкапу):

```bash
docker compose run --rm --entrypoint /usr/local/bin/restore.sh backup /backups/latest
```

Структура бэкапа:
- `mongo/` — вывод `mongodump` (через `mongos`)
- `postgres/shop.dump` — `pg_dump` custom format
- `manifest.json` — метаданные

## Kubernetes (Helm)

CronJob `*-backup` (если `backup.enabled: true` в values):
- расписание по умолчанию: `0 2 * * *`
- `mongodump` с primary MongoDB Pod
- `pg_dump` с сервиса PostgreSQL

Для восстановления используйте `mongorestore` / `pg_restore` из debug-Pod в namespace релиза.

## Рекомендации

1. Храните бэкапы вне кластера (S3, NFS).
2. Периодически проверяйте восстановление на staging.
3. В production задайте отдельные пароли и шифрование томов.
