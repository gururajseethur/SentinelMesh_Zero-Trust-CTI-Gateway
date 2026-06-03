# SentinelMesh

<p>
<img src="https://img.shields.io/badge/zero--trust-RS256%20JWKS-blue" alt="zero-trust" />
<img src="https://img.shields.io/badge/auth-Keycloak%20%2B%20OIDC-success" alt="keycloak" />
<img src="https://img.shields.io/badge/stack-MISP%20%C2%B7%20OpenCTI%20%C2%B7%20TheHive-0a7" alt="stack" />
<img src="https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite%208-61dafb" alt="frontend" />
<img src="https://img.shields.io/badge/capstone-BIA%20Master--Diploma-purple" alt="capstone" />
</p>

**Zero-trust threat intelligence platform** — every API request is verified against a live JWKS endpoint before any upstream service is touched. No bypass mode, no symmetric fallback, no degraded state. Either the RS256 JWT is valid or the request is dropped with 401.

Built on MISP, OpenCTI, TheHive, and Keycloak, with a Node.js API vault ([tisp-proxy](tisp-proxy/)) that enforces mandatory JWT verification on startup and per-request. The React command center ([tisp-command-center](tisp-command-center/)) runs in simulation mode for demos and switches to live Keycloak OIDC auth when environment variables are set.

This system includes a simulation mode for UI demonstration and a fully secure mode with real OIDC authentication via Keycloak.

