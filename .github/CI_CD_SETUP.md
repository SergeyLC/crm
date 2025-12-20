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

Configure these secrets in your repository: **Settings → Secrets and variables → Actions → Repository secrets**

### Server Access
| Secret | Description | Example |
|--------|-------------|---------|
| `SERVER_HOST` | Server IP address | `217.160.74.128` |
| `SERVER_USER` | SSH username | `root` |
| `SERVER_SSH_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### Application Secrets
| Secret | Description | Example |
|--------|-------------|---------|
| `JWT_SECRET` | JWT token secret (min 32 chars) | `your-super-secret-jwt-key-min-32-characters` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

## Server Setup

### 1. Production Server Setup

```bash
# Create deployment directory
mkdir -p /var/www/loyacrm-production
cd /var/www/loyacrm-production

# Clone repository (or copy files)
git clone https://github.com/SergeyLC/crm.git .

# Create environment file from example
cp .env.production.example .env

# Edit environment file with your values
nano .env
```

**Required changes in `.env`:**
- `POSTGRES_PASSWORD` - Set secure database password
- `JWT_SECRET` - Set secure JWT secret (min 32 characters)
- `NEXT_PUBLIC_BACKEND_API_URL` - Set to your server IP
- `CORS_ORIGIN` - Set to your server IP

### 2. Staging Server Setup

```bash
# Create deployment directory
mkdir -p /var/www/loyacrm-staging
cd /var/www/loyacrm-staging

# Clone repository (or copy files)
git clone https://github.com/SergeyLC/crm.git .

# Create environment file from example
cp .env.staging.example .env.stage

# Edit environment file with your values
nano .env.stage
```

**Required changes in `.env.stage`:**
- `POSTGRES_PASSWORD` - Set secure database password
- `JWT_SECRET` - Set secure JWT secret (min 32 characters)
- `NEXT_PUBLIC_BACKEND_API_URL` - Set to your server IP:8080
- `CORS_ORIGIN` - Set to your server IP:8080

### 3. Docker Registry Authentication

Authenticate Docker to pull images from GitHub Container Registry:

```bash
# Create GitHub Personal Access Token
# Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# Generate new token with 'read:packages' scope

# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 4. Initial Docker Compose Setup

```bash
# Production
cd /var/www/loyacrm-production
docker compose up -d

# Staging
cd /var/www/loyacrm-staging
docker compose -f docker-compose.stage.yml up -d
```

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
