# 🚀 CRM Docker Deployment Guide

*Production deployment with Docker: containerized application with zero source code on servers*

*[🇸 English | [🇩🇪 Deutsch](DEPLOYMENT.de.md)*

## 📋 Overview

This document describes production deployment of CRM using Docker. This ultra-optimized architecture eliminates source code from production servers and uses Docker secrets for secure credential management.

### Production Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Backend       │    │   Frontend      │    │   Nginx Proxy   │
│   (Container)   │    │   (Pre-built)   │    │   (Pre-built)    │    │   (Container)   │
│   Port: 5432    │◄──►│   Port: 4000    │◄──►│   Port: 3000    │◄──►│   Port: 80/443  │
│   Secrets       │    │   Secrets       │    │                 │    │   SSL/TLS       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                      ▲
                                      │
                               ┌─────────────────┐
                               │   Migrator      │
                               │   (On-demand)   │
                               │   Tool Service  │
                               └─────────────────┘
```

### Key Security & Architecture Improvements

- **🔒 Zero Source Code:** No application source code on production servers
- **🔐 Docker Secrets:** Secure credential management for database passwords and JWT secrets
- **🏗️ Pre-built Images:** Applications deployed as pre-built container images from GitHub Container Registry
- **🛠️ On-demand Tools:** Migration service runs only when needed using Docker Compose profiles
- **📁 Clean Structure:** Organized configuration with environment-specific overrides
- **🔄 Environment Overrides:** Separate compose files for staging/production environments

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

### 2.1 New Architecture File Structure

The new ultra-optimized architecture uses a clean separation of configuration and application code:

```
docker-example/                    # Production deployment configuration
├── docker-compose.yml            # Main production services
├── docker-compose.staging.yml    # Staging environment overrides
├── .env.production               # Production environment variables
├── .env.staging                  # Staging environment variables
├── nginx/
│   └── conf.d/
│       └── crm.conf          # Nginx configuration with SSL
├── secrets/                      # Docker secrets (not in git)
│   ├── db_password.txt           # Database password
│   └── jwt_secret.txt            # JWT secret key
├── backups/                      # Database backup storage
└── README.md                     # Deployment instructions

docker/                           # Build configurations (for CI/CD)
├── backend/
│   └── Dockerfile                # Multi-stage backend build
└── frontend/
    └── Dockerfile                # Multi-stage frontend build
```

### 2.2 Environment Variables Setup

#### Environment Files Overview:

| File | Environment | Purpose | Secrets |
|------|-------------|---------|---------|
| **`.env.production`** | Production | App config, domain, ports | No (secrets in Docker secrets) |
| **`.env.staging`** | Staging | App config, domain, ports | No (secrets in Docker secrets) |
| **`secrets/db_password.txt`** | All | Database password | Yes (Docker secret) |
| **`secrets/jwt_secret.txt`** | All | JWT signing secret | Yes (Docker secret) |

#### Setup Production Environment:

```bash
# Copy the example configuration
cp -r docker-example /var/www/crm-production

# Navigate to deployment directory
cd /var/www/crm-production

# Create secrets (replace with actual values)
echo "your-secure-db-password" > secrets/db_password.txt
openssl rand -base64 32 > secrets/jwt_secret.txt

# Configure environment
nano .env.production  # Update domain and settings
```

#### Docker Secrets Security:

- **🔒 Secure Storage:** Secrets stored in files outside of containers
- **🚫 No Environment Variables:** Sensitive data not exposed as env vars
- **🔐 Encrypted:** Secrets encrypted at rest and in transit
- **👁️ No Logs:** Secrets never appear in container logs

## 🗄️ Step 3: Database Preparation

### 3.1 Understanding Persistent Storage

**Important:** PostgreSQL data is stored in a Docker named volume `crm_prod_pg_data`. This volume persists data between container restarts, deployments, and even container recreation. The volume is automatically created by Docker Compose and survives `docker compose down` commands.

**Volume location:** Docker manages the volume storage location automatically. To inspect:
```bash
# List volumes
docker volume ls

# Inspect volume details
docker volume inspect crm_prod_pg_data

# Check volume usage
docker system df -v
```

**⚠️ Data Safety:** Never delete the volume manually unless you want to lose all database data. Use `docker compose down -v` only if you intentionally want to reset the database.

### 3.2 Run migrations for Docker database

```bash
cd /var/www/crm

# Start only database service first
docker compose up -d postgres

# Wait for database to be ready
sleep 30

# Run migrations through container
docker compose exec backend sh -c "cd db && pnpm run migrate:deploy && pnpm run generate"

# Or run migrations from host (if database is accessible)
# cd db
# export DATABASE_URL="postgresql://crm:your_password@localhost:5432/crm"
# pnpm run migrate:deploy
# pnpm run generate
```

### 3.2 Data copying (optional)

If you need to copy data from current database:

```bash
# Create dump of current database
pg_dump -h localhost -U crm crm > current_db_backup.sql

# Restore to Docker database
docker compose exec -T postgres psql -U crm crm < current_db_backup.sql
```

## 🚀 Step 4: Start Docker Services

### 4.1 Production Deployment

```bash
cd /var/www/crm-production

# For production environment
docker compose --env-file .env.production up -d

# For staging environment
docker compose --env-file .env.staging -f docker-compose.yml -f docker-compose.staging.yml up -d

# Check status
docker compose ps
```

### 4.2 Database Migration (First Time Only)

Run database migrations using the migrator service:

```bash
# Run migrations (migrator service runs and exits)
docker compose --profile migrator run --rm migrator

# Verify migration success
docker compose logs migrator
```

### 4.3 Application Updates

To update the application with new images:

```bash
# Update image tag in .env.production
echo "TAG=v1.2.3" >> .env.production

# Run migrations if schema changed
docker compose --profile migrator run --rm migrator

# Restart services with new images
docker compose --env-file .env.production up -d

# Clean up old images
docker image prune -f
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
docker compose exec postgres pg_isready -U crm
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

### 7.1 Service Management

```bash
cd /var/www/crm-production

# View all services status
docker compose ps

# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Restart specific service
docker compose restart backend

# Scale services (if needed)
docker compose up -d --scale backend=2
```

### 7.2 Database Management

```bash
# Run migrations manually
docker compose --profile migrator run --rm migrator

# Backup database
docker compose exec db pg_dump -U crm crm > backups/backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T db psql -U crm crm < backups/backup.sql

# Check database connectivity
docker compose exec db pg_isready -U crm
```

### 7.3 Health Checks

```bash
# Application health through nginx
curl -f https://your-domain.com/health

# API health check
curl -f https://your-domain.com/api/health

# Individual service health
docker compose exec backend curl -f http://localhost:4000/health
docker compose exec frontend curl -f http://localhost:3000/api/health
```

### 7.4 Resource Monitoring

```bash
# Container resource usage
docker stats

# System resource usage
docker system df

# Volume usage
docker system df -v
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

Change `/etc/nginx/sites-available/crm`:

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
docker exec -it crm-backend-docker sh

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
docker compose exec postgres pg_dump -U crm crm > backup_$(date +%Y%m%d).sql

# Volume backup (if needed)
docker run --rm -v crm_prod_pg_data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz -C /data .
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

- **🔒 Zero Source Code:** No application source code stored on production servers
- **🔐 Docker Secrets:** Secure credential management with encrypted secrets
- **🏗️ Pre-built Images:** Applications deployed as immutable container images
- **🛠️ On-demand Tools:** Migration service runs only when needed
- **📁 Clean Architecture:** Organized configuration with environment separation
- **🔄 Easy Updates:** Simple image tag updates for deployments
- **🛡️ Enhanced Security:** Secrets not exposed in environment variables or logs
- **📊 Better Monitoring:** Health checks and structured logging
- **🔧 Simplified Maintenance:** No build dependencies on production servers
- **⚡ Fast Deployments:** Only container downloads, no compilation

## 📋 Deployment Checklist

- [ ] Docker and Docker Compose installed on server
- [ ] `docker-example` directory copied to production server
- [ ] Domain configured in `.env.production` and nginx config
- [ ] SSL certificates configured (replace snakeoil certs)
- [ ] Docker secrets created (`secrets/db_password.txt`, `secrets/jwt_secret.txt`)
- [ ] Database password and JWT secret generated securely
- [ ] Environment variables configured in `.env.production`
- [ ] Docker services started successfully (`docker compose ps`)
- [ ] Database migrations executed (`docker compose --profile migrator run --rm migrator`)
- [ ] Application accessible at `https://your-domain.com`
- [ ] API endpoints responding at `https://your-domain.com/api`
- [ ] SSL certificate valid and HTTPS working
- [ ] All containers healthy and logging properly
- [ ] Backup strategy configured for database and volumes

---

**Author:** Sergey Daub
**Date:** 26 November 2025
**Version:** 4.0 - Ultra-optimized architecture with zero source code and Docker secrets