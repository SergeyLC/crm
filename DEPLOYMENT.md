# 🚀 LoyaCareCRM Deployment Guide

*Complete deployment instructions for CRM system*

*[🇸 English | [🇩🇪 Deutsch](DEPLOYMENT.de.md)*

## 📋 Deployment Options

LoyaCareCRM supports multiple deployment methods:

### 🐳 **Docker Deployment (Recommended)**
- **Development**: Local development with hot reload
- **Stage**: Pre-production testing environment
- **Production**: Containerized production deployment
- **CI/CD**: Automated deployment via GitHub Actions

### 🖥️ **Traditional Server Deployment**
- Manual Ubuntu server setup with PM2, Nginx, PostgreSQL
- Suitable for custom server configurations

---

## 🐳 Docker Deployment

### Prerequisites

#### System Requirements
- **Docker**: Version 24.0+
- **Docker Compose**: Version 2.0+
- **Git**: Latest version
- **4GB RAM minimum** (8GB recommended)
- **2GB free disk space**

#### Installation
```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 🚀 Quick Start with Docker

#### 1. Clone Repository
```bash
git clone <your-repository-url> loyacrm
cd loyacrm
```

#### 2. Development Environment Setup
```bash
# Copy development environment file
cp .env.dev.example .env.dev

# Start development environment
docker-compose -f docker-compose.dev.yml up --build -d

# Check container status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

#### 3. Stage Environment Setup
```bash
# Copy stage environment files
cp .env.backend.stage.example .env.backend.stage
cp .env.frontend.stage.example .env.frontend.stage

# Edit environment variables for stage
nano .env.backend.stage  # Configure database and secrets
nano .env.frontend.stage # Configure API URLs

# Start stage environment
./docker-stage-start.sh

# Check status
docker-compose -f docker-compose.stage.yml ps

# View logs
./docker-stage-logs.sh
```

#### 4. Production Environment Setup
```bash
# Copy production environment files
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend

# Edit environment variables
nano .env.backend  # Configure database and secrets
nano .env.frontend # Configure API URLs

# Start production environment
docker-compose up --build -d

# Check status
docker-compose ps
```

### 🌐 Access URLs

| Environment | Frontend | Backend API | Database |
|-------------|----------|-------------|----------|
| **Development** | http://localhost:3003 | http://localhost:4003/api | localhost:5435 |
| **Stage** | http://localhost:3004 | http://localhost:4004/api | localhost:5436 |
| **Production** | http://localhost:3002 | http://localhost:4002/api | External PostgreSQL |

### 🔧 Docker Management Commands

#### Development Environment
```bash
# Start development containers
docker-compose -f docker-compose.dev.yml up -d

# Stop development containers
docker-compose -f docker-compose.dev.yml down

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up --build --force-recreate

# View logs
docker-compose -f docker-compose.dev.yml logs -f [service-name]

# Access container shell
docker-compose -f docker-compose.dev.yml exec [service-name] sh
```

#### Stage Environment
```bash
# Start stage containers
./docker-stage-start.sh

# Stop stage containers
./docker-stage-stop.sh

# View logs
./docker-stage-logs.sh [service-name]

# Access container shell
docker-compose -f docker-compose.stage.yml exec [service-name] sh
```

#### Production Environment
```bash
# Start production containers
docker-compose up -d

# Stop production containers
docker-compose down

# Update and restart
docker-compose pull && docker-compose up -d

# View logs
docker-compose logs -f [service-name]
```

### 📊 Monitoring and Troubleshooting

#### Check Container Health
```bash
# List all containers
docker ps -a

# Check container logs
docker logs loyacrm-backend-dev
docker logs loyacrm-frontend-dev

# Check resource usage
docker stats

# Inspect container
docker inspect loyacrm-postgres-dev
```

#### Database Operations
```bash
# Access PostgreSQL in development
docker-compose -f docker-compose.dev.yml exec postgres psql -U loyacrm -d loyacrm

# Access PostgreSQL in stage
docker-compose -f docker-compose.stage.yml exec postgres psql -U loyacrm -d loyacrm

# Run database migrations in development
docker-compose -f docker-compose.dev.yml exec backend sh -c "cd backend && pnpm prisma migrate deploy"

# Run database migrations in stage
docker-compose -f docker-compose.stage.yml exec backend sh -c "cd db && pnpm run migrate:deploy"

# Reset development database
docker-compose -f docker-compose.dev.yml down -v  # Removes volumes
docker-compose -f docker-compose.dev.yml up -d   # Recreates with fresh data

# Reset stage database
./docker-stage-stop.sh
docker volume rm loyacarecrm_postgres_stage_data 2>/dev/null || true
./docker-stage-start.sh
```

#### Common Issues

**Port conflicts:**
```bash
# Check what's using ports
sudo lsof -i :3003
sudo lsof -i :4003
sudo lsof -i :5435

# Change ports in docker-compose files if needed
```

**Permission issues:**
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

**Build failures:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### 🔄 Updates and Maintenance

#### Update Application
```bash
# Pull latest changes
git pull origin main

# Update development environment
docker-compose -f docker-compose.dev.yml up --build -d

# Update production environment
docker-compose down
docker-compose pull
docker-compose up -d
```

#### Backup Database (Development)
```bash
# Create backup
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U loyacrm loyacrm > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U loyacrm loyacrm < backup_20241201.sql
```

### 🔒 Security Considerations

#### Environment Variables
- Never commit `.env` files to repository
- Use strong passwords for database
- Rotate JWT secrets regularly
- Use different secrets for dev/prod environments

#### Production Security
```bash
# Run security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock clair-scanner [image-name]

# Update base images regularly
docker-compose build --pull

# Use secrets management
# Consider using Docker secrets or external secret managers
```

### 📋 Docker Deployment Checklist

**Development Setup:**
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `.env.dev` configured
- [ ] Development containers running
- [ ] Frontend accessible at http://localhost:3003
- [ ] Backend API responding at http://localhost:4003/api
- [ ] Database accessible at localhost:5435
- [ ] Hot reload working for code changes

**Stage Setup:**
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `.env.backend.stage` and `.env.frontend.stage` configured
- [ ] Stage containers running
- [ ] Frontend accessible at http://localhost:3004
- [ ] Backend API responding at http://localhost:4004/api
- [ ] Database accessible at localhost:5436
- [ ] Database migrations applied

**Production Setup:**
- [ ] Production environment files configured
- [ ] External PostgreSQL database ready
- [ ] Domain/DNS configured
- [ ] SSL certificates obtained
- [ ] Production containers deployed
- [ ] Application accessible via domain
- [ ] Monitoring and logging configured

---

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

### 1. Create Site Configuration
```bash
sudo nano /etc/nginx/sites-available/loyacrm
```

Configuration contents:
```nginx
server {
    listen 80;
    server_name your-domain.com your-server-ip;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static files
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/loyacrm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL Setup (Optional but Recommended)

### 1. Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

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
