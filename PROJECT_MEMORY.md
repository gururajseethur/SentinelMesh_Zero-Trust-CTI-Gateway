# TISP Nexus Project Memory

Use this as the short context file for future work on this project.

## Current Status

- GitHub source was downloaded from `https://github.com/gururajseethur/TISP-Nexus.git` as an archive because `git` was not installed in the shell.
- The local workspace is the working project copy:
  `C:\Users\marco\Documents\Codex\2026-04-28\https-github-com-gururajseethur-tisp-nexus`
- The remote GitHub repository has not been updated with local fixes unless the user pushes/uploads these files later.

## Completed Work

- React/Vite dashboard hardened in `tisp-command-center`.
- Dashboard UI redesigned into a cleaner SOC/product dashboard after user rejected the original visual style.
- Dashboard now passes lint and production build.
- Mobile/desktop layout improved after screenshot checks.
- Removed render-time randomness and dynamic Tailwind class construction.
- Added deterministic UI helpers in `tisp-command-center/src/lib/uiTokens.js`.
- Docker Compose hardened in `tisp-infra/docker-compose.yml`.
- Removed hardcoded/default secret fallbacks for sensitive values.
- Added missing OpenCTI dependencies: MinIO and RabbitMQ.
- Added `.env.example` and `validate-env.ps1`.
- Added `tisp-tools` with IOC normalization, anonymization, STIX 2.1 generation, and pattern detection.
- Added project-level docs:
  - `README.md`
  - `docs/PROJECT_COMPLETION_MATRIX.md`
  - `docs/MULTI_ORG_SIMULATION_TEST_PLAN.md`
- Added final evidence report:
  - `submission-evidence/TISP_Submission_Test_Report.html`
  - `submission-evidence/TISP_Submission_Test_Report.pdf`
  - desktop/mobile screenshots under `submission-evidence/screenshots`
- Added reusable final validation script:
  - `scripts/test-submission.ps1`
- Added user-testing polish:
  - Removed placeholder-like sequence text from the dashboard header.
  - Shortened the mobile dashboard subtitle to avoid clipped text.
- Rebuilt the Architecture Map after user feedback:
  - Removed absolute-position floating nodes and hard-coded disconnected paths.
  - Added a connected five-layer CTI topology with flow labels and no overlapping cards.
  - Added `submission-evidence/screenshots/architecture-map-desktop.png`.
- Fixed Project settings after user testing:
  - Wired the sidebar Project settings button into app navigation.
  - Added a real settings view for deployment profile, governance controls, integrations, and submission evidence.
  - Added Project settings to the browser sidebar smoke test.
- Redesigned the weakest remaining dashboard modules before upload:
  - Replaced the random OpenCTI molecule-style graph with a labeled STIX relationship map.
  - Rebuilt TheHive cases as a compact incident queue with severity, SLA, responder, and filter controls.
- Added one-click project onboarding:
  - Root `Start-TISP-Nexus.bat`, `install.ps1`, and `install.sh`.
  - `docs/ONE_CLICK_INSTALLATION.md` and `docs/TECHNOLOGY_BLUEPRINT.md`.
  - In-app `TECHNOLOGY_BLUEPRINT` module explaining stack, install flow, config levels, and demo path.
- Shifted the dashboard away from the dark AI-template look:
  - Introduced a bright glass/HUD visual system in `tisp-command-center/src/index.css`.
  - Rebuilt OpenCTI into an animated bright-HUD node-and-wire graph with compact STIX entities, visible wire sockets, moving relationship packets, hover/focus node detail popovers, clean non-striped graph background, signal velocity chart, relationship mix chart, and source reliability panels.
  - Lazy-loaded OpenCTI so the richer charting does not bloat the main dashboard bundle.
- Added production hardening artifacts:
  - `tisp-infra/docker-compose.prod.yml`
  - `tisp-infra/nginx/templates/tisp.conf.template`
  - `tisp-infra/.env.prod.example`
  - `tisp-infra/generate-secrets.ps1`
  - `tisp-infra/smoke-test.ps1`
  - `tisp-infra/backup-volumes.ps1`
  - `tisp-infra/validate-prod-compose.ps1`
  - `tisp-infra/validate-images.ps1`
  - `docs/PRODUCTION_READINESS_RUNBOOK.md`
  - `docs/PRODUCTION_ACCEPTANCE_CHECKLIST.md`
  - `docs/BACKUP_RESTORE_GUIDE.md`

## Validation Commands That Passed

```powershell
cd tisp-command-center
npm run lint
npm run build
```

```powershell
cd tisp-tools
npm test
```

```powershell
cd tisp-infra
.\validate-env.ps1 .env.example -AllowPlaceholders
docker compose --env-file .env.example config
.\validate-env.ps1 .env.prod.example -Profile prod -AllowPlaceholders
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod.example config
.\validate-prod-compose.ps1 .env.prod.example
.\validate-images.ps1 .env.prod.example -Production
```

Browser sidebar smoke test also passed for all views:
Architecture Map, MISP Ingestion, OpenCTI Graph, TheHive Cases, Identity & RBAC, Automation, and Executive Dashboard.

One-command final evidence refresh:

```powershell
.\scripts\test-submission.ps1
```

## Important Caveats

- Full Docker stack deployment was not run; only Compose syntax/config validation was completed.
- Running `docker compose up -d` still needs explicit user approval because it starts local services and can pull large images.
- Before submission/demo, copy `tisp-infra/.env.example` to `.env` and replace all `CHANGE_ME` values.
- Before real production, generate `tisp-infra/.env.prod`, install real TLS certs under `tisp-infra/certs`, enable MFA/RBAC, run the production smoke test, and prove backup/restore.
- For GitHub submission, install Git or upload/push the modified workspace files.
- For graduation evidence, include screenshots of:
  - Dashboard
  - Compose validation
  - `tisp-tools/out/stix-bundle.json`
  - `tisp-tools/out/threat-report.json`
  - Existing DOCX/PDF deliverables in `Project 1`

## Graduation Readiness

This is a strong academic graduation project package because it includes:

- Written deliverables for all required project areas.
- A runnable monitoring/reporting dashboard.
- Docker Compose infrastructure for the CTI stack.
- Governance, RBAC, STIX/TAXII, integration, reporting, compliance, and user training documents.
- Runnable analysis/anonymization scripts.
- A multi-organization simulation test plan.

Best final polish before submission:

- Run the Docker lab if system resources allow.
- Capture evidence screenshots.
- Push/upload the final version to GitHub.
