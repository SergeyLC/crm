# Staging Environments (stage-main / stage-develop)

How staging works next to production on the same host.

## Preferred path: GitHub Actions

| Environment | Trigger | Port | Directory | Compose |
|-------------|---------|------|-----------|---------|
| **stage-main** | workflow_dispatch on `main` | **8080** | `/var/www/crm-stage-main` | `docker-compose.stage-main.yml` |
| **stage-develop** | workflow_dispatch on `develop` | **8081** | `/var/www/crm-stage-develop` | `docker-compose.stage-develop.yml` |
| **production** | Tag `v*` | **80** | `/var/www/crm-production` | `docker-compose.production.yml` |

Full matrix: [docs/deployment/README.md](README.md) · [.github/CI_CD_SETUP.md](../../.github/CI_CD_SETUP.md)

**CI behavior:** runs `prisma migrate deploy`. **Seed is optional** — enable **run_seed** on Run workflow, or:

```bash
node scripts/seed-remote.js --env stage-main
node scripts/seed-remote.js --env stage-develop
# Or on the server:
docker exec -w /app/db crm-stage-main-backend sh -c 'pnpm run seed:runtime'
# Demo login: admin@example.com / 1
```

## Comparison

| Component | Production | Stage-main | Stage-develop |
|-----------|------------|------------|---------------|
| **Port** | 80 | 8080 | 8081 |
| **URL** | http://SERVER_IP | http://SERVER_IP:8080 | http://SERVER_IP:8081 |
| **Typical DB** | `crm` | `crm_staging` | `crm_stage_develop` |
| **Containers** | `crm-production-*` | `crm-stage-main-*` | `crm-stage-develop-*` |
| **Directory** | `/var/www/crm-production` | `/var/www/crm-stage-main` | `/var/www/crm-stage-develop` |
| **GitHub env** | `production` | `stage-main` | `stage-develop` |

## Prerequisites

- [Server setup](01-server-setup.md) (directories + firewall for 8080 / 8081)
- GitHub environments `stage-main` / `stage-develop` with secrets ([QUICK_SETUP](../../.github/QUICK_SETUP.md))

## Automated deploy

Push to `main`/`develop` runs tests only on the ~4 GB VPS policy. Deploy staging via GitHub Actions:

1. Actions → **Deploy Application** → **Run workflow**
2. Branch `main` → stage-main (:8080) · Branch `develop` → stage-develop (:8081)
3. Optional: check **run_seed**

```bash
# After deploy
# → http://YOUR_SERVER_IP:8080  (stage-main)
# → http://YOUR_SERVER_IP:8081  (stage-develop)
```

---

## Legacy manual staging (`crm-staging`)

The steps below describe an older **manual** layout (`/var/www/crm-staging`, `docker-compose.stage.yml`, containers `crm-staging-*`). Prefer the GitHub Actions path above. Kept for emergency/manual use only.

### Seed note (manual / legacy)

Seed is **optional** and **not** run by CI. Only run seed when you need demo data on an empty database — it is not a required deploy step.

```bash
# Preferred:
docker exec -w /app/db crm-stage-main-backend sh -c 'pnpm run seed:runtime'
# Or from laptop:
# node scripts/seed-remote.js --env stage-main

# Legacy name (only if you still run crm-staging-*):
# docker exec -w /app/db crm-staging-backend sh -c 'pnpm run seed:runtime'
```

## Step 1: Create Staging Directory (legacy)

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Legacy directory (prefer /var/www/crm-stage-main)
mkdir -p /var/www/crm-staging
cd /var/www/crm-staging
```

## Step 2: Transfer Configuration Files

### Option A: From Production (on server)

```bash
# Copy from production
cp /var/www/crm-production/docker-compose.yml docker-compose.stage.yml
cp /var/www/crm-production/.env .env.stage
cp /var/www/crm-production/nginx.conf nginx.stage.conf
```

### Option B: From Local Repository

On **local machine**:

```bash
cd /path/to/CRM

# Create staging deployment package
mkdir -p staging-package
cp docker-compose.stage.yml staging-package/
cp .env.stage staging-package/
cp nginx.stage.conf staging-package/

# Transfer to server
tar -czf staging-config.tar.gz staging-package/
scp staging-config.tar.gz root@YOUR_SERVER_IP:/var/www/crm-staging/

