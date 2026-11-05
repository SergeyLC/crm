# Deprecated thin wrapper.
# Use the repo-root Windows counterpart of deploy.sh instead:
#   .\deploy.ps1 -m "message" -s          # develop
#   .\deploy.ps1 -m "message" -t          # main → production tag
#
# This script used to always bump db version and create a v* tag (scripts/deploy.js).
# Forwarding to root deploy.ps1 -t when no args, otherwise pass args through.

$ErrorActionPreference = "Stop"
$RootDeploy = Join-Path (Split-Path -Parent $PSScriptRoot) "deploy.ps1"

Write-Host "Note: prefer .\deploy.ps1 at repo root (Windows equivalent of .\deploy.sh)." -ForegroundColor Yellow

if ($args.Count -eq 0) {
  Write-Host "No args → forwarding to .\deploy.ps1 -t (production auto-increment release)." -ForegroundColor Yellow
  & $RootDeploy -t
  exit $LASTEXITCODE
}

& $RootDeploy @args
exit $LASTEXITCODE
