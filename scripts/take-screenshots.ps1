param(
  [int]$Port = 5173
)

$dashboardDir = Join-Path $PSScriptRoot "..\tisp-command-center"
$screenshotDir = Join-Path $PSScriptRoot "..\submission\evidence\screenshots"
$baseUrl = "http://127.0.0.1:$Port"

Write-Host ""
Write-Host "=== SentinelMesh Screenshot Guide ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step 1: Dev server is starting..." -ForegroundColor Yellow
Write-Host "        (If already running, close this script and skip to Step 2)" -ForegroundColor DarkGray
Write-Host ""

# Start dev server in background
$job = Start-Job -ScriptBlock {
  param($dir, $port)
  Set-Location $dir
  & npm run dev -- --host 127.0.0.1 --port $port --strictPort 2>&1
} -ArgumentList $dashboardDir, $Port

# Wait for server to be ready
$ready = $false
$attempts = 0
while (-not $ready -and $attempts -lt 20) {
  Start-Sleep -Seconds 2
  $attempts++
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port" -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) { $ready = $true }
  } catch { }
}

if (-not $ready) {
  Write-Host "Server did not start. Start 'npm run dev' manually in tisp-command-center/, then run this script again." -ForegroundColor Red
  Stop-Job $job -ErrorAction SilentlyContinue
  Remove-Job $job -ErrorAction SilentlyContinue
  exit 1
}

Write-Host "Server ready at $baseUrl" -ForegroundColor Green
Write-Host ""

# Define screenshot targets
$screens = @(
  @{ Route = "/";             Name = "sentinelmesh-dashboard-overview-1440x900.png";          Instruction = "Full Executive Dashboard — KPIs visible, LabWarningBanner at top, charts loaded" }
  @{ Route = "/blueprint";    Name = "sentinelmesh-blueprint-task-alignment-1440x900.png";     Instruction = "Technology Blueprint — scroll to 'Project Task Alignment', all 9 tasks visible" }
  @{ Route = "/architecture"; Name = "sentinelmesh-architecture-map-1440x900.png";             Instruction = "Architecture Map — full diagram with data flow visible" }
  @{ Route = "/misp";         Name = "sentinelmesh-misp-events-1440x900.png";                  Instruction = "MISP Ingestion page — events table visible, no loading spinner" }
  @{ Route = "/opencti";      Name = "sentinelmesh-opencti-graph-1440x900.png";                Instruction = "OpenCTI Graph — node graph rendered, threat count metrics visible" }
  @{ Route = "/thehive";      Name = "sentinelmesh-thehive-cases-1440x900.png";                Instruction = "TheHive Cases — cases list visible, search input field visible at top" }
  @{ Route = "/identity";     Name = "sentinelmesh-identity-iam-audit-1440x900.png";           Instruction = "Identity & RBAC — click 'Run Audit Suite', wait for result toast, then screenshot" }
  @{ Route = "/automation";   Name = "sentinelmesh-automation-workflows-1440x900.png";         Instruction = "Automation — pipeline list visible with Active Workflows badge" }
  @{ Route = "/settings";     Name = "sentinelmesh-project-settings-1440x900.png";             Instruction = "Project Settings — integration status table, lab vs production posture visible" }
)

Write-Host "Step 2: Set your browser window to exactly 1440x900" -ForegroundColor Yellow
Write-Host "        Chrome: F12 -> Device toolbar -> Custom -> 1440 x 900" -ForegroundColor DarkGray
Write-Host "        Or use: Ctrl+Shift+P -> 'Capture full size screenshot' for each page" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Step 3: Open each URL and take the screenshot. Save to:" -ForegroundColor Yellow
Write-Host "        $screenshotDir" -ForegroundColor Cyan
Write-Host ""

$i = 1
foreach ($screen in $screens) {
  $url = "$baseUrl$($screen.Route)"
  Write-Host "[$i/$($screens.Count)] $($screen.Name)" -ForegroundColor White
  Write-Host "        URL: $url" -ForegroundColor DarkGray
  Write-Host "        Show: $($screen.Instruction)" -ForegroundColor DarkGray
  Write-Host ""

  Start-Process $url
  Start-Sleep -Milliseconds 800
  $i++
}

Write-Host "All $($screens.Count) browser tabs opened." -ForegroundColor Green
Write-Host "Screenshot target directory: $screenshotDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Naming convention: sentinelmesh-<page>-<resolution>.png" -ForegroundColor DarkGray
Write-Host "Press any key when done to stop the dev server..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue
Write-Host "Dev server stopped." -ForegroundColor Yellow
