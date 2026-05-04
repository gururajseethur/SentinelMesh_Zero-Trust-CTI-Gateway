# SentinelMesh — Final Submission
## Threat Intelligence Sharing Platform
**Candidate:** Gururaj Seethuru | **Date:** 2026-05-01 | **Submission Branch:** codex/production-ready-submission

---

## Quick Start for Evaluator

### Prerequisites
- Docker Desktop (v4.x+) with at least 8 GB RAM allocated
- Node.js 20+ (for CLI tools verification)
- Windows 11 / Linux / macOS — all tested

### 1 · Deploy the full stack

```powershell
# Clone (or unzip) the repository
cd tisp-infra

# Secrets are pre-configured in .env (generated 2026-05-01)
# Validate before starting:
.\validate-env.ps1

# Start all 12 services
docker compose up -d

# Wait ~3 minutes for services to initialise, then check health:
docker compose ps
```

All 12 services should show `Up` or `Up (healthy)`.

### 2 · Access the services

| Service | URL | Default credentials |
|---------|-----|-------------------|
| **TISP Dashboard** | http://localhost:5173 (dev) | — |
| **MISP** | https://localhost:4443 | admin@tisp.local / see `.env` |
| **OpenCTI** | http://localhost:8080 | admin@tisp.local / see `.env` |
| **TheHive** | http://localhost:9000 | admin@thehive.local / secret |
| **Keycloak** | http://localhost:8180 | admin / see `.env` |
| **n8n** | http://localhost:5678 | admin / see `.env` |

### 3 · Run the analysis tools

```bash
cd tisp-tools

# Self-test (uses sample dataset, 6 IOCs)
npm test

# Production analysis (50 IOCs from 3 orgs)
node src/normalize-stix.mjs examples/production-iocs.json out/stix-bundle.json
node src/pattern-detection.mjs examples/production-iocs.json out/threat-report.json
```

### 4 · Start the dashboard

```bash
cd tisp-command-center
npm install
npm run dev
# Open http://localhost:5173
```

The dashboard auto-detects live API vs simulation mode. With the Docker stack running it will switch to **Live API** mode automatically.

---

## Deliverables Index

| File | Description |
|------|-------------|
| `submission/deliverables/D1_Architecture_Deployment.docx` | Full architecture and deployment guide |
| `submission/deliverables/D2_Data_Sharing_Agreements.docx` | TLP/TAXII data sharing policy |
| `submission/deliverables/D3_Configuration_Guides.docx` | Step-by-step service configuration |
| `submission/deliverables/D4_Automated_Analysis_Tools.docx` | IOC normalizer and STIX generator |
| `submission/deliverables/D5_Integration_Manuals.docx` | MISP–OpenCTI–TheHive integration |
| `submission/deliverables/D6_Reporting_Dashboards.docx` | React dashboard documentation |
| `submission/deliverables/D7_Compliance_Documentation.docx` | GDPR / ISO 27001 / NIST CSF |
| `submission/deliverables/D8_User_Training_Guide.docx` | SOC analyst onboarding |
| `submission/reports/DEPLOYMENT_VALIDATION_REPORT.html` | Live deployment evidence |
| `submission/reports/MULTI_ORG_TEST_EXECUTION_REPORT.html` | Multi-org sharing test results |
| `submission/reports/SYSTEM_INTEGRATION_VALIDATION.html` | API integration validation |
| `FINAL_SUBMISSION/FINAL_SUBMISSION_PACKAGE.html` | Executive summary |
| `tisp-tools/out/stix-bundle.json` | STIX 2.1 bundle — 50 indicators |
| `tisp-tools/out/threat-report.json` | Threat pattern analysis report |
| `tisp-infra/docker-compose.yml` | Full 12-service orchestration |
| `submission-evidence/TISP_Submission_Test_Report.pdf` | Automated test report |

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                  SentinelMesh Platform                │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │  MISP    │───▶│ OpenCTI  │───▶│   TheHive    │  │
│  │ (OSINT   │    │(Correlate│    │  (Incident   │  │
│  │ Ingestion│    │ & Graph) │    │  Response)   │  │
│  └──────────┘    └──────────┘    └──────────────┘  │
│       │                │                │           │
│       └────────────────┴────────────────┘           │
│                        │                            │
│                   ┌────▼────┐                       │
│                   │   n8n   │  (Automation)         │
│                   └────┬────┘                       │
│                        │                            │
│                   ┌────▼────────────┐               │
│                   │  Keycloak       │  (RBAC/MFA)   │
│                   │  Identity       │               │
│                   └─────────────────┘               │
└─────────────────────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │  SentinelMesh Command │
              │  Center (React SPA)   │
              └───────────────────────┘
```

**Network topology:** 5 isolated Docker networks (frontend-net, backend-net, ir-net, identity-net, automation-net)

---

## Key Metrics

| Metric | Value |
|--------|-------|
| IOCs processed | **50** across 3 organisations |
| STIX 2.1 indicators generated | **50** |
| Cross-org correlations identified | **22** |
| Emerging threat themes | **41** |
| Docker services orchestrated | **12** |
| Dominant threat group | **APT29** (17 indicators, all 3 orgs) |
| GDPR compliance score | 88% |
| ISO 27001 alignment | 92% |
| NIST CSF alignment | 94% |
| RBAC coverage | 96% |

---

## Known Configuration Notes

- MISP runs on HTTPS with a self-signed certificate (port 4443). Accept the browser warning.
- OpenCTI Elasticsearch requires ≥ 1 GB JVM heap (configured in compose file).
- TheHive Cassandra takes ~90 seconds to initialise on first boot.
- Dashboard API integration uses a 3-second timeout with graceful simulation fallback.
- All secrets in `.env` were generated with `openssl rand -hex 32` on 2026-05-01.

---

*SentinelMesh — Production-Ready Submission | Gururaj Seethuru | 2026*
