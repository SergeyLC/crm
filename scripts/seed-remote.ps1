# CRM - remote DB seed (Windows)
# Equivalent to: node scripts/seed-remote.js --env <env> [--confirm CONFIRM]

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "Node.js not found. Install Node >= 24 and ensure it is on PATH."
  exit 1
}

Write-Host "==> Running scripts/seed-remote.js ..."
& node (Join-Path $PSScriptRoot "seed-remote.js") @args
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
