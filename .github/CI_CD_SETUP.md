# GitHub Actions CI/CD Setup Guide

## Overview

This project uses GitHub Actions for automated deployment to production and staging environments via Docker containers.

## Workflow

### Staging Deployment
- **Trigger**: Push to `main` or `develop` branch
- **Environment**: Staging server
- **Docker Images**: Tagged with `staging-{commit}-{timestamp}`
- **Port**: 8080
- **Database**: `loyacrm_staging`

### Production Deployment
- **Trigger**: Push git tag `v*` (e.g., `v1.4.2`)
- **Environment**: Production server
- **Docker Images**: Tagged with version (e.g., `v1.4.2`)
- **Port**: 80
- **Database**: `loyacrm`

## Required GitHub Secrets

Configure secrets in your repository following this structure for better security and organization.

### Step 1: Create Environments

**GitHub → Repository → Settings → Environments**

Create two environments:

#### **Production Environment**
- **Name**: `production`
- **Protection rules** (optional):
  - ✅ Required reviewers (добавьте себя для подтверждения prod деплоя)
  - ✅ Wait timer: 0 minutes
- **Environment secrets**:
  | Secret | Description | Example |
  |--------|-------------|---------|
  | `POSTGRES_DB` | Production database name | `loyacrm` |
  | `POSTGRES_USER` | Production database user | `loyacrm` |
  | `POSTGRES_PASSWORD` | Production database password | Generated with `openssl rand -base64 32` |
  | `JWT_SECRET` | Production JWT secret (min 32 chars) | Generated with `openssl rand -base64 64` |

#### **Staging Environment**
- **Name**: `staging`
- **Environment secrets**:
  | Secret | Description | Example |
  |--------|-------------|---------|
  | `POSTGRES_DB` | Staging database name | `loyacrm_staging` |
  | `POSTGRES_USER` | Staging database user | `loyacrm` or `loyacrm_staging` |
  | `POSTGRES_PASSWORD` | Staging database password | Generated with `openssl rand -base64 32` |
  | `JWT_SECRET` | Staging JWT secret (min 32 chars) | Generated with `openssl rand -base64 64` |

### Step 2: Repository Secrets (Shared)

**Settings → Secrets and variables → Actions → Repository secrets**

These secrets are shared across all environments:

| Secret | Description | Example |
|--------|-------------|---------|
| `SERVER_HOST` | Server IP address | `217.154.173.36` |
| `SERVER_USER` | SSH username | `root` |
| `SERVER_SSH_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### Benefits of This Structure

✅ **Environment-specific secrets** - Different passwords for prod/staging  
✅ **Same secret names** - No PROD/STAGING suffixes needed  
✅ **Protection rules** - Can require approval for production deployments  
✅ **Clean workflow code** - Secrets automatically scoped to environment  
✅ **Better security** - Staging secrets can't leak to production

### Architecture Diagram

```
GitHub Repository
├── Repository Secrets (shared)
│   ├── SERVER_HOST = 217.154.173.36
│   ├── SERVER_USER = root
│   └── SERVER_SSH_KEY = (SSH private key)
│
├── Environment: production
│   ├── POSTGRES_PASSWORD = (prod password)
│   └── JWT_SECRET = (prod secret)
│
└── Environment: staging
    ├── POSTGRES_PASSWORD = (staging password)
    └── JWT_SECRET = (staging secret)
```

### Quick Setup Commands

Generate secure secrets:

```bash
# Generate PostgreSQL password (32 chars)
openssl rand -base64 32

# Generate JWT secret (64 chars)
openssl rand -base64 64

