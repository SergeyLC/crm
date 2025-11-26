## 🖥️ Traditional Ubuntu Server Deployment

### 1. System Update
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Required Packages
```bash
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 3. Node.js Installation (Version 24+)
```bash
# Install Node.js 24 using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v24.x.x
pnpm --version  # Should show latest pnpm

# Optional: Install nvm for version management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
nvm alias default 24
```

### 4. Verify Node.js Installation
```bash
# Run the version check script
./check-node-version.sh
```

### 5. PM2 Process Manager
```bash
sudo pnpm add -g pm2
```

## 🗄️ PostgreSQL Installation and Setup

### 1. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 2. Configure PostgreSQL
```bash
# Start and enable auto-start
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql
```

In PostgreSQL console execute:
```sql
CREATE USER loyacrm WITH PASSWORD 'your_strong_password';
CREATE DATABASE loyacrm OWNER loyacrm;
GRANT ALL PRIVILEGES ON DATABASE loyacrm TO loyacrm;
\q
```

### 3. Configure PostgreSQL Access
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```
Find and uncomment/modify:
```
listen_addresses = 'localhost'
```

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```
Add line:
```
local   loyacrm         loyacrm                                 md5
```

```bash
sudo systemctl restart postgresql
```

## 🟢 Node.js and pnpm Installation

### 1. Install Node.js 24+ via NodeSource
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install pnpm
```bash
sudo npm install -g pnpm
```

### 3. Verify Installation
```bash
node --version
pnpm --version
```

### 4. Install PM2 for Process Management
```bash
sudo pnpm add -g pm2
```

## 🌐 Nginx Installation and Setup

### 1. Install Nginx
```bash
sudo apt install -y nginx
```

### 2. Start and Enable Auto-start
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 📁 Application Deployment

### 1. Clone Repository
```bash
cd /var/www/
sudo git clone <your-repository-url> loyacrm
sudo chown -R $USER:$USER /var/www/loyacrm
cd loyacrm
```

### 2. Environment Variables Setup

#### Database:
```bash
cd db
nano .env
```
Contents of `.env`:
```env
DATABASE_URL="postgresql://loyacrm:your_strong_password@localhost:5432/loyacrm"
```

#### Backend:
```bash
cd ../backend
nano .env
```
Contents of `.env`:
```env
DATABASE_URL="postgresql://loyacrm:your_strong_password@localhost:5432/loyacrm"
JWT_SECRET="your_super_secret_jwt_key_here"
PORT=4000
NODE_ENV=production
```

#### Frontend:
```bash
cd ../frontend
nano .env.local
```
Contents of `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://your-server-ip:4000
```

### 3. Dependencies Installation and Database Initialization

#### Database:
```bash
cd /var/www/loyacrm/db
pnpm install
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm run generate
```

#### Backend:
```bash
cd ../backend
pnpm install
pnpm run build
```

#### Frontend:
```bash
cd ../frontend
pnpm install
pnpm run build
```

## 🚀 Launch Services with PM2

### 1. Create PM2 Configuration
```bash
cd /var/www/loyacrm
nano ecosystem.config.js
```

Contents of `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'loyacrm-backend',
      cwd: './backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'loyacrm-frontend',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

### 2. Start Applications
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
⚠️ **Important:** Execute the command that `pm2 startup` outputs.

## 🌐 Configure Nginx as Reverse Proxy

> **🚀 Performance Optimized Configuration**
> This setup uses the optimized nginx configuration from **[NGINX_OPTIMIZATION.md](NGINX_OPTIMIZATION.md)** which includes:
> - Gzip compression (70-80% traffic reduction)
> - HTTP/2 support (30-50% speedup with SSL)
> - Aggressive caching (instant repeat visits)
> - Rate limiting (DDoS protection)
> - Security headers and optimized buffers

### 1. Create Optimized Site Configuration
```bash
sudo nano /etc/nginx/sites-available/loyacrm
```

