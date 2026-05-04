$N8N_URL = "http://localhost:5678"
$N8N_BASIC_AUTH = $env:N8N_BASIC_AUTH

if ([string]::IsNullOrWhiteSpace($N8N_BASIC_AUTH)) {
  Write-Error "N8N_BASIC_AUTH must be set in user:password format."
  exit 1
}

$encoded = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($N8N_BASIC_AUTH))
$headers = @{
  Authorization = "Basic $encoded"
  "Content-Type" = "application/json"
}

$workflowDir = Join-Path $PSScriptRoot "n8n-workflows"
$failed = $false

foreach ($file in Get-ChildItem -Path $workflowDir -Filter "*.json") {
  try {
    $body = Get-Content -Raw -Path $file.FullName
    Invoke-RestMethod -Method Post -Uri "$N8N_URL/api/v1/workflows" -Headers $headers -Body $body | Out-Null
    Write-Host "Imported $($file.Name)"
  } catch {
    $failed = $true
    Write-Error "Failed $($file.Name): $($_.Exception.Message)"
  }
}

if ($failed) {
  exit 1
}

exit 0
