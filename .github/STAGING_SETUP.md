# Staging Server Setup Guide

This guide describes how to set up a staging environment on the same Ubuntu server where production is already running.

## Architecture

Two independent environments will run on one server:

```
Production:
  - Frontend: localhost:3000
  - Backend: localhost:4000
  - Database: loya_care_crm_prod
  - Directory: /var/www/loyacrm

Staging:
  - Frontend: localhost:3001
  - Backend: localhost:4001
  - Database: loya_care_crm_staging
  - Directory: /var/www/loyacrm-staging
```

## Step 1: Create staging directory

```bash
sudo mkdir -p /var/www/loyacrm-staging
sudo chown $USER:$USER /var/www/loyacrm-staging
cd /var/www/loyacrm-staging
```

## Step 2: Clone repository

```bash
git clone https://github.com/Betreut-zu-Hause/LoyaCareCRM.git .
git checkout main
```

## Step 3: Create staging database

```bash
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
-- Create user for staging
CREATE USER loyacare_staging WITH PASSWORD 'staging_password_here';

-- Create database
CREATE DATABASE loya_care_crm_staging OWNER loyacare_staging;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE loya_care_crm_staging TO loyacare_staging;

-- Exit
\q
```

Test connection:
```bash
psql "postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging"
```

## Step 4: Create environment files for staging

### Backend staging environment

```bash
cd /var/www/loyacrm-staging/backend
nano .env.staging.local
```

Content:
```bash
DATABASE_URL="postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging"
JWT_SECRET="staging-jwt-secret-generate-with-openssl-rand-hex-32"
CORS_ORIGIN="https://staging.your-domain.com"
PRISMA_LOG_LEVEL=warn
LOG_LEVEL=info
PORT=4001
NODE_ENV=staging
```

Protect file:
```bash
chmod 600 .env.staging.local
```

### Frontend staging environment

```bash
cd /var/www/loyacrm-staging/frontend
nano .env.staging.local
```

Content:
```bash
NEXT_PUBLIC_API_URL="https://staging.your-domain.com/api"
NEXT_PUBLIC_BACKEND_API_URL="https://staging.your-domain.com:4001/api"
NEXT_PUBLIC_APP_VERSION=0.0.0+dev
NEXT_TELEMETRY_DISABLED=1
PORT=3001
```

Protect file:
```bash
chmod 600 .env.staging.local
```

### Database staging environment

```bash
cd /var/www/loyacrm-staging/db
nano .env.staging.local
```

Content:
```bash
DATABASE_URL="postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging"
PRISMA_LOG_LEVEL=warn
```

**Important:** Prisma commands (`migrate:deploy`, `migrate:reset`, `seed`) read `DATABASE_URL` from the `.env.staging.local` file in the `db/` directory. Make sure this file exists before running migrations.

Protect file:
```bash
chmod 600 .env.staging.local
```

## Step 5: Install dependencies and build project

### Install pnpm (if not already installed)

```bash
npm install -g pnpm@10
```

### Configure pnpm

```bash
pnpm config set store-dir /var/cache/pnpm
pnpm config set fetch-timeout 300000
pnpm config set enable-pre-post-scripts true
```

### Build project

```bash
cd /var/www/loyacrm-staging

# 1. Install dependencies and generate Prisma client
cd db
pnpm install --frozen-lockfile --prefer-offline
pnpm run generate
cd ..

# IMPORTANT: Make sure .env.staging.local exists in db/
# Check:
ls -la db/.env.staging.local
# If file doesn't exist, go back to Step 4 and create it!

# 2. Install frontend dependencies
cd frontend
pnpm install --frozen-lockfile --prefer-offline
cd ..

# 3. Install backend dependencies
cd backend
pnpm install --frozen-lockfile --prefer-offline
cd ..

# 4. Generate i18n files
cd frontend
pnpm run collect-locales
cd ..

# 5. Build frontend
cd frontend
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build
cd ..

# 6. Build backend
cd backend
pnpm run build
cd ..

# 7. Apply database migrations
cd db
# Prisma reads DATABASE_URL from .env.staging.local in current directory (db/)
pnpm run migrate:deploy

# 8. Seed database with initial data
pnpm run seed
cd ..
```