**Configuration contents:**
```nginx
# Optimized Nginx Configuration for LoyaCare CRM
# Rate limiting zone (protect against DDoS)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

# Upstream definitions for better load balancing
upstream frontend {
    server localhost:3000;
    keepalive 64;
}

upstream backend {
    server localhost:4000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com your-server-ip;

    # Redirect HTTP to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Max upload size (adjust for your needs)
    client_max_body_size 10M;
    client_body_buffer_size 128k;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Buffer sizes
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/rss+xml
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;
    gzip_disable "msie6";

    # Frontend (Next.js) - with rate limiting
    location / {
        limit_req zone=general_limit burst=20 nodelay;
        
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API - with stricter rate limiting
    location /api/ {
        limit_req zone=api_limit burst=5 nodelay;
        
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (if needed)
        # add_header Access-Control-Allow-Origin "https://your-domain.com" always;
        # add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        # add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    }

    # Next.js static files - aggressive caching
    location /_next/static/ {
        proxy_pass http://frontend;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Next.js images - cache for 1 year
    location /_next/image {
        proxy_pass http://frontend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public static files - cache for 1 hour
    location /public/ {
        proxy_pass http://frontend;
        add_header Cache-Control "public, max-age=3600";
    }

    # Favicon and robots.txt - cache for 1 day
    location ~ ^/(favicon\.ico|robots\.txt)$ {
        proxy_pass http://frontend;
        add_header Cache-Control "public, max-age=86400";
        access_log off;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTPS configuration (uncomment and configure after SSL setup)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name your-domain.com www.your-domain.com;
#
#     # SSL certificates (managed by Certbot)
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
#     ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
#
#     # Modern SSL configuration
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
#     ssl_prefer_server_ciphers off;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 1d;
#     ssl_stapling on;
#     ssl_stapling_verify on;
#
#     # HSTS (uncomment after testing)
#     # add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
#
#     # Include all location blocks from HTTP server above
#     # ... (copy all location blocks here)
# }
```

### 2. Edit Configuration for Your Domain
```bash
sudo nano /etc/nginx/sites-available/loyacrm
```

**Required changes:**
- Replace `your-domain.com` with your actual domain
- Replace `your-server-ip` with your actual server IP
- Uncomment and configure SSL section after obtaining certificates
- Adjust rate limiting if needed (current: API 10 req/s, Frontend 30 req/s)

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/loyacrm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Test Optimizations

**Test gzip compression:**
```bash
curl -H "Accept-Encoding: gzip" -I http://your-domain.com
```
Should return: `Content-Encoding: gzip`

**Test caching:**
```bash
curl -I http://your-domain.com/_next/static/chunks/main.js
```
Should return: `Cache-Control: public, max-age=31536000, immutable`

### Performance Improvements Included:
- ✅ **Gzip compression** (70-80% traffic reduction)
- ✅ **HTTP/2 support** (30-50% speedup when SSL enabled)
- ✅ **Aggressive static caching** (1 year for immutable assets)
- ✅ **Rate limiting** (DDoS protection)
- ✅ **Connection keepalive** (fewer TCP handshakes)
- ✅ **Optimized buffers** (efficient memory usage)
- ✅ **Security headers** (XSS, frame, content protection)

## 🔒 SSL Setup (Optional but Recommended)

### 1. Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

**What Certbot does automatically:**
- ✅ Adds SSL certificates to nginx configuration
- ✅ Enables HTTP/2 support
- ✅ Sets up HTTP → HTTPS redirect
- ✅ Configures automatic certificate renewal
- ✅ Updates nginx configuration with modern SSL settings

### 3. After SSL Setup
After running Certbot, uncomment the HTTPS server block in `/etc/nginx/sites-available/loyacrm`:

```bash
sudo nano /etc/nginx/sites-available/loyacrm
```

Find and uncomment the entire HTTPS server block (lines starting with `# server {` for port 443).

### 4. Enable HSTS (After Testing)
After confirming SSL works correctly, uncomment the HSTS header in the HTTPS block:
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

