# SentinelMesh Command Center

React/Vite dashboard for the Threat Intelligence Sharing Platform project. It visualizes platform health, CTI ingestion, OpenCTI correlation, TheHive incident operations, identity telemetry, and automation workflows.

## Commands

```powershell
npm ci
npm run lint
npm run build
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173` after starting the dev server.

## Dashboard Modes

The dashboard runs in one of two modes, controlled by the `.env` file:

### Simulation Mode (default)
- Uses built-in demonstration data — no backend services required
- Ideal for portfolio showcase, project presentation, and academic evaluation
- Set `VITE_SIMULATION_MODE=true` (default)

### Live Mode
1. Deploy platform services: `cd ../tisp-infra && docker compose up -d`
2. Copy environment template: `cp .env.example .env`
3. Fill in API keys and tokens in `.env`
4. Set `VITE_SIMULATION_MODE=false`
5. Restart: `npm run dev`

A **Simulation / Live** badge is shown in the bottom-right corner of the dashboard.

**Note for evaluation**: Simulation Mode is sufficient and recommended. All routes, animations, and data visualizations work without running Docker services.

## Navigation

The dashboard uses React Router with 9 unique routes:

| Route | Module |
|-------|--------|
| `/` | Executive Dashboard |
| `/blueprint` | Technology Blueprint |
| `/architecture` | Architecture Map |
| `/misp` | MISP Ingestion |
| `/opencti` | OpenCTI Graph |
| `/thehive` | TheHive Cases |
| `/identity` | Identity & RBAC |
| `/automation` | Automation (n8n) |
| `/settings` | Project Settings |

## Verification

The dashboard is expected to pass:

- `npm run lint`
- `npm run build`

The app uses deterministic telemetry samples so React purity linting and screenshots remain stable.
