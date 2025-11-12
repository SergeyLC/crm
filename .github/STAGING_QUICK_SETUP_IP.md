# Staging Quick Setup - IP only (161.97.67.253)

Quick guide for setting up staging using IP address without domain name.

## 🎯 Result

After setup, staging will be available at:
- **Frontend:** `http://161.97.67.253:8001`
- **Backend API:** `http://161.97.67.253:8002/api`

## 📋 Step-by-Step Instructions

### 1. Environment Files

```bash
# Backend
cd /var/www/loyacrm-staging/backend
cat > .env.production.local << 'EOF'
DATABASE_URL="postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging"
JWT_SECRET="staging-jwt-secret-generate-with-openssl-rand-hex-32"
CORS_ORIGIN="http://161.97.67.253:8001"
PRISMA_LOG_LEVEL=warn
LOG_LEVEL=info
PORT=4001
NODE_ENV=staging
EOF
chmod 600 .env.production.local

# Frontend
cd /var/www/loyacrm-staging/frontend
cat > .env.production.local << 'EOF'
NEXT_PUBLIC_API_URL="http://161.97.67.253:8002/api"
NEXT_PUBLIC_BACKEND_API_URL="http://161.97.67.253:8002/api"
NEXT_PUBLIC_APP_VERSION=0.0.0+dev
NEXT_TELEMETRY_DISABLED=1
PORT=3001
EOF
chmod 600 .env.production.local

# Database
cd /var/www/loyacrm-staging/db
cat > .env.production.local << 'EOF'
DATABASE_URL="postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging"
PRISMA_LOG_LEVEL=warn
EOF
chmod 600 .env.production.local
```

### 2. Nginx Configuration

```bash
sudo tee /etc/nginx/sites-available/loyacrm-staging > /dev/null << 'EOF'
# Staging Frontend on port 8001
server {
    listen 8001;
    server_name 161.97.67.253;

    location / {
        proxy_pass http://localhost:3001\;
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
        proxy_pass http://localhost:4001\;
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
EOF

# Activate
sudo ln -s /etc/nginx/sites-available/loyacrm-staging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Firewall

```bash
sudo ufw allow 8001/tcp comment 'Staging Frontend'
sudo ufw allow 8002/tcp comment 'Staging Backend API'
sudo ufw status
```

### 4. GitHub Secrets

**Option A: Environment Secrets (Recommended)**

Create environment `staging` in `Settings → Environments → New environment`:

```
SERVER_HOST=161.97.67.253
SERVER_USER=root  # or your user
SERVER_SSH_KEY=<your-ssh-key>

DATABASE_URL=postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging
JWT_SECRET=<generate with: openssl rand -hex 32>
CORS_ORIGIN=http://161.97.67.253:8001
NEXT_PUBLIC_API_URL=http://161.97.67.253:8002/api
NEXT_PUBLIC_BACKEND_API_URL=http://161.97.67.253:8002/api
```

**Option B: Repository Secrets (Alternative)**

In `Settings → Secrets and variables → Actions` add with `STAGING_` prefix:

```
STAGING_SERVER_HOST=161.97.67.253
STAGING_SERVER_USER=root  # or your user
STAGING_SERVER_SSH_KEY=<your-ssh-key>

STAGING_DATABASE_URL=postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging
STAGING_JWT_SECRET=<generate with: openssl rand -hex 32>
STAGING_CORS_ORIGIN=http://161.97.67.253:8001
STAGING_NEXT_PUBLIC_API_URL=http://161.97.67.253:8002/api
STAGING_NEXT_PUBLIC_BACKEND_API_URL=http://161.97.67.253:8002/api
```

**Note:** The workflow uses Environment secrets (Option A) by default.

## ✅ Verification

### Check Nginx

```bash
# Check that Nginx is listening on ports
sudo ss -tulpn | grep nginx | grep -E '8001|8002'

# Alternative:
sudo lsof -i :8001 -i :8002

# Should show:
# tcp  0  0 0.0.0.0:8001  0.0.0.0:*  LISTEN  <pid>/nginx
# tcp  0  0 0.0.0.0:8002  0.0.0.0:*  LISTEN  <pid>/nginx
```

### Check PM2

```bash
pm2 status
# Should be running:
# loyacrm-staging-frontend (port 3001)
# loyacrm-staging-backend (port 4001)
```

### Check Availability

```bash
# Backend API
curl http://localhost:4001/api/health
curl http://161.97.67.253:8002/api/health

# Frontend
curl -I http://localhost:3001
curl -I http://161.97.67.253:8001
```

### Open in Browser

1. Frontend: `http://161.97.67.253:8001`
2. Login with test account:
   - Email: `admin@loya.care`
   - Password: `1`

## 🔒 Important

### CORS

Make sure backend `.env.production.local` contains:
```bash
CORS_ORIGIN="http://161.97.67.253:8001"
```

This must be the **exact frontend URL** (with http://, no trailing slash).

### Restart After .env Changes

```bash
pm2 restart loyacrm-staging-backend
pm2 restart loyacrm-staging-frontend
```

## 🚀 Automatic Deploy

After setting up GitHub Secrets, every push to `main` will:
1. Run tests
2. Generate build version (e.g., `0.1.25+sha.abc123`)
3. Deploy to staging (161.97.67.253)
4. Create `.env` files from secrets
5. Apply migrations and seed

## 📝 Notes

- **HTTP without SSL:** Since using IP, SSL is not configured. This is acceptable for staging.
- **Ports 8001/8002:** Standard ports for staging, don't conflict with production.
- **Seed data:** Test users are automatically created on each deploy.

## 🔧 Troubleshooting

### Error: "ERR_CONNECTION_REFUSED"

```bash
# Check that PM2 processes are running
pm2 status

# Check logs
pm2 logs loyacrm-staging-frontend --lines 50
pm2 logs loyacrm-staging-backend --lines 50

# Restart
pm2 restart all
```

### Error: "CORS policy"

Check CORS_ORIGIN in backend:
```bash
cd /var/www/loyacrm-staging/backend
grep CORS_ORIGIN .env.production.local
# Should be: CORS_ORIGIN="http://161.97.67.253:8001"

pm2 restart loyacrm-staging-backend
```

### Ports Not Open

```bash
# Check firewall
sudo ufw status numbered

# Open ports if closed
sudo ufw allow 8001/tcp
sudo ufw allow 8002/tcp
```

## 📚 Full Documentation

See `STAGING_SETUP.md` for detailed instructions with all options.