### 5. Test SSL Configuration
```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Test HTTP/2 support
curl -I --http2 https://your-domain.com
```

**Expected improvements with SSL + HTTP/2:**
- Page load time: -30-50%
- Parallel resource loading
- Better security headers

## 🛡️ Firewall Setup

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 🔧 Management Scripts Creation

### 1. Application Update Script
```bash
sudo nano /usr/local/bin/loyacrm-update.sh
```

Contents:
```bash
#!/bin/bash
cd /var/www/loyacrm

echo "Updating repository..."
git pull origin main

echo "Updating database..."
cd db
pnpm run generate

echo "Building backend..."
cd ../backend
pnpm install --prod
pnpm run build

echo "Building frontend..."
cd ../frontend
pnpm install --prod
pnpm run build

echo "Restarting services..."
pm2 restart all

echo "Update completed!"
```

```bash
sudo chmod +x /usr/local/bin/loyacrm-update.sh
```

### 2. Monitoring Script
```bash
sudo nano /usr/local/bin/loyacrm-status.sh
```

Contents:
```bash
#!/bin/bash
echo "=== PM2 Status ==="
pm2 status

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager

echo "=== PostgreSQL Status ==="
sudo systemctl status postgresql --no-pager

echo "=== Disk Usage ==="
df -h /var/www/loyacrm
```

```bash
sudo chmod +x /usr/local/bin/loyacrm-status.sh
```

## 📊 Deployment Verification

### 1. Service Status Check
```bash
# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx

# PostgreSQL status
sudo systemctl status postgresql

# Port check
sudo netstat -tlnp | grep -E ':3000|:4000|:5432|:80'
```

### 2. Logs Check
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Availability Testing
```bash
# Backend API check
curl http://localhost:4000/api/health

# Frontend check
curl http://localhost:3000
```

## 🔄 Automatic Backup Setup

### 1. Create Backup Script
```bash
sudo nano /usr/local/bin/loyacrm-backup.sh
```

Contents:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/loyacrm"
DATE=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U loyacrm loyacrm > "$BACKUP_DIR/db_backup_$DATE.sql"

# Code backup (excluding node_modules)
tar --exclude='node_modules' --exclude='.git' -czf "$BACKUP_DIR/code_backup_$DATE.tar.gz" /var/www/loyacrm

# Remove old backups (older than 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/loyacrm-backup.sh
```

### 2. Setup Automatic Backup
```bash
# Add to crontab for daily backup
sudo crontab -e
```

Add line:
```
0 2 * * * /usr/local/bin/loyacrm-backup.sh
```

## 📝 Final Verification Commands

```bash
# Check all services
loyacrm-status.sh

# Check availability
echo "Open in browser: http://your-server-ip"
echo "API available at: http://your-server-ip/api"
```

## 🔧 Useful Management Commands

### PM2 Service Management
```bash
# Restart all services
pm2 restart all

# Stop services
pm2 stop all

# Start services
pm2 start all

# View logs
pm2 logs loyacrm-backend
pm2 logs loyacrm-frontend

# Real-time monitoring
pm2 monit
```

### System Management
```bash
# Update application
loyacrm-update.sh

# Check status
loyacrm-status.sh

# Backup
loyacrm-backup.sh

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Problem Diagnosis
```bash
# Check system logs
sudo journalctl -u nginx
sudo journalctl -u postgresql

# Check resource usage
htop
df -h
free -h

# Check network connections
sudo netstat -tlnp
sudo ss -tlnp
```

## 🚨 Troubleshooting

### Database Issues
```bash
# Check PostgreSQL connection
sudo -u postgres psql -c "\l"

# Check users
sudo -u postgres psql -c "\du"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Node.js Application Issues
```bash
# Detailed PM2 logs
pm2 logs --lines 50

# Restart specific application
pm2 restart loyacrm-backend
pm2 restart loyacrm-frontend

