param(
  [string]$ComposeProjectName = "tisp-infra",
  [string]$BackupDir = ".\backups\$(Get-Date -Format yyyyMMdd-HHmmss)"
)

$ErrorActionPreference = "Stop"

$volumes = @(
  "misp_mysql_data",
  "misp_files_data",
  "misp_redis_data",
  "opencti_es_data",
  "opencti_minio_data",
  "opencti_rabbitmq_data",
  "opencti_redis_data",
  "thehive_es_data",
  "thehive_cassandra_data",
  "keycloak_db_data",
  "n8n_data"
)

$backupPath = (New-Item -ItemType Directory -Force -Path $BackupDir).FullName
$manifest = @()

foreach ($volume in $volumes) {
  $dockerVolume = "${ComposeProjectName}_${volume}"
  docker volume inspect $dockerVolume *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Docker volume not found: $dockerVolume. Set -ComposeProjectName to the compose project name used for deployment."
  }

  $archive = "$dockerVolume.tar.gz"
  Write-Host "Backing up $dockerVolume to $archive"
  docker run --rm `
    -v "${dockerVolume}:/source:ro" `
    -v "${backupPath}:/backup" `
    alpine:3.20 `
    tar -czf "/backup/$archive" -C /source .

  if ($LASTEXITCODE -ne 0) {
    throw "Backup failed for $dockerVolume"
  }

  $manifest += [pscustomobject]@{
    volume = $dockerVolume
    archive = $archive
    created_at = (Get-Date).ToString("o")
  }
}

$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $backupPath "manifest.json") -Encoding utf8
Write-Host "Backup completed: $backupPath"
