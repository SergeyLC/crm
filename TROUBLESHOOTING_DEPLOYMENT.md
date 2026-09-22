# Troubleshooting: Deploy with Docker - skipped

## Problem
After a push to GitHub, the "Deploy with Docker" stage is skipped, even though "Setup Deployment Configuration" succeeds.

## Cause
The deploy stage is skipped if one of these conditions is not met:
- `needs.setup.outputs.should_deploy == 'true'`
- `needs.setup.outputs.deployment_type == 'docker'`

**Possible causes:**

1. **The `DEPLOYMENT_TYPE` variable is not set in the GitHub repository** or has an incorrect value
2. **Environment secrets are not configured** — secrets must be at the environment level (staging/production), not at the repository level
3. **Environment does not exist** — make sure `staging` and `production` environments are created under Settings → Environments
4. **Composite action tries to use `secrets.*`** — composite actions do not have access to secrets; all secrets must be passed as inputs
5. **Missing `packages: write` permission** — the workflow cannot push images to GitHub Container Registry

## Solution

### Step 0: Configure permissions in the workflow (CRITICAL)

The file `.github/workflows/deploy.yml` must include a `permissions` section:

```yaml
name: Deploy Application

on:
  push:
    branches: [main]

permissions:
  contents: read
  packages: write  # ← REQUIRED for push to GHCR

env:
  REGISTRY: ghcr.io
```

**Why this matters:**
- Without `packages: write`, GitHub Actions cannot push Docker images to GitHub Container Registry
- Error: `denied: installation not allowed to Create organization package`

### Step 1: Create Environments (REQUIRED)

GitHub Actions requires environments to exist in order to access environment secrets.

1. Go to the repository on GitHub
2. **Settings → Environments**
3. Create two environments:
   - **staging** (for automatic deploys from main/develop)
   - **production** (for tagged releases)

### Step 2: Configure Environment Secrets

For each environment (staging and production), add the following secrets:

**Settings → Environments → [staging/production] → Add Secret**

Required secrets for each environment:
- `POSTGRES_DB` - database name (e.g. `crm_staging` or `crm`)
- `POSTGRES_USER` - DB user (e.g. `crm`)
- `POSTGRES_PASSWORD` - DB password (generate: `openssl rand -base64 32`)
- `JWT_SECRET` - JWT secret (generate: `openssl rand -base64 64`)

### Step 3: Configure Repository Secrets

These secrets are shared across all environments:

**Settings → Secrets and variables → Actions → Secrets → New repository secret**

- `SERVER_HOST` - server IP or domain (e.g. `217.154.173.36`)
- `SERVER_USER` - SSH user (e.g. `root`)
- `SERVER_SSH_KEY` - SSH **private** key (full key, including BEGIN/END)