# Full PM2 reload
pm2 kill
pm2 start ecosystem.config.js
```

### Nginx Issues
```bash
# Check configuration
sudo nginx -t

# Reload configuration
sudo nginx -s reload

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

## 📋 Deployment Checklist

- [ ] Ubuntu system updated
- [ ] PostgreSQL installed and configured
- [ ] Database and user created
- [ ] Node.js 24+ installed
- [ ] pnpm installed
- [ ] PM2 installed
- [ ] Nginx installed and configured
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] pnpm dependencies installed
- [ ] Database migrations executed
- [ ] Production builds created
- [ ] PM2 ecosystem configured
- [ ] PM2 services started
- [ ] Nginx proxy configured
- [ ] SSL configured (optional)
- [ ] Firewall configured
- [ ] Management scripts created
- [ ] Backup configured
- [ ] Functionality verified
- [ ] Availability tested

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs`
2. Check service status: `loyacrm-status.sh`
3. Check Nginx configuration: `sudo nginx -t`
4. Contact developer: sergeydaub@gmail.com

---

## 🚀 GitHub Actions CI/CD Setup

### Overview
This guide covers automated deployment using GitHub Actions for continuous integration and deployment (CI/CD).

### Prerequisites
- GitHub repository access
- Server with SSH access
- Repository secrets configured

### Required GitHub Secrets
In your repository settings (`Settings` → `Secrets and variables` → `Actions`), add these secrets:

#### SSH Access:
- `SERVER_HOST` - Server IP address or domain
- `SERVER_USER` - Server username (usually `root` or your username)
- `SERVER_SSH_KEY` - Private SSH key for server access

#### Environment Variables:
- `DATABASE_URL` - Production database connection URL
- `JWT_SECRET` - JWT secret key
- `NEXT_PUBLIC_BACKEND_API_URL` - Backend API URL for production

### Server Preparation

#### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 24+
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo pnpm add -g pm2

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

#### 2. Setup PostgreSQL
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
CREATE DATABASE loyacrm;
CREATE USER loyacrm_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE loyacrm TO loyacrm_user;
\q
```

#### 3. Clone Repository
```bash
sudo mkdir -p /var/www
cd /var/www
git clone https://github.com/your-username/LoyaCareCRM.git loyacrm
cd loyacrm
```

#### 4. Configure Environment Variables
Create `.env` files on the server:

**`/var/www/loyacrm/backend/.env`:**
```bash
PORT=4000
DATABASE_URL="postgresql://loyacrm_user:your_secure_password@localhost:5432/loyacrm"
JWT_SECRET="your_jwt_secret_here"
USE_MOCK=false
```

**`/var/www/loyacrm/frontend/.env`:**
```bash
NEXT_PUBLIC_BACKEND_API_URL="https://your-domain.com/api"
```

### GitHub Actions Workflow

The workflow file `.github/workflows/deploy-production.yml` is already configured and will:

1. **Code Validation** - Run linting and type checking
2. **Application Build** - Build frontend and backend
3. **Database Migration** - Apply database migrations
4. **PM2 Configuration** - Generate `ecosystem.config.js` automatically
5. **Service Restart** - Stop old processes and start new ones
6. **Health Check** - Verify application availability

### Important Notes

⚠️ **Security Warning:** The `ecosystem.config.js` file is **NOT** stored in the repository. It is generated automatically on the server during deployment and contains server-specific configurations (paths, ports, logs).

#### File Structure After Deployment:
```
/var/www/loyacrm/
├── frontend/          # Built Next.js application
├── backend/           # Built Node.js application
├── db/               # Prisma client and migrations
├── ecosystem.config.js  # ← Generated automatically!
├── .env files       # Configured manually
└── package.json     # Root dependencies
```

### Manual Deployment Trigger

You can trigger deployment manually:
1. Go to GitHub repository
2. Click `Actions` tab
3. Select `Deploy to Server` workflow
4. Click `Run workflow`

### Automated Deployment via Script

The project includes a convenient deployment script that automates version bumping and tag creation:

