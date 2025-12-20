# Staging Setup Commands - Copy & Paste

Ready-to-use commands for quick staging setup on server **161.97.67.253**.

## 🚀 All Commands in One Block

```bash
#!/bin/bash
# Staging Setup Script for 161.97.67.253

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting staging setup...${NC}"

# 1. Create staging database
echo -e "${BLUE}📦 Creating staging database...${NC}"
sudo -u postgres psql << 'EOF'
CREATE USER loyacare_staging WITH PASSWORD 'StAgInG_PaSsWoRd_2024!';
CREATE DATABASE loya_care_crm_staging OWNER loyacare_staging;
GRANT ALL PRIVILEGES ON DATABASE loya_care_crm_staging TO loyacare_staging;
\q
EOF

# 2. Clone repository
echo -e "${BLUE}📥 Cloning repository...${NC}"
sudo mkdir -p /var/www/loyacrm-staging
sudo chown $USER:$USER /var/www/loyacrm-staging
cd /var/www/loyacrm-staging
git clone https://github.com/Betreut-zu-Hause/LoyaCareCRM.git .
git checkout main

# 3. Create environment files
echo -e "${BLUE}🔧 Creating environment files...${NC}"

# Backend .env
cat > backend/.env.production.local << 'EOF'
DATABASE_URL="postgresql://loyacare_staging:StAgInG_PaSsWoRd_2024!@localhost:5432/loya_care_crm_staging"
JWT_SECRET="staging-jwt-secret-32-chars-long-min"
CORS_ORIGIN="http://161.97.67.253:8001"
PRISMA_LOG_LEVEL=warn
LOG_LEVEL=info
PORT=4001
NODE_ENV=staging
EOF
chmod 600 backend/.env.production.local

# Frontend .env
cat > frontend/.env.production.local << 'EOF'
NEXT_PUBLIC_API_URL="http://161.97.67.253:8001"
NEXT_PUBLIC_BACKEND_API_URL="http://161.97.67.253:8002/api"
NEXT_PUBLIC_APP_VERSION=0.0.0+dev
NEXT_TELEMETRY_DISABLED=1
PORT=3001
EOF
chmod 600 frontend/.env.production.local

# Database .env
cat > db/.env.production.local << 'EOF'
DATABASE_URL="postgresql://loyacare_staging:StAgInG_PaSsWoRd_2024!@localhost:5432/loya_care_crm_staging"
PRISMA_LOG_LEVEL=warn
EOF
chmod 600 db/.env.production.local

# 4. Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${BLUE}📦 Installing pnpm...${NC}"
    npm install -g pnpm@10
fi

# Configure pnpm
pnpm config set store-dir /var/cache/pnpm
pnpm config set fetch-timeout 300000
pnpm config set enable-pre-post-scripts true

# 5. Build project
echo -e "${BLUE}🔨 Building project...${NC}"

# DB
cd db
pnpm install --frozen-lockfile --prefer-offline
pnpm run generate
cd ..

# Frontend
cd frontend
pnpm install --frozen-lockfile --prefer-offline
pnpm run collect-locales
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build
cd ..

# Backend
cd backend
pnpm install --frozen-lockfile --prefer-offline
pnpm run build
cd ..

# Migrations and seed
cd db
pnpm run migrate:deploy
pnpm run seed
cd ..

# 6. Create PM2 configuration
echo -e "${BLUE}⚙️  Creating PM2 config...${NC}"
cat > ecosystem.staging.config.js << 'EOF'
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
      env_file: './.env.production.local',
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
      env_file: './.env.production.local',
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
EOF

# 7. Start PM2
echo -e "${BLUE}🚀 Starting PM2 services...${NC}"
pm2 start ecosystem.staging.config.js
pm2 save

# 8. Configure Nginx
echo -e "${BLUE}🌐 Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/loyacrm-staging > /dev/null << 'EOF'
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
EOF

sudo ln -s /etc/nginx/sites-available/loyacrm-staging /etc/nginx/sites-enabled/ 2>/dev/null || echo "Symlink already exists"
sudo nginx -t
sudo systemctl reload nginx

# 9. Open ports in firewall
echo -e "${BLUE}🔓 Opening firewall ports...${NC}"
sudo ufw allow 8001/tcp comment 'Staging Frontend'
sudo ufw allow 8002/tcp comment 'Staging Backend API'

# 10. Verification
echo -e "${GREEN}✅ Staging setup complete!${NC}"
echo ""
echo "📊 Status:"
pm2 status

echo ""
echo "🌐 Access staging at:"
echo "   Frontend: http://161.97.67.253:8001"
echo "   Backend:  http://161.97.67.253:8002/api"
echo ""
echo "👤 Test login:"
echo "   Email: admin@loya.care"
echo "   Password: 1"
echo ""
echo "📝 Next steps:"
echo "   1. Add GitHub Secrets (see STAGING_QUICK_SETUP_IP.md)"
echo "   2. Test access: curl http://161.97.67.253:8002/api/health"
echo "   3. Open in browser: http://161.97.67.253:8001"
```

