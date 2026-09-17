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

Write-Host "==> Applying migrations (if backend is up)..."
docker compose -f docker-compose.dev.yml exec -T backend sh -c "cd /app/db && pnpm run migrate:deploy" 2>$null

Write-Host ""
Write-Host "App (Nginx):  http://localhost:3003"
Write-Host "API health:   http://localhost:3003/api/health"
Write-Host "DB (host):    localhost:5435"
Write-Host ""
Write-Host "Logs: docker compose -f docker-compose.dev.yml logs -f"
Write-Host "Stop: docker compose -f docker-compose.dev.yml down"
