# Production Deployment with Manual Build

Build Docker images locally and deploy to server.

## Overview

**Best for**: Single developers, testing, servers without internet access to registries

**Advantages**:
- ✅ Full control over build process
- ✅ Works without GitHub Actions
- ✅ No registry authentication needed
- ✅ Can build on any platform
- ✅ Useful for private/airgapped servers

**Disadvantages**:
- ❌ Manual process
- ❌ Large image files to transfer (500MB-1GB)
- ❌ Requires Docker on local machine
- ❌ Platform compatibility issues (ARM64 vs AMD64)

## Prerequisites

- [Server setup completed](01-server-setup.md)
- Docker installed locally (macOS, Windows, or Linux)
- SSH access to server
- Sufficient disk space (2-3 GB locally, 2GB on server)

## Step 1: Prepare Local Environment

### Check Docker

```bash
docker --version
# Should show: Docker version 20.x or higher

docker compose version
# Should show: Docker Compose version v2.x or higher
```

### Clone Repository (if needed)

```bash
cd ~/work
git clone YOUR_REPOSITORY_URL LoyaCareCRM
cd LoyaCareCRM
```

## Step 2: Build Docker Images

### Important: Platform Targeting

If building on **Apple Silicon (M1/M2/M3)** or **ARM64** device for **AMD64 server**:

```bash
# Build for AMD64 platform
docker buildx build --platform linux/amd64 \
  -t crm-frontend:latest \
  -f docker/frontend/Dockerfile .

docker buildx build --platform linux/amd64 \
  -t crm-backend:latest \
  -f docker/backend/Dockerfile .
```

If building on **AMD64** (Intel/AMD) for **AMD64 server**:

```bash
# Build for native platform
docker build -t crm-frontend:latest -f docker/frontend/Dockerfile .
docker build -t crm-backend:latest -f docker/backend/Dockerfile .
```

### Configure Build Arguments (Optional)

For specific backend API URL:

```bash
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t crm-frontend:latest \
  -f docker/frontend/Dockerfile .
```

### Build Time

Expected build times:
- **Frontend**: 5-15 minutes (Next.js build)
- **Backend**: 2-5 minutes (Node.js + Prisma)

### Verify Images

```bash
docker images | grep crm

# Expected output:
# crm-frontend    latest    abc123    2 minutes ago    150MB
# crm-backend     latest    def456    5 minutes ago    200MB
```

## Step 3: Export Images

### Save as tar archives

```bash
# Frontend
docker save crm-frontend:latest | gzip > crm-frontend.tar.gz

# Backend
docker save crm-backend:latest | gzip > crm-backend.tar.gz

# Check file sizes
ls -lh *.tar.gz
# frontend: ~140-170 MB
# backend: ~180-220 MB
```

## Step 4: Transfer Images to Server

### Using SCP

```bash
# Transfer frontend
scp crm-frontend.tar.gz root@YOUR_SERVER_IP:/tmp/

# Transfer backend
scp crm-backend.tar.gz root@YOUR_SERVER_IP:/tmp/
```

**Transfer time**: Depends on connection speed
- 10 Mbps: ~5-8 minutes
- 100 Mbps: ~30-60 seconds

### Using rsync (faster for updates)

```bash
rsync -avz --progress crm-frontend.tar.gz root@YOUR_SERVER_IP:/tmp/
rsync -avz --progress crm-backend.tar.gz root@YOUR_SERVER_IP:/tmp/
```

### Alternative: USB/Direct Copy

For servers without internet or slow connections:
1. Save images to USB drive
2. Copy USB drive to server
3. Mount and load from `/media/usb/`

## Step 5: Load Images on Server

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Load frontend image
docker load < /tmp/crm-frontend.tar.gz

# Load backend image
docker load < /tmp/crm-backend.tar.gz

# Verify images loaded
docker images | grep crm

# Cleanup transfer files
rm /tmp/crm-frontend.tar.gz /tmp/crm-backend.tar.gz
```

## Step 6: Prepare Configuration Files

### Copy Configuration to Server

On **local machine**:

```bash
cd /path/to/LoyaCareCRM

# Create deployment package
mkdir -p deployment-package

