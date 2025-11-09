# Server Initial Setup Guide

This guide covers the initial setup required on the production server **before** the first automated deployment.

## Prerequisites

- Ubuntu/Debian server with root access
- Node.js 18+ installed
- PostgreSQL 14+ installed
- PM2 installed globally
- Git installed

## Step 1: Create Project Directory

```bash
sudo mkdir -p /var/www/loyacrm
sudo chown $USER:$USER /var/www/loyacrm
cd /var/www/loyacrm
```

## Step 2: Clone Repository

```bash
git clone https://github.com/Betreut-zu-Hause/LoyaCareCRM.git .
git checkout main
```

## Step 3: Create Environment Files

### Backend Secrets

```bash
cd /var/www/loyacrm/backend
cp .env.production.local.example .env.production.local
nano .env.production.local
```

Fill in:
```bash
DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5432/loya_care_crm_prod"
JWT_SECRET="your-32-char-secret-generate-with-openssl-rand-hex-32"
CORS_ORIGIN="https://your-domain.com"
```

Secure the file:
```bash
chmod 600 .env.production.local
```

### Frontend Secrets

```bash
cd /var/www/loyacrm/frontend
cp .env.production.local.example .env.production.local
nano .env.production.local
```

Fill in:
```bash
NEXT_PUBLIC_API_URL="https://your-domain.com"
NEXT_PUBLIC_BACKEND_API_URL="https://api.your-domain.com/api"
```

Secure the file:
```bash
chmod 600 .env.production.local
```

### Database Secrets

```bash
cd /var/www/loyacrm/db
cp .env.production.local.example .env.production.local
nano .env.production.local
```

Fill in:
```bash
DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5432/loya_care_crm_prod"
```

Secure the file:
```bash
chmod 600 .env.production.local
```

## Step 4: Create PM2 Log Directory

```bash
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

## Step 5: Setup Database

### Create PostgreSQL Database and User

```bash
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
-- Create user
CREATE USER loyacare_prod WITH PASSWORD 'your_strong_password_here';

-- Create database
CREATE DATABASE loya_care_crm_prod OWNER loyacare_prod;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE loya_care_crm_prod TO loyacare_prod;

-- Exit
\q
```

### Test Connection

```bash
psql "postgresql://loyacare_prod:your_password@localhost:5432/loya_care_crm_prod"
```

## Step 6: Initial Build (Manual First Time)

```bash
cd /var/www/loyacrm

# Generate Prisma client
cd db
npm ci
npm run generate
cd ..

# Install and build frontend
cd frontend
npm ci
npm run build
cd ..

# Install and build backend
cd backend
npm ci
npm run build
cd ..

# Run migrations
cd db
npm run migrate:deploy
cd ..
```

## Step 7: Create PM2 Configuration

The deployment script will check if `ecosystem.config.js` exists. If not, it will create it from the template.

For the initial setup, you can manually create it:

```bash
cd /var/www/loyacrm
cp .github/ecosystem.config.template.js ecosystem.config.js
```

The template already includes `env_file: "./.env.production.local"` for both apps.

## Step 8: Start Services with PM2

```bash
cd /var/www/loyacrm
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Run the command that pm2 startup outputs
```

## Step 9: Verify Environment Variables

Check that PM2 processes can see the environment variables:

```bash
# Check backend environment
pm2 env loyacrm-backend | grep DATABASE_URL
pm2 env loyacrm-backend | grep JWT_SECRET

# Check frontend environment
pm2 env loyacrm-frontend | grep NEXT_PUBLIC_BACKEND_API_URL
```

If variables are not showing, check:
1. `.env.production.local` files exist in correct locations
2. Files have correct permissions (chmod 600)
3. `env_file` is set in `ecosystem.config.js`

## Step 10: Setup GitHub Actions Deploy Key

### On Server

Generate SSH key for GitHub Actions:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy
```

### On GitHub

1. Go to your repository: Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `SERVER_HOST`: Your server IP or domain
   - `SERVER_USER`: Your SSH username
   - `SERVER_SSH_KEY`: Content of `~/.ssh/github_deploy` (private key)

## Step 11: Test Deployment

Create a tag to trigger deployment:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Watch the GitHub Actions workflow run.

## Verification Checklist

After setup and first deployment, verify:

- [ ] `.env.production.local` files exist in `backend/`, `frontend/`, and `db/`
- [ ] All `.env.production.local` files have `chmod 600` permissions
- [ ] Database connection works from backend
- [ ] PM2 processes are running: `pm2 status`
- [ ] Environment variables are loaded: `pm2 env 0` and `pm2 env 1`
- [ ] Backend responds: `curl http://localhost:4000/health`
- [ ] Frontend responds: `curl http://localhost:3000`
- [ ] Nginx reverse proxy configured (if applicable)
- [ ] SSL certificate installed (if applicable)
- [ ] PM2 startup configured: `pm2 list` after reboot

## Troubleshooting

### PM2 Can't Find Environment Variables

```bash
# Check if files exist
ls -la /var/www/loyacrm/backend/.env.production.local
ls -la /var/www/loyacrm/frontend/.env.production.local

# Check permissions
chmod 600 /var/www/loyacrm/backend/.env.production.local
chmod 600 /var/www/loyacrm/frontend/.env.production.local

# Restart PM2
pm2 restart all
pm2 env 0
```

### Database Connection Fails

```bash
# Test connection manually
psql "postgresql://loyacare_prod:password@localhost:5432/loya_care_crm_prod"

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check logs
pm2 logs loyacrm-backend
```

### Frontend Can't Connect to Backend

Check CORS settings and URLs:
```bash
pm2 env loyacrm-backend | grep CORS_ORIGIN
pm2 env loyacrm-frontend | grep NEXT_PUBLIC_BACKEND_API_URL
```

## Security Notes

1. **Never commit** `.env.production.local` files to git
2. Keep file permissions at `600` for all secret files
3. Use strong passwords (20+ characters) for database
4. Generate JWT secret with: `openssl rand -hex 32`
5. Regularly rotate secrets
6. Keep backups of `.env.production.local` files in a secure location (NOT in git)

## Regular Maintenance

### Update Secrets

To update secrets:

```bash
cd /var/www/loyacrm/backend
nano .env.production.local
# Update values
pm2 restart loyacrm-backend
```

### Check Logs

```bash
pm2 logs
pm2 logs loyacrm-backend
pm2 logs loyacrm-frontend
```

### Monitor

```bash
pm2 monit
pm2 status
```