Capstone for the Spinnaker Analytics / BIA Master-Diploma in Ethical Hacking & Cybersecurity — *Implementing Security Measures within a Threat Intelligence Sharing Platform*. All 9 project tasks map directly to repository artifacts (see [Technology Blueprint](#) in the dashboard or `docs/PROJECT_COMPLETION_MATRIX.md`).

---

## Why This Project Matters

Threat intelligence is only useful when it can be shared securely across team boundaries. This platform addresses the three hardest problems in CTI sharing:

1. **Who can see what** — Keycloak RBAC with per-role data access, not flat API keys
2. **How to trust the data** — STIX 2.1 normalized ingestion with source credibility tagging
3. **How to act on it** — TheHive case management wired directly to MISP IOC feeds

The security design was subjected to iterative red-team review: the proxy went through four certification passes before receiving a zero-trust PASS.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     User (Browser)                        │
│          React SPA — Vite 8, React 19, Recharts          │
└───────────────────┬──────────────────────────────────────┘
                    │ HTTPS (TLS terminated at Nginx)
                    ▼
┌──────────────────────────────────────────────────────────┐
│                  Nginx Reverse Proxy                       │
│   • Keycloak SSO redirect (login-required)                │
│   • CSP: script-src 'self', frame-ancestors 'none'        │
│   • Rate limiting, CORS headers                           │
└───────┬───────────────────────────────┬──────────────────┘
        │                               │
        ▼                               ▼
┌───────────────┐             ┌─────────────────────┐
│  tisp-proxy   │             │  Keycloak 24 (OIDC)  │
│  (API Vault)  │             │  PKCE S256, RS256     │
│               │◄────JWT─────│  JWKS endpoint        │
│  JWKS-backed  │             └─────────────────────┘
│  RS256 verify │
│  per-request  │
└───────┬───────┘
        │  Injects service API keys (server-side only)
        ├──────────────► MISP (IOC / malware events)
        ├──────────────► OpenCTI (graph-based CTI)
        └──────────────► TheHive (case management)

┌──────────────────────────────────────────────────────────┐
│                  Supporting Services                       │
│  n8n (workflow automation)  •  Grafana (metrics)          │
│  Elasticsearch + Kibana     •  MinIO (object storage)     │
│  RabbitMQ (OpenCTI broker)  •  PostgreSQL (Keycloak DB)   │
└──────────────────────────────────────────────────────────┘
```

### Auth Flow

```
1. Browser loads SPA → Keycloak JS adapter detects unauthenticated session
2. Redirect to Keycloak login with PKCE code_challenge (S256)
3. User authenticates → Keycloak issues RS256-signed JWT + refresh token
4. SPA holds JWT in memory (never localStorage, never cookies)
5. Every API call: Authorization: Bearer <JWT> → tisp-proxy
6. tisp-proxy fetches public key from JWKS endpoint
7. jwt.verify(): algorithm=RS256, iss, aud, exp all enforced
8. On pass: proxy injects upstream API key and forwards request
9. On fail (tampered / expired / wrong issuer): 401, request dropped
10. Refresh timer fires at 55s — proactive token renewal before exp
```

---

## Security Model

### Zero-Trust Enforcement

- **Mandatory startup validation** — if `KEYCLOAK_URL`, `KEYCLOAK_REALM`, or `KEYCLOAK_CLIENT_ID` are missing, the proxy calls `process.exit(1)`. There is no fallback mode, no optional verification, no degraded state.
- **Unconditional JWT verification** — every request to `/proxy/*` calls `await verifyJWT(token)`. The call has no conditional guard; it cannot be skipped.
- **Algorithm pinning** — `algorithms: ['RS256']` is explicit. HS256 (symmetric, forgeable without the private key) is rejected at the library level.
- **Full claim enforcement** — `iss`, `aud`, and `exp` are validated. An expired token from the correct issuer fails. A valid token from a rogue issuer fails.
- **Fail-closed on JWKS outage** — if the JWKS endpoint is unreachable, every request returns 401. No request reaches the upstream vault.

### Defense in Depth

| Layer | Control |
|---|---|
| Network | Port 3001 not published to host NIC; internal Docker DNS only |
| TLS edge | Nginx terminates HTTPS; services communicate on internal net |
| Authentication | Keycloak OIDC, PKCE S256, `login-required` on load |
| Authorization | RBAC: realm roles + client roles merged, per-route guards |
| API key isolation | Service credentials in proxy env only; never in browser bundle or `VITE_*` vars |
| Rate limiting | 100 req / 15 min / IP before any route handler |
| CSP | `script-src 'self'`, `frame-ancestors 'none'`, no `unsafe-inline` on scripts |

### Verified Attack Surface (automated in CI)

| Attack | Outcome |
|---|---|
| Expired JWT | 401 — `jwt expired` |
| Wrong issuer | 401 — `jwt issuer invalid` |
| Tampered RS256 signature | 401 — `invalid signature` |
| HS256 algorithm substitution | 401 — `Malformed JWT: missing kid header` |
| Empty / null / undefined token | 401 — `Missing bearer token` |
| Structurally invalid string | 401 — `Malformed JWT` |
| JWKS endpoint unreachable | 401 — `Unable to retrieve signing key` |

---

## Repository Structure

```
tisp-nexus/
├── tisp-command-center/        # React SPA (dashboard + auth)
│   ├── src/auth/               # Keycloak adapter, AuthContext, ProtectedRoute
│   ├── src/components/         # Per-service nodes, Sidebar, Overview
│   ├── src/lib/                # platformAPI (sim + live modes), adversarial tests
│   └── src/state/              # PlatformContext (polling, exponential backoff)
│
├── tisp-proxy/                 # Node.js API key vault
│   ├── src/server.js           # Express, rate limiter, mandatory JWT enforcement
│   ├── src/verify-jwt.js       # JWKS-backed RS256 verifier factory
│   └── src/verify-jwt.test.js  # 7 self-contained cryptographic security tests
│
├── tisp-infra/                 # Docker Compose stack
│   ├── docker-compose.yml      # Base: all services, proxy not host-exposed
│   ├── docker-compose.prod.yml # Prod overlay: Nginx TLS, port reset
│   ├── docker-compose.dev.yml  # Dev overlay: 127.0.0.1:3001 only
│   └── nginx/                  # Reverse proxy config with CSP
│
├── tisp-tools/                 # Node.js CTI utilities (zero runtime dependencies)
│   └── src/                    # IOC normalizer, STIX 2.1 bundler, pattern detector
│
├── docs/                       # Architecture docs, runbooks, compliance checklists
└── submission/                 # Deliverables, screenshots, reports
```

---

## Stack

| Component | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, Recharts, Framer Motion |
| Auth | Keycloak 24, keycloak-js, OIDC / PKCE S256 |
| API Vault | Node.js 22, Express 4, jwks-rsa, jsonwebtoken |
| CTI Platforms | MISP latest, OpenCTI 6, TheHive 5 |
| Automation | n8n (self-hosted) |
| Observability | Grafana, Elasticsearch + Kibana |
| Infrastructure | Docker Compose, Nginx, PostgreSQL, MinIO, RabbitMQ |
| CI | GitHub Actions — lint, build, unit tests, security tests, infra validation |

---

## Setup

### Prerequisites

- Docker Desktop ≥ 4.28 with Compose v2
- Node.js 22+
- 16 GB RAM (full stack) / 8 GB (dashboard demo only)

### Dashboard Demo (no Docker required)

```bash
cd tisp-command-center
npm ci
npm run dev
```

Opens at `http://localhost:5173` in simulation mode — all data is synthetic, no external services needed. Demonstrates the full UI, RBAC-gated routes, and auth flow with a simulated Keycloak state.

### Running with Real Authentication

The dashboard has two modes:

| Mode | How it works | When to use |
|---|---|---|
| **Simulation** | Auth context is stubbed. All API data is synthetic. No Keycloak required. | Demos, grading, local dev |
| **Live (OIDC)** | Keycloak PKCE S256 login flow. JWT verified by the proxy per-request via JWKS. | Full stack, production |

**To enable real Keycloak auth**, set these variables before starting the dashboard:

```bash
# tisp-command-center/.env.local
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=tisp
VITE_KEYCLOAK_CLIENT_ID=tisp-dashboard
VITE_API_BASE_URL=http://localhost:3001
```

And these before starting the proxy:

```bash
# tisp-proxy environment (or tisp-infra/.env)
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=tisp
KEYCLOAK_CLIENT_ID=tisp-dashboard
MISP_URL=https://misp:443
MISP_API_KEY=<your-misp-key>
OPENCTI_URL=http://opencti:4000
OPENCTI_TOKEN=<your-opencti-token>
THEHIVE_URL=http://thehive:9000
THEHIVE_API_KEY=<your-thehive-key>
```

The proxy will **refuse to start** (`process.exit(1)`) if `KEYCLOAK_URL`, `KEYCLOAK_REALM`, or `KEYCLOAK_CLIENT_ID` are missing — there is no insecure fallback.

In simulation mode, the `LabWarningBanner` in the dashboard UI makes the mode explicit. The sidebar shows "Simulation Mode" in the user footer. Real mode shows the authenticated user's name and Keycloak role.

### Full Stack

```bash
cd tisp-infra
cp .env.example .env
# Replace placeholder secrets — see .env.example
docker compose --env-file .env up -d
```

### Run Security Tests

Self-contained — no live Keycloak or network access required:

```bash
cd tisp-proxy
npm ci && npm test
```

### Run All CI Checks Locally

```bash
cd tisp-command-center && npm run lint && npm run build && npm test
cd ../tisp-proxy && npm test
cd ../tisp-tools && npm test
```

---

## Known Limitations

Intentional scope decisions for a lab build:

| Limitation | Production path |
|---|---|
| `proxy_ssl_verify off` in Nginx — upstream services use self-signed certs | Private CA; mount CA bundle; set `proxy_ssl_trusted_certificate` |
| Single-instance Keycloak — SPOF | External PostgreSQL cluster + KC session replication |
| In-process rate limiter — resets on restart, not shared across replicas | Redis-backed rate limiter (`rate-limit-redis`) |
| No token revocation check — proxy trusts `exp` only | Keycloak token introspection endpoint on sensitive operations |
| MFA available in Keycloak but not policy-enforced | Authentication flow requiring OTP for all realm users |

---

## Compliance Mapping

| Standard | Implementation |
|---|---|
| GDPR data minimization | IOC anonymization in `tisp-tools/src/anonymize.mjs` |
| ISO 27001 A.9 — Access control | Keycloak RBAC with least-privilege role assignments |
| NIST CSF Protect / Detect | Keycloak session audit + Grafana dashboards |
| STIX 2.1 / TAXII | `tisp-tools/src/stix-bundler.mjs` produces conformant bundles |

Full documentation: `docs/` and `submission/deliverables/`.

---

## CI Pipeline

| Job | Checks |
|---|---|
| `dashboard` | lint, build, 25 unit tests, Playwright e2e |
| `security` | 7 cryptographic JWT security tests (self-contained, no KC needed) |
| `tools` | CTI utility correctness — IOC normalization, STIX output shape |
| `infra` | `docker compose config` for base and prod overlay |

---

## Assignment Coverage

See `docs/PROJECT_COMPLETION_MATRIX.md` for the direct mapping from Spinnaker project tasks to repository artifacts.

Submission deliverables (DOCX, evidence screenshots, test reports) are in `submission/`.