# Show your SSH private key (copy all output)
cat ~/.ssh/id_rsa
# or for newer keys:
cat ~/.ssh/id_ed25519
```

### Step-by-Step Setup

#### 1. Create Production Environment

1. Go to: **Settings → Environments → New environment**
2. Name: `production`
3. Click **Add secret** for each:
   - Name: `POSTGRES_DB`, Value: `loyacrm`
   - Name: `POSTGRES_USER`, Value: `loyacrm`
   - Name: `POSTGRES_PASSWORD`, Value: `openssl rand -base64 32`
   - Name: `JWT_SECRET`, Value: `openssl rand -base64 64`
4. (Optional) Add **Required reviewers** for deployment approval

#### 2. Create Staging Environment

1. **New environment**
2. Name: `staging`
3. **Add secret** for each (different values from production!):
   - Name: `POSTGRES_DB`, Value: `loyacrm_staging`
   - Name: `POSTGRES_USER`, Value: `loyacrm`
   - Name: `POSTGRES_PASSWORD`, Value: `openssl rand -base64 32`
   - Name: `JWT_SECRET`, Value: `openssl rand -base64 64`

#### 3. Add Repository Secrets

1. **Settings → Secrets and variables → Actions → Repository secrets**
2. **New repository secret**:
   - Name: `SERVER_HOST`
   - Value: `217.154.173.36`
3. **New repository secret**:
   - Name: `SERVER_USER`
   - Value: `root`
4. **New repository secret**:
   - Name: `SERVER_SSH_KEY`
   - Value: Copy your entire private key including `-----BEGIN` and `-----END` lines

### Verification Checklist

After setup, verify you have:

- [ ] Environment `production` created
- [ ] Environment `staging` created  
- [ ] `production` has `POSTGRES_DB` secret
- [ ] `production` has `POSTGRES_USER` secret
- [ ] `production` has `POSTGRES_PASSWORD` secret
- [ ] `production` has `JWT_SECRET` secret
- [ ] `staging` has `POSTGRES_DB` secret
- [ ] `staging` has `POSTGRES_USER` secret
- [ ] `staging` has `POSTGRES_PASSWORD` secret
- [ ] `staging` has `JWT_SECRET` secret
- [ ] Repository has `SERVER_HOST` secret
- [ ] Repository has `SERVER_USER` secret
- [ ] Repository has `SERVER_SSH_KEY` secret

## Server Setup

После настройки GitHub Secrets нужно подготовить сервер.

**Important**: Environment files (.env, .env.stage) are now **automatically created** by GitHub Actions using Environment Secrets. You only need to:
1. Create deployment directories
2. Install Docker and Docker Compose
3. Login to GitHub Container Registry

### 1. Production Server Setup

```bash
# Create deployment directory
mkdir -p /var/www/loyacrm-production

# Ensure Docker and Docker Compose are installed
docker --version
docker compose version

# Login to GitHub Container Registry (one-time setup)
# Replace USERNAME with your GitHub username
# Generate PAT at: https://github.com/settings/tokens (read:packages scope)
echo $GITHUB_PAT | docker login ghcr.io -u USERNAME --password-stdin
```

### 2. Staging Server Setup

```bash
# Create deployment directory
mkdir -p /var/www/loyacrm-staging

# Login to GitHub Container Registry if not done already
echo $GITHUB_PAT | docker login ghcr.io -u USERNAME --password-stdin
```

**Note**: All configuration files (docker-compose, nginx.conf, .env) will be automatically managed by GitHub Actions. No manual file creation needed!

### 3. Initial Deployment

After server setup, trigger the first deployment:

```bash
# For staging: Push to main branch
git push origin main

# For production: Create and push a release tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will:
1. Build Docker images
2. Copy deployment files to server
3. Create/update environment files with secrets
4. Pull images
5. Run database migrations
6. Start containers

# Staging
cd /var/www/loyacrm-staging

# Start postgres
docker compose -f docker-compose.stage.yml up -d postgres

# Wait and check status
sleep 10
docker compose -f docker-compose.stage.yml ps postgres
```

**Note:** 
- Frontend and backend containers will be started automatically by GitHub Actions during first deployment
- The deployment script will copy all necessary Docker Compose and Nginx configuration files
- You only need to create the `.env` or `.env.stage` file manually

## Deployment Process

### Staging Deployment

1. **Commit changes** to `main` or `develop` branch:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **GitHub Actions** will automatically:
   - Run tests
   - Build Docker images
   - Push to GitHub Container Registry
   - Deploy to staging server
   - Run database migrations
   - Restart containers

3. **Check deployment** status:
   - GitHub: Actions tab
   - Server: `docker ps` or `docker compose -f docker-compose.stage.yml ps`
   - URL: `http://YOUR_SERVER_IP:8080`

### Production Deployment

1. **Create release tag** using deploy script:
   ```bash
   # Auto-increment patch version
   ./deploy.sh -m "feat: new feature description" -t

   # Or specify version manually
   ./deploy.sh -m "feat: new feature description" -v 1.4.2
   ```

