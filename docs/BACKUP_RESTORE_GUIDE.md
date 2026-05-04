# Backup And Restore Guide

This guide covers the Docker volume backup approach used by the SentinelMesh production deployment.

## What Must Be Backed Up

The platform stores state in Docker volumes:

- `misp_mysql_data`
- `misp_files_data`
- `misp_redis_data`
- `opencti_es_data`
- `opencti_minio_data`
- `opencti_rabbitmq_data`
- `opencti_redis_data`
- `thehive_es_data`
- `thehive_cassandra_data`
- `keycloak_db_data`
- `n8n_data`

The `.env.prod` file is also critical, but it contains secrets. Store it in a secure password vault or encrypted operations repository, not in Git.

## Backup

From `tisp-infra`:

```powershell
.\backup-volumes.ps1 -ComposeProjectName tisp-infra
```

The script creates a timestamped folder under `tisp-infra/backups/` with one `.tar.gz` archive per volume and a `manifest.json`.

If the deployment uses a custom Compose project name, pass it explicitly:

```powershell
.\backup-volumes.ps1 -ComposeProjectName tisp-prod
```

## Restore Test

Perform restore tests on a separate machine or isolated Docker project. Do not test restore by overwriting the only working production volumes.

1. Stop the target test stack.
2. Create empty Docker volumes with the same names.
3. Extract each archive into its matching volume with an Alpine helper container.
4. Start the test stack.
5. Verify login, data search, case access, STIX export, and automation workflows.

Example restore command for one volume:

```powershell
docker run --rm -v tisp-prod_misp_mysql_data:/target -v C:\path\to\backup:/backup alpine:3.20 sh -c "rm -rf /target/* && tar -xzf /backup/tisp-prod_misp_mysql_data.tar.gz -C /target"
```

Repeat for every volume in `manifest.json`.

## Recovery Acceptance

A backup is not considered valid until a restore test proves:

- Keycloak users and roles are present.
- MISP events and attributes are searchable.
- OpenCTI entities and relationships are searchable.
- TheHive cases are visible.
- n8n credentials and workflows are intact.
- The dashboard and smoke tests still work after recovery.
