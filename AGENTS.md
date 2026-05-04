# SentinelMesh — Agent Context

This file is the authoritative context for any AI agent (Codex, Copilot Workspace, etc.) working on this repo.
Read this before making any changes.

---

## What this project is

**SentinelMesh** is a Cyber Threat Intelligence (CTI) sharing platform built as an academic submission for
Spinnaker Analytics. It demonstrates a multi-organization threat intelligence exchange environment using
industry-standard open-source tools.

Three simulated organizations — **ORG-A SOC**, **ORG-B CERT**, **ORG-C DFIR** — exchange sanitized IOCs
under TLP controls using STIX 2.1 format.

---

## Repository layout

```
SentinelMesh/
├── tisp-command-center/     React 19 SPA dashboard (Vite 8 + Tailwind CSS 4)
│   ├── src/
│   │   ├── App.jsx                Main router + PlatformProvider
│   │   ├── components/            13 route components (all wired, all functional)
│   │   ├── lib/
│   │   │   ├── platformAPI.js     Live/simulation dual-mode API client
│   │   │   └── uiTokens.js        Deterministic chart seeds
│   │   └── state/
│   │       └── PlatformContext.jsx  Global stats state (single 30s poll)
│   ├── vite.config.js       Proxy targets read from env (loadEnv)
│   └── .env.example         All VITE_* vars documented
├── tisp-tools/              Node.js zero-dependency CTI analysis (ESM)
│   └── src/
│       ├── normalize-stix.mjs     STIX 2.1 bundle generation
│       ├── pattern-detection.mjs  Pattern + trust scoring
│       ├── ioc-utils.mjs          IOC normalization + anonymization
│       └── self-test.mjs          Self-test suite
├── tisp-infra/              Docker Compose (13 services)
│   ├── docker-compose.yml         Lab stack
│   ├── docker-compose.prod.yml    Production overlay
│   └── nginx/templates/
│       └── tisp.conf.template     TLS reverse proxy config
├── submission/
│   ├── deliverables/        D1–D8 DOCX submission documents
│   ├── reports/             HTML validation reports + PDFs
│   └── evidence/            Screenshots + logs
├── scripts/                 Utility and capture scripts
└── docs/                    Technical markdown docs
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Framer Motion, Recharts, Lucide, React Router 7, Sonner |
| API client | Vanilla fetch, proxied via `/api/misp`, `/api/opencti`, `/api/thehive` in dev |
| Global state | `PlatformContext.jsx` — React Context, single `setInterval` poll |
| CTI Ingestion | MISP 2.5.35 (REST + MySQL 8 + Redis 7) |
| CTI Correlation | OpenCTI 6.0.0 (GraphQL + Elasticsearch 8 + MinIO + RabbitMQ) |
| Incident Response | TheHive 5.2 (REST + Elasticsearch 8) |
| Identity / SSO | Keycloak 24.0 (OIDC/OAuth2 + PostgreSQL 16) |
| Automation | n8n (REST + Node runtime) |
| Analysis scripts | Node.js ESM, zero external dependencies |
| Infrastructure | Docker Compose 2.27, Nginx 1.27 |

---

## Route map

| Route | Component |
|---|---|
| `/` | `Overview.jsx` — KPI dashboard |
| `/blueprint` | `TechnologyBlueprint.jsx` |
| `/architecture` | `Architecture.jsx` — 5-layer data flow diagram |
| `/misp` | `MISPNode.jsx` — IOC telemetry |
| `/opencti` | `OpenCTINode.jsx` (lazy-loaded) |
| `/thehive` | `TheHiveNode.jsx` — case management |
| `/identity` | `IdentityNode.jsx` — IAM + session audit |
| `/automation` | `AutomationNode.jsx` — n8n workflow catalog |
| `/settings` | `ProjectSettings.jsx` — profile + toggles |
| `*` | `NotFound.jsx` |

---

## How to verify your changes

**Always run this before finishing any task:**

```bash
cd tisp-command-center
npm run build
```

Expected output: `✓ built in <Xms` with no errors or warnings.

For tisp-tools changes:
```bash
cd tisp-tools
npm test
```

---

## Coding conventions

- **No comments** unless the WHY is non-obvious (a hidden constraint or workaround)
- **No new dependencies** without checking if a built-in or existing import covers it
- Tailwind CSS only for styling — no inline styles except for dynamic values (`style={{ width: \`${n}%\` }}`)
- React components: functional only, hooks, no class components
- tisp-tools scripts: ES modules (`import`/`export`), zero `npm install`, Node built-ins only
- Toast notifications via `sonner` (`import { toast } from 'sonner'`)
- Icons from `lucide-react` only
- HUD-style components: use `BrilliantCard`, `HolographicHeader`, `DataPulse` from `HUDComponents.jsx`

---

## What NOT to touch (Claude is handling these)

- `src/auth/` directory — Keycloak OIDC login flow is being built separately
- `App.jsx` routing logic — routes are complete and stable
- `platformAPI.js` core fetch logic — do not change the simulation fallback behavior

---

## Environment variables reference

All frontend vars live in `tisp-command-center/.env.example`. Key ones:

| Variable | Purpose |
|---|---|
| `VITE_API_MODE` | `"simulation"` (default) or `"live"` |
| `VITE_MISP_URL` | Proxy target for `/api/misp/*` calls |
| `VITE_OPENCTI_URL` | Proxy target for `/api/opencti/*` calls |
| `VITE_THEHIVE_URL` | Proxy target for `/api/thehive/*` calls |
| `VITE_MISP_API_KEY` | Auth header for MISP REST calls |
| `VITE_OPENCTI_TOKEN` | Bearer token for OpenCTI GraphQL |
| `VITE_THEHIVE_API_KEY` | Bearer token for TheHive REST |
| `VITE_POLLING_INTERVAL` | Stats refresh in ms (default 30000) |

---

## Task assignments for this sprint

Tasks assigned to Codex in this sprint (Claude is handling S2-A only):

### S3-A — Architecture.jsx: clickable layer nodes
**File:** `tisp-command-center/src/components/Architecture.jsx`
Read the full file first. Import `useNavigate` from `react-router-dom`. Add a `route` field to each layer:
- Sources → `/misp`
- Ingestion & Governance → `/misp`
- Correlation & Analysis → `/opencti`
- Response & Reporting → `/thehive`
- Persistence → `/architecture`

Pass `route` down to `NodeCard`. When clicked, call `navigate(route)`. Add `cursor-pointer hover:border-primary/50 transition-colors` to NodeCard when a route is present.

---

### S3-B — n8n workflow seed files
Create two files:
- `tisp-infra/n8n-workflows/ioc-ingest.json`
- `tisp-infra/n8n-workflows/case-alert.json`

`ioc-ingest.json`: minimal n8n v1 workflow. Nodes: Webhook trigger (path `/ioc-ingest`) → HTTP Request (POST `http://misp:443/events/add`, header `Authorization: {{$env.MISP_API_KEY}}`).

`case-alert.json`: Webhook trigger (path `/case-alert`) → HTTP Request (POST `http://thehive:9000/api/v1/case`, header `Authorization: Bearer {{$env.THEHIVE_API_KEY}}`).

---

### S3-C — lastUpdated badge in Overview.jsx
**File:** `tisp-command-center/src/components/Overview.jsx`
`usePlatform()` already returns `lastUpdated` (a `Date` or `null`). Add it to the destructure.
Find the `<div className="mb-4 flex items-center justify-end">` block (the mode badge row).
Change it to `justify-between`. Add to the left side:
```jsx
{lastUpdated && (
  <span className="text-xs text-on-surface-muted">
    Updated {lastUpdated.toLocaleTimeString()}
  </span>
)}
```

---

### S5-A — import-to-misp.mjs
**Create:** `tisp-tools/src/import-to-misp.mjs`

Read `tisp-tools/src/ioc-utils.mjs` for the `readJson` helper. Zero external dependencies — use Node built-ins only (`https`, `fs/promises`).

Logic:
1. Read argv[1] or default `out/stix-bundle.json`
2. Require env var `MISP_API_KEY` — throw if missing
3. Read `MISP_URL` (default `https://localhost:4443`), `MISP_VERIFY_SSL` (default `false`)
4. Filter `bundle.objects` where `type === 'indicator'`
5. For each indicator, POST to `${MISP_URL}/events/add`:
   - Headers: `Authorization: ${MISP_API_KEY}`, `Accept: application/json`, `Content-Type: application/json`
   - Body: `{ "Event": { "info": object.name, "distribution": 0, "threat_level_id": 2, "analysis": 0, "Attribute": [{ "type": "text", "value": object.pattern, "comment": object.description }] } }`
   - `rejectUnauthorized: false` when `MISP_VERIFY_SSL !== 'true'`
6. Log each result. Print summary: `Imported N/Total indicators`

Add to `tisp-tools/package.json` scripts:
```json
"import": "node src/import-to-misp.mjs",
"pipeline": "npm run normalize && npm run import"
```

---

### S5-B — n8n bootstrap + compose edit
**Create:** `tisp-infra/import-n8n-workflows.ps1`

PowerShell 7. Read `$N8N_URL = "http://localhost:5678"` and `$N8N_BASIC_AUTH = $env:N8N_BASIC_AUTH`.
Base64-encode credentials. For each `.json` in `$PSScriptRoot/n8n-workflows/`: POST to `$N8N_URL/api/v1/workflows`.
Print success/fail per file. Exit 0 if all pass, exit 1 on any failure.

**Edit:** `tisp-infra/docker-compose.yml` — in the `n8n` service block, add:
```yaml
environment:
  N8N_WORKFLOWS_FOLDER: /data/workflows
volumes:
  - ./n8n-workflows:/data/workflows:ro
```
Match the existing indentation exactly.

---

### S6-A — GitHub Actions CI
**Create:** `.github/workflows/ci.yml`

Three jobs, trigger on `push` and `pull_request` to any branch, all `ubuntu-latest`:

**Job `dashboard`** (Node 22): `working-directory: tisp-command-center`
Steps: checkout → setup-node (cache npm) → `npm ci` → `npm run lint` → `npm run build`

**Job `tools`** (Node 22): `working-directory: tisp-tools`
Steps: checkout → setup-node → `npm test`

**Job `infra`**:
Steps: checkout → `docker compose -f tisp-infra/docker-compose.yml config --quiet` → `docker compose -f tisp-infra/docker-compose.yml -f tisp-infra/docker-compose.prod.yml config --quiet`

---

### S6-B — Nginx rate limiting + CSP
**File:** `tisp-infra/nginx/templates/tisp.conf.template`

Read the full file first (58 lines). Add before the first `server {}` block:
```nginx
limit_req_zone $binary_remote_addr zone=tisp_general:10m rate=120r/m;
```

Inside the HTTPS `server {}` block's `location /` block, after `proxy_ssl_verify off;`:
```nginx
    limit_req zone=tisp_general burst=20 nodelay;
    limit_req_status 429;
```

Add alongside existing `add_header` lines (after the Permissions-Policy line):
```nginx
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;" always;
```

---

### S6-C — Certbot in production compose
**File:** `tisp-infra/docker-compose.prod.yml`

Read the full file first. Add a `certbot` service:
```yaml
  certbot:
    image: certbot/certbot:latest
    command: >
      certonly --webroot --webroot-path=/var/www/certbot
      --email ${TISP_ADMIN_EMAIL} --agree-tos --no-eff-email
      -d ${TISP_DOMAIN} -d misp.${TISP_DOMAIN} -d opencti.${TISP_DOMAIN}
      -d thehive.${TISP_DOMAIN} -d auth.${TISP_DOMAIN} -d n8n.${TISP_DOMAIN}
    volumes:
      - certbot_webroot:/var/www/certbot
      - certbot_certs:/etc/letsencrypt
    depends_on:
      - nginx
```

Add to the `volumes:` section: `certbot_webroot:` and `certbot_certs:`.
Add to Nginx volumes: `- certbot_webroot:/var/www/certbot:ro`

---

### S6-D — Vitest tests
**Install first:** `cd tisp-command-center && npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom`

Add `"test": "vitest run"` to `tisp-command-center/package.json` scripts.
Add to the returned config object in `vite.config.js`:
```js
test: { environment: 'jsdom' }
```

**Create `tisp-command-center/src/lib/platformAPI.test.js`:**
Mock `import.meta.env.VITE_API_MODE = 'simulation'`. Test that simulation mode returns expected static values:
- `getMISPStats()` → `{ totalEvents: 347, mode: 'simulation' }`
- `getOpenCTIStats()` → `{ relationships: 12_800_000, mode: 'simulation' }`
- `getTheHiveStats()` → `{ openCases: 24, mode: 'simulation' }`
- `getAllStats()` → `isLive === false`

**Create `tisp-command-center/src/state/PlatformContext.test.jsx`:**
Render `<PlatformProvider><span data-testid="c" /></PlatformProvider>`. Mock `platformAPI.getAllStats` to resolve immediately. Assert child renders and `loading` transitions to `false`.
