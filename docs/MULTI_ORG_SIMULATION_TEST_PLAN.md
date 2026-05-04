# Multi-Organization Simulation Test Plan

## Objective

Validate TISP in a simulated sharing community with three organizations before production rollout.

## Simulated Participants

| Organization | Role | Expected Activity |
| --- | --- | --- |
| ORG-A SOC | Financial-sector SOC | Submit high-confidence brute-force and C2 indicators. |
| ORG-B CERT | Coordination and validation team | Validate indicators, contribute malware hashes, publish community advisories. |
| ORG-C DFIR | Incident response partner | Submit URL/YARA evidence and raise TheHive cases. |

## Test Cases

| ID | Test | Expected Result | Evidence |
| --- | --- | --- | --- |
| TISP-MO-01 | ORG-A submits TLP:AMBER SSH brute-force IPs to MISP | Indicators are visible only to allowed sharing group members. | MISP event screenshot or export. |
| TISP-MO-02 | ORG-B imports shared IOCs and validates confidence | Source reliability and confidence are updated in the report. | `tisp-tools/out/threat-report.json`. |
| TISP-MO-03 | ORG-C submits URL and YARA evidence | Sensitive query data is anonymized before STIX export. | `tisp-tools/out/stix-bundle.json`. |
| TISP-MO-04 | OpenCTI correlates campaign/domain/hash relationships | Graph view shows linked entities and campaign context. | OpenCTI graph screenshot. |
| TISP-MO-05 | TheHive case is opened for a CRITICAL C2 indicator | Case contains observables, severity, assignee, and timeline. | TheHive case export. |
| TISP-MO-06 | n8n workflow routes high-severity intelligence | Workflow logs show successful enrichment or case creation. | n8n execution log. |
| TISP-MO-07 | Keycloak RBAC blocks guest write access | Guest can view permitted data but cannot publish events. | Keycloak/MISP audit log. |
| TISP-MO-08 | Dashboard displays threat severity and source trends | React dashboard loads without console/build errors. | `npm run build` and browser screenshot. |

## Pass Criteria

- All secrets are externalized in `.env`; no default passwords are used.
- `npm test` passes in `tisp-tools`.
- `npm run lint` and `npm run build` pass in `tisp-command-center`.
- `docker compose --env-file .env config` produces valid compose output.
- Each organization can access only its allowed sharing groups and datasets.
- STIX export contains TLP markings and sanitized values for sensitive indicators.

## Evidence Package

Collect these files/screenshots for final submission:

- `submission/deliverables/*.docx`
- `submission/deliverables/TISP_Architecture_Diagram.pdf`
- `submission/reports/stix-bundle.json`
- `submission/reports/threat-report.json`
- Dashboard screenshot from `http://127.0.0.1:5173`
- Docker Compose validation output
- Production overlay validation output
- Keycloak RBAC screenshot
- MISP sharing group screenshot
