# 🚀 Quick CI/CD Setup

## Problem: Deploy with Docker - skipped?

Follow these steps in order:

### 1️⃣ Create Environments (2 minutes)

```
GitHub Repo → Settings → Environments → New environment
```

Create two environments:
- ✅ **staging**
- ✅ **production**

### 2️⃣ Configure Environment Secrets (5 minutes)

For **EACH** environment (staging and production):

```
Settings → Environments → [select staging] → Add Secret
```

Add 4 secrets:

| Secret Name | Example Value | How to Generate |
|-------------|---------------|-----------------|
| `POSTGRES_DB` | `crm_staging` or `crm` | Choose a database name |
| `POSTGRES_USER` | `crm` | Choose a username |
| `POSTGRES_PASSWORD` | `x7K9mP2qR...` | `openssl rand -base64 32` |
| `JWT_SECRET` | `L8nQ5tV9w...` | `openssl rand -base64 64` |

Repeat for the **production** environment with different values!

### 3️⃣ Configure Repository Secrets (3 minutes)

```
Settings → Secrets and variables → Actions → Secrets → New repository secret
```

Add 3 secrets:

| Secret Name | Example | Description |
|-------------|---------|-------------|
| `SERVER_HOST` | `217.160.74.128` | Your server IP or domain |
| `SERVER_USER` | `root` | SSH user |
| `SERVER_SSH_KEY` | `-----BEGIN...` | Full SSH **private** key (pair with public key on server) |

**How to get the SSH key pair** (private → GitHub, public → server):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
# Public key on server (as SERVER_USER, e.g. root → /root/.ssh/authorized_keys):
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
# Private key into GitHub secret SERVER_SSH_KEY:
cat ~/.ssh/github_deploy
```

Full details: [GitHub Secrets Guide — SERVER_SSH_KEY](../docs/deployment/GITHUB_SECRETS_GUIDE.md#server_ssh_key)

### 4️⃣ (Optional) Set a Repository Variable

```
Settings → Secrets and variables → Actions → Variables → New repository variable
```

- **Name**: `DEPLOYMENT_TYPE`
- **Value**: `docker`

## ✅ Done!

Now a push to `main` will automatically start a staging deploy (except release commits with `[skip ci]`).

### How to verify

1. Commit and push to main:
   ```bash
   git push origin main
   ```

2. Open Actions and check the logs:
   ```
   Actions → Deploy Application → Setup Deployment Configuration
   ```

3. You should see:
   ```
   ✅ deployment_type: docker
   ✅ should_deploy: true
   ✅ environment: staging
   ```

4. The "Deploy with Docker" job should run (not skipped)

## ❌ Still not working?

See the detailed guide: [TROUBLESHOOTING_DEPLOYMENT.md](../TROUBLESHOOTING_DEPLOYMENT.md)

## 📚 Additional documentation

- [Full CI/CD instructions](CI_CD_SETUP.md)
- [Deployment configuration](../DEPLOYMENT_CONFIG.md)
