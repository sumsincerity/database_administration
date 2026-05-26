# Rollback guide

Rollback is performed with Helm.

## List revisions

```bash
helm history <release> -n <namespace>
```

## Roll back to a previous revision

```bash
helm rollback <release> <revision> -n <namespace>
```

## What to consider

- StatefulSets (MongoDB/PostgreSQL) keep data in PVCs, so rollback to an older API version usually does not require restoring the databases.
- If you change DB schema/initialization logic, ensure the change is forward/backward compatible.

