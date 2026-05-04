$secretNames = @(
  "KEYCLOAK_DB_PASSWORD",
  "KEYCLOAK_ADMIN_PASSWORD",
  "MISP_DB_PASSWORD",
  "MISP_DB_ROOT_PASSWORD",
  "MISP_REDIS_PASSWORD",
  "MISP_ADMIN_PASSWORD",
  "MISP_SALT",
  "MISP_ENCRYPTION_KEY",
  "MISP_GPG_PASSPHRASE",
  "OPENCTI_ADMIN_PASSWORD",
  "OPENCTI_ADMIN_TOKEN",
  "MINIO_SECRET_KEY",
  "RABBITMQ_DEFAULT_PASS",
  "THEHIVE_APPLICATION_SECRET",
  "THEHIVE_ELASTIC_PASSWORD",
  "N8N_BASIC_AUTH_PASSWORD",
  "N8N_ENCRYPTION_KEY",
  "GRAFANA_ADMIN_PASSWORD"
)

function New-Secret {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  [Convert]::ToBase64String($bytes).TrimEnd("=")
}

$envPath = Join-Path $PSScriptRoot "..\tisp-infra\.env"
if (-not (Test-Path $envPath)) {
  Write-Error "No tisp-infra/.env file found."
  exit 1
}

$content = Get-Content -Path $envPath
foreach ($name in $secretNames) {
  $replacement = "$name=$(New-Secret)"
  $existing = $content | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
  if ($existing) {
    Write-Host "- $existing"
    Write-Host "+ $replacement"
    $content = $content -replace "^$name=.*$", $replacement
  }
}

Write-Host ""
Write-Host "Preview only. Review the diff above before applying these replacements to tisp-infra/.env."
