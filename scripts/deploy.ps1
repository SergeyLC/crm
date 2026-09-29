# CRM - Production release (Windows)
# Bumps db/package.json, commits, pushes, and creates tag v*.
# Equivalent to: node scripts/deploy.js

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "Node.js not found. Install Node >= 24 and ensure it is on PATH."
  exit 1
}

Write-Host "==> Running scripts/deploy.js ..."
& node (Join-Path $PSScriptRoot "deploy.js")
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
