param(
  [ValidateSet("Demo", "Validate", "Lab", "Production")]
  [string]$Mode = "Demo",
  [int]$Port = 5173,
  [switch]$SkipInstall,
  [switch]$StartLabStack,
  [switch]$SkipBrowser
)

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$dashboard = Join-Path $root "tisp-command-center"
$tools = Join-Path $root "tisp-tools"
$infra = Join-Path $root "tisp-infra"
$envExample = Join-Path $infra ".env.example"
$envFile = Join-Path $infra ".env"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
  param(
    [string]$Name,
    [string]$Hint
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name was not found. $Hint"
  }
}

function Invoke-Checked {
  param(
    [string]$WorkingDirectory,
    [scriptblock]$Script
  )

  Push-Location $WorkingDirectory
  try {
    & $Script
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed in $WorkingDirectory with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

function New-Secret {
  param([int]$Length = 32)

  $alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  $bytes = New-Object byte[] $Length
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  $chars = foreach ($byte in $bytes) { $alphabet[$byte % $alphabet.Length] }
  -join $chars
}

function New-LabEnv {
  if (Test-Path -LiteralPath $envFile) {
    Write-Host "Existing tisp-infra/.env found; keeping it." -ForegroundColor Yellow
    return
  }

  if (-not (Test-Path -LiteralPath $envExample)) {
    throw "Missing template: $envExample"
  }

  Write-Step "Creating tisp-infra/.env with generated local lab secrets"
  $content = Get-Content -LiteralPath $envExample -Raw
  $values = @{
    KEYCLOAK_DB_PASSWORD = New-Secret 36
    KEYCLOAK_ADMIN_PASSWORD = New-Secret 36
    MISP_DB_PASSWORD = New-Secret 36
    MISP_DB_ROOT_PASSWORD = New-Secret 36
    MISP_REDIS_PASSWORD = New-Secret 36
    MISP_ADMIN_PASSWORD = New-Secret 36
    MISP_ADMIN_ORG_UUID = [guid]::NewGuid().ToString()
    MISP_SALT = New-Secret 36
    MISP_UUID = [guid]::NewGuid().ToString()
    MISP_ENCRYPTION_KEY = New-Secret 32
    MISP_GPG_PASSPHRASE = New-Secret 36
    OPENCTI_ADMIN_PASSWORD = New-Secret 36
    OPENCTI_ADMIN_TOKEN = New-Secret 64
    MINIO_SECRET_KEY = New-Secret 36
    RABBITMQ_DEFAULT_PASS = New-Secret 36
    N8N_BASIC_AUTH_PASSWORD = New-Secret 36
    N8N_ENCRYPTION_KEY = New-Secret 40
  }

  foreach ($key in $values.Keys) {
    $content = [regex]::Replace($content, "$key=CHANGE_ME[^\r\n]*", "$key=$($values[$key])")
  }

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($envFile, $content, $utf8NoBom)
}

function Ensure-DashboardServer {
  $url = "http://127.0.0.1:$Port/"
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
      Write-Host "Dashboard already running at $url" -ForegroundColor Green
      return
    }
  } catch {
    # Start below.
  }

  Write-Step "Starting dashboard at $url"
  $outLog = Join-Path $dashboard "vite-dev.out.log"
  $errLog = Join-Path $dashboard "vite-dev.err.log"
  Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "$Port", "--strictPort") `
    -WorkingDirectory $dashboard `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog | Out-Null

  for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        Write-Host "Dashboard ready at $url" -ForegroundColor Green
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  throw "Dashboard did not become ready. Check $outLog and $errLog."
}

Write-Host "SentinelMesh one-click installer" -ForegroundColor Green
Write-Host "Mode: $Mode"

Assert-Command "node" "Install Node.js LTS from https://nodejs.org/ and run this script again."
Assert-Command "npm.cmd" "Node.js normally installs npm. Reinstall Node.js LTS if npm is missing."

if ($Mode -in @("Validate", "Lab", "Production") -or $StartLabStack) {
  Assert-Command "docker" "Install Docker Desktop if you want Docker lab or production validation."
}

if (-not $SkipInstall) {
  Write-Step "Installing dashboard dependencies"
  Invoke-Checked $dashboard { npm ci }
}

New-LabEnv

Write-Step "Running CTI tool self-test"
Invoke-Checked $tools { npm test }

Write-Step "Building dashboard"
Invoke-Checked $dashboard { npm run lint }
Invoke-Checked $dashboard { npm run build }

Write-Step "Validating local lab environment"
Invoke-Checked $infra { .\validate-env.ps1 .env }

if ($Mode -in @("Validate", "Lab", "Production")) {
  Write-Step "Validating Docker Compose configuration"
  Invoke-Checked $infra {
    docker compose --env-file .env config | Out-Null
  }
}

if ($Mode -eq "Validate") {
  Write-Step "Running full submission evidence validation"
  Invoke-Checked $root { .\scripts\test-submission.ps1 }
}

if ($Mode -eq "Production") {
  Write-Step "Generating and validating production secrets template"
  Invoke-Checked $infra { .\generate-secrets.ps1 }
  Invoke-Checked $infra { .\validate-env.ps1 .env.prod -Profile prod }
  Invoke-Checked $infra {
    docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod config | Out-Null
  }
  Invoke-Checked $infra { .\validate-prod-compose.ps1 .env.prod }
}

if ($StartLabStack) {
  Write-Step "Starting Docker lab stack"
  Invoke-Checked $infra { docker compose --env-file .env up -d }
}

Ensure-DashboardServer

$dashboardUrl = "http://127.0.0.1:$Port/"
if (-not $SkipBrowser) {
  Start-Process $dashboardUrl
}

Write-Host ""
Write-Host "SentinelMesh is ready." -ForegroundColor Green
Write-Host "Dashboard: $dashboardUrl"
Write-Host "Technology guide: docs/TECHNOLOGY_BLUEPRINT.md"
Write-Host "Installation guide: docs/ONE_CLICK_INSTALLATION.md"
Write-Host "Submission PDF: submission/reports/TISP_Submission_Test_Report.pdf"
