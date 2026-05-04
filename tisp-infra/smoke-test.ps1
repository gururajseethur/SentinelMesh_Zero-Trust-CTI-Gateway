param(
  [Parameter(Mandatory = $true)]
  [string]$Domain,
  [switch]$SkipCertificateCheck
)

$ErrorActionPreference = "Stop"

if ($SkipCertificateCheck) {
  [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
}

$targets = @(
  @{ Name = "MISP"; Url = "https://misp.$Domain/" },
  @{ Name = "OpenCTI"; Url = "https://opencti.$Domain/" },
  @{ Name = "TheHive"; Url = "https://thehive.$Domain/" },
  @{ Name = "Keycloak"; Url = "https://auth.$Domain/" },
  @{ Name = "n8n"; Url = "https://n8n.$Domain/" }
)

$failures = @()
foreach ($target in $targets) {
  try {
    $response = Invoke-WebRequest -Uri $target.Url -Method Head -TimeoutSec 20 -UseBasicParsing
    Write-Host ("PASS {0} {1} HTTP {2}" -f $target.Name, $target.Url, [int]$response.StatusCode)
  } catch {
    $failures += ("FAIL {0} {1} - {2}" -f $target.Name, $target.Url, $_.Exception.Message)
  }
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Host "Production smoke test passed for $Domain"
