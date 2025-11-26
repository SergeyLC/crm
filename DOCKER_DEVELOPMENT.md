# 🚀 LoyaCareCRM Docker Development Guide

*Local development with Docker: nginx proxy, health checks, volumes, seeding*

## 📋 Overview

This document describes setting up the local development environment for LoyaCareCRM using Docker. Docker provides isolation, consistency, and convenience for development with hot-reload, health checks, and automatic database seeding.

### Development Setup Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Backend       │    │   Frontend      │    │   Nginx Proxy   │
│   (Docker)      │    │   (Docker)      │    │   (Docker)      │    │   (Docker)      │
│   Port: 5435    │◄──►│   Port: 4003    │◄──►│   Port: 3003    │◄──►│   Port: 80      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲                       ▲
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                    ┌─────────────────┐         ┌─────────────────┐
                    │   Health Checks │         │   Hot Reload    │
                    │   & Volumes     │         │   (HMR)         │
                    └─────────────────┘         └─────────────────┘
```

### Ports for Development Environment

- **PostgreSQL:** 5435 (with named volume for data)
- **Backend:** 4003 (direct) / 80/api (nginx proxy)
- **Frontend:** 3003 (direct) / 80 (nginx proxy)
- **Nginx Proxy:** 80 (reverse proxy for frontend and backend)

### Development Setup Features

- **Nginx Reverse Proxy:** Combines frontend and backend under a single port 80
- **Health Checks:** Automatic service readiness verification
- **Named Volumes:** Persistent PostgreSQL data storage (`loyacrm_pg_data`)
- **Database Seeding:** Automatic database population with test data
- **Hot Module Replacement (HMR):** WebSocket support for live reloading
- **API Health Endpoint:** `/api/health` for backend status checking

## 🛠️ Docker Installation

### On your local machine, run:

```bash
# Update the system
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

## 📁 Preparing Development Environment

### 1. Cloning the repository

```bash
git clone <your-repository-url> loyacrm
cd loyacrm
```

### 2. Setting up environment variables

Create a `.env.dev` file based on the template:

```bash
cp .env.dev.example .env.dev
```

Contents of `.env.dev`:
```bash
# Database
POSTGRES_DB=loyacrm
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=password123

# Backend
DATABASE_URL="postgresql://loyacrm:password123@postgres:5432/loyacrm"
JWT_SECRET="your_dev_jwt_secret_here"
PORT=4003
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_APP_VERSION=dev
```

## 🚀 Starting Development Environment

### Quick start

```bash
# Start all services
./docker-dev-start.sh

# Or manually
docker compose -f docker-compose.dev.yml up -d
```

### Checking status

```bash
# Container status
docker compose -f docker-compose.dev.yml ps

# Logs
./docker-dev-logs.sh

# Stop
./docker-dev-stop.sh
```

## ✅ Testing Development Setup

### Checking availability

```bash
# Backend API via nginx proxy
curl http://localhost/api/health

# Backend API direct
curl http://localhost:4003/api/health

# Frontend via nginx proxy
curl http://localhost

# Frontend direct (for full HMR)
curl http://localhost:3003

# Database
psql -h localhost -p 5435 -U loyacrm loyacrm -c "SELECT version();"
```

### Functional testing

Open in browser:
- **Via nginx proxy:** `http://localhost` (recommended for production-like experience)
- **Direct access:** `http://localhost:3003` (for full HMR functionality)

Ensure that:
- ✅ Application loads
- ✅ API requests work (login, deals, etc.)
- ✅ Database is accessible and contains seeded data
- ✅ Hot reload works (on code changes)

## 🗄️ Database Seeding

On first startup of the development environment, database seeding is performed automatically:

- **Users:** admin@example.com, employee@example.com, lead@example.com
- **Passwords:** password123 (for all users)
- **Roles:** Admin, Employee, Lead
- **Deals:** Several test deals for demonstration

### Manual reseeding

```bash
# Stop services
docker compose -f docker-compose.dev.yml down

# Remove volume to reset DB
docker volume rm loyacarecrm_loyacrm_pg_data

# Restart
docker compose -f docker-compose.dev.yml up -d
```

## 🔄 Hot Module Replacement (HMR)

Development setup supports HMR for fast development:

- **WebSocket Proxy:** Nginx proxies WebSocket connections for `/_next/webpack-hmr`
- **Direct Access:** For full HMR functionality, use `http://localhost:3003`
- **Turbopack Notes:** If HMR issues occur, try direct access to port 3003

