# Quick Start: GitHub Secrets for Deployment

## 🎯 What changed

Now deployment **automatically creates** `.env.production.local` files from GitHub Secrets. No more need to manually create these files on the server!

## 📋 Required GitHub Secrets

Add the following 8 secrets to your GitHub repository:

### 1. Server connection
```
SERVER_HOST=161.97.67.253
SERVER_USER=ubuntu
SERVER_SSH_KEY=<content of private SSH key>
```

### 2. Database
```
DATABASE_URL=postgresql://loyacare_prod:password@localhost:5432/loya_care_crm_prod
```

### 3. Security
```bash
# Generate: openssl rand -hex 32
JWT_SECRET=8f7a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
```

### 4. CORS
```
CORS_ORIGIN=https://your-domain.com
```

### 5. Frontend URLs
```
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_BACKEND_API_URL=https://api.your-domain.com/api
```

## 🚀 How to add secrets to GitHub

### Quick way:

1. Open: `https://github.com/Betreut-zu-Hause/LoyaCareCRM/settings/secrets/actions`
2. Click **"New repository secret"**
3. Add each secret from the list above
4. **Important:** secret names must match exactly!

### Or through UI:

1. Go to your repository on GitHub
2. **Settings** (at the top)
3. **Secrets and variables** → **Actions** (on the left)
4. **New repository secret**
5. Fill in **Name** and **Value**
6. **Add secret**

## ✅ Verification

After adding all 8 secrets, you should see them in the list:

```
✓ SERVER_HOST
✓ SERVER_USER  
✓ SERVER_SSH_KEY
✓ DATABASE_URL
✓ JWT_SECRET
✓ CORS_ORIGIN
✓ NEXT_PUBLIC_API_URL
✓ NEXT_PUBLIC_BACKEND_API_URL
```

## 🧪 Testing

Run deployment:

```bash
git tag v1.0.1
git push origin v1.0.1
```

Check in **Actions** → workflow should:
1. ✅ Create `.env.production.local` files
2. ✅ Set permissions `chmod 600`
3. ✅ Restart PM2

## 📚 Detailed documentation

For detailed information see:
- `.github/GITHUB_SECRETS_GUIDE.md` - Complete guide to secrets
- `.github/SERVER_SETUP.md` - Initial server setup
- `README.env.md` - Documentation on environment variables
- `DEPLOYMENT_PRODUCTION.md` - Deployment guide

## 🔒 Security

- ✅ Secrets are **encrypted** in GitHub
- ✅ Secrets are **not visible** in Actions logs
- ✅ `.env.production.local` files are **not committed** to git
- ✅ Files are protected with `chmod 600` on the server

## ⚡ Advantages

**Before:**
- manual creation of `.env.production.local` on the server
- risk of forgetting to update secrets when changing
- difficult to synchronize between environments

**Now:**
- ✅ Automatic creation on every deployment
- ✅ Centralized secret management in GitHub
- ✅ Easy to update - just change the secret and redeploy

## 🆘 Problems?

If deployment doesn't work:

1. **Check all 8 secrets are added**
2. **Secret names match exactly** (case-sensitive!)
3. **SSH key is correct** (including BEGIN/END lines)
4. **DATABASE_URL format is correct**
5. Check logs in **Actions** → click on workflow

Detailed help: `.github/GITHUB_SECRETS_GUIDE.md`
