# 🚀 LoyaCareCRM Docker Deployment Guide

*Production deployment with Docker: containerized application*

*[🇸 English | [🇩🇪 Deutsch](DEPLOYMENT.de.md)*

## 📋 Overview

This document describes production deployment of LoyaCareCRM using Docker. Docker provides isolation, scalability, and consistency of the production environment.

### Production Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Backend       │    │   Frontend      │    │   Nginx Proxy   │
│   (Container)   │    │   (Docker)      │    │   (Docker)      │    │   (Docker)      │
│   Port: 5432    │◄──►│   Port: 4003    │◄──►│   Port: 3003    │◄──►│   Port: 80      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Ports for Production Environment

- **PostgreSQL:** 5432 (internal container port, not exposed externally)
- **Backend:** 4003 (internal container port)
- **Frontend:** 3003 (internal container port)
- **Nginx Proxy:** 80 (exposed to host)

### Production Setup Features

- **Containerized PostgreSQL:** Database runs in Docker container with persistent volume
- **Docker Network:** All services communicate through internal Docker network
- **Nginx Reverse Proxy:** Containerized proxy for routing
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

# Docker Compose V2 is included with Docker 20.10+
# No separate installation needed - use 'docker compose' (not 'docker-compose')

# Reboot or apply group changes
newgrp docker

# Verify installation
docker --version
docker compose version
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

Fill `.env.backend` with real values:

```bash
# Database
DATABASE_URL=postgresql://loyacrm:your_actual_strong_password@postgres:5432/loyacrm
JWT_SECRET=your_actual_jwt_secret_key_here
PORT=4003
NODE_ENV=production
```

Fill `.env.frontend` with real values:

```bash
NEXT_PUBLIC_API_URL=http://backend:4003
NEXT_PUBLIC_APP_VERSION=docker
```

⚠️ **Important:** The `.env.docker` file contains sensitive data and should NOT be committed to git. It is already added to `.gitignore`.

**Note:** In CI/CD processes (GitHub Actions), secrets are automatically substituted from GitHub Secrets repository, ensuring secure storage of confidential data.

## 🗄️ Step 3: Database Preparation

### 3.1 Run migrations for Docker database

```bash
cd /var/www/loyacrm

# Start only database service first
docker compose up -d postgres

# Wait for database to be ready
sleep 30

# Run migrations through container
docker compose exec backend sh -c "cd db && pnpm run migrate:deploy && pnpm run generate"

# Or run migrations from host (if database is accessible)
# cd db
# export DATABASE_URL="postgresql://loyacrm:your_password@localhost:5432/loyacrm"
# pnpm run migrate:deploy
# pnpm run generate
```

### 3.2 Data copying (optional)

If you need to copy data from current database:

```bash
# Create dump of current database
pg_dump -h localhost -U loyacrm loyacrm > current_db_backup.sql

# Restore to Docker database
docker compose exec -T postgres psql -U loyacrm loyacrm < current_db_backup.sql
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
# Check through Nginx proxy
curl http://localhost/api/health

# Or check services directly through Docker
docker compose exec backend curl -f http://localhost:4003/api/health
docker compose exec frontend curl -f http://localhost:3003

# Check database connectivity
docker compose exec postgres pg_isready -U loyacrm
```

### 5.2 Functional testing

Open in browser: `http://your-server-ip`

Make sure that:
- ✅ Application loads through Nginx proxy
- ✅ API requests work
- ✅ Database is accessible from backend
- ✅ All containers are healthy

## 🌐 Step 6: Nginx Setup for Docker

### 6.1 Nginx configuration

Nginx is already configured in the Docker Compose setup and runs in a container. The configuration is in `nginx.prod.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:4003;
    }

    upstream frontend {
        server frontend:3003;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend (Next.js)
        location / {
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

        # Backend API
        location /api/ {
            proxy_pass http://backend/api/;
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
            proxy_pass http://frontend;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }
}
```

### 6.2 Access the application

Docker version is available at: `http://your-server-ip`

The Nginx container exposes port 80 to the host, so no additional host nginx configuration is needed.

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

# Health check through nginx
curl http://localhost/api/health

# Or check services directly
docker compose exec backend curl -f http://localhost:4003/api/health
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
# Database backup from container
docker compose exec postgres pg_dump -U loyacrm loyacrm > backup_$(date +%Y%m%d).sql

# Volume backup (if needed)
docker run --rm -v loyacrm_prod_pg_data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz -C /data .
```

## 🚨 Troubleshooting

### Containers don't start
```bash
docker compose logs
docker compose config
```

### Database unavailable
```bash
# Check PostgreSQL container status
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Test database connectivity from backend
docker compose exec backend sh -c "cd db && pnpm run migrate:deploy"
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
- [ ] Environment variables configured in `.env.backend` and `.env.frontend`
- [ ] Docker services built and started
- [ ] Application accessible at `http://your-server-ip`
- [ ] API accessible at `http://your-server-ip/api`
- [ ] Database migrations executed
- [ ] All containers healthy (`docker compose ps`)
- [ ] Functional testing passed

## 🎯 Docker Deployment Advantages

- **Isolation:** Each component in separate container
- **Scalability:** Easy to scale services
- **Reproducibility:** Consistent environment across all servers
- **Management:** Simplified dependency management
- **Rollback:** Fast rollback to previous version
- **Production Ready:** Containerized nginx proxy, persistent database storage, SSL support

---

**Author:** Sergey Daub
**Date:** 26 November 2025
**Version:** 3.2 - Corrected PostgreSQL configuration (containerized, not external)