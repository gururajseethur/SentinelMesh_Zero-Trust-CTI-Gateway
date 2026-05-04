param(
  [string]$EnvFile = ".env.prod.example"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir
try {
  $json = docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $EnvFile config --format json
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  $config = $json | ConvertFrom-Json
  $errors = @()

  foreach ($service in $config.services.PSObject.Properties) {
    $ports = @($service.Value.ports)
    if ($service.Name -eq "reverse-proxy") {
      $published = @($ports | ForEach-Object { [string]$_.published }) | Sort-Object
      $expected = @("80", "443")
      $missing = $expected | Where-Object { $_ -notin $published }
      if ($missing.Count -gt 0) {
        $errors += "reverse-proxy is missing published port(s): $($missing -join ', ')"
      }
      continue
    }

    if ($ports.Count -gt 0 -and $null -ne $ports[0]) {
      $published = $ports | ForEach-Object { "$($_.published):$($_.target)" }
      $errors += "$($service.Name) still exposes direct port(s): $($published -join ', ')"
    }
  }

  if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
  }

  Write-Output "Production Compose exposure validation passed. Only reverse-proxy publishes host ports."
} finally {
  Pop-Location
}
