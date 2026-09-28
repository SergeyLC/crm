# Archived Documentation

This directory contains **legacy deployment documentation** that has been superseded by the new modular guides in the parent directory.

## ⚠️ Important Notice

**These documents are OUTDATED and kept only for historical reference.**

For current deployment instructions, please use:
- **[Main Documentation](../README.md)** — environment matrix
- **[.github/CI_CD_SETUP.md](../../.github/CI_CD_SETUP.md)** — branch/tag → environment (source of truth)
- **[Server Setup Guide](../01-server-setup.md)**
- **[Production via GitHub Actions](../02-production-github-actions.md)** — tag `v*` → port 80
- **[Staging](../04-staging-deployment.md)** — `stage-main` :8080 / `stage-develop` :8081

Do not follow archive guides for new deploys.

## 📚 What's in This Archive

### Traditional Deployment Guides (Pre-Docker)
- `DEPLOYMENT_TRADITIONAL.md` - Manual PM2/Nginx setup
- `SERVER_SETUP.md` - Old server configuration
- `STAGING_SETUP.md` - Old staging setup without Docker

### Legacy Docker Guides
- `DEPLOYMENT_DOCKER.md` - Old Docker deployment guide
- `DOCKER_QUICK_START.md` - Superseded by new guides
- `DOCKER_DEVELOPMENT.md` - Development environment (outdated)

### CI/CD Workflows
- `CI_CD_WORKFLOW.md` - Old GitHub Actions workflow
- `DOCKER_CI_CD_WORKFLOW.md` - Legacy CI/CD documentation

### Mixed Language Documentation
- `DEPLOYMENT.md` - English version (outdated)
- `DEPLOYMENT.de.md` - German version (outdated)

### Quick Reference (Outdated)
- `SECRETS_QUICKSTART.md` - Quick secrets setup
- `STAGING_COMMANDS.md` - Old staging commands
- `STAGING_QUICK_SETUP_IP.md` - Legacy quick setup

### Production Guides (Outdated)
- `DEPLOYMENT_PRODUCTION.md` - Old production deployment

## 🔄 Migration Notes

If you're currently using any of these guides:

1. **Traditional PM2 Deployment** → Migrate to [Manual Build Docker Deployment](../03-production-manual-build.md)
2. **Old Docker Setup** → Use [new Docker guides](../README.md)
3. **Legacy Staging** → Follow [new Staging Guide](../04-staging-deployment.md)
4. **Old CI/CD** → Update to [GitHub Actions Guide](../02-production-github-actions.md)

## 📅 Archive Date

**Archived**: December 20, 2025  
**Reason**: Documentation restructuring and modernization  
**Replacement**: Modular English-only Docker-based guides

## 💡 Why These Were Archived

1. **Fragmentation** - Too many overlapping guides
2. **Mixed Languages** - English and German mixed in same repository
3. **Outdated Methods** - PM2/manual deployment superseded by Docker
4. **Poor Navigation** - Hard to find the right guide
5. **Maintenance Burden** - Multiple guides describing same processes

## ✅ What Replaced Them

The new documentation structure offers:
- **7 focused guides** instead of 14+ fragmented files
- **All in English** for consistency
- **Docker-first** approach (industry standard)
- **Clear navigation** with cross-links
- **Step-by-step instructions** with troubleshooting
- **Production AND Staging** in dedicated guides

---

[← Back to Main Documentation](../README.md)
