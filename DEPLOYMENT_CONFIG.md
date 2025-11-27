# 🚀 Deployment Configuration Guide

This guide explains how to configure the unified deployment system for LoyaCare CRM.

## 📋 Deployment Strategy

The deployment system uses two dimensions:
- **Environment:** Determined by branch (`main` → production, `develop` → staging)
- **Deployment Type:** Determined by configuration priority (default: `docker`)

### Supported Combinations

| Branch | Environment | Default Type | Override Methods |
|--------|-------------|--------------|------------------|
| `main` | production | docker | workflow_dispatch, vars, env |
| `develop` | staging | docker | workflow_dispatch, vars, env |

### Deployment Type Selection Guide

#### When to Use Docker Deployment 🐳
- **Recommended for:** Production and staging environments
- **Benefits:** Isolated containers, easy rollback, consistent environment
- **Use case:** Standard deployments, microservices architecture

#### When to Use Traditional Deployment 📦
- **Recommended for:** Development, testing, or legacy systems
- **Benefits:** Direct server access, easier debugging, lower resource usage
- **Use case:** Custom server configurations, development environments

#### How to Choose Deployment Type

1. **For Production:**
   - Use **Docker** (default) for stability and isolation
   - Use **Traditional** only if Docker is not feasible

2. **For Staging:**
   - Use **Docker** (default) to match production environment
   - Use **Traditional** for development/testing flexibility

3. **For Manual Testing:**
   - Use **workflow_dispatch** to override type per deployment
   - Test both types before committing to repository variables

## ⚙️ GitHub Configuration

### 1. Repository Variables

Go to **Settings → Secrets and variables → Actions**

#### Repository Variables (apply to all environments):
```
DEPLOYMENT_TYPE=docker  # or 'traditional'
```

### 2. Environment Setup

Create two environments in **Settings → Environments**:

#### Production Environment
- **Name:** `production`
- **Environment variables:**
  ```
  DEPLOYMENT_TYPE=docker  # override if needed
  ```
- **Environment secrets:** (same as before)
  ```
  SERVER_HOST=your-production-server.com
  SERVER_USER=your-user
  SERVER_SSH_KEY=your-private-key
  DATABASE_URL=postgresql://user:pass@host:5432/db
  JWT_SECRET=your-jwt-secret
  ```

#### Staging Environment
- **Name:** `staging`
- **Environment variables:**
  ```
  DEPLOYMENT_TYPE=docker  # override if needed
  ```
- **Environment secrets:** (staging-specific)
  ```
  SERVER_HOST=your-staging-server.com
  SERVER_USER=your-user
  SERVER_SSH_KEY=your-private-key
  DATABASE_URL=postgresql://user:pass@host:5432/db
  JWT_SECRET=your-jwt-secret
  ```

## 🔄 How It Works

### Deployment Type Priority

The system determines deployment type using this priority order:

1. **Workflow Dispatch Override** (highest priority)
   - Manual trigger via GitHub Actions UI
   - Allows testing different deployment types
   - Input: `deployment_type` (docker/traditional)

2. **Environment Variable** (per-environment)
   - Set in GitHub Environment variables
   - Overrides repository default for specific environment
   - Variable: `DEPLOYMENT_TYPE=docker`

3. **Repository Variable** (global default)
   - Set in repository Actions variables
   - Applies to all branches/environments
   - Variable: `DEPLOYMENT_TYPE=docker`

4. **Default: `docker`** (lowest priority)
   - Used when no other configuration is found
   - Ensures consistent behavior

### Examples

```bash
# Repository variable sets global default
DEPLOYMENT_TYPE=traditional

# Environment variable overrides for production only
# Production environment: DEPLOYMENT_TYPE=docker
# Result: Production uses Docker, Staging uses Traditional

# Workflow dispatch overrides everything
# Manual run with deployment_type=docker
# Result: Uses Docker regardless of variables
```

### Automatic Deployment
```bash
# Push to main → Production deployment (type from config)
git push origin main

# Push to develop → Staging deployment (type from config)
git push origin develop
```

### Release Creation (Version Increment)
```bash
# Create and push version tag
git tag v1.2.3
git push origin v1.2.3

# This triggers:
# 1. Version increment in package.json
# 2. GitHub release creation
# 3. Production deployment with new version
```

### Manual Override

Use **workflow_dispatch** to override deployment type for specific runs:

1. Go to **Actions → Deploy Application**
2. Click **Run workflow**
3. **Choose branch:** `main` (production) or `develop` (staging)
4. **Set inputs:**
   - **Deployment type:** Choose `docker` or `traditional` (leave empty to use default)
   - **Force deploy:** Check to bypass normal conditions
   - **Version:** Specify version for release creation (optional)
