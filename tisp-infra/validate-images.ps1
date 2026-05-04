param(
  [string]$EnvFile = ".env.prod.example",
  [switch]$Production,
  [int]$TimeoutSeconds = 20
)

$ErrorActionPreference = "Stop"

$manifestAccept = "application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.v2+json"

function Resolve-ImageReference {
  param([string]$Image)

  $name = $Image.Split("@", 2)[0]
  $lastSlash = $name.LastIndexOf("/")
  $lastColon = $name.LastIndexOf(":")
  $tag = "latest"

  if ($lastColon -gt $lastSlash) {
    $tag = $name.Substring($lastColon + 1)
    $name = $name.Substring(0, $lastColon)
  }

  $first = $name.Split("/")[0]
  if ($first -match "[\.:]" -or $first -eq "localhost") {
    return [pscustomobject]@{
      Registry = $first
      Repository = $name.Substring($first.Length + 1)
      Reference = $tag
    }
  }

  $repository = if ($name.Contains("/")) { $name } else { "library/$name" }
  [pscustomobject]@{
    Registry = "registry-1.docker.io"
    Repository = $repository
    Reference = $tag
  }
}

function Get-BearerToken {
  param(
    [string]$Challenge,
    [string]$Repository
  )

  $values = @{}
  [regex]::Matches($Challenge, '(\w+)="([^"]*)"') | ForEach-Object {
    $values[$_.Groups[1].Value] = $_.Groups[2].Value
  }

  if (-not $values.ContainsKey("realm")) {
    throw "Registry did not provide a bearer token realm"
  }

  $query = @()
  if ($values.ContainsKey("service")) {
    $query += "service=$([System.Uri]::EscapeDataString($values["service"]))"
  }
  $scope = if ($values.ContainsKey("scope")) { $values["scope"] } else { "repository:${Repository}:pull" }
  $query += "scope=$([System.Uri]::EscapeDataString($scope))"

  $tokenResponse = Invoke-RestMethod -Uri "$($values["realm"])?$($query -join "&")" -TimeoutSec $TimeoutSeconds
  if ($tokenResponse.token) { return $tokenResponse.token }
  if ($tokenResponse.access_token) { return $tokenResponse.access_token }
  throw "Registry token response did not include a token"
}

function Test-ImageManifest {
  param([string]$Image)

  $ref = Resolve-ImageReference $Image
  $uri = "https://$($ref.Registry)/v2/$($ref.Repository)/manifests/$($ref.Reference)"
  $headers = @{ Accept = $manifestAccept }

  try {
    Invoke-WebRequest -Uri $uri -Headers $headers -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing | Out-Null
    return
  } catch {
    $response = $_.Exception.Response
    if (-not $response -or [int]$response.StatusCode -ne 401) {
      throw
    }

    $challenge = $response.Headers["www-authenticate"]
    $token = Get-BearerToken -Challenge $challenge -Repository $ref.Repository
    $headers.Authorization = "Bearer $token"
    Invoke-WebRequest -Uri $uri -Headers $headers -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing | Out-Null
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir
try {
  $composeArgs = @("compose")
  if ($Production) {
    $composeArgs += @("-f", "docker-compose.yml", "-f", "docker-compose.prod.yml")
  }
  $composeArgs += @("--env-file", $EnvFile, "config", "--format", "json")

  $json = docker @composeArgs
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  $config = $json | ConvertFrom-Json
  $images = $config.services.PSObject.Properties |
    ForEach-Object { $_.Value.image } |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Sort-Object -Unique

  $errors = @()
  foreach ($image in $images) {
    try {
      Test-ImageManifest $image
      Write-Output "PASS image manifest: $image"
    } catch {
      $errors += "Image manifest not found or inaccessible: $image $($_.Exception.Message)"
    }
  }

  if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
  }

  Write-Output "Image manifest validation passed for $($images.Count) image(s)."
} finally {
  Pop-Location
}
