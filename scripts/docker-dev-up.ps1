# LoyaCareCRM - Docker Dev Start (Windows)
# Run AFTER reboot, once Docker Desktop shows "Engine running".

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$env:Path = "$env:ProgramFiles\Docker\Docker\resources\bin;" + $env:Path

Write-Host "==> Checking Docker..."
docker version | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker is not ready. Start Docker Desktop and wait until it is running."
  exit 1
}

if (-not (Test-Path ".env.dev")) {
  Copy-Item ".env.dev.example" ".env.dev"
  Write-Host "Created .env.dev from example - edit passwords if needed."
}

New-Item -ItemType Directory -Force -Path ".\backups" | Out-Null

Write-Host "==> Building and starting docker-compose.dev.yml ..."
docker compose -f docker-compose.dev.yml up --build -d

Write-Host "==> Waiting for containers..."
Start-Sleep -Seconds 15
docker compose -f docker-compose.dev.yml ps

Write-Host "==> Applying migrations from host (Docker Postgres on :5435)..."
$env:DATABASE_URL = "postgresql://${env:POSTGRES_USER}:${env:POSTGRES_PASSWORD}@localhost:5435/${env:POSTGRES_DB}"
if (-not $env:POSTGRES_USER) {
  # Fallback from .env.dev defaults used in this repo
  Get-Content .env.dev | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
      Set-Item -Path "Env:$($matches[1].Trim())" -Value $matches[2].Trim()
    }
  }
  $env:DATABASE_URL = "postgresql://${env:POSTGRES_USER}:${env:POSTGRES_PASSWORD}@localhost:5435/${env:POSTGRES_DB}"
}
Push-Location db
pnpm exec prisma migrate deploy
Pop-Location

Write-Host ""
Write-Host "App (Nginx):  http://localhost:3003"
Write-Host "API health:   http://localhost:3003/api/health"
Write-Host "DB (host):    localhost:5435"
Write-Host "Login seed:   admin@loya.care / 1"
Write-Host ""
Write-Host "Logs: docker compose -f docker-compose.dev.yml logs -f"
Write-Host "Stop: docker compose -f docker-compose.dev.yml down"
