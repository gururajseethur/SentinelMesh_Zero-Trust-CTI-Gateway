# Technology Blueprint

SentinelMesh is a practical threat intelligence sharing platform package. It is designed to show how a security team can collect, normalize, correlate, govern, share, and respond to cyber threat intelligence across multiple organizations.

## What We Are Trying To Achieve

The project answers the Spinnaker Analytics assignment by building a modular CTI environment with:

- secure intelligence ingestion
- source trust and governance controls
- RBAC and MFA-ready access control
- automated IOC normalization and anonymization
- STIX/TAXII-compatible exchange outputs
- OpenCTI-style relationship analysis
- TheHive-style incident coordination
- monitoring, reporting, screenshots, and PDF evidence
- production-readiness documents and validation scripts

## Technology Stack

| Layer | Technologies | Purpose |
| --- | --- | --- |
| User interface | React 19, Vite, Tailwind CSS 4, Framer Motion, Lucide, Recharts | SOC-style command center for monitoring, explanation, reporting, and demo flow |
| Threat intelligence ingestion | MISP, MISP modules | IOC collection, tagging, enrichment, and sharing workflows |
| Threat intelligence correlation | OpenCTI, STIX 2.1, TAXII-ready export | Entity relationship analysis across reports, malware, infrastructure, indicators, and TTPs |
| Incident response | TheHive | Case management, responder ownership, evidence coordination, and incident workflow |
| Identity and access | Keycloak, RBAC, MFA plan | Organization-aware access control and authentication governance |
| Automation | n8n | Playbooks and SOC workflow orchestration |
| Data services | PostgreSQL, Redis, Elasticsearch, RabbitMQ, MinIO | Persistence, queueing, search, cache, and object storage |
| Deployment | Docker Compose, Nginx reverse proxy | Local lab stack plus production overlay with TLS termination |
| Analysis tools | Node.js scripts | IOC normalization, anonymization, STIX generation, pattern detection, and self-test output |
| Evidence | PowerShell validation, browser smoke, Edge screenshots/PDF | Repeatable submission proof |

## Why These Tools

- MISP is a widely used open-source CTI sharing platform.
- OpenCTI provides graph-based intelligence modeling and correlation.
- TheHive provides incident response and case collaboration.
- Keycloak gives a realistic identity layer for RBAC and MFA planning.
- n8n shows automation and SOC playbook integration.
- Docker Compose keeps the lab reproducible and free/open-source.
- The React dashboard gives the evaluator a clean, visual way to understand the project.

## Demo Story

1. The dashboard shows the platform readiness and project evidence.
2. The Technology Blueprint explains the stack and one-click setup.
3. The Architecture Map shows how data flows from collection to sharing and reporting.
4. MISP Ingestion shows IOC collection and feed governance.
5. OpenCTI Graph shows threat relationships and STIX-style entities.
6. TheHive Cases shows case response and collaboration.
7. Identity & RBAC shows account, role, and MFA posture.
8. Project Settings shows lab and production readiness controls.

## One-Click Commands

```powershell
.\Start-SentinelMesh.bat
```

or:

```powershell
.\install.ps1
```

For full evidence:

```powershell
.\install.ps1 -Mode Validate
```

For Docker lab validation:

```powershell
.\install.ps1 -Mode Lab
```

For full Docker lab startup:

```powershell
.\install.ps1 -Mode Lab -StartLabStack
```