5. Click **Run workflow**

### Environment Variable Override
Set `DEPLOYMENT_TYPE` in repository variables to change default:

```yaml
# In GitHub: Settings → Secrets and variables → Actions → Variables
DEPLOYMENT_TYPE=traditional  # All deployments will be traditional
```

Or override per environment in **Settings → Environments → [environment] → Variables**:
```yaml
DEPLOYMENT_TYPE=docker  # Override for specific environment
```

## 🐳 Docker Deployment

### What happens:
1. **Build:** Frontend and backend images are built and pushed to GHCR
2. **Deploy:** Images are pulled on server and containers are started
3. **Migrate:** Database migrations run automatically
4. **Health Check:** Services are verified to be running

### Server Requirements:
- Docker and Docker Compose installed
- `docker-example/` directory with configurations
- SSH access for deployment user

## 📦 Traditional Deployment

### What happens:
1. **Build:** Applications are built locally in CI
2. **Deploy:** Source code is copied to server
3. **Install:** Dependencies are installed
4. **Migrate:** Database migrations run
5. **Start:** Services are started with PM2/systemd

### Server Requirements:
- Node.js and pnpm installed
- PM2 or systemd for process management
- Database access
- SSH access for deployment user

## 🏷️ Release Management

### Creating a New Release

To create a new production release with automatic version increment:

```bash
# 1. Update version in package.json (optional, will be auto-updated)
npm version patch  # or minor, major

# 2. Create and push git tag
git tag v1.2.3
git push origin v1.2.3

# 3. Workflow automatically:
#    - Updates package.json version
#    - Creates GitHub release
#    - Deploys to production
#    - Updates Docker images with version tag
```

### Release Process

1. **Tag Creation:** Push tag `v*` to repository
2. **Validation:** Checks if tag is on `main` branch
3. **Version Update:** Updates `frontend/package.json` version
4. **Git Commit:** Commits version change back to `main`
5. **GitHub Release:** Creates release with changelog
6. **Deployment:** Triggers production deployment with new version

### Version Tags

- `v1.2.3` → Production release 1.2.3
- `latest` → Always points to latest production deployment
- `staging-*` → Staging deployments with commit hash

### Rollback

To rollback to previous version:

```bash
# Deploy specific version
# Use workflow_dispatch with version input
# Or create tag pointing to previous commit
git tag v1.2.2 <previous-commit-hash>
git push origin v1.2.2
```

### Adding New Deployment Types

1. Add new type to workflow validation:
```yaml
if [[ "$DEPLOYMENT_TYPE" != "docker" && "$DEPLOYMENT_TYPE" != "traditional" && "$DEPLOYMENT_TYPE" != "newtype" ]]; then
```

2. Create new job in workflow:
```yaml
deploy-newtype:
  needs: setup
  if: needs.setup.outputs.deployment_type == 'newtype'
  # Implementation...
```

### Adding New Environments

1. Add branch mapping in setup job:
```yaml
feature)
  ENVIRONMENT="feature"
  ;;
```

2. Create new GitHub environment with same name
3. Add environment secrets and variables

## 🚨 Troubleshooting

### Deployment Not Triggering
- Check branch name matches (`main`/`develop`)
- Verify workflow file is in `.github/workflows/deploy.yml`
- Check GitHub Actions permissions

### Wrong Deployment Type
- Check deployment type priority order (workflow_dispatch > env var > repo var > default)
- Use workflow_dispatch to override manually for testing
- Verify environment variables in GitHub Environments
- Check repository variables in Actions → Variables

### Docker Deployment Issues
- Ensure `docker-example/` exists on server
- Check Docker secrets are created
- Verify image pull permissions

### Traditional Deployment Issues
- Implement the placeholder steps in workflow
- Ensure server has required dependencies
- Check PM2/systemd configuration

## 📊 Monitoring

### Deployment Status
- Check **Actions** tab for workflow runs
- Each deployment shows detailed logs
- Environment badges show deployment status

### Rollback
- For Docker: Deploy previous image tag
- For Traditional: Restore from backup directory

---

**Last Updated:** November 2025

## 📝 Recent Changes

### November 2025 - Deployment Type Selection Enhancement
- **Added workflow_dispatch override** for manual deployment type selection
- **Implemented priority system** for deployment type determination
- **Enhanced documentation** with selection guide and examples
- **Improved troubleshooting** for deployment type issues