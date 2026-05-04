# Production Acceptance Checklist

Use this checklist before calling the platform production-ready in front of an evaluator or a real stakeholder.

## Configuration

| Check | Evidence | Status |
| --- | --- | --- |
| `.env.prod` generated with unique secrets | `tisp-infra/generate-secrets.ps1` output | Required before live deployment |
| Placeholder secrets removed | `.\validate-env.ps1 .env.prod -Profile prod` | Required before live deployment |
| Production Compose overlay validates | `docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod config` | Passed in structure mode with `.env.prod.example` |
| Direct service ports removed in production overlay | `.\validate-prod-compose.ps1 .env.prod` | Passed in structure mode with `.env.prod.example` |
| Container image manifests resolve | `.\validate-images.ps1 .env.prod -Production` | Required before live deployment |
| Reverse proxy configured for TLS hostnames | `tisp-infra/nginx/templates/tisp.conf.template` | Implemented |

## Security

| Check | Evidence | Status |
| --- | --- | --- |
| TLS certificate installed | `tisp-infra/certs/fullchain.pem` and `privkey.pem` | Required before live deployment |
| Keycloak MFA enabled | Keycloak realm policy screenshot | Required before live deployment |
| RBAC roles mapped in each platform | MISP/OpenCTI/TheHive/Keycloak screenshots | Required before live deployment |
| Bootstrap admin passwords rotated | Admin change log | Required before live deployment |
| Platform audit logs reviewed | Log review record | Required before live deployment |

## Functional Testing

| Check | Evidence | Status |
| --- | --- | --- |
| Dashboard lint passes | `npm run lint` | Passed |
| Dashboard production build passes | `npm run build` | Passed |
| CTI tools self-test passes | `npm test` in `tisp-tools` | Passed |
| STIX bundle generated | `tisp-tools/out/stix-bundle.json` | Passed |
| Threat pattern report generated | `tisp-tools/out/threat-report.json` | Passed |
| Production endpoints respond | `.\smoke-test.ps1 -Domain <domain>` | Required after live deployment |
| Multi-organization simulation completed | `docs/MULTI_ORG_SIMULATION_TEST_PLAN.md` results | Required for final live pilot |

## Operations

| Check | Evidence | Status |
| --- | --- | --- |
| Volume backup completes | `.\backup-volumes.ps1` output and `manifest.json` | Required after live deployment |
| Restore tested on clean host | Restore notes and screenshots | Required before real production |
| Monitoring ownership assigned | Operations rota or owner list | Required before real production |
| Data sharing agreements approved | Signed or approved agreement templates | Required before real data sharing |
| Compliance mapping reviewed | `submission/deliverables/D7_Compliance_Documentation.docx` | Included |

## Submission Position

For academic submission, this repository is strong because it includes runnable code, infrastructure-as-code, evidence screenshots, automated tests, governance documents, and compliance mapping.

For real production, do not expose the platform to external users until all "Required before live deployment" items are completed and evidenced.
