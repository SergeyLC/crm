# 🚀 LoyaCareCRM Docker Deployment Guide

*Production deployment with Docker: containerized application*

*[🇸 English | [🇩🇪 Deutsch](DEPLOYMENT.de.md)*

## 📋 Overview

This document describes production deployment of LoyaCareCRM using Docker. Docker provides isolation, scalability, and consistency of the production environment.

### Production Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Backend       │    │   Frontend      │    │   Nginx Proxy   │
│   (External)    │    │   (Docker)      │    │   (Docker)      │    │   (Host)        │
│   Port: 5434    │◄──►│   Port: 4002    │◄──►│   Port: 3002    │◄──►│   Port: 82      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Ports for Production Environment

- **PostgreSQL:** 5434 (external database)
- **Backend:** 4002 (internal container port)
- **Frontend:** 3002 (internal container port)
- **Nginx Proxy:** 82 (host reverse proxy)

### Production Setup Features

- **External PostgreSQL:** Uses external database for persistence
- **Nginx Reverse Proxy:** Host-based proxy for routing
- **SSL Termination:** HTTPS at nginx level
- **Environment Variables:** Production secrets through .env files
- **CI/CD Integration:** Automatic deployment through GitHub Actions

## 🛠️ Step 1: Install Docker

### On Ubuntu server execute:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reboot or apply group changes
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

## 📁 Step 2: Prepare Docker Configuration

### 2.1 File Structure

All necessary files are already created in the repository:

```
docker/
├── backend/
│   └── Dockerfile          # Configuration for backend
├── frontend/
│   └── Dockerfile          # Configuration for frontend
docker-compose.yml           # Service orchestration
.env.docker                  # Environment variables for Docker
DOCKER_QUICK_START.md        # Quick start
```

### 2.2 Environment Variables Setup

#### Difference between .env files:

| File | Mode | Purpose | Creation |
|------|-------|---------|----------|
| **`.env.dev`** | Local development | Fixed dev values for `./docker-dev-start.sh` | From `.env.docker.example` |
| **`.env.docker`** | Production Docker | Real secrets for production deployment | Dynamically in CI/CD from GitHub Secrets |

**Local development** uses `.env.dev` (loaded through `env_file: - .env.dev` in `docker-compose.dev.yml`).

**Production** uses `.env.docker` (created automatically in GitHub Actions from repository secrets or manually on server).

#### Setup for production:

**Option 1: Manual setup on server**

Copy template and configure environment variables:

```bash
cd /var/www/loyacrm
cp .env.docker.example .env.docker
nano .env.docker
```

**Option 2: Automatic setup through CI/CD**

The `.env.docker` file is created automatically in GitHub Actions from repository secrets (GitHub Secrets) during deployment.

Fill `.env.docker` with real values:

```bash
# Database
POSTGRES_DB=loyacrm
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=your_actual_strong_password

# Backend
DATABASE_URL=postgresql://loyacrm:your_actual_strong_password@postgres:5432/loyacrm
JWT_SECRET=your_actual_jwt_secret_key_here
PORT=4002
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4002
NEXT_PUBLIC_APP_VERSION=docker
```

⚠️ **Important:** The `.env.docker` file contains sensitive data and should NOT be committed to git. It is already added to `.gitignore`.

**Note:** In CI/CD processes (GitHub Actions), secrets are automatically substituted from GitHub Secrets repository, ensuring secure storage of confidential data.

## 🗄️ Step 3: Database Preparation

### 3.1 Run migrations for Docker database

```bash
cd /var/www/loyacrm

# Set environment variables for Docker database
export DATABASE_URL="postgresql://loyacrm:your_strong_password@localhost:5434/loyacrm"

# Run migrations
cd db
pnpm run migrate:deploy
pnpm run generate
```

### 3.2 Data copying (optional)

If you need to copy data from current database:

```bash
# Create dump of current database
pg_dump -h localhost -U loyacrm loyacrm > current_db_backup.sql

# Start Docker database (temporarily)
docker compose up -d postgres

# Wait 30 seconds, then restore
docker exec -i loyacrm-postgres-docker psql -U loyacrm loyacrm < current_db_backup.sql

# Stop Docker database
docker compose down
```

## 🚀 Step 4: Start Docker Services

### 4.1 Production start

```bash
cd /var/www/loyacrm

# Build images
docker compose build

# Start services
docker compose up -d

# Check status
docker compose ps
```

### 4.2 Check logs

```bash
# Logs of all services
docker compose logs -f

# Logs of specific service
docker compose logs -f backend
docker compose logs -f frontend
```

```bash
# Logs of all services
docker compose logs -f

# Logs of specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

## ✅ Step 5: Testing

### 5.1 Availability check

```bash
# Backend API
curl http://localhost:4002/api/health

# Frontend
curl http://localhost:3002

# Database (external)
psql -h localhost -p 5434 -U loyacrm loyacrm -c "SELECT version();"
```

### 5.2 Functional testing

Open in browser: `http://your-server-ip:82`

Make sure that:
- ✅ Application loads
- ✅ API requests work
- ✅ Database is accessible
- ✅ Nginx proxy works correctly

## 🌐 Step 6: Nginx Setup for Docker

### 6.1 Create configuration

Create `/etc/nginx/sites-available/loyacrm-docker`:

```nginx
server {
    listen 82;
    server_name your-domain.com your-server-ip;

    # Docker Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Docker Backend API
    location /api/ {
        proxy_pass http://localhost:4002/api/;
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
        proxy_pass http://localhost:3002;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 6.2 Activate configuration

```bash
sudo ln -s /etc/nginx/sites-available/loyacrm-docker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Now Docker version is available at: `http://your-server-ip:82`

## 📊 Step 7: Monitoring and Management

### 7.1 Use ready scripts

```bash
# Start Docker services
./docker-start.sh

# Stop
./docker-stop.sh

# View logs
./docker-logs.sh

# Update (git pull + rebuild)
./docker-update.sh
```

### 7.2 Status monitoring

```bash
# Container status
docker compose ps

# Resource usage
docker stats

# Health check
curl http://localhost:4003/api/health
curl http://localhost:3003
```

## 🔄 Step 8: Full Transition to Docker

**⚠️ Execute only after thorough testing!**

### 8.1 Stop current services

```bash
# Stop PM2 services
pm2 stop all

# Stop PostgreSQL
sudo systemctl stop postgresql
```

### 8.2 Switch Nginx

Change `/etc/nginx/sites-available/loyacrm`:

```nginx
# Change ports in proxy_pass
proxy_pass http://localhost:3001;  # instead of 3000
proxy_pass http://localhost:4001/api/;  # instead of 4000
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 8.3 Update environment variables

Update `.env` files to use Docker ports.

## 🔧 Docker Deployment Management

### Useful Commands

```bash
# View logs
docker compose logs -f

# Restart service
docker compose restart backend

# Enter container
docker exec -it loyacrm-backend-docker sh

# Cleanup
docker system prune -a
docker volume prune

# Monitoring
docker stats
docker compose ps
```

### Backup

```bash
# Database backup
docker exec loyacrm-postgres-docker pg_dump -U loyacrm loyacrm > backup_$(date +%Y%m%d).sql

# Volume backup
docker run --rm -v loyacrm_postgres_data:/data -v /backup:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
```

## 🚨 Troubleshooting

### Containers don't start
```bash
docker compose logs
docker compose config
```

### Database unavailable
```bash
# Check external PostgreSQL
psql -h localhost -p 5434 -U loyacrm loyacrm -c "SELECT version();"
```

### Application doesn't respond
```bash
docker compose logs backend
docker compose logs frontend
```

### Port conflicts

**Port already in use:**
```bash
# Find process using port
lsof -i :3002
lsof -i :4002

# Stop conflicting service or change ports
```

## 📋 Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] External PostgreSQL configured on port 5434
- [ ] Environment variables configured in `.env.backend` and `.env.frontend`
- [ ] Docker services built and started
- [ ] Application accessible on ports 3002/4002
- [ ] Nginx configured for port 82
- [ ] Functional testing passed
- [ ] **After testing:** Transition to Docker completed

## 🎯 Docker Deployment Advantages

- **Isolation:** Each component in separate container
- **Scalability:** Easy to scale services
- **Reproducibility:** Consistent environment across all servers
- **Management:** Simplified dependency management
- **Rollback:** Fast rollback to previous version
- **Production Ready:** Nginx proxy, external database, SSL support

---

**Author:** Sergey Daub
**Date:** 26 November 2025
**Version:** 3.0 - Production deployment guide (separated from development)