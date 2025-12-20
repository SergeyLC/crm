# LoyaCareCRM - Docker Deployment Documentation

Complete guide for deploying LoyaCareCRM on Ubuntu server using Docker.

## 📋 Documentation Structure

### Getting Started
- **[Server Setup Guide](01-server-setup.md)** - Initial server preparation, Docker installation, and directory structure

### Production Deployment
- **[GitHub Actions Deployment](02-production-github-actions.md)** - Recommended: Automated CI/CD deployment
- **[Manual Build Deployment](03-production-manual-build.md)** - Manual local build and server deployment

### Additional Environments
- **[Staging Deployment](04-staging-deployment.md)** - Test environment setup on port 8080

### Operations
- **[Container Management](05-management.md)** - Day-to-day operations, updates, and backups
- **[Troubleshooting](06-troubleshooting.md)** - Common issues and solutions

### Supplementary Guides
- **[GitHub Secrets Setup](GITHUB_SECRETS_GUIDE.md)** - Configure GitHub Actions secrets for CI/CD
- **[Nginx Optimization](NGINX_OPTIMIZATION.md)** - Performance tuning, caching, and HTTP/2 setup
- **[Server Performance](SERVER_PERFORMANCE.md)** - pnpm migration, npm optimization, and speed improvements
- **[Deployment Optimization](DEPLOYMENT_OPTIMIZATION.md)** - CI/CD workflow optimizations and time savings

## 🚀 Quick Start

### For Production (Recommended Path)
1. [Set up your server](01-server-setup.md) - 15 minutes
2. Choose deployment method:
   - [GitHub Actions](02-production-github-actions.md) - Best for teams
   - [Manual Build](03-production-manual-build.md) - Best for quick deployment
3. Access your app at `http://YOUR_SERVER_IP`

### For Staging Environment
1. Complete production setup first
2. Follow [Staging Deployment Guide](04-staging-deployment.md)
3. Access staging at `http://YOUR_SERVER_IP:8080`

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│  Nginx (Port 80/8080)                   │
│  ├─ Frontend (Next.js) - Port 3000      │
│  └─ Backend (Express) - Port 4000       │
│      └─ PostgreSQL 16 - Port 5432       │
└─────────────────────────────────────────┘
```

### Production vs Staging

| Parameter | Production | Staging |
|-----------|-----------|---------|
| HTTP Port | 80 | 8080 |
| Database | `loyacrm` | `loyacrm_staging` |
| Volume | `loyacrm_pg_data` | `loyacrm_pg_data_staging` |
| Containers | `loyacrm-*` | `loyacrm-staging-*` |
| Images | `:latest` | `:staging` |
| Directory | `/var/www/loyacrm-production` | `/var/www/loyacrm-staging` |

## 📦 What's Included

- ✅ Docker-based deployment (no source code on server)
- ✅ Nginx reverse proxy configuration
- ✅ PostgreSQL 16 with automatic backups
- ✅ Health checks for all services
- ✅ Separate staging environment
- ✅ Environment variable management
- ✅ Zero-downtime updates

## 🔒 Security

- Database credentials stored in `.env` files
- JWT secrets for authentication
- Nginx SSL/TLS ready (optional)
- Firewall configuration included
- Automatic security updates recommended

## 📊 Requirements

- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 2GB (recommended 4GB)
- **CPU**: 2+ cores
- **Disk**: Minimum 10GB free space
- **Access**: SSH with root/sudo privileges

## 🆘 Need Help?

1. Check [Troubleshooting Guide](06-troubleshooting.md)
2. Review container logs: `docker compose logs`
3. Verify service status: `docker compose ps`
4. Search [archived documentation](archive/) for legacy deployment methods

## 📂 Archive

Old deployment documentation has been moved to the [archive/](archive/) directory. These guides are kept for reference but may contain outdated information. **Always use the main guides above for current deployments.**

## 📝 License

LoyaCareCRM - Internal Documentation

---

**Last Updated**: December 20, 2025  
**Version**: 2.0  
**Project**: LoyaCareCRM