2. **GitHub Actions** will automatically:
   - Run tests
   - Build Docker images with version tag
   - Push to GitHub Container Registry
   - Create GitHub Release
   - Deploy to production server
   - Run database migrations
   - Restart containers

3. **Check deployment** status:
   - GitHub: Actions tab and Releases
   - Server: `docker ps` or `docker compose ps`
   - URL: `http://YOUR_SERVER_IP`

## Deployment Script Usage

The `deploy.sh` script simplifies the deployment process:

```bash
# View help
./deploy.sh -h

# Staging deployment (push to main)
./deploy.sh -m "fix: update user validation"

# Production release with auto-increment
./deploy.sh -m "feat: add dashboard" -t

# Production release with specific version
./deploy.sh -m "feat: add dashboard" -v 1.4.2

# Push without deployment (docs-only)
./deploy.sh -m "docs: update README" -s
```

## Monitoring Deployments

### GitHub Actions

- Navigate to **Actions** tab in repository
- Click on the running workflow
- Monitor each step in real-time
- Check logs for errors

### Server Monitoring

```bash
# Check Docker container status
docker ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Check specific container
docker logs loyacrm-backend
docker logs loyacrm-staging-backend
```

## Troubleshooting

### Deployment Fails at "Pull Docker images"

**Problem**: Cannot pull images from GitHub Container Registry

**Solution**:
```bash
# Re-authenticate on server
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Migration Fails

**Problem**: Database migration errors

**Solution**:
```bash
# Check database connection
docker exec loyacrm-backend sh -c 'cd /app/db && pnpm run migrate:status'

# Manually run migrations
docker exec loyacrm-backend sh -c 'cd /app/db && pnpm run migrate:deploy'
```

### Containers Not Starting

**Problem**: Health checks fail

**Solution**:
```bash
# Check logs
docker compose logs backend frontend

# Verify environment variables
docker exec loyacrm-backend env | grep DATABASE_URL

# Restart services
docker compose restart backend frontend
```

### Port Conflicts

**Problem**: Port already in use

**Solution**:
```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :8080

# Stop conflicting service or change port in .env
```

## Manual Deployment (Without GitHub Actions)

If you need to deploy manually:

```bash
# On your local machine
# 1. Build images
docker buildx build --platform linux/amd64 -t loyacrm-backend:latest -f docker/backend/Dockerfile .
docker buildx build --platform linux/amd64 -t loyacrm-frontend:latest -f docker/frontend/Dockerfile .

# 2. Save images
docker save loyacrm-backend:latest | gzip > backend.tar.gz
docker save loyacrm-frontend:latest | gzip > frontend.tar.gz

# 3. Transfer to server
scp backend.tar.gz root@YOUR_SERVER_IP:/var/www/loyacrm-production/
scp frontend.tar.gz root@YOUR_SERVER_IP:/var/www/loyacrm-production/

# On the server
# 4. Load images
docker load < backend.tar.gz
docker load < frontend.tar.gz

# 5. Update containers
cd /var/www/loyacrm-production
docker compose up -d --force-recreate
```

## Security Best Practices

1. **Never commit secrets** to repository
   - Use GitHub Secrets for sensitive data
   - Keep `.env` files on server only
   - Add `.env*` to `.gitignore` (except `.env*.example`)

2. **Use strong passwords**
   - Database password: 32+ characters
   - JWT secret: 32+ characters, random
   - Generate with: `openssl rand -base64 32`

3. **Limit SSH access**
   - Use SSH keys (no passwords)
   - Disable root login if possible
   - Use firewall to restrict access

4. **Keep images private**
   - GitHub Container Registry is private by default
   - Only authenticate necessary servers

5. **Regular updates**
   - Keep Docker images updated
   - Update dependencies regularly
   - Monitor security advisories

## Environment Variables Reference

See complete environment variable documentation:
- [DATABASE_ENV_CONFIG.md](../docs/DATABASE_ENV_CONFIG.md)
- [backend/README.env.md](../docs/backend/README.env.md)

## Related Documentation

- [deployment/README.md](../docs/deployment/README.md) - Docker deployment guide
- [deployment/02-production-github-actions.md](../docs/deployment/02-production-github-actions.md) - GitHub Actions deployment
- [deployment/03-production-manual-build.md](../docs/deployment/03-production-manual-build.md) - Manual deployment process

---

**Last Updated:** December 20, 2024  
**Deployment Method:** Docker Compose via GitHub Actions
