# TISP Infrastructure - Deployment Guide

## Prerequisites
- **OS**: Ubuntu 22.04 / 24.04 LTS (Recommended)
- **Engine**: Docker 26+
- **Orchestration**: Docker Compose 2.27+
- **Resources**: 16GB RAM Min (32GB Recommended for full stack)

## Rapid Deployment
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Replace every `CHANGE_ME` value with a strong secret.
3. Validate required secret values:
   ```powershell
   .\validate-env.ps1 .env
   ```
   To validate the example file structure without replacing placeholders:
   ```powershell
   .\validate-env.ps1 .env.example -AllowPlaceholders
   ```
4. Validate Compose syntax:
   ```bash
   docker compose --env-file .env config
   ```
5. Launch stack:
   ```bash
   docker compose --env-file .env up -d
   ```

## Production Overlay

Use the production overlay for a controlled deployment behind TLS:

```powershell
.\generate-secrets.ps1
notepad .env.prod
.\validate-env.ps1 .env.prod -Profile prod
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod config
.\validate-prod-compose.ps1 .env.prod
.\validate-images.ps1 .env.prod -Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
.\smoke-test.ps1 -Domain your-domain.example
```

The production reverse proxy expects:

- `certs/fullchain.pem`
- `certs/privkey.pem`

Do not expose production services until DNS, TLS, MFA, RBAC, backup, and smoke testing are complete.

## Service Access
- **MISP**: https://localhost:4443
- **OpenCTI**: http://localhost:8080
- **TheHive**: http://localhost:9000
- **Keycloak**: http://localhost:8180
- **n8n**: http://localhost:5678

## Network Topology
- `frontend-net`: Internet-facing reverse proxy and UI.
- `backend-net`: Database and core service interlink.
- `identity-net`: Keycloak and Postgres isolation.
- `ir-net`: Incident response (TheHive/Cassandra) isolation.
- `automation-net`: n8n control plane.

## Security Notes
- All databases are bound to internal networks only (`no-host-exposure`).
- Keycloak is the central authority for all service SSO/OIDC.
- Sensitive values are required through `.env`; Compose fails fast when required secrets are missing.
- `.env` must never be committed. Keep `.env.example` for structure only.
- Production deployment uses `docker-compose.prod.yml` and Nginx TLS reverse proxy settings.