## 📝 Manual Installation (Step by Step)

If the automatic script doesn't work, execute commands one by one:

### 1. Database

```bash
sudo -u postgres psql
```

In PostgreSQL:
```sql
CREATE USER loyacare_staging WITH PASSWORD 'StAgInG_PaSsWoRd_2024!';
CREATE DATABASE loya_care_crm_staging OWNER loyacare_staging;
GRANT ALL PRIVILEGES ON DATABASE loya_care_crm_staging TO loyacare_staging;
\q
```

### 2. Clone repository

```bash
sudo mkdir -p /var/www/loyacrm-staging
sudo chown $USER:$USER /var/www/loyacrm-staging
cd /var/www/loyacrm-staging
git clone https://github.com/Betreut-zu-Hause/LoyaCareCRM.git .
```

### 3. Environment files

See section 3 in the automatic script above.

### 4. Install and build

```bash
cd /var/www/loyacrm-staging

# pnpm
npm install -g pnpm@10
pnpm config set store-dir /var/cache/pnpm

# DB
cd db && pnpm install && pnpm run generate && cd ..

# Frontend
cd frontend && pnpm install && pnpm run collect-locales && pnpm run build && cd ..

# Backend
cd backend && pnpm install && pnpm run build && cd ..

# Migrations & Seed
cd db && pnpm run migrate:deploy && pnpm run seed && cd ..
```

### 5. PM2 and Nginx

See sections 6-8 in the automatic script.

## 🔑 GitHub Secrets

**Option A: Environment Secrets (Recommended)**

1. Go to: `Settings → Environments → New environment`
2. Name: `staging`
3. Add secrets (without `STAGING_` prefix):

```bash
# Copy SSH key
cat ~/.ssh/id_rsa  # or another key

# Generate JWT secret
openssl rand -hex 32
```

Add secrets:
```
SERVER_HOST=161.97.67.253
SERVER_USER=root  # or your user
SERVER_SSH_KEY=<output from cat ~/.ssh/id_rsa>

DATABASE_URL=postgresql://loyacare_staging:StAgInG_PaSsWoRd_2024!@localhost:5432/loya_care_crm_staging
JWT_SECRET=<output from openssl rand -hex 32>
CORS_ORIGIN=http://161.97.67.253:8001
NEXT_PUBLIC_API_URL=http://161.97.67.253:8002/api
NEXT_PUBLIC_BACKEND_API_URL=http://161.97.67.253:8002/api
```

**Option B: Repository Secrets (Alternative)**

In `Settings → Secrets and variables → Actions` add with `STAGING_` prefix:

```
STAGING_SERVER_HOST=161.97.67.253
STAGING_SERVER_USER=root
STAGING_SERVER_SSH_KEY=<ssh key>
STAGING_DATABASE_URL=postgresql://...
STAGING_JWT_SECRET=<secret>
STAGING_CORS_ORIGIN=http://161.97.67.253:8001
STAGING_NEXT_PUBLIC_API_URL=http://161.97.67.253:8002/api
STAGING_NEXT_PUBLIC_BACKEND_API_URL=http://161.97.67.253:8002/api
```

**Note:** The workflow uses Environment secrets (Option A) by default.

## ✅ Installation Verification

```bash
# PM2 status
pm2 status

# Logs
pm2 logs loyacrm-staging-backend --lines 20
pm2 logs loyacrm-staging-frontend --lines 20

# Backend health
curl http://localhost:4001/api/health
curl http://161.97.67.253:8002/api/health

# Frontend
curl -I http://localhost:3001
curl -I http://161.97.67.253:8001

# Nginx ports
sudo ss -tulpn | grep nginx | grep -E '8001|8002'
# Or:
sudo lsof -i :8001 -i :8002

# Firewall
sudo ufw status | grep -E '8001|8002'
```

## 🔄 Updating Staging

```bash
cd /var/www/loyacrm-staging
git pull origin main
cd db && pnpm install && pnpm run generate && cd ..
cd frontend && pnpm run build && cd ..
cd backend && pnpm run build && cd ..
cd db && pnpm run migrate:deploy && cd ..
pm2 restart loyacrm-staging-backend loyacrm-staging-frontend
```

## 🆘 Problems

### "Connection refused"
```bash
pm2 restart all
pm2 logs
```

### "CORS error"
```bash
cd /var/www/loyacrm-staging/backend
grep CORS_ORIGIN .env.production.local
# Should be: http://161.97.67.253:8001
pm2 restart loyacrm-staging-backend
```

### "Port already in use"
```bash
sudo kill -9 $(sudo lsof -t -i:3001)
sudo kill -9 $(sudo lsof -t -i:4001)
pm2 restart all
```
