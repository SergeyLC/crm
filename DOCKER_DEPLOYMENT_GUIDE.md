# CRM - Docker Deployment Guide

Complete guide for deploying the project on a clean Ubuntu server using Docker.

## Table of Contents

- [Production Deployment](#deployment-concept) - main production environment
- [Staging Deployment](#staging-environment-deployment) - test environment on port 8080
- [Container Management](#container-management)
- [Troubleshooting](#troubleshooting)

## Deployment Concept

**Recommended approach:** Docker images are built on developer's machine or via CI/CD (GitHub Actions), then uploaded to Container Registry and deployed on the server.

**Server does NOT require project source code** - only configuration files (docker-compose.yml, nginx.conf, .env).

This guide covers:
- **Production deployment** - main production environment (port 80)
- **Staging deployment** - testing environment for verifying changes (port 8080)

### Production Deployment Methods:
1. **GitHub Actions (recommended)** - automatic build and publish to GitHub Container Registry
2. **Manual local build** - build on developer's machine and upload images to server
3. **Server build** - for testing only (not recommended for production)

## Server Requirements

- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 2GB (recommended 4GB)
- **CPU**: 2+ cores
- **Disk**: Minimum 10GB free space (without source code)
- **Access**: SSH with root or sudo privileges

## Step 1: Connect to Server

```bash
# Replace YOUR_SERVER_IP with your server's IP
ssh root@YOUR_SERVER_IP

# If using SSH key
ssh -i ~/.ssh/your_key root@YOUR_SERVER_IP
```

## Step 2: Update System

```bash
# Update package list
apt update

# Upgrade installed packages
apt upgrade -y

# Install necessary utilities
apt install -y curl wget git nano
```

## Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify installation
docker --version
# Should output: Docker version 29.x.x or newer

# Enable Docker autostart
systemctl enable docker
systemctl start docker
```

## Step 4: Install Docker Compose

```bash
# Docker Compose usually comes with Docker
# Verify installation
docker compose version
# Should output: Docker Compose version v5.x.x or newer
```

## Step 5: Create Directory Structure

```bash
# Create project directories
mkdir -p /var/www/crm-production
mkdir -p /var/www/crm-production/backups

# Set permissions
chmod -R 755 /var/www/crm-production
```

## Step 6: Prepare Configuration Files

There are three deployment methods:

---

### Method 1: GitHub Actions + Container Registry (RECOMMENDED)

**Advantages:**
- ✅ Automatic builds on push/merge
- ✅ Image versioning
- ✅ Images stored in GitHub Container Registry
- ✅ No need to build images manually
- ✅ Server holds configuration only

**Steps:**

1. **Configure GitHub Actions** (the file should already exist at `.github/workflows/docker-publish.yml`)

2. **On the local machine, create a deployment package:**
```bash
cd /path/to/CRM

# Create directory for deployment files
mkdir -p deployment-package

# Copy only the required files
cp docker-compose.yml deployment-package/
cp .env.example deployment-package/
cp nginx.conf deployment-package/
cp -r nginx deployment-package/ 2>/dev/null || true

# Create archive
tar -czf crm-deployment.tar.gz deployment-package/

# Copy to server
scp crm-deployment.tar.gz root@YOUR_SERVER_IP:/var/www/
```

3. **On the server, extract and configure:**
```bash
cd /var/www
tar -xzf crm-deployment.tar.gz
mv deployment-package/* crm-production/
rm -rf deployment-package crm-deployment.tar.gz

cd /var/www/crm-production

# Create .env from the example
cp .env.example .env
nano .env  # Fill in the values
```

4. **In docker-compose.yml, use images from the Registry:**
```yaml
services:
  frontend:
    image: ghcr.io/sergeylc/crm/frontend:latest
    # or a specific version:
    # image: ghcr.io/sergeylc/crm/frontend:v1.0.0
  
  backend:
    image: ghcr.io/sergeylc/crm/backend:latest
    # or a specific version:
    # image: ghcr.io/sergeylc/crm/backend:v1.0.0
```

5. **On first run you may need to authenticate with GitHub Registry:**
```bash
# Create a Personal Access Token in GitHub with read:packages permission
# Settings → Developer settings → Personal access tokens → Tokens (classic)

# Authenticate
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

6. **Start the containers** (see Step 11)

---

### Method 2: Manual build on the local machine

**Advantages:**
- ✅ Full control over the build process
- ✅ No CI/CD setup required
- ✅ Server holds configuration only

**Steps:**

1. **On the local machine, build the images:**
```bash
cd /path/to/CRM

# Build Backend
docker build -f docker/backend/Dockerfile -t crm-backend:latest .

# Build Frontend
docker build --no-cache \
  -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t crm-frontend:latest .

# Verify images
docker images | grep crm
```

2. **Save images to files:**
```bash
# Create directory for images
mkdir -p docker-images

# Export images
docker save crm-backend:latest | gzip > docker-images/backend.tar.gz
docker save crm-frontend:latest | gzip > docker-images/frontend.tar.gz

# Create deployment package
mkdir -p deployment-package
cp docker-compose.yml deployment-package/
cp .env.example deployment-package/
cp nginx.conf deployment-package/
cp -r nginx deployment-package/ 2>/dev/null || true

# Create archive with everything needed
tar -czf crm-full-deployment.tar.gz deployment-package/ docker-images/
```

3. **Copy to the server:**
```bash
# Copy archive (may take time, ~500MB-1GB)
scp crm-full-deployment.tar.gz root@YOUR_SERVER_IP:/var/www/
```

4. **On the server, extract and load images:**
```bash
cd /var/www
tar -xzf crm-full-deployment.tar.gz

# Load images into Docker
docker load < docker-images/backend.tar.gz
docker load < docker-images/frontend.tar.gz

# Move configuration
mv deployment-package/* crm-production/

# Clean up
rm -rf deployment-package docker-images crm-full-deployment.tar.gz

# Configure .env
cd /var/www/crm-production
cp .env.example .env
nano .env  # Fill in the values
```

5. **Start the containers** (see Step 11)

---

### Method 3: Build on the server (NOT recommended for production)

**Use for testing only!**

**Drawbacks:**
- ❌ Requires source code on the server
- ❌ Puts load on the production server during builds
- ❌ Longer deployment time
- ❌ Requires more disk space

**Steps:**

1. **Create a directory for source code:**
```bash
mkdir -p /var/www/crm-source
```

2. **On the local machine:**
```bash
cd /path/to/CRM

# Sync the project (excluding unnecessary files)
rsync -avz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.git' \
  --exclude='coverage' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  ./ root@YOUR_SERVER_IP:/var/www/crm-source/
```

3. **On the server, build the images:**
```bash
cd /var/www/crm-source

# Build Backend
docker build -f docker/backend/Dockerfile -t crm-backend:latest .

# Build Frontend
docker build --no-cache \
  -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t crm-frontend:latest .

# Copy configuration
cp docker-compose.yml /var/www/crm-production/
cp .env.example /var/www/crm-production/
cp nginx.conf /var/www/crm-production/

# Configure .env
cd /var/www/crm-production
cp .env.example .env
nano .env
```

4. **Start the containers** (see Step 11)

---

## Step 7: Configure environment variables

**On the server:**

```bash
# Go to the production directory
cd /var/www/crm-production

# Create .env file for Docker Compose
cat > .env << 'EOF'
# General settings
DOMAIN=YOUR_SERVER_IP
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=production

# Frontend settings
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api

# Backend settings
BACKEND_PORT=4000
LOG_LEVEL=info
CORS_ORIGIN=http://YOUR_SERVER_IP

# Database
POSTGRES_DB=crm
POSTGRES_USER=crm
POSTGRES_PASSWORD=crm2024secure

# Security
JWT_SECRET=dGhpc2lzYXNlY3JldGp3dHNlY3JldGtleQ==

# Docker images
FRONTEND_IMAGE=crm-frontend:latest
BACKEND_IMAGE=crm-backend:latest

# Ports
NGINX_PORT=80
EOF

# IMPORTANT: Replace YOUR_SERVER_IP with the real server IP
nano .env

# For production it is recommended to generate new values:
# JWT_SECRET: openssl rand -base64 32
# POSTGRES_PASSWORD: openssl rand -base64 16
```

## Step 8: Configure docker-compose.yml

```bash
cd /var/www/crm-production

cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: crm-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_USER=${POSTGRES_USER:-crm}
      - POSTGRES_DB=${POSTGRES_DB:-crm}
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-crm}"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - crm-network

  backend:
    image: ${BACKEND_IMAGE:-crm-backend:latest}
    container_name: crm-backend
    restart: unless-stopped
    environment:
      - PORT=${BACKEND_PORT:-4000}
      - NODE_ENV=${NODE_ENV:-production}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - DATABASE_URL=postgresql://${POSTGRES_USER:-crm}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-crm}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:${BACKEND_PORT:-4000}/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    networks:
      - crm-network

  frontend:
    image: ${FRONTEND_IMAGE:-crm-frontend:latest}
    container_name: crm-frontend
    restart: unless-stopped
    environment:
      - PORT=${FRONTEND_PORT:-3000}
      - NODE_ENV=${NODE_ENV:-production}
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api}
      - NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}
      - NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION:-production}
    depends_on:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:${FRONTEND_PORT:-3000} || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - crm-network

  nginx:
    image: nginx:alpine
    container_name: crm-nginx
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    ports:
      - "${NGINX_PORT:-80}:80"
    networks:
      - crm-network

volumes:
  pg_data:
    name: crm_pg_data

networks:
  crm-network:
    driver: bridge
EOF
```

## Step 9: Configure Nginx

```bash
cd /var/www/crm-production

cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:4000;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 10M;

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
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
```

## Step 10: Start containers

```bash
cd /var/www/crm-production

# Start all services
docker compose up -d

# Check container status
docker compose ps

# Should show all 4 containers with status "Up (healthy)"
```

## Step 11: Apply database migrations

```bash
# Wait until PostgreSQL is fully started (30-60 seconds)
sleep 60

# Apply migrations
docker exec crm-backend sh -c "cd /app/db && npx prisma migrate deploy"

# Check applied migrations
docker exec crm-backend sh -c "cd /app/db && npx prisma migrate status"
```

## Step 12: Seed the database

```bash
# Create seed data (administrators, test leads/deals)
docker exec crm-backend sh -c "cd /app/db && node prisma/seed.ts"
```

## Step 13: Verify the system is working

### 13.1 Backend API check

```bash
# Health check
curl http://YOUR_SERVER_IP/api/health
# Should return: {"status":"ok"}

# Auth test
curl -X POST http://YOUR_SERVER_IP/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"1"}'
# Should return JSON with a token and user data
```

### 13.2 Frontend check

```bash
# Check the home page
curl -I http://YOUR_SERVER_IP/de
# Should return: HTTP/1.1 200 OK

# Check the login page
curl -I http://YOUR_SERVER_IP/de/login
# Should return: HTTP/1.1 200 OK
```

### 13.3 Browser check

Open in a browser:
- **Home**: `http://YOUR_SERVER_IP/de`
- **Login**: `http://YOUR_SERVER_IP/de/login`

**Test credentials:**
- Email: `admin@example.com`
- Password: `1`

After a successful login you should see the CRM dashboard.

## Step 14: Configure autostart

Docker containers are already configured with `restart: unless-stopped`, so they will start automatically after a server reboot.

Verify:
```bash
# Reboot the server
reboot

# After reboot, connect and check
ssh root@YOUR_SERVER_IP
cd /var/www/crm-production
docker compose ps
```

## Container Management

### Viewing logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f nginx

# Last 50 lines
docker compose logs --tail 50 backend
```

### Restarting services

```bash
# Restart all
docker compose restart

# Restart a specific service
docker compose restart backend
docker compose restart frontend
```

### Stopping and removing

```bash
# Stop all services
docker compose stop

# Stop and remove containers (DB is preserved)
docker compose down

# Remove everything including the DB (CAUTION!)
docker compose down -v
```

### Updating after code changes

**Method 1: Via GitHub Actions (recommended)**

```bash
# 1. On the local machine: push code to the repository
git push origin main

# 2. GitHub Actions will automatically build and publish new images

# 3. On the server: update images and restart
cd /var/www/crm-production

# Pull new image versions
docker compose pull

# Recreate containers with the new images
docker compose up -d

# Verify
docker compose ps
```

**Method 2: Manual build and upload**

```bash
# 1. On the local machine, rebuild images
cd /path/to/CRM
docker build -f docker/backend/Dockerfile -t crm-backend:latest .
docker build --no-cache -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t crm-frontend:latest .

# 2. Save and copy to the server
docker save crm-backend:latest | gzip > backend.tar.gz
docker save crm-frontend:latest | gzip > frontend.tar.gz
scp backend.tar.gz frontend.tar.gz root@YOUR_SERVER_IP:/tmp/

# 3. On the server, load and update
ssh root@YOUR_SERVER_IP
cd /tmp
docker load < backend.tar.gz
docker load < frontend.tar.gz
rm backend.tar.gz frontend.tar.gz

cd /var/www/crm-production
docker compose up -d --force-recreate backend frontend

# 4. Verify
docker compose ps
```

**Method 3: Build on the server (not recommended)**

```bash
# 1. Sync the new code
rsync -avz --exclude='node_modules' --exclude='.next' \
  ./ root@YOUR_SERVER_IP:/var/www/crm-source/

# 2. On the server, rebuild images
ssh root@YOUR_SERVER_IP
cd /var/www/crm-source
docker build -f docker/backend/Dockerfile -t crm-backend:latest .
docker build --no-cache -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t crm-frontend:latest .

# 3. Recreate containers
cd /var/www/crm-production
docker compose up -d --force-recreate backend frontend

# 4. Verify
docker compose ps
```

## Database backups

### Creating a backup

```bash
# Create directory for backups
mkdir -p /var/www/crm-backups

# Create a backup
docker exec crm-postgres pg_dump \
  -U crm crm > /var/www/crm-backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Or use custom format (compressed)
docker exec crm-postgres pg_dump \
  -U crm -Fc crm > /var/www/crm-backups/backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restoring from a backup

```bash
# From an SQL file
cat /var/www/crm-backups/backup_YYYYMMDD_HHMMSS.sql | \
  docker exec -i crm-postgres psql -U crm -d crm

# From custom format
docker exec -i crm-postgres pg_restore \
  -U crm -d crm < /var/www/crm-backups/backup_YYYYMMDD_HHMMSS.dump
```

### Automatic backups (cron)

```bash
# Create backup script
cat > /usr/local/bin/crm-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/var/www/crm-backups
DATE=$(date +%Y%m%d_%H%M%S)
docker exec crm-postgres pg_dump -U crm -Fc crm > $BACKUP_DIR/backup_$DATE.dump
# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete
EOF

# Make executable
chmod +x /usr/local/bin/crm-backup.sh

# Add to cron (every day at 3:00 AM)
crontab -e
# Add the line:
# 0 3 * * * /usr/local/bin/crm-backup.sh
```

## Monitoring

### System health checks

```bash
# Disk usage
df -h

# Memory usage
free -h

# Docker stats
docker stats

# Check logs for errors
docker compose logs --tail 100 | grep -i error
```

## Staging Environment Deployment

A staging environment lets you test changes before deploying to production. Staging uses separate containers, database, and ports.

### Differences between Staging and Production

| Parameter | Production | Staging |
|----------|-----------|---------|
| HTTP port | 80 | 8080 |
| Database | `crm` | `crm_staging` |
| Docker volume | `crm_pg_data` | `crm_pg_data_staging` |
| Container names | `crm-*` | `crm-staging-*` |
| Docker images | `:latest` | `:staging` |
| Network | `crm-network` | `crm-staging-network` |
| Directory | `/var/www/crm-production` | `/var/www/crm-staging` |

### Step 1: Prepare Staging configuration

Ready-made files already exist on the local machine:
- `docker-compose.stage.yml` - staging configuration
- `.env.stage` - environment variable template for staging
- `nginx.stage.conf` - nginx configuration for staging
- `frontend/.env.staging` - frontend build variables for staging

### Step 2: Build images for Staging

```bash
cd /path/to/CRM

# Build Backend image (same for prod and staging)
docker build --platform linux/amd64 \
  -t crm-backend:staging \
  -f docker/backend/Dockerfile .

# Build Frontend image with staging variables
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api \
  --build-arg NEXT_PUBLIC_APP_VERSION=staging \
  -t crm-frontend:staging \
  -f docker/frontend/Dockerfile.prod .
```

**⚠️ Important:** Use `--platform linux/amd64` if you build on Mac (ARM64) for an AMD64 server.

### Step 3: Export and copy images

```bash
# Export images
docker save crm-backend:staging | gzip > crm-backend-staging.tar.gz
docker save crm-frontend:staging | gzip > crm-frontend-staging.tar.gz

# Copy to the server
scp crm-backend-staging.tar.gz crm-frontend-staging.tar.gz \
    docker-compose.stage.yml nginx.stage.conf .env.stage \
    root@YOUR_SERVER_IP:/var/www/crm-staging/
```

### Step 4: Configure on the server

```bash
ssh root@YOUR_SERVER_IP
cd /var/www/crm-staging

# Create directory for backups
mkdir -p backups

# Load Docker images
docker load < crm-backend-staging.tar.gz
docker load < crm-frontend-staging.tar.gz

# Configure .env
cp .env.stage .env

# Generate secure passwords
DB_PASS=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Update .env with passwords (use a text editor)
nano .env
# Replace:
# POSTGRES_PASSWORD=CHANGE_ME_STAGING_PASSWORD  ->  with the generated password
# JWT_SECRET=CHANGE_ME_STAGING_JWT_SECRET       ->  with the generated secret
```

### Step 5: Start Staging containers

```bash
cd /var/www/crm-staging

# Start containers
docker compose -f docker-compose.stage.yml up -d

# Check status
docker ps --filter name=crm-staging

# Check logs
docker compose -f docker-compose.stage.yml logs -f
```

### Step 6: Apply migrations and seed data

```bash
# Apply database migrations
docker exec crm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# **IMPORTANT:** Run seed to create test data
docker exec crm-staging-backend sh -c 'cd /app/db && npm run seed'

# Verify created data
docker exec crm-staging-postgres psql -U crm -d crm_staging \
  -c 'SELECT COUNT(*) as users FROM "User"; SELECT COUNT(*) as contacts FROM "Contact";'
```

**Seed will create:**
- 13 users (including admin@example.com with password "1")
- 110 contacts
- 110 deals in various stages
- Test groups and notes

### Step 7: Open port 8080 (if required)

By default many hosting providers block non-standard ports. Staging is available locally on the server; for external access:

**Option 1: Open the port with the hosting provider**

Contact hosting support to open port 8080.

**Option 2: SSH tunnel (for developers)**

```bash
# On the local machine, create a tunnel
ssh -L 8080:localhost:8080 root@YOUR_SERVER_IP -N

# Then open in a browser: http://localhost:8080/de
```

**Option 3: Path-based routing via production nginx**

Configure production nginx to proxy `/staging/` to staging.

### Step 8: Verify Staging

```bash
# API test (on the server)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"1"}'

# Should return: {"success":true,"user":{...},"token":"..."}

# Frontend test
curl -I http://localhost:8080/de
# Should return: HTTP/1.1 200 OK
```

**Staging access:**
- URL: `http://YOUR_SERVER_IP:8080/de`
- Email: `admin@example.com`
- Password: `1`

### Managing Staging

```bash
cd /var/www/crm-staging

# View logs
docker compose -f docker-compose.stage.yml logs -f

# Restart services
docker compose -f docker-compose.stage.yml restart

# Stop
docker compose -f docker-compose.stage.yml stop

# Full cleanup (including DB)
docker compose -f docker-compose.stage.yml down -v
```

### Updating Staging images

```bash
# 1. On the local machine, rebuild
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api \
  -t crm-frontend:staging \
  -f docker/frontend/Dockerfile.prod .

# 2. Export and copy
docker save crm-frontend:staging | gzip > crm-frontend-staging.tar.gz
scp crm-frontend-staging.tar.gz root@YOUR_SERVER_IP:/var/www/crm-staging/

# 3. On the server, load and restart
ssh root@YOUR_SERVER_IP
cd /var/www/crm-staging
docker load < crm-frontend-staging.tar.gz
docker compose -f docker-compose.stage.yml restart frontend
```

### Cleaning up temporary files

After a successful deployment, delete the image archives:

```bash
# On the server
cd /var/www/crm-staging
rm -f *.tar.gz

# On the local machine
rm -f crm-*-staging.tar.gz
```

---

## Troubleshooting

### Container does not start

```bash
# Check logs
docker compose logs backend

# Check configuration
docker compose config

# Recreate the container
docker compose up -d --force-recreate backend
```

### Database is unavailable

```bash
# Check status
docker compose ps postgres

# Check logs
docker compose logs postgres

# Check connection
docker exec crm-backend sh -c "cd /app/db && npx prisma db pull"
```

### Frontend shows errors

```bash
# Check environment variables
docker exec crm-frontend env | grep NEXT_PUBLIC

# Verify that .env.production was copied
docker exec crm-frontend cat /app/frontend/.env.production

# Rebuild with --no-cache
docker build --no-cache -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t crm-frontend:latest /var/www/crm-source
```

### Nginx 502/504 errors

```bash
# Check upstream services
docker compose ps

# Check nginx configuration
docker exec crm-nginx nginx -t

# Reload nginx
docker compose restart nginx
```

## Security

### Change passwords

**IMPORTANT:** On first deploy it is recommended to generate new values:

```bash
cd /var/www/crm-production

# Generate a new DB password
NEW_DB_PASSWORD=$(openssl rand -base64 16)
echo "New DB password: $NEW_DB_PASSWORD"

# Generate a new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 32)
echo "New JWT secret: $NEW_JWT_SECRET"

# Update the .env file
nano .env
# Change:
# POSTGRES_PASSWORD=new_password
# JWT_SECRET=new_secret

# Recreate containers with the new values
docker compose down
docker compose up -d

# Verify connection
docker compose ps
```

**To change passwords on an existing system:**

1. **PostgreSQL password:**
```bash
# Stop services
cd /var/www/crm-production
docker compose stop backend frontend

# Change the password in .env
nano .env
# POSTGRES_PASSWORD=new_password

# Change the password in PostgreSQL
docker exec -it crm-postgres psql -U crm -d crm \
  -c "ALTER USER crm WITH PASSWORD 'new_password';"

# Restart services
docker compose up -d
```

2. **JWT Secret (will require all users to re-authenticate):**
```bash
# Change in .env
nano .env
# JWT_SECRET=new_secret

# Restart backend
docker compose restart backend
```

### Firewall configuration

```bash
# Install ufw
apt install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS (if using SSL)
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

## SSL/HTTPS (optional)

For production it is recommended to use an SSL certificate (Let's Encrypt + Certbot).

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain a certificate (replace with your domain)
certbot --nginx -d your-domain.com

# Certificate auto-renewal (already configured automatically)
# Verify: certbot renew --dry-run
```

## Contacts and support

If you encounter problems, check:
1. Container logs: `docker compose logs`
2. Service status: `docker compose ps`
3. Port availability: `netstat -tulpn | grep LISTEN`
4. Resource usage: `docker stats`

---

**Created:** 2025-12-19  
**Version:** 1.0  
**Project:** CRM  
**Deployment:** Docker Production
