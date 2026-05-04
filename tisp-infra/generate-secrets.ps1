param(
  [string]$Template = ".env.prod.example",
  [string]$Output = ".env.prod",
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function New-RandomSecret {
  param([int]$Bytes = 32)
  $buffer = [byte[]]::new($Bytes)
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($buffer)
  } finally {
    $rng.Dispose()
  }
  return [Convert]::ToBase64String($buffer).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function New-AlphaNumSecret {
  param([int]$Length = 40)
  $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  $buffer = [byte[]]::new($Length)
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($buffer)
  } finally {
    $rng.Dispose()
  }
  return -join ($buffer | ForEach-Object { $alphabet[$_ % $alphabet.Length] })
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$templatePath = if ([System.IO.Path]::IsPathRooted($Template)) { $Template } else { Join-Path $scriptDir $Template }
$outputPath = if ([System.IO.Path]::IsPathRooted($Output)) { $Output } else { Join-Path $scriptDir $Output }

if (-not (Test-Path -LiteralPath $templatePath)) {
  throw "Template file not found: $templatePath"
}

if ((Test-Path -LiteralPath $outputPath) -and -not $Force) {
  throw "Output file already exists: $outputPath. Use -Force to overwrite."
}

$lines = Get-Content -LiteralPath $templatePath | ForEach-Object {
  if ($_ -notmatch "^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
    return $_
  }

  $key = $matches[1]
  $value = $matches[2]
  if ($value -notlike "CHANGE_ME*") {
    return $_
  }

  $secret = switch ($key) {
    { $_ -in @("OPENCTI_ADMIN_TOKEN", "MISP_ADMIN_ORG_UUID", "MISP_UUID") } { [guid]::NewGuid().ToString() }
    { $_ -in @("MISP_DB_PASSWORD", "MISP_DB_ROOT_PASSWORD") } { New-AlphaNumSecret -Length 40 }
    "THEHIVE_APPLICATION_SECRET" { New-RandomSecret -Bytes 64 }
    default { New-RandomSecret -Bytes 32 }
  }

  "$key=$secret"
}

Set-Content -LiteralPath $outputPath -Value $lines -Encoding utf8
Write-Output "Generated $outputPath"
Write-Output "Edit TISP_DOMAIN before deployment, then run: .\validate-env.ps1 .env.prod -Profile prod"
