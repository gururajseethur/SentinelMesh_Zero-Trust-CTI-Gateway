#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD="$ROOT/tisp-command-center"
TOOLS="$ROOT/tisp-tools"
INFRA="$ROOT/tisp-infra"
PORT="${PORT:-5173}"

step() {
  printf '\n==> %s\n' "$1"
}

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n%s\n' "$1" "$2" >&2
    exit 1
  fi
}

create_env() {
  if [ -f "$INFRA/.env" ]; then
    printf 'Existing tisp-infra/.env found; keeping it.\n'
    return
  fi

  step "Creating tisp-infra/.env with generated local lab secrets"
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$INFRA/.env.example" "$INFRA/.env" <<'PY'
import pathlib
import secrets
import string
import sys
import uuid

src = pathlib.Path(sys.argv[1])
dst = pathlib.Path(sys.argv[2])
alphabet = string.ascii_letters + string.digits

def secret(length=36):
    return ''.join(secrets.choice(alphabet) for _ in range(length))

values = {
    "KEYCLOAK_DB_PASSWORD": secret(),
    "KEYCLOAK_ADMIN_PASSWORD": secret(),
    "MISP_DB_PASSWORD": secret(),
    "MISP_DB_ROOT_PASSWORD": secret(),
    "MISP_REDIS_PASSWORD": secret(),
    "MISP_ADMIN_PASSWORD": secret(),
    "MISP_ADMIN_ORG_UUID": str(uuid.uuid4()),
    "MISP_SALT": secret(),
    "MISP_UUID": str(uuid.uuid4()),
    "MISP_ENCRYPTION_KEY": secret(32),
    "MISP_GPG_PASSPHRASE": secret(),
    "OPENCTI_ADMIN_PASSWORD": secret(),
    "OPENCTI_ADMIN_TOKEN": secret(64),
    "MINIO_SECRET_KEY": secret(),
    "RABBITMQ_DEFAULT_PASS": secret(),
    "N8N_BASIC_AUTH_PASSWORD": secret(),
    "N8N_ENCRYPTION_KEY": secret(40),
}

lines = []
for line in src.read_text().splitlines():
    if "=" in line and not line.lstrip().startswith("#"):
        key, value = line.split("=", 1)
        if key in values and value.startswith("CHANGE_ME"):
            line = f"{key}={values[key]}"
    lines.append(line)
dst.write_text("\n".join(lines) + "\n")
PY
  else
    cp "$INFRA/.env.example" "$INFRA/.env"
    printf 'python3 was not found, so .env was copied with placeholders. Replace CHANGE_ME values before Docker deployment.\n'
  fi
}

need node "Install Node.js LTS from https://nodejs.org/."
need npm "Install npm through Node.js LTS."

step "Installing dashboard dependencies"
(cd "$DASHBOARD" && npm ci)

create_env

step "Running CTI tool self-test"
(cd "$TOOLS" && npm test)

step "Building dashboard"
(cd "$DASHBOARD" && npm run lint && npm run build)

if command -v pwsh >/dev/null 2>&1; then
  step "Validating local lab environment"
  (cd "$INFRA" && pwsh -NoProfile -File ./validate-env.ps1 .env)
fi

step "Starting dashboard at http://127.0.0.1:$PORT/"
(cd "$DASHBOARD" && npm run dev -- --host 127.0.0.1 --port "$PORT" --strictPort) &

printf '\nSentinelMesh is ready.\n'
printf 'Dashboard: http://127.0.0.1:%s/\n' "$PORT"
printf 'Technology guide: docs/TECHNOLOGY_BLUEPRINT.md\n'
printf 'Installation guide: docs/ONE_CLICK_INSTALLATION.md\n'
wait