# Copy files
cp docker-compose.yml deployment-package/
cp .env.example deployment-package/
cp nginx.conf deployment-package/

# Create archive
tar -czf crm-config.tar.gz deployment-package/

# Transfer to server
scp crm-config.tar.gz root@YOUR_SERVER_IP:/var/www/

# Cleanup local
rm -rf deployment-package crm-config.tar.gz
```

### Extract on Server

```bash
# On server
cd /var/www

# Extract
tar -xzf crm-config.tar.gz

# Move to production directory
mv deployment-package/* crm-production/

# Cleanup
rm -rf deployment-package crm-config.tar.gz
```

## Step 7: Configure Environment Variables

```bash
cd /var/www/crm-production

# Create .env from template
cp .env.example .env

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

echo "Generated DB Password: $DB_PASSWORD"
echo "Generated JWT Secret: $JWT_SECRET"

# Edit .env
nano .env
```

**Required configuration:**

```env
# Domain
DOMAIN=YOUR_SERVER_IP

# Database
POSTGRES_DB=crm
POSTGRES_USER=crm
POSTGRES_PASSWORD=YOUR_GENERATED_PASSWORD

# Security
JWT_SECRET=YOUR_GENERATED_JWT_SECRET

# API URLs
NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api

# Docker Images (use local images)
FRONTEND_IMAGE=crm-frontend:latest
BACKEND_IMAGE=crm-backend:latest
```

## Step 8: Update docker-compose.yml

Ensure `docker-compose.yml` uses correct image names:

```bash
nano docker-compose.yml
```

**Verify image references:**

```yaml
services:
  frontend:
    image: ${FRONTEND_IMAGE:-crm-frontend:latest}
    
  backend:
    image: ${BACKEND_IMAGE:-crm-backend:latest}
```

**Remove** any `build:` directives if present.

## Step 9: Start Services

```bash
cd /var/www/crm-production

# Start all services
docker compose up -d

# Wait for startup (30-60 seconds)
sleep 30

# Check status
docker compose ps
```

**Expected output:**

```
NAME                     STATUS          PORTS
crm-backend          Up (healthy)    
crm-frontend         Up (healthy)    
crm-nginx            Up              0.0.0.0:80->80/tcp
crm-postgres         Up (healthy)    
```

## Step 10: Database Setup

### Run Migrations

```bash
# Apply database schema
docker exec crm-backend sh -c 'cd /app/db && npx prisma migrate deploy'
```

### Seed Database (First Deployment Only)

```bash
# Populate with test data
docker exec crm-backend sh -c 'cd /app/db && npm run seed'
```

**Seed creates:**
- 13 users (including admin@loya.care / password: 1)
- 110 contacts
- 110 deals
- Test groups and notes

## Step 11: Verify Deployment

### Check Logs

```bash
# View all services
docker compose logs -f

# View specific service
docker compose logs -f backend
docker compose logs -f frontend

# Exit logs: Ctrl+C
```

### Test API Endpoint

```bash
# Health check
curl http://localhost/api/health
# Should return: {"status":"ok"}

# Login test
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loya.care","password":"1"}'
# Should return: {"success":true,"token":"..."}
```

### Test Frontend

```bash
# Check home page
curl -I http://localhost/de
# Should return: HTTP/1.1 200 OK
```

### Browser Access

Open browser: `http://YOUR_SERVER_IP/de`

**Login credentials:**
- Email: `admin@loya.care`
- Password: `1`

## Updating Application

### Update Process

1. **Pull latest code** (local machine):
   ```bash
   cd /path/to/LoyaCareCRM
   git pull origin main
   ```

2. **Rebuild images**:
   ```bash
   # Frontend
   docker buildx build --platform linux/amd64 \
     -t crm-frontend:latest \
     -f docker/frontend/Dockerfile .
   
   # Backend
   docker buildx build --platform linux/amd64 \
     -t crm-backend:latest \
     -f docker/backend/Dockerfile .
   ```

3. **Export new images**:
   ```bash
   docker save crm-frontend:latest | gzip > crm-frontend.tar.gz
   docker save crm-backend:latest | gzip > crm-backend.tar.gz
   ```

4. **Transfer to server**:
   ```bash
   scp crm-frontend.tar.gz root@YOUR_SERVER_IP:/tmp/
   scp crm-backend.tar.gz root@YOUR_SERVER_IP:/tmp/
   ```

5. **Load on server**:
   ```bash
   ssh root@YOUR_SERVER_IP
   
   docker load < /tmp/crm-frontend.tar.gz
   docker load < /tmp/crm-backend.tar.gz
   
   rm /tmp/crm-*.tar.gz
   ```

6. **Restart services**:
   ```bash
   cd /var/www/crm-production
   docker compose up -d --force-recreate
   ```

7. **Run migrations** (if database changed):
   ```bash
   docker exec crm-backend sh -c 'cd /app/db && npx prisma migrate deploy'
   ```

## Platform Compatibility Issues

### Symptom: "exec format error"

```
Error response from daemon: failed to create shim task: 
OCI runtime create failed: runc create failed: 
unable to start container process: exec format error
```

**Cause**: Image built for wrong architecture (e.g., ARM64 image on AMD64 server)

**Solution**: Rebuild with correct platform:

```bash
# On local machine
docker buildx build --platform linux/amd64 \
  -t crm-frontend:latest \
  -f docker/frontend/Dockerfile .

docker buildx build --platform linux/amd64 \
  -t crm-backend:latest \
  -f docker/backend/Dockerfile .
```

### Check Server Architecture

```bash
# On server
uname -m
# x86_64 = AMD64
# aarch64 = ARM64
```

### Check Image Architecture

```bash
docker inspect crm-frontend:latest | grep Architecture
# Should match server architecture
```

## Disk Space Management

### Monitor Disk Usage

```bash
# Overall disk usage
df -h

# Docker disk usage
docker system df

# Detailed Docker usage
docker system df -v
```

### Cleanup Old Images

```bash
# Remove old images
docker image prune -a

# Remove unused containers, networks, volumes
docker system prune -a --volumes

# Warning: This removes ALL unused resources!
```

## Troubleshooting

### Build fails with "out of memory"

Increase Docker memory limit:
- **Docker Desktop**: Settings → Resources → Memory (increase to 4-8 GB)

### Transfer interrupted

Resume with rsync:
```bash
rsync -avz --progress --partial crm-frontend.tar.gz root@YOUR_SERVER_IP:/tmp/
```

### Images not loading on server

Check available disk space:
```bash
df -h /var/lib/docker
# Need at least 2GB free
```

### Service unhealthy after update

```bash
# Check logs
docker compose logs backend

# Force rebuild
docker compose up -d --force-recreate backend

# Check if migrations needed
docker exec crm-backend sh -c 'cd /app/db && npx prisma migrate status'
```

## Automation Script

Create `deploy-manual.sh` on local machine:

```bash
#!/bin/bash
set -e

SERVER_IP="YOUR_SERVER_IP"
SERVER_USER="root"

echo "Building images..."
docker buildx build --platform linux/amd64 -t crm-frontend:latest -f docker/frontend/Dockerfile .
docker buildx build --platform linux/amd64 -t crm-backend:latest -f docker/backend/Dockerfile .

echo "Exporting images..."
docker save crm-frontend:latest | gzip > crm-frontend.tar.gz
docker save crm-backend:latest | gzip > crm-backend.tar.gz

echo "Transferring to server..."
scp crm-frontend.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
scp crm-backend.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

echo "Loading images on server..."
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
docker load < /tmp/crm-frontend.tar.gz
docker load < /tmp/crm-backend.tar.gz
rm /tmp/crm-*.tar.gz
cd /var/www/crm-production
docker compose up -d --force-recreate
EOF

echo "Cleaning up local files..."
rm crm-frontend.tar.gz crm-backend.tar.gz

echo "Deployment complete!"
```

Make executable:
```bash
chmod +x deploy-manual.sh
```

Use:
```bash
./deploy-manual.sh
```

## Next Steps

- **[Deploy Staging Environment](04-staging-deployment.md)** - Set up test environment
- **[Container Management](05-management.md)** - Day-to-day operations
- **[Troubleshooting Guide](06-troubleshooting.md)** - Common issues

---

[← Back to GitHub Actions Deployment](02-production-github-actions.md) | [Next: Staging Deployment →](04-staging-deployment.md)
