# CRM Deployment Script (Windows) — counterpart to ./deploy.sh
# Usage examples:
#   .\deploy.ps1 -m "feat: ..." -s                 # develop (required -s)
#   .\deploy.ps1 -m "fix: ..."                     # main: push (no release tag)
#   .\deploy.ps1 -m "docs: ..." -s                  # main: push with [skip ci]
#   .\deploy.ps1 -m "feat: ..." -t                  # main: auto patch release tag
#   .\deploy.ps1 -m "feat: ..." -v 1.4.2            # main: explicit release tag

[CmdletBinding()]
param(
  [Alias("m")]
  [string]$Message = "",

  [Alias("v")]
  [string]$Version = "",

  [Alias("t")]
  [switch]$AutoIncrement,

  [Alias("s")]
  [switch]$SkipDeploy,

  [Alias("h")]
  [switch]$Help
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Write-Info($text) { Write-Host $text -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host $text -ForegroundColor Green }
function Write-Warn($text) { Write-Host $text -ForegroundColor Yellow }
function Write-Err($text) { Write-Host $text -ForegroundColor Red }

function Show-Help {
  $branch = (git branch --show-current).Trim()
  if ($branch -eq "develop") {
    Write-Info "CRM Deployment Script (develop)"
    Write-Warn "On develop: only push with -s is allowed (no release tags)."
    Write-Host ""
    Write-Ok "USAGE:"
    Write-Host "  .\deploy.ps1 -m `"MESSAGE`" -s"
    Write-Host ""
    Write-Ok "OPTIONS:"
    Write-Host "  -m / -Message   Commit message (required when there are changes)"
    Write-Host "  -s / -SkipDeploy  Required on develop ([skip ci] prefix)"
    Write-Host "  -h / -Help      Show this help"
    Write-Host ""
    Write-Warn "Staging deploy is NOT automatic on this VPS."
    Write-Warn "After push: GitHub Actions → Deploy Application → Run workflow (branch develop)."
    Write-Warn "Optional seed: check run_seed, or: node scripts/seed-remote.js --env stage-develop"
  }
  else {
    Write-Info "CRM Deployment Script (main / other)"
    Write-Host ""
    Write-Ok "USAGE:"
    Write-Host "  .\deploy.ps1 [OPTIONS]"
    Write-Host ""
    Write-Ok "OPTIONS:"
    Write-Host "  -m / -Message       Commit message"
    Write-Host "  -v / -Version       Create release tag vX.Y.Z (production)"
    Write-Host "  -t / -AutoIncrement Create release tag with auto-incremented patch"
    Write-Host "  -s / -SkipDeploy    Prefix commit with [skip ci]"
    Write-Host "  -h / -Help          Show this help"
    Write-Host ""
    Write-Ok "WORKFLOW:"
    Write-Host "  Without -t/-v:  push branch (tests; staging only via Run workflow)"
    Write-Host "  With -t/-v:     create tag v* → production deploy"
    Write-Host "  With -s:        push with [skip ci] (no workflow on that commit)"
  }
}

if ($Help) {
  Show-Help
  exit 0
}

$currentBranch = (git branch --show-current).Trim()
$creatingRelease = -not [string]::IsNullOrWhiteSpace($Version) -or $AutoIncrement.IsPresent
$skipDeploy = $SkipDeploy.IsPresent
$unstagedChangesCommitted = $false
$commitMessagePrefix = ""
$commitMessage = ""

if ($currentBranch -eq "develop" -and $creatingRelease) {
  Write-Err "Cannot create release tags on develop branch."
  Write-Warn "Release tags only on main. Use: .\deploy.ps1 -m `"message`" -s"
  exit 1
}

if ($currentBranch -eq "develop" -and -not $skipDeploy) {
  Write-Err "On develop branch, you must use -s / -SkipDeploy."
  Write-Warn "Usage: .\deploy.ps1 -m `"message`" -s"
  Write-Warn "Staging: Actions → Deploy Application → Run workflow (develop)."
  exit 1
}

# Commit local changes if any
$dirty = $false
git diff --quiet 2>$null
if ($LASTEXITCODE -ne 0) { $dirty = $true }
git diff --cached --quiet 2>$null
if ($LASTEXITCODE -ne 0) { $dirty = $true }

if ($dirty) {
  if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Err "Commit message is required when there are local changes."
    Write-Warn "Usage: .\deploy.ps1 -m `"your commit message`" [-t | -v X.Y.Z | -s]"
    exit 1
  }
  Write-Info "Staging changes..."
  git add -A
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $unstagedChangesCommitted = $true
}
else {
  Write-Warn "No unstaged changes to commit"
}

Write-Info "Syncing with remote repository..."
git pull --rebase
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($creatingRelease) {
  $packageJson = "frontend/package.json"
  $packageVersion = node -p "require('./$packageJson').version"
  Write-Info "Version in package.json: $packageVersion"

  $latestTag = (git tag -l "v*" | Sort-Object { [version]($_ -replace '^v','') } | Select-Object -Last 1)
  if ($latestTag) {
    $tagVersion = $latestTag.Substring(1)
    Write-Info "Latest git tag: $latestTag ($tagVersion)"
  }
  else {
    $tagVersion = "0.0.0"
    Write-Warn "No git tags found, using 0.0.0"
  }

  function Version-Gte([string]$a, [string]$b) {
    return ([version]$a -ge [version]$b)
  }

  if (Version-Gte $packageVersion $tagVersion) {
    $currentVersion = $packageVersion
    Write-Ok "Using package.json version: $currentVersion"
  }
  else {
    $currentVersion = $tagVersion
    Write-Ok "Using git tag version: $currentVersion"
  }

  if ($AutoIncrement.IsPresent -and [string]::IsNullOrWhiteSpace($Version)) {
    if ($currentVersion -match '^([0-9]+)\.([0-9]+)\.([0-9]+)$') {
      $major = [int]$Matches[1]
      $minor = [int]$Matches[2]
      $patch = [int]$Matches[3] + 1
      $Version = "$major.$minor.$patch"
      Write-Ok "Auto-incrementing patch version: $currentVersion → $Version"
    }
    else {
      Write-Err "Cannot parse current version: $currentVersion"
      exit 1
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($Message)) {
    $commitMessage = "chore(release): v$Version - $Message"
  }
  else {
    $commitMessage = "chore(release): v$Version"
  }

  Write-Info "Preparing release: $Version"
  Write-Info "Commit and tag message: `"$commitMessage`""
  Write-Warn "Production deployment will be triggered by GitHub Actions on tag push"
}
else {
  if (-not [string]::IsNullOrWhiteSpace($Message)) {
    $commitMessage = $Message
  }
  else {
    $commitMessage = "Update code"
  }

  if ($skipDeploy) {
    $commitMessagePrefix = "[skip ci] "
    $commitMessage = "$commitMessagePrefix$commitMessage"
    Write-Warn "Deployment will be skipped (skip ci flag added)"
  }
}

$unpushedCommits = @(git log "origin/$currentBranch..HEAD" --pretty=format:"* %s" 2>$null)
if (-not $unpushedCommits) {
  $unpushedCommits = @(git log "origin/main..HEAD" --pretty=format:"* %s" 2>$null)
}
$unpushedText = ($unpushedCommits -join "`n").Trim()
$unpushedCount = @($unpushedCommits | Where-Object { $_ }).Count

if ($creatingRelease) {
  if ($unpushedText) {
    $commitMessage = "$commitMessage`n`n$unpushedText"
    Write-Info "Including unpushed commits in release message:"
    Write-Host $unpushedText
  }

  if ($unstagedChangesCommitted) {
    Write-Info "Amending commit with release message..."
    git commit --amend -m $commitMessage
  }
  else {
    Write-Info "Creating empty release commit..."
    git commit --allow-empty -m $commitMessage
  }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
else {
  if ($unstagedChangesCommitted) {

    if ($unpushedText) {
      $commitMessage = "$commitMessagePrefix$commitMessage`n`n$unpushedText"
      Write-Info "Including unpushed commits in message:"
      Write-Host $unpushedText
    }
    Write-Info "Amending commit with full message..."
    git commit --amend -m $commitMessage
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
  elseif ($unpushedCount -gt 1) {
    $packageJson = "frontend/package.json"
    $currentVersion = node -p "require('./$packageJson').version"
    $starter = "chore(staging)"
    if ($commitMessagePrefix) { $starter = "${commitMessagePrefix}update" }
    if (-not [string]::IsNullOrWhiteSpace($Message)) {
      $stagingMessage = "${starter}: v$currentVersion - $Message`n`n$unpushedText"
    }
    else {
      $stagingMessage = "${starter}: v$currentVersion`n$unpushedText"
    }
    Write-Info "Creating staging summary commit..."
    git commit --allow-empty -m $stagingMessage
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
}

Write-Info "Pushing to remote..."
if ($currentBranch -eq "develop") {
  git push origin develop
}
else {
  git push
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not [string]::IsNullOrWhiteSpace($Version)) {
  if ($Version -notmatch '^[0-9]+\.[0-9]+\.[0-9]+$') {
    Write-Err "Invalid version format: $Version (expected X.Y.Z)"
    exit 1
  }

  $tagName = "v$Version"
  git rev-parse $tagName 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Err "Tag $tagName already exists"
    exit 1
  }

  Write-Info "Creating release tag: $tagName"
  git tag -a $tagName -m $commitMessage
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Info "Pushing tag: $tagName..."
  git push origin $tagName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Ok "Release tag created successfully!"
  Write-Ok "Tag: $tagName"
  Write-Ok "Version: $Version"
  Write-Warn "GitHub Actions will deploy to production."
  Write-Warn "After Actions finishes, run: git pull --rebase"
}
else {
  Write-Ok "Changes pushed to $currentBranch successfully!"
  if ($skipDeploy) {
    if ($currentBranch -eq "develop") {
      Write-Warn "Commit includes [skip ci]. Staging deploy: Actions → Run workflow (develop)."
    }
    else {
      Write-Warn "Deployment skipped ([skip ci])."
    }
  }
  else {
    Write-Warn "No release tag created. Production: .\deploy.ps1 -t or -v X.Y.Z (on main)."
    Write-Warn "Staging: Actions → Deploy Application → Run workflow."
  }
}
