# GitHub Secrets Setup Guide

This guide explains how to add secrets to your GitHub repository for automated deployment.

## What Are GitHub Secrets?

GitHub Secrets are encrypted environment variables that you can use in GitHub Actions workflows. They are **never** exposed in logs and are perfect for storing sensitive information like database passwords and API keys.

## Required Secrets for Deployment

Your deployment workflow needs the following secrets:

### Server Connection Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `SERVER_HOST` | Your server IP or domain | `161.97.67.253` or `server.example.com` |
| `SERVER_USER` | SSH username on server | `ubuntu` or `root` |
| `SERVER_SSH_KEY` | Private SSH key for authentication | Contents of `~/.ssh/id_ed25519` |

### Application Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT signing (32+ chars) | Generated with `openssl rand -hex 32` |
| `CORS_ORIGIN` | Allowed CORS origin (frontend URL) | `https://your-domain.com` |
| `NEXT_PUBLIC_API_URL` | Frontend public URL | `https://your-domain.com` |
| `NEXT_PUBLIC_BACKEND_API_URL` | Backend API URL | `https://api.your-domain.com/api` |

## Step-by-Step: Adding Secrets to GitHub

### 1. Navigate to Repository Settings

1. Go to your repository on GitHub
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**

![GitHub Secrets Location](https://docs.github.com/assets/cb-45016/images/help/repository/actions-secret-location.png)

### 2. Add New Secret

1. Click the **New repository secret** button
2. Enter the **Name** (exactly as shown in the table above, case-sensitive!)
3. Enter the **Value**
4. Click **Add secret**

### 3. Repeat for All Secrets

Add all 8 required secrets one by one.

## Generating Secret Values

### DATABASE_URL

Format: `postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE`

Example:
```
postgresql://loyacare_prod:MyStr0ngP@ssw0rd@localhost:5432/loya_care_crm_prod
```

**⚠️ Important:**
- Use a **different** database user for production
- Use a **strong password** (20+ characters, mixed case, numbers, symbols)
- If your password contains special characters (`@`, `:`, `/`, etc.), URL-encode them

### JWT_SECRET

Generate a secure random string (minimum 32 characters):

```bash
# Using OpenSSL (recommended)
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Example output:
```
8f7a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
```

### CORS_ORIGIN

Your frontend domain (where users access the application):

```
https://your-domain.com
```

**Important:** No trailing slash!

### NEXT_PUBLIC_API_URL

Same as CORS_ORIGIN:

```
https://your-domain.com
```

### NEXT_PUBLIC_BACKEND_API_URL

Your backend API endpoint:

```
https://api.your-domain.com/api
```

or if backend is on same domain:

```
https://your-domain.com:4000/api
```

### SERVER_SSH_KEY

Generate an SSH key pair for GitHub Actions:

```bash
# On your local machine or server
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# View the public key (add to server)
cat ~/.ssh/github_deploy.pub

# View the private key (add to GitHub Secrets)
cat ~/.ssh/github_deploy
```

**Steps:**

1. **Generate key pair** (run above command)
2. **Add public key to server:**
   ```bash
   # SSH to your server
   ssh user@your-server

   # Add public key to authorized_keys
   echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
   ```

3. **Add private key to GitHub Secret:**
   - Copy the **entire** private key (including `-----BEGIN` and `-----END` lines)
   - Paste into GitHub Secret `SERVER_SSH_KEY`

## Verifying Secrets

After adding all secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all 8 secrets listed:
   - ✅ SERVER_HOST
   - ✅ SERVER_USER
   - ✅ SERVER_SSH_KEY
   - ✅ DATABASE_URL
   - ✅ JWT_SECRET
   - ✅ CORS_ORIGIN
   - ✅ NEXT_PUBLIC_API_URL
   - ✅ NEXT_PUBLIC_BACKEND_API_URL

3. Secret **values are hidden** (you can only update or delete them)

## Testing the Deployment

After adding all secrets, test the deployment:

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0
```

Watch the deployment in **Actions** tab:
1. Go to repository → **Actions**
2. Click on the running workflow
3. Monitor the deployment progress

## Security Best Practices

### ✅ DO:
- **Rotate secrets regularly** (every 90 days recommended)
- **Use different secrets** for development and production
- **Generate strong passwords** (20+ characters)
- **Limit access** to repository settings (only admins)
- **Use environment-specific secrets** if you have staging/production

### ❌ DON'T:
- **Never commit secrets** to git (even in private repos)
- **Never share secrets** via chat/email
- **Never use the same password** for database and JWT
- **Never use weak passwords** like "password123"
- **Never hardcode secrets** in code

## Updating Secrets

To update a secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click on the secret name
3. Click **Update secret**
4. Enter the new value
5. Click **Update secret**

⚠️ **After updating secrets, trigger a new deployment** for changes to take effect.

## Troubleshooting

### "Secret not found" Error

**Problem:** GitHub Actions can't find the secret.

**Solution:**
- Check secret name is **exactly** as specified (case-sensitive)
- Ensure secret is created in the **correct repository**
- For organization repos, check if secret is at org level or repo level

### SSH Connection Fails

**Problem:** `SERVER_SSH_KEY` authentication fails.

**Solution:**
1. Verify public key is in `~/.ssh/authorized_keys` on server
2. Ensure private key includes `-----BEGIN` and `-----END` lines
3. Check line breaks are preserved (GitHub should do this automatically)
4. Test SSH connection manually:
   ```bash
   ssh -i ~/.ssh/github_deploy user@server
   ```

### Database Connection Fails

**Problem:** Backend can't connect to database.

**Solution:**
1. Verify `DATABASE_URL` format is correct
2. URL-encode special characters in password
3. Test connection manually:
   ```bash
   psql "postgresql://user:pass@host:5432/db"
   ```
4. Check database is accessible from server (firewall rules)

### CORS Errors

**Problem:** Frontend can't access backend API.

**Solution:**
1. Verify `CORS_ORIGIN` matches exactly your frontend URL
2. Check for trailing slashes (should not have any)
3. Ensure protocol is correct (`https://` not `http://`)
4. Check `NEXT_PUBLIC_BACKEND_API_URL` is accessible

## Alternative: Using Environment-Specific Secrets

For multiple environments (staging, production), you can use environment-specific secrets:

### Setup Environments

1. Go to **Settings** → **Environments**
2. Create environments: `staging`, `production`
3. Add environment-specific secrets

### Update Workflow

```yaml
deploy:
  runs-on: ubuntu-latest
  environment: production  # ← Add this line
  needs: check
  steps:
    # ... rest of workflow
```

This allows different secret values for different environments!

## Questions?

If you encounter issues:
1. Check GitHub Actions logs for error messages
2. Verify all 8 secrets are added correctly
3. Test each component separately (SSH, DB, backend, frontend)
4. Review the [GitHub Secrets documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
