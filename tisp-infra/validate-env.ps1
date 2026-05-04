param(
  [string]$EnvFile = ".env",
  [ValidateSet("lab", "prod")]
  [string]$Profile = "lab",
  [switch]$AllowPlaceholders
)

$ErrorActionPreference = "Stop"

$required = @(
  "TISP_DOMAIN",
  "KEYCLOAK_DB_PASSWORD",
  "KEYCLOAK_ADMIN_PASSWORD",
  "MISP_DB_PASSWORD",
  "MISP_DB_ROOT_PASSWORD",
  "MISP_REDIS_PASSWORD",
  "MISP_ADMIN_PASSWORD",
  "MISP_ADMIN_ORG_UUID",
  "MISP_SALT",
  "MISP_UUID",
  "MISP_ENCRYPTION_KEY",
  "MISP_GPG_PASSPHRASE",
  "OPENCTI_ADMIN_PASSWORD",
  "OPENCTI_ADMIN_TOKEN",
  "MINIO_SECRET_KEY",
  "RABBITMQ_DEFAULT_PASS",
  "N8N_BASIC_AUTH_PASSWORD",
  "N8N_ENCRYPTION_KEY"
)

$prodRequired = @(
  "ELASTIC_PASSWORD",
  "THEHIVE_ELASTIC_PASSWORD",
  "THEHIVE_APPLICATION_SECRET"
)

if ($Profile -eq "prod") {
  $required += $prodRequired
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Environment file not found: $EnvFile. Copy .env.example to .env and replace the CHANGE_ME values."
}

$values = @{}
Get-Content -LiteralPath $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#") -or -not $line.Contains("=")) {
    return
  }

  $parts = $line.Split("=", 2)
  $values[$parts[0].Trim()] = $parts[1].Trim()
}

$errors = @()
foreach ($key in $required) {
  if (-not $values.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($values[$key])) {
    $errors += "$key is missing"
    continue
  }

  if (-not $AllowPlaceholders -and $values[$key] -like "CHANGE_ME*") {
    $errors += "$key still contains a placeholder"
  }

  if (-not $AllowPlaceholders -and $key -ne "TISP_DOMAIN" -and $values[$key].Length -lt 16) {
    $errors += "$key should be at least 16 characters for deployment"
  }

  if (-not $AllowPlaceholders -and $key -in @("MISP_DB_PASSWORD", "MISP_DB_ROOT_PASSWORD") -and $values[$key] -notmatch "^[A-Za-z0-9]+$") {
    $errors += "$key should use only letters and numbers for MISP database compatibility"
  }
}

if ($Profile -eq "prod" -and -not $AllowPlaceholders) {
  if ($values["TISP_DOMAIN"] -in @("example.org", "localhost", "tisp.local")) {
    $errors += "TISP_DOMAIN must be replaced with the real production domain"
  }
}

if ($errors.Count -gt 0) {
  $errors | ForEach-Object { Write-Error $_ }
  exit 1
}

$mode = if ($AllowPlaceholders) { "structure" } else { "secret" }
Write-Output "TISP $Profile $mode validation passed for $EnvFile"
