# Staging Environment Deployment

Complete guide for deploying staging environment alongside production.

## Overview

**Purpose**: Isolated testing environment that mirrors production

**Key Features**:
- ✅ Separate database, volumes, and containers
- ✅ Runs on different port (8080 vs 80)
- ✅ Independent from production
- ✅ Can test updates before production deployment
- ✅ Includes development tools enabled

## Production vs Staging Comparison

| Component | Production | Staging |
|-----------|-----------|---------|
| **Port** | 80 | 8080 |
| **URL** | http://SERVER_IP | http://SERVER_IP:8080 |
| **Database** | loyacrm | loyacrm_staging |
| **Volume** | loyacrm_pg_data | loyacrm_pg_data_staging |
| **Network** | loyacrm-network | loyacrm-staging-network |
| **Containers** | loyacrm-* | loyacrm-staging-* |
| **Directory** | /var/www/loyacrm-production | /var/www/loyacrm-staging |
| **Images** | :latest or :v1.0.0 | :staging |
| **DevTools** | Disabled | Enabled |

## Prerequisites

- [Server setup completed](01-server-setup.md)
- Production environment running (optional but recommended)
- Port 8080 opened in firewall
- Docker images built and available

## Step 1: Create Staging Directory

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Create staging directory
mkdir -p /var/www/loyacrm-staging
cd /var/www/loyacrm-staging
```

## Step 2: Transfer Configuration Files

### Option A: From Production (on server)

```bash
# Copy from production
cp /var/www/loyacrm-production/docker-compose.yml docker-compose.stage.yml
cp /var/www/loyacrm-production/.env .env.stage
cp /var/www/loyacrm-production/nginx.conf nginx.stage.conf
```

### Option B: From Local Repository

On **local machine**:

```bash
cd /path/to/LoyaCareCRM

# Create staging deployment package
mkdir -p staging-package
cp docker-compose.stage.yml staging-package/
cp .env.stage staging-package/
cp nginx.stage.conf staging-package/

# Transfer to server
tar -czf staging-config.tar.gz staging-package/
scp staging-config.tar.gz root@YOUR_SERVER_IP:/var/www/loyacrm-staging/