```bash
# Standard staging deployment
./deploy.sh -m "fix critical auth bug"

# Create release tag (triggers production deployment)
./deploy.sh -t -m "new features release"

# Or from frontend directory
cd frontend
pnpm run deploy -- -t -m "add new customer dashboard feature"
```

**What the script does:**

**For Regular Commits (Staging):**
1. ✅ Commits unstaged changes with provided message
2. ✅ Syncs with remote (`git pull --rebase`)
3. ✅ Includes list of all unpushed commits in message
4. ✅ If multiple unpushed commits exist: creates summary commit with `chore(staging): v{VERSION}`
5. ✅ Pushes to main → triggers staging deployment

**For Releases (Production with `-t` flag):**
1. ✅ Reads current version from `frontend/package.json` and git tags
2. ✅ Auto-increments patch version (e.g., `0.1.33` → `0.1.34`)
3. ✅ Creates commit with `chore(release): v{VERSION}` message
4. ✅ Includes list of all unpushed commits in commit message
5. ✅ Pushes commit to main
6. ✅ Creates and pushes annotated release tag: `v0.1.34`
7. ✅ GitHub Actions automatically deploys to production and updates package.json

**Command Options:**
- `-m "message"` - **Required**: Custom description for commit/release
- `-t` - Create and push release tag (triggers production deployment)
- `-v VERSION` - Specify exact version (e.g., `-v 1.5.0`), otherwise auto-increments

**Commit Message Formats:**

*Regular staging commit:*
```
fix: critical auth bug

* feat: add new dashboard
* perf: optimize queries
```

*Multiple unpushed commits (auto-generated staging deploy):*
```
chore(staging): v0.1.33 - deploying multiple changes

* feat: add new dashboard
* perf: optimize queries  
* fix: critical auth bug
```

*Release commit:*
```
chore(release): v0.1.34 - new features release

* feat: add customer dashboard
* perf: improve database performance
* fix: authentication bug
```

**Examples:**
```bash
# Standard staging push
./deploy.sh -m "fix: authentication bug"
# → Pushes to staging with version 0.1.33+sha.abc123

# Production release
./deploy.sh -t -m "performance improvements and bug fixes"
# → Creates tag v0.1.34, deploys to production

# Release with specific version
./deploy.sh -v 1.5.0 -m "major release"
# → Creates tag v1.5.0, deploys to production
```

### Monitoring and Logs

#### Check Deployment Status:
```bash
# On server
cd /var/www/loyacrm
pm2 status
pm2 logs
```

#### View Application Logs:
```bash
pm2 logs loyacrm-frontend
pm2 logs loyacrm-backend
```

### Troubleshooting

#### If Deployment Fails:
1. Check GitHub Actions logs for errors
2. Verify SSH connection: `ssh -T user@server`
3. Check server resources: `df -h` and `free -h`
4. Verify environment variables are set correctly

#### Common Issues:
- **SSH Connection Failed**: Check `SERVER_SSH_KEY` format (should be private key)
- **Build Failed**: Check Node.js version and dependencies
- **Migration Failed**: Verify database connection and permissions
- **Services Not Starting**: Check PM2 logs and port availability

### Security Best Practices

1. **SSH Keys**: Use separate SSH keys for each server
2. **Environment Variables**: Never commit real values to repository
3. **Database**: Use strong passwords and limit access
4. **Firewall**: Configure UFW or iptables properly
5. **SSL**: Enable HTTPS with Let's Encrypt

### Useful Commands

```bash
# Check all services
pm2 status

# View real-time logs
pm2 logs --lines 50

# Restart services
pm2 restart all

# Check system resources
htop
df -h
free -h

# Backup database
pg_dump loyacrm > backup_$(date +%Y%m%d).sql
```

This setup provides a complete CI/CD pipeline for automated deployment of your LoyaCareCRM application! 🎉

---

**Author:** Sergey Daub (sergeydaub@gmail.com)
**Version:** 2.0
**Date:** 25 November 2025
