# Production Deployment via GitHub Actions

Automated deployment using GitHub Actions and GitHub Container Registry.

## Overview

**Best for**: Teams, automated deployments, version control

**Advantages**:
- ✅ Automatic builds on push/merge
- ✅ Image versioning and history
- ✅ No manual image building
- ✅ Minimal server configuration
- ✅ Images stored in GitHub Container Registry

## Prerequisites

- [Server setup completed](01-server-setup.md)
- GitHub repository with workflow configured
- GitHub Personal Access Token (for pulling images)

## Architecture

```
Developer → GitHub Push → GitHub Actions → Build Images → 
GitHub Container Registry → Server Pull → Docker Compose Up
```

## Step 1: Configure GitHub Actions

The workflow file should already exist at `.github/workflows/docker-publish.yml`.

**Key features**:
- Builds on every push to `main`
- Creates tags for releases
- Publishes to `ghcr.io/YOUR_USERNAME/crm`

## Step 2: Prepare Deployment Package

On your **local machine**:

```bash
cd /path/to/LoyaCareCRM

# Create deployment package directory
mkdir -p deployment-package

# Copy required configuration files
cp docker-compose.yml deployment-package/
cp .env.example deployment-package/
cp nginx.conf deployment-package/

# Create archive
tar -czf loyacrm-deployment.tar.gz deployment-package/

# Copy to server
scp loyacrm-deployment.tar.gz root@YOUR_SERVER_IP:/var/www/
```

## Step 3: Extract and Configure on Server

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Navigate to upload location
cd /var/www

# Extract archive
tar -xzf loyacrm-deployment.tar.gz

# Move files to production directory
mv deployment-package/* loyacrm-production/

# Cleanup
rm -rf deployment-package loyacrm-deployment.tar.gz

# Go to production directory
cd /var/www/loyacrm-production
```

## Step 4: Update docker-compose.yml

Edit `docker-compose.yml` to use GitHub Container Registry images:

```bash
nano docker-compose.yml
```

**Update image references:**

```yaml
services:
  frontend:
    # Use your GitHub username/organization
    image: ghcr.io/sergeylc/crm/frontend:latest
    # For specific version:
    # image: ghcr.io/sergeylc/crm/frontend:v1.0.0
    
  backend:
    image: ghcr.io/sergeylc/crm/backend:latest
    # For specific version:
    # image: ghcr.io/sergeylc/crm/backend:v1.0.0
```

## Step 5: Authenticate with GitHub Container Registry

### Create Personal Access Token

1. Go to GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `read:packages` - Download packages
   - ✅ `write:packages` - Publish packages (optional)
4. Generate and copy the token

### Login to Registry

```bash
# On server
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Verify login
docker login ghcr.io
# Should show: Login Succeeded
```

## Step 6: Configure Environment Variables

```bash
cd /var/www/loyacrm-production

# Create .env from template
cp .env.example .env

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

echo "Generated DB Password: $DB_PASSWORD"
echo "Generated JWT Secret: $JWT_SECRET"

# Edit .env file
nano .env
```

**Configure these essential variables:**

```env
# Domain
DOMAIN=YOUR_SERVER_IP

# Database
POSTGRES_DB=loyacrm
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=YOUR_GENERATED_PASSWORD

# Security
JWT_SECRET=YOUR_GENERATED_JWT_SECRET

# API URLs
NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api

# Docker Images (update with your repository)
FRONTEND_IMAGE=ghcr.io/YOUR_USERNAME/crm/frontend:latest
BACKEND_IMAGE=ghcr.io/YOUR_USERNAME/crm/backend:latest
```

## Step 7: Start Services

```bash
cd /var/www/loyacrm-production

# Pull images from GitHub Container Registry
docker compose pull

# Start all services
docker compose up -d

# Wait for services to start (30-60 seconds)
sleep 30

# Check service status
docker compose ps
```

**Expected output:**
```
NAME                     STATUS          PORTS
loyacrm-backend          Up (healthy)    
loyacrm-frontend         Up (healthy)    
loyacrm-nginx            Up              0.0.0.0:80->80/tcp
loyacrm-postgres         Up (healthy)    
```

## Step 8: Run Database Migrations

```bash
# Apply database migrations
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Run seed data (first deployment only)
docker exec loyacrm-backend sh -c 'cd /app/db && npm run seed'
```

**Seed creates**:
- 13 users (admin@loya.care / password: 1)
- 110 contacts
- 110 deals
- Test groups and notes

## Step 9: Verify Deployment

### Check Logs

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Test API

```bash
# Health check
curl http://localhost/api/health

# Login test
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loya.care","password":"1"}'

# Should return: {"success":true, ...}
```

### Test Frontend

```bash
# Access home page
curl -I http://localhost/de

# Should return: HTTP/1.1 200 OK
```

### Browser Access

Open in browser: `http://YOUR_SERVER_IP/de`

**Default credentials:**
- Email: `admin@loya.care`
- Password: `1`

## Updating Application

When new code is pushed to GitHub:

### Automatic (via GitHub Actions)

1. **Push code to GitHub:**
   ```bash
   git push origin main
   ```

2. **GitHub Actions automatically builds and publishes new images**

3. **Update on server:**
   ```bash
   cd /var/www/loyacrm-production
   
   # Pull new images
   docker compose pull
   
   # Restart with new images
   docker compose up -d
   
   # Check status
   docker compose ps
   ```

### Using Specific Versions

```bash
# Edit .env to use specific version
nano .env

# Change from:
FRONTEND_IMAGE=ghcr.io/YOUR_USERNAME/crm/frontend:latest

# To specific version:
FRONTEND_IMAGE=ghcr.io/YOUR_USERNAME/crm/frontend:v1.2.0

# Pull and restart
docker compose pull
docker compose up -d
```

## Rollback to Previous Version

```bash
# Edit .env to use previous version tag
nano .env

# Update image version to previous tag
# FRONTEND_IMAGE=ghcr.io/YOUR_USERNAME/crm/frontend:v1.1.0

# Pull old version
docker compose pull

# Restart
docker compose up -d
```

## Monitoring

### View Container Status

```bash
docker compose ps
docker stats
```

### Check Resource Usage

```bash
# Disk usage
df -h

# Docker disk usage
docker system df

# Memory usage
free -h
```

### View Recent Logs

```bash
# Last 100 lines
docker compose logs --tail 100

# Last 100 lines with errors
docker compose logs --tail 100 | grep -i error
```

## Troubleshooting

### Images not pulling

```bash
# Re-login to registry
docker logout ghcr.io
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Try pull again
docker compose pull
```

### Service unhealthy

```bash
# Check specific service logs
docker compose logs backend

# Restart service
docker compose restart backend

# Force recreate
docker compose up -d --force-recreate backend
```

### Database connection errors

```bash
# Check PostgreSQL logs
docker compose logs postgres

# Verify DATABASE_URL in backend
docker exec loyacrm-backend env | grep DATABASE_URL

# Test connection
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "SELECT 1;"
```

## Security Best Practices

1. **Use specific version tags** instead of `:latest` in production
2. **Regularly update images** for security patches
3. **Keep GitHub token secure** - never commit to repository
4. **Review GitHub Actions logs** for failed builds
5. **Set up automated backups** (see [Management Guide](05-management.md))

## Next Steps

- **[Deploy Staging Environment](04-staging-deployment.md)** - Set up test environment
- **[Container Management](05-management.md)** - Day-to-day operations
- **[Troubleshooting Guide](06-troubleshooting.md)** - Common issues

---

[← Back to Server Setup](01-server-setup.md) | [Next: Manual Build Deployment →](03-production-manual-build.md)