# Cleanup
rm -rf staging-package staging-config.tar.gz
```

On **server**:

```bash
cd /var/www/loyacrm-staging
tar -xzf staging-config.tar.gz
mv staging-package/* .
rm -rf staging-package staging-config.tar.gz
```

## Step 3: Configure docker-compose.stage.yml

Edit the staging compose file:

```bash
cd /var/www/loyacrm-staging
nano docker-compose.stage.yml
```

**Key staging configurations:**

```yaml
services:
  nginx:
    container_name: loyacrm-staging-nginx
    image: nginx:alpine
    ports:
      - "8080:80"  # Staging port
    volumes:
      - ./nginx.stage.conf:/etc/nginx/nginx.conf:ro
    networks:
      - loyacrm-staging-network
    depends_on:
      - frontend

  frontend:
    container_name: loyacrm-staging-frontend
    image: ${FRONTEND_IMAGE:-loyacrm-frontend:staging}
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}
      - NEXT_PUBLIC_ENABLE_DEVTOOLS=true  # Enabled for staging
    networks:
      - loyacrm-staging-network
    depends_on:
      - backend

  backend:
    container_name: loyacrm-staging-backend
    image: ${BACKEND_IMAGE:-loyacrm-backend:staging}
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - loyacrm-staging-network
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    container_name: loyacrm-staging-postgres
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - loyacrm_pg_data_staging:/var/lib/postgresql/data  # Separate volume
    networks:
      - loyacrm-staging-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  loyacrm-staging-network:
    driver: bridge

volumes:
  loyacrm_pg_data_staging:
    driver: local
```

## Step 4: Configure Environment Variables

```bash
cd /var/www/loyacrm-staging
nano .env.stage
```

**Essential staging configuration:**

```env
# Nginx
NGINX_PORT=8080

# Database (staging)
POSTGRES_DB=loyacrm_staging
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=YOUR_STAGING_PASSWORD  # Use different from production

# Security (staging)
JWT_SECRET=YOUR_STAGING_JWT_SECRET  # Use different from production

# API URLs (with :8080 port!)
NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api

# Docker Images
FRONTEND_IMAGE=loyacrm-frontend:staging
BACKEND_IMAGE=loyacrm-backend:staging

# Development
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
```

**CRITICAL**: API URL must include `:8080` port for staging!

## Step 5: Prepare Docker Images

### Option A: Manual Build (Recommended for First Deployment)

On **local machine**:

```bash
cd /path/to/LoyaCareCRM

# Build staging images with correct API URL
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api \
  --build-arg NEXT_PUBLIC_ENABLE_DEVTOOLS=true \
  -t loyacrm-frontend:staging \
  -f docker/frontend/Dockerfile .

docker buildx build --platform linux/amd64 \
  -t loyacrm-backend:staging \
  -f docker/backend/Dockerfile .

# Export images
docker save loyacrm-frontend:staging | gzip > loyacrm-frontend-staging.tar.gz
docker save loyacrm-backend:staging | gzip > loyacrm-backend-staging.tar.gz

# Transfer to server
scp loyacrm-frontend-staging.tar.gz root@YOUR_SERVER_IP:/tmp/
scp loyacrm-backend-staging.tar.gz root@YOUR_SERVER_IP:/tmp/
```

On **server**:

```bash
# Load images
docker load < /tmp/loyacrm-frontend-staging.tar.gz
docker load < /tmp/loyacrm-backend-staging.tar.gz

# Verify
docker images | grep staging

# Cleanup
rm /tmp/loyacrm-*-staging.tar.gz
```

### Option B: Use Production Images

```bash
# Tag production images as staging
docker tag loyacrm-frontend:latest loyacrm-frontend:staging
docker tag loyacrm-backend:latest loyacrm-backend:staging

# Update .env.stage if needed
nano /var/www/loyacrm-staging/.env.stage
# FRONTEND_IMAGE=loyacrm-frontend:staging
# BACKEND_IMAGE=loyacrm-backend:staging
```

**Note**: Using production images for staging may have incorrect API URLs if not rebuilt with staging build args.

## Step 6: Open Port 8080

### Check Firewall Status

```bash
sudo ufw status
```

### Allow Port 8080

```bash
# Allow staging port
sudo ufw allow 8080/tcp comment 'LoyaCRM Staging'

# Verify
sudo ufw status numbered
```

**Expected output:**
```
To                         Action      From
--                         ------      ----
80/tcp (Nginx HTTP)        ALLOW       Anywhere
8080/tcp (LoyaCRM Staging) ALLOW       Anywhere
```

### Check Hosting Provider Firewall

If port 8080 is still not accessible:
1. Log in to your hosting control panel
2. Navigate to Firewall or Security settings
3. Add rule: Allow TCP port 8080 from any IP
4. Apply changes

### Alternative: SSH Tunnel (if port blocked)

If you cannot open port 8080, use SSH tunnel:

```bash
# On your local machine
ssh -L 8080:localhost:8080 root@YOUR_SERVER_IP

# Keep connection open
# Access staging: http://localhost:8080/de
```

## Step 7: Start Staging Services

```bash
cd /var/www/loyacrm-staging

# Start with staging configuration
docker compose -f docker-compose.stage.yml --env-file .env.stage up -d

# Wait for startup (30-60 seconds)
sleep 30

# Check status
docker compose -f docker-compose.stage.yml ps
```

**Expected output:**

```
NAME                         STATUS          PORTS
loyacrm-staging-backend      Up (healthy)    
loyacrm-staging-frontend     Up (healthy)    
loyacrm-staging-nginx        Up              0.0.0.0:8080->80/tcp
loyacrm-staging-postgres     Up (healthy)    
```

## Step 8: Database Setup

### Run Migrations

```bash
# Apply database schema
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'
```

### Seed Database (IMPORTANT!)

```bash
# Populate with test data
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npm run seed'
```

**Seed creates:**
- 13 users (admin@loya.care / password: 1)
- 110 contacts
- 110 deals  
- Test groups and notes

**⚠️ DO NOT SKIP**: Staging needs seed data for testing!

## Step 9: Verify Staging Deployment

### Check Container Status

```bash
# All containers
docker compose -f docker-compose.stage.yml ps

# Detailed status
docker ps --filter "name=loyacrm-staging"

# Health checks
docker inspect loyacrm-staging-backend | grep -A 10 Health
```

### Check Logs

```bash
# All staging services
docker compose -f docker-compose.stage.yml logs -f

# Specific service
docker compose -f docker-compose.stage.yml logs -f backend
docker compose -f docker-compose.stage.yml logs -f frontend

# Last 100 lines
docker compose -f docker-compose.stage.yml logs --tail 100
```

### Test API

```bash
# Health check
curl http://localhost:8080/api/health
# Should return: {"status":"ok"}

# Login test
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loya.care","password":"1"}'
# Should return: {"success":true,"token":"..."}

# Get users
curl http://localhost:8080/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return: [{"id":1,"email":"admin@loya.care",...}]
```

### Test Frontend

```bash
# Check home page
curl -I http://localhost:8080/de
# Should return: HTTP/1.1 200 OK

# Check API proxy
curl -I http://localhost:8080/api/health
# Should return: HTTP/1.1 200 OK
```

### Browser Access

Open browser: `http://YOUR_SERVER_IP:8080/de`

**Login credentials:**
- Email: `admin@loya.care`
- Password: `1`

**Verify:**
- Login works
- Dashboard loads
- Users list shows 13 users
- Contacts list shows 110 contacts
- Deals list shows 110 deals

## Step 10: Configure Nginx (if needed)

Edit staging nginx configuration:

```bash
nano /var/www/loyacrm-staging/nginx.stage.conf
```

**Sample staging configuration:**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:5000;
    }

    server {
        listen 80;
        server_name _;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api {
            proxy_pass http://backend/api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

**Reload nginx after changes:**

```bash
docker compose -f docker-compose.stage.yml restart nginx
```

## Updating Staging

### Update Images

On **local machine**:

```bash
# Pull latest code
git pull origin develop  # or main

# Rebuild staging images
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api \
  -t loyacrm-frontend:staging \
  -f docker/frontend/Dockerfile .

docker buildx build --platform linux/amd64 \
  -t loyacrm-backend:staging \
  -f docker/backend/Dockerfile .

# Export and transfer
docker save loyacrm-frontend:staging | gzip > loyacrm-frontend-staging.tar.gz
docker save loyacrm-backend:staging | gzip > loyacrm-backend-staging.tar.gz

scp loyacrm-frontend-staging.tar.gz root@YOUR_SERVER_IP:/tmp/
scp loyacrm-backend-staging.tar.gz root@YOUR_SERVER_IP:/tmp/
```

On **server**:

```bash
# Load new images
docker load < /tmp/loyacrm-frontend-staging.tar.gz
docker load < /tmp/loyacrm-backend-staging.tar.gz

# Restart staging
cd /var/www/loyacrm-staging
docker compose -f docker-compose.stage.yml up -d --force-recreate

# Run migrations if database changed
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Cleanup
rm /tmp/loyacrm-*-staging.tar.gz
```

## Managing Both Environments

### View All Services

```bash
# Production
docker compose -f /var/www/loyacrm-production/docker-compose.yml ps

# Staging
docker compose -f /var/www/loyacrm-staging/docker-compose.stage.yml ps

# All containers
docker ps
```

### Stop/Start Services

```bash
# Stop staging (production keeps running)
cd /var/www/loyacrm-staging
docker compose -f docker-compose.stage.yml stop

# Start staging
docker compose -f docker-compose.stage.yml start

# Restart specific service
docker compose -f docker-compose.stage.yml restart backend
```

### View Logs

```bash
# Production logs
docker compose -f /var/www/loyacrm-production/docker-compose.yml logs -f

# Staging logs
docker compose -f /var/www/loyacrm-staging/docker-compose.stage.yml logs -f

# Specific container
docker logs -f loyacrm-staging-backend
```

## Common Staging Issues

### Issue: Port 8080 blocked

**Symptom**: Cannot access http://SERVER_IP:8080

**Solutions**:

1. **Check UFW firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 8080/tcp
   ```

2. **Check hosting firewall:**
   - Log in to hosting control panel
   - Open port 8080 in firewall settings

3. **Use SSH tunnel:**
   ```bash
   ssh -L 8080:localhost:8080 root@YOUR_SERVER_IP
   # Access: http://localhost:8080/de
   ```

### Issue: Frontend shows "Network Error"

**Symptom**: Frontend loads but API calls fail

**Cause**: Wrong API URL in frontend build

**Solution**: Rebuild frontend with correct URL

```bash
# On local machine
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api \
  -t loyacrm-frontend:staging \
  -f docker/frontend/Dockerfile .

# Export, transfer, load, restart (see Update section)
```

**Verify build args:**
```bash
# On server
docker exec loyacrm-staging-frontend sh -c 'cat /app/.env.local'
# Should show: NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api
```

### Issue: Database empty after deployment

**Symptom**: Login fails, no users exist

**Cause**: Seed script not run

**Solution**: Run seed manually

```bash
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npm run seed'
```

### Issue: Containers keep restarting

**Check logs:**
```bash
docker compose -f docker-compose.stage.yml logs backend
```

**Common causes:**
- Database connection fails (check DATABASE_URL in .env.stage)
- Port 8080 already in use (check: `netstat -tulpn | grep 8080`)
- Insufficient memory (check: `free -h`)

## Testing Workflow

### Recommended Workflow

1. **Develop locally** → test on localhost
2. **Deploy to staging** → test on http://SERVER_IP:8080
3. **Test thoroughly** → run all features
4. **Deploy to production** → update http://SERVER_IP

### Staging Testing Checklist

- [ ] Frontend loads correctly
- [ ] Login works with test credentials
- [ ] Dashboard displays data
- [ ] Users list shows seed data (13 users)
- [ ] Contacts list shows seed data (110 contacts)
- [ ] Deals list shows seed data (110 deals)
- [ ] CRUD operations work (create, read, update, delete)
- [ ] API responses are correct
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive layout works

## Cleanup and Maintenance

### Remove Staging Environment

```bash
cd /var/www/loyacrm-staging

# Stop and remove containers
docker compose -f docker-compose.stage.yml down

# Remove volumes (deletes all data!)
docker compose -f docker-compose.stage.yml down -v

# Remove staging directory
cd /var/www
rm -rf loyacrm-staging

# Remove staging images
docker rmi loyacrm-frontend:staging
docker rmi loyacrm-backend:staging

# Close port 8080 (optional)
sudo ufw delete allow 8080/tcp
```

### Reset Staging Database

```bash
# Stop backend
docker compose -f docker-compose.stage.yml stop backend

# Stop postgres
docker compose -f docker-compose.stage.yml stop postgres

# Remove postgres container and volume
docker compose -f docker-compose.stage.yml rm -f postgres
docker volume rm loyacrm_pg_data_staging

# Restart services
docker compose -f docker-compose.stage.yml up -d

# Wait for postgres to be ready
sleep 20

# Run migrations
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Seed database
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npm run seed'
```

## Next Steps

- **[Container Management](05-management.md)** - Day-to-day operations for both environments
- **[Troubleshooting Guide](06-troubleshooting.md)** - Common issues and solutions

---

[← Back to Manual Build Deployment](03-production-manual-build.md) | [Next: Container Management →](05-management.md)