The matching **public** key must be in that user's `~/.ssh/authorized_keys` on the server  
(for `root`: `/root/.ssh/authorized_keys`).  
Details: [GITHUB_SECRETS_GUIDE.md — SERVER_SSH_KEY](docs/deployment/GITHUB_SECRETS_GUIDE.md#server_ssh_key)

### Step 4: Set the repository variable (optional)

1. **Settings → Secrets and variables → Actions → Variables**
2. **New repository variable**:
   - **Name**: `DEPLOYMENT_TYPE`
   - **Value**: `docker`

### Option 2: Use manual workflow dispatch

If the repository variable is not set, you can start a deploy manually:

1. Go to **Actions** in the repository
2. Select the **Deploy Application** workflow
3. Click **Run workflow**
4. In the `deployment_type` field enter: `docker`
5. Click **Run workflow**

## Quick settings check

### 1. Check that Environments exist

```bash
# Manually:
# Settings → Environments
# Should exist: staging, production
```

### 2. Check environment secrets

**For staging:**
```bash
# Settings → Environments → staging → Secrets
# Should exist: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, JWT_SECRET
```

**For production:**
```bash
# Settings → Environments → production → Secrets  
# Should exist: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, JWT_SECRET
```

### 3. Check repository secrets

```bash
# Settings → Secrets and variables → Actions → Secrets
# Should exist: SERVER_HOST, SERVER_USER, SERVER_SSH_KEY
```

### Option 3: Check GitHub Actions logs

After adding debug messages, check the "Setup Deployment Configuration" stage logs:

```
🔍 Debug: GitHub Ref: refs/heads/main
🔍 Debug: deployment_type_override input: ''
🔍 Debug: deployment_type_default input: 'docker'
...
🔍 Debug outputs:
  - environment: staging
  - deployment_type: docker
  - image_tag: staging-abc1234-20241220-120000
  - should_deploy: true
  - is_release: false
```

Make sure that:
- `deployment_type` = `docker`
- `should_deploy` = `true`
- `image_tag` is not empty

## Common errors

### ❌ Job "Deploy with Docker" skipped

**Cause:** Environments were not created, or environment secrets are missing

**Solution:** 
1. Create `staging` and `production` environments in Settings → Environments
2. Add secrets to each environment (see Step 2 above)
3. Ensure repository secrets are configured (SERVER_HOST, SERVER_USER, SERVER_SSH_KEY)

### ❌ Error: "Environment 'staging' does not exist"

**Cause:** The environment was not created in repository settings

**Solution:** Settings → Environments → New environment → staging

### ❌ Secrets not found during deploy

**Cause:** Secrets were added at the repository level instead of the environment level

**Solution:** Move POSTGRES_*, JWT_SECRET secrets to environment secrets (Settings → Environments → staging/production → Secrets)

### ❌ SCP/SSH: `unable to authenticate, attempted methods [none publickey]`

**Cause:** TCP to port 22 works, but `SERVER_SSH_KEY` does not match any key in the server user's `authorized_keys`.

**Solution:**
1. Public key → `/root/.ssh/authorized_keys` (if `SERVER_USER=root`) or `~SERVER_USER/.ssh/authorized_keys`
2. Private key (full file) → GitHub secret `SERVER_SSH_KEY`
3. See [GITHUB_SECRETS_GUIDE.md — SERVER_SSH_KEY](docs/deployment/GITHUB_SECRETS_GUIDE.md#server_ssh_key)

## Checking current settings

### Correct secrets structure:

```
Repository Level:
├── Variables
│   └── DEPLOYMENT_TYPE = "docker"
└── Secrets
    ├── SERVER_HOST
    ├── SERVER_USER
    └── SERVER_SSH_KEY

Environment Level (staging):
└── Secrets
    ├── POSTGRES_DB
    ├── POSTGRES_USER
    ├── POSTGRES_PASSWORD
    └── JWT_SECRET

Environment Level (production):
└── Secrets
    ├── POSTGRES_DB
    ├── POSTGRES_USER
    ├── POSTGRES_PASSWORD
    └── JWT_SECRET
```

## Frequent mistakes

### ❌ Error 1: `Unrecognized named-value: 'secrets'`

**Problem:** Composite action tries to use `${{ secrets.SECRET_NAME }}`

**Cause:** Composite actions **do not have access** to the `secrets` context

**Solution:** All secrets must be passed as `inputs` to the composite action:

```yaml
# ❌ INCORRECT in composite action:
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    password: ${{ secrets.GITHUB_TOKEN }}  # DOES NOT WORK!

# ✅ CORRECT in composite action:
inputs:
  github_token:
    description: 'GitHub token'
    required: true

steps:
  - name: Log in to GitHub Container Registry
    uses: docker/login-action@v3
    with:
      password: ${{ inputs.github_token }}  # WORKS!

# In the workflow, pass the secret as an input:
- name: Deploy with Docker
  uses: ./.github/actions/docker-deploy
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### ❌ Error 2: `denied: installation not allowed to Create organization package`

**Problem:** GitHub Actions cannot push Docker images to GHCR

**Cause:** Missing `packages: write` permission in the workflow

**Solution:** Add `permissions` at the start of the workflow:

```yaml
name: Deploy Application

permissions:
  contents: read
  packages: write  # ← This is required!
```

## Additional information

### deployment_type configuration priority:
1. 🥇 Manual override (workflow_dispatch input) - highest priority
2. 🥈 Repository variable `DEPLOYMENT_TYPE`
3. 🥉 Default: `docker` - lowest priority

### Conditions for deploy:

**Staging deployment:**
- Push to the `main` branch (except release commits with `[skip ci]`)
- `DEPLOYMENT_TYPE` = `docker` (or unset)
- All tests passed successfully

**Production deployment:**
- Push a git tag matching `v*` (e.g. `v1.4.2`)
- `DEPLOYMENT_TYPE` = `docker` (or unset)
- All tests passed successfully
- Release created (automatically)

## See also

- [CI/CD Setup Guide](.github/CI_CD_SETUP.md) - full setup instructions
- [Deployment Config](DEPLOYMENT_CONFIG.md) - deployment configuration
- [GitHub Actions Docs](https://docs.github.com/en/actions)