**Using HMR:**
```bash
# Via nginx proxy (may have limitations)
open http://localhost

# Direct access for full HMR functionality
open http://localhost:3003
```

## 📊 Monitoring Development Environment

### Health Checks

```bash
# Check health of all services
curl http://localhost/api/health

# Container status
docker compose -f docker-compose.dev.yml ps

# Resource usage
docker stats
```

### Working with database

```bash
# Connect to PostgreSQL
psql -h localhost -p 5435 -U loyacrm loyacrm

# View tables
\dt

# Execute commands in container
docker compose -f docker-compose.dev.yml exec postgres psql -U loyacrm -d loyacrm
```

### Service logs

```bash
# All logs
docker compose -f docker-compose.dev.yml logs -f

# Specific service logs
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f nginx
```

## 🔧 Managing Development Environment

### Restarting services

```bash
# Restart all services
docker compose -f docker-compose.dev.yml restart

# Restart specific service
docker compose -f docker-compose.dev.yml restart backend

# Rebuild and restart
docker compose -f docker-compose.dev.yml up --build --force-recreate
```

### Cleanup

```bash
# Stop and remove containers
docker compose -f docker-compose.dev.yml down

# Remove volumes (reset DB)
docker compose -f docker-compose.dev.yml down -v

# Clean unused resources
docker system prune -a
```

## 🚨 Troubleshooting

### Containers not starting
```bash
docker compose -f docker-compose.dev.yml logs
docker compose -f docker-compose.dev.yml config
```

### Database unavailable
```bash
docker compose -f docker-compose.dev.yml ps postgres
docker compose -f docker-compose.dev.yml logs postgres
```

### Application not responding
```bash
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend
docker compose -f docker-compose.dev.yml logs nginx
docker network inspect loyacarecrm_loyacrm-dev-network
```

### Hot Module Replacement (HMR) issues

**Symptoms:**
- WebSocket connection failed errors in browser console
- Code changes not reflected automatically
- 404 errors on `/_next/webpack-hmr`

**Solutions:**

1. **Use direct access for full HMR:**
   ```bash
   open http://localhost:3003
   ```

2. **Check nginx configuration:**
   - Ensure `nginx.conf` contains WebSocket proxy for `/_next/webpack-hmr`
   - Check nginx logs: `docker compose -f docker-compose.dev.yml logs nginx`

3. **Turbopack compatibility:**
   - Next.js may use Turbopack, which has limited WebSocket proxy support
   - For reliable HMR, use direct access to port 3003

4. **Check frontend logs:**
   ```bash
   docker compose -f docker-compose.dev.yml logs frontend
   ```

### Database Seeding issues

**Seeding not performed:**
```bash
# Check backend logs
docker compose -f docker-compose.dev.yml logs backend

# Perform seeding manually
docker compose -f docker-compose.dev.yml exec backend sh -c "cd db && pnpm run seed"
```

**Users not created:**
```bash
# Connect to DB
psql -h localhost -p 5435 -U loyacrm loyacrm

# Check users
SELECT * FROM "User";
```

### Health Check failures

**Service fails health check:**
```bash
# Check status
docker compose -f docker-compose.dev.yml ps

# Detailed logs
docker compose -f docker-compose.dev.yml logs [service-name]
```

**Database health check fails:**
- Ensure PostgreSQL is fully started
- Check credentials in docker-compose.dev.yml

### Port conflicts

**Port already in use:**
```bash
# Find process using the port
lsof -i :3003
lsof -i :4003
lsof -i :5435
lsof -i :80

# Stop conflicting service or change ports
```

## 📋 Development Setup Checklist

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `.env.dev` configured with correct credentials
- [ ] Development services started (`./docker-dev-start.sh`)
- [ ] Application available on ports 80 (nginx) and 3003 (direct)
- [ ] API available on ports 80/api (nginx) and 4003 (direct)
- [ ] Database available on port 5435 with seeded data
- [ ] Health checks pass for all services
- [ ] Hot Module Replacement works (via direct access localhost:3003)
- [ ] Nginx reverse proxy correctly proxies WebSocket for HMR

## 🎯 Development Setup Advantages

- **Fast setup:** One script starts the entire environment
- **Isolation:** Each component in a separate container
- **Hot Reload:** Instant changes without restart
- **Seeding:** Automatic population with test data
- **Health Checks:** Automatic status monitoring
- **Persistent Data:** Named volumes preserve data between runs
- **WebSocket Support:** HMR via proxy with fallback to direct access

---

**Author:** Sergey Daub
**Date:** November 26, 2025
**Version:** 1.0 - Docker development environment setup