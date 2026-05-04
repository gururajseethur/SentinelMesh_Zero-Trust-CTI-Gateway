param(
  [switch]$SkipScreenshots,
  [switch]$SkipPdf,
  [switch]$SkipImageValidation
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$evidence = Join-Path $root "submission-evidence"
$logs = Join-Path $evidence "logs"
$screenshots = Join-Path $evidence "screenshots"
$app = Join-Path $root "tisp-command-center"
$tools = Join-Path $root "tisp-tools"
$infra = Join-Path $root "tisp-infra"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

New-Item -ItemType Directory -Path $logs, $screenshots -Force | Out-Null

function Invoke-LoggedStep {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [scriptblock]$Script
  )

  $log = Join-Path $logs "$Name.log"
  Set-Content -LiteralPath $log -Encoding UTF8 -Value @(
    "# $Name",
    "WorkingDirectory: $WorkingDirectory",
    "StartedAt: $((Get-Date).ToString('s'))",
    ""
  )

  Push-Location $WorkingDirectory
  try {
    $global:LASTEXITCODE = 0
    $output = & $Script 2>&1
    $code = if ($LASTEXITCODE -ne $null) { $LASTEXITCODE } elseif ($?) { 0 } else { 1 }
    $output | Out-File -LiteralPath $log -Append -Encoding UTF8
    "" | Out-File -LiteralPath $log -Append -Encoding UTF8
    "ExitCode: $code" | Out-File -LiteralPath $log -Append -Encoding UTF8
    if ($code -ne 0) {
      throw "$Name failed with exit code $code"
    }
  } finally {
    Pop-Location
  }
}

function Ensure-DevServer {
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
      return
    }
  } catch {
    # Start below.
  }

  $outLog = Join-Path $app "vite-dev.out.log"
  $errLog = Join-Path $app "vite-dev.err.log"
  Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort") `
    -WorkingDirectory $app `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog | Out-Null
  Start-Sleep -Seconds 3

  $response = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -ne 200) {
    throw "Dashboard dev server did not respond with HTTP 200."
  }
}

Invoke-LoggedStep -Name "01-dashboard-lint" -WorkingDirectory $app -Script { npm run lint }
Invoke-LoggedStep -Name "02-dashboard-build" -WorkingDirectory $app -Script { npm run build }
Invoke-LoggedStep -Name "03-tools-self-test" -WorkingDirectory $tools -Script { npm test }
Invoke-LoggedStep -Name "04-env-structure-validation" -WorkingDirectory $infra -Script { .\validate-env.ps1 .env.example -AllowPlaceholders }
Invoke-LoggedStep -Name "05-compose-config-validation" -WorkingDirectory $infra -Script {
  docker compose --env-file .env.example config | Out-Null
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  "compose config passed"
}
Invoke-LoggedStep -Name "06-prod-env-structure-validation" -WorkingDirectory $infra -Script { .\validate-env.ps1 .env.prod.example -Profile prod -AllowPlaceholders }
Invoke-LoggedStep -Name "07-prod-compose-config-validation" -WorkingDirectory $infra -Script {
  docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod.example config | Out-Null
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  "production compose config passed"
}
Invoke-LoggedStep -Name "08-prod-compose-exposure-validation" -WorkingDirectory $infra -Script { .\validate-prod-compose.ps1 .env.prod.example }
if (-not $SkipImageValidation) {
  Invoke-LoggedStep -Name "10-image-manifest-validation" -WorkingDirectory $infra -Script { .\validate-images.ps1 .env.prod.example -Production }
}

if (-not $SkipScreenshots) {
  if (-not (Test-Path -LiteralPath $edge)) {
    throw "Microsoft Edge was not found at $edge; cannot capture screenshots or print PDF."
  }

  Ensure-DevServer
  & $edge --headless=new --disable-gpu --no-first-run --disable-extensions --hide-scrollbars `
    --window-size=1440,900 `
    --virtual-time-budget=3000 `
    --screenshot="$(Join-Path $screenshots 'final-dashboard-desktop-1440x900.png')" `
    "http://127.0.0.1:5173/" | Out-Null
  & $edge --headless=new --disable-gpu --no-first-run --disable-extensions --hide-scrollbars `
    --window-size=390,844 `
    --virtual-time-budget=3000 `
    --screenshot="$(Join-Path $screenshots 'final-dashboard-mobile-390x844.png')" `
    "http://127.0.0.1:5173/" | Out-Null

  Invoke-LoggedStep -Name "09-opencti-visual-capture" -WorkingDirectory $root -Script {
    node .\scripts\capture-opencti-screenshot.mjs `
      --url "http://127.0.0.1:5173/" `
      --output "$(Join-Path $screenshots 'opencti-dataflow-desktop-1440x900.png')" `
      --edge $edge
  }

  $navigationSmoke = Join-Path $logs "09-sidebar-navigation-smoke.json"
  Invoke-LoggedStep -Name "09-browser-navigation-smoke" -WorkingDirectory $root -Script {
    node .\scripts\browser-smoke.mjs --url "http://127.0.0.1:5173/" --output $navigationSmoke --edge $edge
  }
}

if (-not $SkipPdf) {
  if (-not (Test-Path -LiteralPath $edge)) {
    throw "Microsoft Edge was not found at $edge; cannot print PDF."
  }

  $report = Join-Path $evidence "TISP_Submission_Test_Report.html"
  $pdf = Join-Path $evidence "TISP_Submission_Test_Report.pdf"
  if (-not (Test-Path -LiteralPath $report)) {
    throw "Report HTML not found: $report"
  }

  $reportUri = ([System.Uri]$report).AbsoluteUri
  & $edge --headless=new --disable-gpu --no-first-run --disable-extensions --print-to-pdf="$pdf" "$reportUri" | Out-Null
  if (-not (Test-Path -LiteralPath $pdf)) {
    throw "PDF was not generated: $pdf"
  }
}

[PSCustomObject]@{
  Status = "passed"
  Evidence = $evidence
  Logs = $logs
  Screenshots = $screenshots
  Pdf = Join-Path $evidence "TISP_Submission_Test_Report.pdf"
}