# Cleanup
rm -rf staging-package staging-config.tar.gz
```

On **server**:

```bash
cd /var/www/crm-staging
tar -xzf staging-config.tar.gz
mv staging-package/* .
rm -rf staging-package staging-config.tar.gz
```

## Step 3: Configure docker-compose.stage.yml

Edit the staging compose file:

```bash
cd /var/www/crm-staging
nano docker-compose.stage.yml
```

**Key staging configurations:**

```yaml
services:
  nginx:
    container_name: crm-staging-nginx
    image: nginx:alpine
    ports:
      - "8080:80"  # Staging port
    volumes:
      - ./nginx.stage.conf:/etc/nginx/nginx.conf:ro
    networks:
      - crm-staging-network
    depends_on:
      - frontend

  frontend:
    container_name: crm-staging-frontend
    image: ${FRONTEND_IMAGE:-crm-frontend:staging}
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}
      - NEXT_PUBLIC_ENABLE_DEVTOOLS=true  # Enabled for staging
    networks:
      - crm-staging-network
    depends_on:
      - backend

  backend:
    container_name: crm-staging-backend
    image: ${BACKEND_IMAGE:-crm-backend:staging}
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - crm-staging-network
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    container_name: crm-staging-postgres
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - crm_pg_data_staging:/var/lib/postgresql/data  # Separate volume
    networks:
      - crm-staging-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  crm-staging-network:
    driver: bridge

volumes:
  crm_pg_data_staging:
    driver: local
```

## Step 4: Configure Environment Variables

```bash
cd /var/www/crm-staging
nano .env.stage
```

**Essential staging configuration:**

```env
# Nginx
NGINX_PORT=8080

# Database (staging)
POSTGRES_DB=crm_staging
POSTGRES_USER=crm
POSTGRES_PASSWORD=YOUR_STAGING_PASSWORD  # Use different from production

# Security (staging)
JWT_SECRET=YOUR_STAGING_JWT_SECRET  # Use different from production

# API URLs (with :8080 port!)
NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api

# Docker Images
FRONTEND_IMAGE=crm-frontend:staging
BACKEND_IMAGE=crm-backend:staging

# Development
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
```

**CRITICAL**: API URL must include `:8080` port for staging!

## Step 5: Prepare Docker Images

### Option A: Manual Build (Recommended for First Deployment)

On **local machine**:

```bash
cd /path/to/CRM

# Build staging images with correct API URL
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api \
  --build-arg NEXT_PUBLIC_ENABLE_DEVTOOLS=true \
  -t crm-frontend:staging \
  -f docker/frontend/Dockerfile .

docker buildx build --platform linux/amd64 \
  -t crm-backend:staging \
  -f docker/backend/Dockerfile .

# Export images
docker save crm-frontend:staging | gzip > crm-frontend-staging.tar.gz
docker save crm-backend:staging | gzip > crm-backend-staging.tar.gz

# Transfer to server
scp crm-frontend-staging.tar.gz root@YOUR_SERVER_IP:/tmp/
scp crm-backend-staging.tar.gz root@YOUR_SERVER_IP:/tmp/
```

On **server**:

```bash
# Load images
docker load < /tmp/crm-frontend-staging.tar.gz
docker load < /tmp/crm-backend-staging.tar.gz

# Verify
docker images | grep staging

# Cleanup
rm /tmp/crm-*-staging.tar.gz
```

### Option B: Use Production Images

```bash
# Tag production images as staging
docker tag crm-frontend:latest crm-frontend:staging
docker tag crm-backend:latest crm-backend:staging

# Update .env.stage if needed
nano /var/www/crm-staging/.env.stage
# FRONTEND_IMAGE=crm-frontend:staging
# BACKEND_IMAGE=crm-backend:staging
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
sudo ufw allow 8080/tcp comment 'crm Staging'

# Verify
sudo ufw status numbered
```

**Expected output:**
```
To                         Action      From
--                         ------      ----
80/tcp (Nginx HTTP)        ALLOW       Anywhere
8080/tcp (crm Staging) ALLOW       Anywhere
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
cd /var/www/crm-staging

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
crm-staging-backend      Up (healthy)    
crm-staging-frontend     Up (healthy)    
crm-staging-nginx        Up              0.0.0.0:8080->80/tcp
crm-staging-postgres     Up (healthy)    
```

## Step 8: Database Setup

### Run Migrations

```bash
# Apply database schema
docker exec crm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'
```

### Seed Database (optional, manual)

```bash
# Demo data only — CI does not run seed
docker exec crm-staging-backend sh -c 'cd /app/db && ppnpm run seed'
# Prefer: crm-stage-main-backend / crm-stage-develop-backend
```

**Seed creates (when successful):**
- Users including `admin@example.com` / `1`
- Sample contacts, deals, appointments

Skipping seed is fine if you create users another way.

## Step 9: Verify Staging Deployment

### Check Container Status

```bash
# All containers
docker compose -f docker-compose.stage.yml ps

# Detailed status
docker ps --filter "name=crm-staging"

# Health checks
docker inspect crm-staging-backend | grep -A 10 Health
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
  -d '{"email":"admin@example.com","password":"1"}'
# Should return: {"success":true,"token":"..."}

# Get users
curl http://localhost:8080/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return: [{"id":1,"email":"admin@example.com",...}]
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
- Email: `admin@example.com`
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
nano /var/www/crm-staging/nginx.stage.conf
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
  -t crm-frontend:staging \
  -f docker/frontend/Dockerfile .

docker buildx build --platform linux/amd64 \
  -t crm-backend:staging \
  -f docker/backend/Dockerfile .

# Export and transfer
docker save crm-frontend:staging | gzip > crm-frontend-staging.tar.gz
docker save crm-backend:staging | gzip > crm-backend-staging.tar.gz

scp crm-frontend-staging.tar.gz root@YOUR_SERVER_IP:/tmp/
scp crm-backend-staging.tar.gz root@YOUR_SERVER_IP:/tmp/
```

On **server**:

```bash
# Load new images
docker load < /tmp/crm-frontend-staging.tar.gz
docker load < /tmp/crm-backend-staging.tar.gz

# Restart staging
cd /var/www/crm-staging
docker compose -f docker-compose.stage.yml up -d --force-recreate

# Run migrations if database changed
docker exec crm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Cleanup
rm /tmp/crm-*-staging.tar.gz
```

## Managing Both Environments

### View All Services

```bash
# Production
docker compose -f /var/www/crm-production/docker-compose.yml ps

# Staging
docker compose -f /var/www/crm-staging/docker-compose.stage.yml ps

# All containers
docker ps
```

### Stop/Start Services

```bash
# Stop staging (production keeps running)
cd /var/www/crm-staging
docker compose -f docker-compose.stage.yml stop

# Start staging
docker compose -f docker-compose.stage.yml start

# Restart specific service
docker compose -f docker-compose.stage.yml restart backend
```

### View Logs

```bash
# Production logs
docker compose -f /var/www/crm-production/docker-compose.yml logs -f

# Staging logs
docker compose -f /var/www/crm-staging/docker-compose.stage.yml logs -f

# Specific container
docker logs -f crm-staging-backend
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
  -t crm-frontend:staging \
  -f docker/frontend/Dockerfile .

# Export, transfer, load, restart (see Update section)
```

**Verify build args:**
```bash
# On server
docker exec crm-staging-frontend sh -c 'cat /app/.env.local'
# Should show: NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api
```

### Issue: Database empty after deployment

**Symptom**: Login fails, no users exist

**Cause**: Seed script not run

**Solution**: Run seed manually

```bash
docker exec crm-staging-backend sh -c 'cd /app/db && pnpm run seed'
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
cd /var/www/crm-staging

# Stop and remove containers
docker compose -f docker-compose.stage.yml down

# Remove volumes (deletes all data!)
docker compose -f docker-compose.stage.yml down -v

# Remove staging directory
cd /var/www
rm -rf crm-staging

# Remove staging images
docker rmi crm-frontend:staging
docker rmi crm-backend:staging

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
docker volume rm crm_pg_data_staging

# Restart services
docker compose -f docker-compose.stage.yml up -d

# Wait for postgres to be ready
sleep 20

# Run migrations
docker exec crm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Seed database
docker exec crm-staging-backend sh -c 'cd /app/db && pnpm run seed'
```

## Next Steps

- **[Container Management](05-management.md)** - Day-to-day operations for both environments
- **[Troubleshooting Guide](06-troubleshooting.md)** - Common issues and solutions

---

[← Back to Manual Build Deployment](03-production-manual-build.md) | [Next: Container Management →](05-management.md)
