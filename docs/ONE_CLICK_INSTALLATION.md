# One-Click Installation Guide

This project now includes a one-click local demo path for graders and users who do not want to assemble the commands manually.

## Windows

Double-click:

```text
Start-SentinelMesh.bat
```

Or run directly:

```powershell
.\install.ps1
```

The default demo mode:

- checks Node.js and npm
- installs dashboard dependencies with `npm ci`
- creates `tisp-infra/.env` from `.env.example` with generated local lab secrets
- runs the CTI tool self-test
- lints and builds the dashboard
- starts the React command center at `http://127.0.0.1:5173`
- opens the browser

## Linux or macOS

```bash
chmod +x install.sh
./install.sh
```

The shell installer follows the same local demo path. If Python 3 is available, it also generates local lab secrets for `tisp-infra/.env`.

## Installation Modes

```powershell
.\install.ps1
```

Starts the local demo dashboard and validates the analysis tools.

```powershell
.\install.ps1 -Mode Validate
```

Runs the full submission evidence refresh, including lint, build, CTI tools, Docker Compose config validation, screenshots, browser smoke, and PDF generation.

```powershell
.\install.ps1 -Mode Lab
```

Validates the Docker lab configuration without starting the heavy container stack.

```powershell
.\install.ps1 -Mode Lab -StartLabStack
```

Starts the full local Docker lab. Use this only when Docker Desktop is installed and the machine has enough RAM and disk space.

```powershell
.\install.ps1 -Mode Production
```

Generates and validates the production environment template and production Compose overlay. It does not deploy to a real server.

## What Gets Configured

| Area | Configuration |
| --- | --- |
| Dashboard | React/Vite dependencies, build, and local dev server |
| CTI tools | IOC normalization, anonymization, STIX bundle generation, threat report self-test |
| Lab secrets | Generated `tisp-infra/.env` for local validation |
| Docker lab | MISP, OpenCTI, TheHive, Keycloak, n8n, and supporting services |
| Evidence | Logs, screenshots, browser smoke result, and PDF submission report |

## Important Safety Note

The default one-click mode does not start the full Docker stack. The Docker stack is intentionally behind `-StartLabStack` because it can pull large images and run multiple services locally.
