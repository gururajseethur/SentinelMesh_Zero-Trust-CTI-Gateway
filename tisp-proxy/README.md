# tisp-proxy

Server-side API key vault for SentinelMesh. Routes authenticated dashboard
requests to MISP, OpenCTI, and TheHive without exposing service credentials
in the browser bundle.

## How it works

```
Browser → Vite/Nginx proxy → tisp-proxy:3001/proxy/<service> → upstream service
```

The proxy reads service API keys from environment variables (`MISP_API_KEY`,
`OPENCTI_TOKEN`, `THEHIVE_API_KEY`) and injects them into upstream requests.
The browser only ever holds a Keycloak-issued JWT — no service secrets touch
the client.

## JWT verification

When `KEYCLOAK_URL`, `KEYCLOAK_REALM`, and `KEYCLOAK_CLIENT_ID` are set, the
proxy performs **full RS256 cryptographic verification** of every incoming JWT
before forwarding any upstream request:

- Fetches the public key from the Keycloak JWKS endpoint
- Verifies the RS256 signature, `iss`, `aud`, and `exp` claims
- Rejects tampered, expired, or wrong-issuer tokens with HTTP 401
- Symmetric algorithms (HS256) are explicitly excluded

When those env vars are not set (lab/sim mode), the proxy falls back to a
presence-only bearer token check. This is acceptable only in the isolated lab
network — see [Security](#security) below.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `TISP_PROXY_PORT` | `3001` | Port the proxy listens on |
| `KEYCLOAK_URL` | — | Keycloak base URL, e.g. `https://auth.example.com` |
| `KEYCLOAK_REALM` | — | Keycloak realm name, e.g. `tisp` |
| `KEYCLOAK_CLIENT_ID` | — | OIDC client ID, e.g. `tisp-dashboard` |
| `MISP_URL` | `https://misp:443` | MISP base URL (internal Docker hostname) |
| `MISP_API_KEY` | — | MISP automation key |
| `OPENCTI_URL` | `http://opencti:4000` | OpenCTI base URL |
| `OPENCTI_TOKEN` | — | OpenCTI API token |
| `THEHIVE_URL` | `http://thehive:9000` | TheHive base URL |
| `THEHIVE_API_KEY` | — | TheHive API key |

Set these in `tisp-infra/.env` (gitignored). Never set them as `VITE_*` variables.

## Security

### Network isolation

Port 3001 is bound to the Docker-internal `tisp-net` network. It is never
published to the host NIC in `docker-compose.yml`. The only callers are the
Vite dev server (via `server.proxy` rewrite) and the Nginx reverse proxy —
both internal to the same Docker Compose stack.

`docker-compose.dev.yml` exposes `127.0.0.1:3001` for local debugging only.

### Lab / sim mode (KC not configured)

When Keycloak is not configured, the proxy verifies only that an
`Authorization: Bearer <token>` header is non-empty. This is documented here
and warned on startup. It is safe only because:

1. Port 3001 is not reachable from outside the Docker network
2. Nginx SSO terminates unauthenticated requests before they enter the stack
3. Upstream data is a controlled lab environment, not production

## Running tests

The test suite is self-contained — it generates its own RSA key pair and
starts a local JWKS server. No live Keycloak instance required.

```bash
npm test
```

Tests are also run automatically in CI via the `security` job in
`.github/workflows/ci.yml`.