## Step 6: Create PM2 configuration for staging

```bash
cd /var/www/loyacrm-staging
nano ecosystem.staging.config.js
```

Content:
```javascript
module.exports = {
  apps: [
    {
      name: 'loyacrm-staging-backend',
      script: './dist/server.js',
      cwd: '/var/www/loyacrm-staging/backend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 4001
      },
      env_file: './.env.staging.local',
      error_file: '/var/log/pm2/loyacrm-staging-backend-error.log',
      out_file: '/var/log/pm2/loyacrm-staging-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'loyacrm-staging-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/loyacrm-staging/frontend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: './.env.staging.local',
      error_file: '/var/log/pm2/loyacrm-staging-frontend-error.log',
      out_file: '/var/log/pm2/loyacrm-staging-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

## Step 7: Start staging services

```bash
cd /var/www/loyacrm-staging
pm2 start ecosystem.staging.config.js
pm2 save
```

Check status:
```bash
pm2 status
```

You should see 4 processes:
- `loyacrm-backend` (production)
- `loyacrm-frontend` (production)
- `loyacrm-staging-backend` (staging)
- `loyacrm-staging-frontend` (staging)

## Step 8: Configure Nginx for staging

### Option A: If you have a domain name (recommended)

Create configuration for staging subdomain:

```bash
sudo nano /etc/nginx/sites-available/loyacrm-staging
```

Content:
```nginx
# Staging Frontend
server {
    listen 80;
    server_name staging.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Staging Backend API
server {
    listen 80;
    server_name api-staging.your-domain.com;

    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option B: If you only have IP address (161.97.67.253)

Use ports to access staging:

```bash
sudo nano /etc/nginx/sites-available/loyacrm-staging
```

Content:
```nginx
# Staging Frontend on port 8001
server {
    listen 8001;
    server_name 161.97.67.253;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for Next.js
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}

# Staging Backend API on port 8002
server {
    listen 8002;
    server_name 161.97.67.253;

    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Staging will be available at:**
- Frontend: `http://161.97.67.253:8001`
- Backend API: `http://161.97.67.253:8002`

Activate configuration:
```bash
sudo ln -s /etc/nginx/sites-available/loyacrm-staging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Verification:**
```bash
# Check that Nginx is listening on ports 8001 and 8002
sudo ss -tulpn | grep nginx
# Or alternatively:
sudo lsof -i :8001 -i :8002
# Should show lines with :8001 and :8002
```

## Step 9: Configure SSL for staging (optional)

### If you have a domain name:

```bash
sudo certbot --nginx -d staging.your-domain.com -d api-staging.your-domain.com
```

### If you only have IP (161.97.67.253):

SSL via Let's Encrypt requires a domain name. Options:

**Option 1:** Use HTTP without SSL for staging (acceptable for testing)
- Frontend: `http://161.97.67.253:8001`
- Backend: `http://161.97.67.253:8002`

**Option 2:** Set up a free subdomain via services like:
- [DuckDNS](https://www.duckdns.org) - to get `mystaging.duckdns.org`
- [No-IP](https://www.noip.com) - to get `mystaging.ddns.net`

Then you can use certbot.

**Option 3:** Self-signed certificate (for local testing)

For staging without a domain name, **Option 1** (HTTP) is recommended.

## Step 10: Configure DNS (only if you have a domain)

If you have a domain name, add A records to DNS:
```
staging.your-domain.com -> 161.97.67.253
api-staging.your-domain.com -> 161.97.67.253
```

**If using IP only - skip this step.**

## Step 11: Update staging environment files with correct URLs

After configuring Nginx, update URLs according to your configuration:

### If using domain name and SSL:

```bash
cd /var/www/loyacrm-staging/frontend
nano .env.staging.local
```

Update:
```bash
NEXT_PUBLIC_API_URL="https://staging.your-domain.com"
NEXT_PUBLIC_BACKEND_API_URL="https://api-staging.your-domain.com/api"
NEXT_PUBLIC_APP_VERSION=0.0.0+dev
NEXT_TELEMETRY_DISABLED=1
PORT=3001
```

```bash
cd /var/www/loyacrm-staging/backend
nano .env.staging.local
```

Update:
```bash
CORS_ORIGIN="https://staging.your-domain.com"
```

### If using IP only (161.97.67.253) with ports:

```bash
cd /var/www/loyacrm-staging/frontend
nano .env.staging.local
```

Update:
```bash
NEXT_PUBLIC_API_URL="http://161.97.67.253:8002/api"
NEXT_PUBLIC_BACKEND_API_URL="http://161.97.67.253:8002/api"
NEXT_PUBLIC_APP_VERSION=0.0.0+dev
NEXT_TELEMETRY_DISABLED=1
PORT=3001
```

```bash
cd /var/www/loyacrm-staging/backend
nano .env.staging.local
```

Update:
```bash
DATABASE_URL="postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging"
JWT_SECRET="staging-jwt-secret-generate-with-openssl-rand-hex-32"
CORS_ORIGIN="http://161.97.67.253:8001"
PRISMA_LOG_LEVEL=warn
LOG_LEVEL=info
PORT=4001
NODE_ENV=staging
```

Restart services:
```bash
pm2 restart loyacrm-staging-backend
pm2 restart loyacrm-staging-frontend
```

## Step 12: Configure GitHub Secrets for staging

In GitHub repository settings, add secrets:

### If using domain name:

```
STAGING_SERVER_HOST=161.97.67.253
STAGING_SERVER_USER=your-ssh-user
STAGING_SERVER_SSH_KEY=<same-as-production-or-new-key>

STAGING_DATABASE_URL=postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging
STAGING_JWT_SECRET=staging-jwt-secret-here
STAGING_CORS_ORIGIN=https://staging.your-domain.com
STAGING_NEXT_PUBLIC_API_URL=https://staging.your-domain.com
STAGING_NEXT_PUBLIC_BACKEND_API_URL=https://api-staging.your-domain.com/api
```

### If using IP only (161.97.67.253):

```
STAGING_SERVER_HOST=161.97.67.253
STAGING_SERVER_USER=your-ssh-user
STAGING_SERVER_SSH_KEY=<same-as-production-or-new-key>

STAGING_DATABASE_URL=postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging
STAGING_JWT_SECRET=staging-jwt-secret-here
STAGING_CORS_ORIGIN=http://161.97.67.253:8001
STAGING_NEXT_PUBLIC_API_URL=http://161.97.67.253:8002/api
STAGING_NEXT_PUBLIC_BACKEND_API_URL=http://161.97.67.253:8002/api
```

## Verification

### 1. Check PM2 processes
```bash
pm2 status
pm2 logs loyacrm-staging-backend --lines 50
pm2 logs loyacrm-staging-frontend --lines 50
```

### 2. Check database connection
```bash
cd /var/www/loyacrm-staging/backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('✅ Database connected');
  process.exit(0);
}).catch(e => {
  console.error('❌ Database connection failed:', e);
  process.exit(1);
});
"
```

### 3. Check backend API
```bash
# Locally on server
curl http://localhost:4001/api/health

# Via Nginx (with domain)
curl https://api-staging.your-domain.com/api/health

# Via Nginx (with IP and port)
curl http://161.97.67.253:8002/api/health
```

### 4. Check frontend
```bash
# Locally on server
curl http://localhost:3001

# Via Nginx (with domain)
curl https://staging.your-domain.com

# Via Nginx (with IP and port)
curl http://161.97.67.253:8001
```

### 5. Check environment variables in PM2
```bash
pm2 env loyacrm-staging-backend | grep DATABASE_URL
pm2 env loyacrm-staging-frontend | grep NEXT_PUBLIC
```

## Simplified option without subdomains

**Note:** This section is relevant if you are using IP address (161.97.67.253) without a domain name. Configuration is already described in Step 8, Option B.

### Final configuration for IP address:

**Access to staging:**
- Frontend: `http://161.97.67.253:8001`
- Backend API: `http://161.97.67.253:8002/api`

**Ports:**
- 8001 - Nginx → Frontend (localhost:3001)
- 8002 - Nginx → Backend (localhost:4001)
- 3001 - Frontend (Next.js)
- 4001 - Backend (Express)

**Firewall:**
Make sure ports are open:
```bash
sudo ufw allow 8001/tcp
sudo ufw allow 8002/tcp
sudo ufw status
```

## Maintenance

### Manual staging update

```bash
cd /var/www/loyacrm-staging
git fetch origin
git reset --hard origin/main
pnpm install --frozen-lockfile
cd db && pnpm run generate && cd ..
cd frontend && pnpm run build && cd ..
cd backend && pnpm run build && cd ..
cd db && pnpm run migrate:deploy && cd ..
pm2 restart loyacrm-staging-backend loyacrm-staging-frontend
```

### View logs

```bash
pm2 logs loyacrm-staging-backend
pm2 logs loyacrm-staging-frontend
pm2 monit
```

### Clear staging database

```bash
cd /var/www/loyacrm-staging/db
pnpm run migrate:reset
# WARNING: This will delete all data in staging database!

# After reset you can fill with test data
pnpm run seed
```

### Backup staging database

```bash
pg_dump -U loyacare_staging -d loya_care_crm_staging > staging_backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Port already in use

Check which ports are in use:
```bash
# Option 1: ss (modern utility)
sudo ss -tulpn | grep -E ':3001|:4001'

# Option 2: lsof
sudo lsof -i :3001
sudo lsof -i :4001
```

Kill process on port:
```bash
sudo kill -9 $(sudo lsof -t -i:3001)
sudo kill -9 $(sudo lsof -t -i:4001)
```

### PM2 cannot see environment files

Check:
```bash
ls -la /var/www/loyacrm-staging/backend/.env.staging.local
ls -la /var/www/loyacrm-staging/frontend/.env.staging.local
```

Fix permissions:
```bash
chmod 600 /var/www/loyacrm-staging/backend/.env.staging.local
chmod 600 /var/www/loyacrm-staging/frontend/.env.staging.local
```

### Backend cannot connect to database

Check connection string:
```bash
cd /var/www/loyacrm-staging/backend
cat .env.staging.local | grep DATABASE_URL
```

Direct connection test:
```bash
psql "postgresql://loyacare_staging:password@localhost:5432/loya_care_crm_staging"
```

### CORS errors

Make sure `CORS_ORIGIN` in backend matches frontend URL:
```bash
cd /var/www/loyacrm-staging/backend
grep CORS_ORIGIN .env.staging.local
```

## Security

1. **Different database passwords** for production and staging
2. **Different JWT secrets** for production and staging
3. **Protect staging with password** via Nginx basic auth (optional):

```nginx
location / {
    auth_basic "Staging Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:3001;
    # ... rest of configuration
}
```

Create password:
```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd staging_user
```

## Resource Monitoring

Check resource usage:
```bash
# CPU and Memory
pm2 monit

# Disk space
df -h

# Database usage
sudo -u postgres psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database;"
```

Staging usually requires less resources, but make sure you have enough:
- RAM: minimum 2GB free for staging
- Disk: minimum 10GB free
- CPU: staging will use part of CPU along with production

## Seed Data

After initial setup, staging database will be populated with test data via `pnpm run seed`.

### What seed.ts creates

Script `db/prisma/seed.ts` creates:

1. **Administrators:**
   - `admin@loya.care`
   - `admin@beispiel.de`
   - `admin@example.com`
   - Password: `1` (for all)

2. **10 employees:**
   - `v1@loya.care` to `v10@loya.care`
   - Password: `1` (for all)

3. **Test data:**
   - Contacts
   - Deals
   - Groups
   - Pipelines
   - And other entities

### Re-run seed

If you need to recreate test data:

```bash
cd /var/www/loyacrm-staging/db

# Option 1: Full database reset and refill
pnpm run migrate:reset
# migrate:reset will automatically run seed

# Option 2: Only run seed (will add data)
pnpm run seed
```

**Note:** Seed uses `upsert`, so re-running will not create duplicates for users with the same email.

### Changing seed data

If you need to change initial data for staging:

1. Edit file `db/prisma/seed.ts`
2. Commit changes
3. Push to main will trigger staging deploy with new seed data

Or locally on server:
```bash
cd /var/www/loyacrm-staging
git pull origin main
cd db
pnpm run migrate:reset  # Will recreate database with new data
```
