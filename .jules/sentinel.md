## 2024-04-22 - [Hardcoded Secret in Docker Compose]
**Vulnerability:** A hardcoded authentication token `f9621fcb-8981-4207-9e47-063945c43d7c` was found in `tisp-infra/docker-compose.yml` serving as a fallback for `APP__ADMIN__TOKEN` of the `opencti` service.
**Learning:** Hardcoded fallback secrets in compose files could unintentionally expose the platform or lead to default credentials being used in production environments, thereby bypassing access controls.
**Prevention:** Avoid defining default values for sensitive tokens in configuration templates. Enforce environment variable declarations to guarantee that secrets are securely provisioned externally.
