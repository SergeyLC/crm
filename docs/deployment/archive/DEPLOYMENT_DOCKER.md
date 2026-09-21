# 🚀 LoyaCareCRM Deployment Guide

*Complete deployment instructions for CRM system*

*[🇸 English | [🇩🇪 Deutsch](DEPLOYMENT.de.md)*

## 📋 Deployment Options

LoyaCareCRM supports multiple deployment methods:

### 🐳 **Docker Deployment (Recommended)**
- **Development**: Local development with hot reload
- **Stage**: Pre-production testing environment
- **Production**: Containerized production deployment
- **CI/CD**: Automated deployment via GitHub Actions

### 🖥️ **Traditional Server Deployment**
- Manual Ubuntu server setup with PM2, Nginx, PostgreSQL
- Suitable for custom server configurations

---

## 🐳 Docker Deployment

### Prerequisites

#### System Requirements
- **Docker**: Version 24.0+
- **Docker Compose**: Version 2.0+
- **Git**: Latest version
- **4GB RAM minimum** (8GB recommended)
- **2GB free disk space**

#### Installation
```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose (v2 plugin)
# Docker Compose v2 comes as a plugin with Docker
# If not included, install it separately:
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 🚀 Quick Start with Docker

#### 1. Clone Repository
```bash
git clone <your-repository-url> crm
cd crm
```

#### 2. Development Environment Setup
```bash
# Copy development environment file
cp .env.dev.example .env.dev

# Start development environment
docker compose -f docker-compose.dev.yml up --build -d

# Check container status
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f
```

#### 3. Stage Environment Setup
```bash
# Copy stage environment files
cp .env.backend.stage.example .env.backend.stage
cp .env.frontend.stage.example .env.frontend.stage

# Edit environment variables for stage
nano .env.backend.stage  # Configure database and secrets
nano .env.frontend.stage # Configure API URLs

# Start stage environment
docker compose -f docker-compose.stage.yml up --build -d

# Check status
docker compose -f docker-compose.stage.yml ps

# View logs
docker compose -f docker-compose.stage.yml logs -f
```

**Stage Environment Features:**
- Uses embedded PostgreSQL database with named volumes
- Separate database instance for stage testing
- All services accessible through Nginx reverse proxy on port 3004
- Health checks ensure service availability
- Production-like setup for testing

### Production Environment Setup
```bash
# Copy production environment files
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend

# Edit environment variables
nano .env.backend  # Configure database and secrets
nano .env.frontend # Configure API URLs

# Start production environment
docker compose -f docker-compose.yml up --build -d

# Check status
docker compose -f docker-compose.yml ps

# View logs
docker compose -f docker-compose.yml logs -f
```

### Understanding Persistent Storage (Production)

**Important:** PostgreSQL data is stored in a Docker named volume `crm_prod_pg_data`. This volume persists data between container restarts, deployments, and even container recreation. The volume is automatically created by Docker Compose and survives `docker compose down` commands.

**Volume location:** Docker manages the volume storage location automatically. To inspect:
```bash
# List volumes
docker volume ls

# Inspect volume details
docker volume inspect crm_prod_pg_data

# Check volume usage
docker system df -v
```

**⚠️ Data Safety:** Never delete the volume manually unless you want to lose all database data. Use `docker compose down -v` only if you intentionally want to reset the database.

### Production Database Setup
```bash
# Start only database service first
docker compose -f docker-compose.yml up -d postgres

# Wait for database to be ready
sleep 30

# Run migrations through container
docker compose -f docker-compose.yml exec backend sh -c "cd db && pnpm run migrate:deploy && pnpm run generate"
```

### Data Migration (Optional)
If migrating from existing database:
```bash
# Create dump of current database
pg_dump -h localhost -U crm crm > current_db_backup.sql

# Restore to Docker database
docker compose -f docker-compose.yml exec -T postgres psql -U crm crm < current_db_backup.sql
```

### 🌐 Access URLs

| Environment | Frontend | Backend API | Database | Nginx Port |
|-------------|----------|-------------|----------|------------|
| **Development** | http://localhost:3003 | http://localhost:3003/api | localhost:5435 | 3003 |
| **Stage** | http://localhost:3004 | http://localhost:3004/api | localhost:5436 | 3004 |
| **Production** | http://localhost:80 | http://localhost:80/api | localhost:5432 | 80 |

### 🛠️ Docker Convenience Scripts

This project includes several convenience scripts to simplify Docker management across different environments. These scripts provide a user-friendly interface for common Docker operations, making deployment and maintenance more accessible to developers and operations teams.

#### Benefits of Using Convenience Scripts:
- **Simplified Commands**: Single commands instead of complex Docker Compose syntax
- **Error Prevention**: Built-in validation and error checking
- **Environment Safety**: Environment-specific configurations prevent accidental cross-environment operations
- **User Experience**: Clear output messages and status indicators
- **Consistency**: Standardized operations across all environments
- **Documentation**: Self-documenting commands with help text

#### Available Scripts by Environment:

**Development Environment:**
- `docker-dev-start.sh` - Starts development environment with database migrations and health checks
- `docker-dev-stop.sh` - Stops all development services cleanly
- `docker-dev-logs.sh` - Displays real-time logs from development containers

**Stage Environment:**
- `docker-stage-start.sh` - Starts staging environment with build and validation
- `docker-stage-stop.sh` - Stops staging services
- `docker-stage-logs.sh` - Shows staging container logs (supports service filtering)

**Production Environment:**
- `docker-start.sh` - Starts production services on deployment server
- `docker-stop.sh` - Stops production services
- `docker-logs.sh` - Displays production logs
- `docker-update.sh` - Updates and restarts production services

#### Script Features:
- **Environment Validation**: Checks for required files and configurations
- **Error Handling**: Graceful failure with informative error messages
- **Status Output**: Clear success/failure indicators
- **Service Health**: Automatic health checks where applicable
- **Directory Safety**: Validates working directory before operations

### 🔧 Docker Management Commands

#### Development Environment
```bash
# Quick start/stop/logs (recommended for beginners)
./docker-dev-start.sh    # Start with migrations and checks
./docker-dev-stop.sh     # Stop all services
./docker-dev-logs.sh     # View logs

# Or manual commands
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml logs -f [service-name]
```

#### Stage Environment
```bash
# Quick start/stop/logs
./docker-stage-start.sh   # Start stage environment
./docker-stage-stop.sh    # Stop stage services
./docker-stage-logs.sh    # View logs (optionally: [service-name])

# Or manual commands
docker compose -f docker-compose.stage.yml up --build -d
docker compose -f docker-compose.stage.yml down
docker compose -f docker-compose.stage.yml logs -f [service-name]
```

#### Production Environment
```bash
# Quick management (on server)
./docker-start.sh         # Start production services
./docker-stop.sh          # Stop production services
./docker-logs.sh          # View production logs
./docker-update.sh        # Update and restart

# Or manual commands
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml logs -f [service-name]
```

#### Script Details and Usage

##### Development Scripts

**`docker-dev-start.sh`**
- **Purpose**: Complete development environment startup with validation
- **What it does**:
  - Validates environment files exist
  - Checks Docker availability
  - Starts all services with database migrations
  - Runs health checks
  - Displays access URLs and status
- **Usage**: `./docker-dev-start.sh`
- **Output**: Service status, access URLs, health check results

**`docker-dev-stop.sh`**
- **Purpose**: Clean shutdown of development environment
- **What it does**:
  - Stops all running containers
  - Preserves data volumes
  - Shows stopped services
- **Usage**: `./docker-dev-stop.sh`
- **Output**: Confirmation of stopped services

**`docker-dev-logs.sh`**
- **Purpose**: Real-time log monitoring for development
- **What it does**:
  - Displays logs from all services
  - Supports optional service filtering
  - Follows log output in real-time
- **Usage**: `./docker-dev-logs.sh [service-name]`
- **Output**: Continuous log stream

##### Stage Scripts

**`docker-stage-start.sh`**
- **Purpose**: Production-like staging environment startup
- **What it does**:
  - Validates stage-specific environment files
  - Builds images if needed
  - Starts services with proper networking
  - Verifies nginx proxy configuration
  - Shows access information
- **Usage**: `./docker-stage-start.sh`
- **Output**: Build status, service URLs, health indicators

**`docker-stage-stop.sh`**
- **Purpose**: Clean staging environment shutdown
- **What it does**:
  - Stops all staging containers
  - Maintains data integrity
  - Confirms successful shutdown
- **Usage**: `./docker-stage-stop.sh`
- **Output**: Stop confirmation messages

**`docker-stage-logs.sh`**
- **Purpose**: Staging environment log monitoring
- **What it does**:
  - Shows logs from staging services
  - Supports service-specific filtering
  - Includes nginx proxy logs
- **Usage**: `./docker-stage-logs.sh [service-name]`
- **Output**: Filtered or full log streams

##### Production Scripts

**`docker-start.sh`**
- **Purpose**: Production service startup (server deployment)
- **What it does**:
  - Starts production containers
  - Verifies service health
  - Configures networking
  - Enables monitoring
- **Usage**: `./docker-start.sh` (on production server)
- **Output**: Startup status and access URLs

**`docker-stop.sh`**
- **Purpose**: Production service shutdown
- **What it does**:
  - Gracefully stops services
  - Maintains data consistency
  - Prepares for maintenance
- **Usage**: `./docker-stop.sh` (on production server)
- **Output**: Shutdown confirmation

**`docker-logs.sh`**
- **Purpose**: Production log monitoring
- **What it does**:
  - Displays production service logs
  - Supports service filtering
  - Includes system monitoring
- **Usage**: `./docker-logs.sh [service-name]` (on production server)
- **Output**: Production log streams

**`docker-update.sh`**
- **Purpose**: Rolling update for production services
- **What it does**:
  - Pulls latest images
  - Stops old containers
  - Starts new containers
  - Runs health checks
  - Cleans up old images
- **Usage**: `./docker-update.sh` (on production server)
- **Output**: Update progress and status

### 🔧 Utility Scripts

In addition to Docker management scripts, the project includes several utility scripts for development, testing, and deployment workflows.

#### Development and Testing Scripts

**`check-node-version.sh`**
- **Purpose**: Validates Node.js installation and version compatibility
- **What it does**:
  - Checks if Node.js is installed
  - Verifies version meets requirements (Node.js 24+)
  - Shows system information
  - Provides upgrade instructions if needed
- **Usage**: `./check-node-version.sh`
- **Output**: Version status and compatibility report

**`run-e2e-tests.sh`**
- **Purpose**: Runs end-to-end tests on dedicated test ports
- **What it does**:
  - Uses test-specific ports (Frontend: 3001, Backend: 4001)
  - Prevents interference with development servers
  - Runs Playwright test suite
  - Provides clear success/failure feedback
- **Usage**: `./run-e2e-tests.sh` or `cd frontend && pnpm run playwright`
- **Output**: Test results and status

**`test-pre-push.sh`**
- **Purpose**: Simulates pre-push hook for local testing
- **What it does**:
  - Runs TypeScript type checking
  - Executes ESLint linting
  - Runs test suites
  - Verifies builds (Frontend + Backend)
  - Tests basic functionality
- **Usage**: `./test-pre-push.sh`
- **Output**: Comprehensive test results

#### Deployment and Monitoring Scripts

**`deploy.sh`**
- **Purpose**: Automated deployment with version management and tagging
- **What it does**:
  - Commits unstaged changes with custom messages
  - Auto-increments version numbers for releases
  - Creates and pushes Git tags for production deployment
  - Supports staging deployments
  - Includes commit history in release notes
- **Usage**:
  - Staging: `./deploy.sh -m "fix: bug description"`
  - Production: `./deploy.sh -t -m "new features release"`
  - Specific version: `./deploy.sh -v 1.5.0 -m "major release"`
- **Output**: Deployment status, version information, and next steps

**`check-deployment.sh`**
- **Purpose**: Comprehensive deployment status monitoring (server-side)
- **What it does**:
  - Checks PM2 process status
  - Displays recent application logs
  - Tests service availability (health checks)
  - Shows system resource usage
  - Reports disk and memory usage
- **Usage**: `./check-deployment.sh` (on production server)
- **Output**: Complete system and application health report

#### Git and Development Workflow Scripts

**`scripts/install-hooks.sh`**
- **Purpose**: Installs Git hooks for automated code quality checks
- **What it does**:
  - Copies pre-push hook to `.git/hooks/`
  - Sets executable permissions
  - Ensures code quality before pushes
- **Usage**: `./scripts/install-hooks.sh`
- **Output**: Hook installation confirmation

**`scripts/pre-push` (Git Hook)**
- **Purpose**: Automated pre-push validation (installed by install-hooks.sh)
- **What it does**:
  - Runs TypeScript type checking across all packages
  - Executes ESLint linting
  - Runs test suites (unit + E2E)
  - Verifies builds for frontend and backend
  - Prevents pushes with failing code
- **Triggers**: Automatically on `git push` to branches
- **Skips**: Tag pushes and delete operations
- **Output**: Comprehensive quality check results

**`scripts/deploy.js`**
- **Purpose**: Legacy deployment script (superseded by deploy.sh)
- **What it does**:
  - Auto-increments patch version in db/package.json
  - Creates commits and Git tags
  - Pushes changes and tags to remote
- **Usage**: `node scripts/deploy.js` (legacy, use deploy.sh instead)
- **Note**: Replaced by the more advanced `deploy.sh` script

### 📊 Monitoring and Troubleshooting

#### Check Container Health
```bash
# List all containers
docker ps -a

# Check container logs
docker logs crm-backend-dev
docker logs crm-frontend-dev

# Check resource usage
docker stats

# Inspect container
docker inspect crm-postgres-dev
```

#### Database Operations
```bash
# Access PostgreSQL in development
docker compose -f docker-compose.dev.yml exec postgres psql -U crm -d crm

# Access PostgreSQL in stage
docker compose -f docker-compose.stage.yml exec postgres psql -U crm -d crm

# Access PostgreSQL in production
docker compose -f docker-compose.yml exec postgres psql -U crm -d crm

# Run database migrations in development
docker compose -f docker-compose.dev.yml exec backend sh -c "cd backend && pnpm prisma migrate deploy"

# Run database migrations in stage
docker compose -f docker-compose.stage.yml exec backend sh -c "cd db && pnpm run migrate:deploy"

# Run database migrations in production
docker compose -f docker-compose.yml exec backend sh -c "cd db && pnpm run migrate:deploy"

# Reset development database
docker compose -f docker-compose.dev.yml down -v  # Removes volumes
docker compose -f docker-compose.dev.yml up -d   # Recreates with fresh data

# Reset stage database
docker compose -f docker-compose.stage.yml down -v
docker compose -f docker-compose.stage.yml up -d

# Reset production database
docker compose -f docker-compose.yml down -v
docker compose -f docker-compose.yml up -d
```

#### Common Issues

**Port conflicts:**
```bash
# Check what's using ports
sudo lsof -i :3003  # Development
sudo lsof -i :3004  # Stage
sudo lsof -i :80    # Production
sudo lsof -i :5435  # Dev database
sudo lsof -i :5436  # Stage database
sudo lsof -i :5432  # Prod database

# Change ports in docker-compose files if needed
```

**Permission issues:**
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

**Build failures:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker compose build --no-cache
```

### 🔄 Updates and Maintenance

#### Update Application
```bash
# Pull latest changes
git pull origin main

# Update development environment
docker compose -f docker-compose.dev.yml up --build -d

# Update stage environment
docker compose -f docker-compose.stage.yml up --build -d

# Update production environment
docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml up -d
```

#### Backup Database (Development)
```bash
# Create backup
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U crm crm > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose -f docker-compose.dev.yml exec -T postgres psql -U crm crm < backup_20241201.sql
```

### 🔄 Migration from Traditional Deployment

**⚠️ Execute only after thorough testing of Docker setup!**

### Step 1: Stop Current Services *(Server)*
```bash
# Stop PM2 services
pm2 stop all

# Stop PostgreSQL service
sudo systemctl stop postgresql
```

### Step 2: Update Nginx Configuration *(Server)*
If you have host Nginx, update configuration to use Docker ports:

```bash
sudo nano /etc/nginx/sites-available/crm
```

Change proxy_pass directives:
```nginx
# Before (traditional deployment)
proxy_pass http://localhost:3000;
proxy_pass http://localhost:4000/api/;

# After (Docker deployment)
proxy_pass http://localhost:80;  # Docker Nginx proxy
# OR directly to containers if no Docker Nginx:
# proxy_pass http://localhost:3003;
# proxy_pass http://localhost:4003/api/;
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Update Environment Variables *(Server)*
Update `.env` files to use Docker service names and ports if needed.

### Step 4: Start Docker Services *(Server)*
```bash
# Start Docker production environment
docker compose -f docker-compose.yml up -d

# Verify everything works
curl http://localhost/api/health
```

### Step 5: Clean Up (Optional) *(Server)*
After successful migration:
```bash
# Remove PM2
sudo pnpm remove -g pm2

# Remove traditional PostgreSQL (if not needed)
sudo apt remove postgresql postgresql-contrib
```

## 🔒 Security Considerations

#### Environment Variables
- Never commit `.env` files to repository
- Use strong passwords for database
- Rotate JWT secrets regularly
- Use different secrets for dev/prod environments

#### Production Security
```bash
# Run security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock clair-scanner [image-name]

# Update base images regularly
docker compose build --pull

# Use secrets management
# Consider using Docker secrets or external secret managers
```

### 📋 Docker Deployment Checklist

**Development Setup:**
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `.env.dev` configured
- [ ] Development containers running
- [ ] Frontend accessible at http://localhost:3003
- [ ] Backend API responding at http://localhost:4003/api
- [ ] Database accessible at localhost:5435
- [ ] Hot reload working for code changes

**Stage Setup:**
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `.env.backend.stage` and `.env.frontend.stage` configured
- [ ] Stage containers running
- [ ] Application accessible at http://localhost:3004
- [ ] API available at http://localhost:3004/api
- [ ] Database accessible at localhost:5436
- [ ] Health checks passing for all services

**Production Setup:**
- [ ] Production environment files configured
- [ ] Production containers deployed
- [ ] Application accessible at http://localhost:80
- [ ] API available at http://localhost:80/api
- [ ] Database accessible at localhost:5432
- [ ] Nginx reverse proxy configured
- [ ] Monitoring and logging configured

---

## 🏗️ Server Directory Structure After Deployment

After a Docker deployment completes, the following directory structure is created on the server. Note that the **entire repository** is copied, not only Docker files.

### Production Docker (`/var/www/docker/crm`)

```
/var/www/docker/crm/
├── .env.docker                    # Created by the workflow from GitHub secrets
├── .git/                         # Full git repository
├── .github/                      # All workflow files
├── backend/                      # Backend source code
│   ├── dist/                     # Built backend (created during build)
│   ├── src/
│   ├── package.json
│   └── ...
├── db/                           # Database and migrations
│   ├── prisma/
│   ├── migrations/
│   └── ...
├── docker/                       # Docker files
│   ├── backend/
│   │   └── Dockerfile
│   └── frontend/
│       └── Dockerfile
├── docker-compose.yml            # Production compose file
├── docker-compose.dev.yml        # Development compose file
├── docker-compose.stage.yml      # Stage compose file
├── frontend/                     # Frontend source code
│   ├── .next/                    # Built frontend (created during build)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── scripts/                      # Deployment scripts
├── docs/                         # Documentation
├── pnpm-lock.yaml               # Lock file
├── package.json                 # Root package.json
└── ...                          # All other repository files
```

### Staging Docker (`/var/www/docker/crm-staging`)

```
/var/www/docker/crm-staging/
├── .env.backend.stage           # Created by the workflow
├── .env.frontend.stage          # Created by the workflow
├── .git/                        # Full git repository
├── .github/                     # All workflow files
├── backend/                     # Backend source code
│   ├── dist/                    # Built backend
│   └── ...
├── db/                          # Database and migrations
├── docker/                      # Docker files
├── docker-compose.yml           # Production compose file
├── docker-compose.dev.yml       # Development compose file
├── docker-compose.stage.yml     # Stage compose file (used for staging)
├── frontend/                    # Frontend source code
│   ├── .next/                   # Built frontend
│   └── ...
├── scripts/                     # Deployment scripts
├── docs/                        # Documentation
└── ...                         # All other repository files
```

### 🔄 Deployment process (ULTRA-OPTIMIZED)

**What happens during deployment (new ultra-optimized version):**

1. **Clone/update code:** *(GitHub Actions)*
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```

2. **Cache and install dependencies:** *(GitHub Actions)*
   ```bash
   # Cache pnpm store
   # Install all dependencies with cache
   pnpm install --frozen-lockfile
   ```

3. **Generate Prisma client:** *(GitHub Actions)*
   ```bash
   cd db && pnpm run generate
   ```

4. **Build applications:** *(GitHub Actions)*
   ```bash
   cd frontend && pnpm run build  # Creates .next/
   cd ../backend && pnpm run build  # Creates dist/
   ```

5. **Build and push Docker images:** *(GitHub Actions)*
   ```bash
   # Build images with pre-built applications
   docker build -t ghcr.io/repo/frontend:v1.0.0 ./docker/frontend/
   docker build -t ghcr.io/repo/backend:v1.0.0 ./docker/backend/
   
   # Push to GitHub Container Registry
   docker push ghcr.io/repo/frontend:v1.0.0
   docker push ghcr.io/repo/backend:v1.0.0
   ```

6. **Create environment files on the server:** *(GitHub Actions → Server)*
   ```bash
   # Create only .env files from GitHub Secrets
   # No source code copying!
   ```

7. **Pull ready images:** *(GitHub Actions → Server)*
   ```bash
   docker pull ghcr.io/repo/frontend:v1.0.0
   docker pull ghcr.io/repo/backend:v1.0.0
   ```

8. **Start containers:** *(GitHub Actions → Server)*
   ```bash
   # Docker Compose uses pre-built images
   docker-compose up -d  # No build on the server!
   ```

### 📁 Final structure on the server

```
/var/www/docker/
├── crm/                    # Production - full repository
│   ├── .env.docker            # Production env
│   ├── backend/dist/          # Built backend
│   ├── frontend/.next/        # Built frontend
│   ├── docker-compose.yml     # Production compose
│   └── ...                    # All remaining code
│
└── crm-staging/           # Staging - full repository
    ├── .env.backend.stage     # Staging backend env
    ├── .env.frontend.stage    # Staging frontend env
    ├── backend/dist/          # Built backend
    ├── frontend/.next/        # Built frontend
    ├── docker-compose.stage.yml  # Staging compose
    └── ...                    # All remaining code
```

### 🎯 Key features (ULTRA-OPTIMIZED VERSION)

- **⚡ Lightning-fast deployment:** Pre-built Docker images cut deploy time to 1–2 min
- **🔄 Dependency caching:** pnpm store is cached between builds on GitHub Actions
- **📦 Ready images:** Applications are built once on CI/CD and run many times
- **🏷️ Image versioning:** Each release has tagged Docker images in GitHub Container Registry
- **🚫 Zero source code on the server:** Only .env files and docker-compose
- **🛡️ Maximum isolation:** Production and staging are fully independent
- **📊 Full reproducibility:** Each deploy uses the exact image versions

### ⚡ **Build performance: Docker vs Traditional deploy**

**❌ Current problem:** Docker deployment is actually **slower** than traditional deploy due to double builds:

#### 🔄 **Process in Docker deployment:**
1. **GitHub Actions** *(CI/CD servers)*: Install dependencies + build → ~3–5 min
2. **Copy code** to the production server → ~10–30 sec
3. **Production server**: Reinstall dependencies + rebuild → ~3–5 min
4. **Total**: ~6–10 minutes per deploy

#### 🚀 **Process in traditional deploy:**
1. **Production server**: Install dependencies + build → ~3–5 min
2. **Total**: ~3–5 minutes per deploy

**Result:** Docker deploy is **2× slower** due to duplicated build steps.

#### 🛠️ **Possible optimizations:**

#### 🏆 **Option 1: Build images on GitHub Actions (IMPLEMENTED - ULTRA MODE)**
- ✅ Build Docker images on CI/CD servers with dependency caching
- ✅ Push ready images to GitHub Container Registry
- ✅ **On the server ONLY ready containers** — no source code!
- **Result:** Maximum optimization, deploy time ~1–2 min

**Ultra mode (current implementation):**

1. **GitHub Actions (CI/CD):**
   - Cache pnpm dependencies
   - Build frontend/backend applications
   - Build Docker images with pre-built applications
   - Push to GitHub Container Registry

2. **Production server:**
   - Create only .env files
   - Pull ready images from the registry
   - Start containers with no build at all
   - Database migrations (currently skipped; needs further work)

**Execution time:**
- **Before optimization:** ~6–10 min (build on the server)
- **After optimization:** ~1–2 min (pull and start only)
- **Speedup:** ~80–90%

##### **Option 2: Multi-stage build with caching**
- Use Docker layer caching
- Cache node_modules between builds
- **Result:** 30–50% speedup

##### **Option 3: Hybrid approach**
- Critical updates: build on the server (faster for small changes)
- Releases: build images on CI/CD (better for large updates)

##### **Option 4: Pre-build dependencies**
- Cache pnpm store on the server
- Use Docker volumes for dependencies
- **Result:** 60–80% speedup on repeat builds

#### 💡 **Recommendation:**
For the current project with frequent small updates, a **hybrid approach** or **dependency-cache optimization** is recommended to keep Docker benefits without a large performance penalty.

---

## 🚀 GitHub Actions CI/CD Setup

### Overview
This guide covers automated deployment using GitHub Actions for continuous integration and deployment (CI/CD) with Docker.

### Prerequisites
- GitHub repository access
- Server with SSH access
- Repository secrets configured

### Required GitHub Secrets
In your repository settings (`Settings` → `Secrets and variables` → `Actions`), add these secrets:

#### SSH Access:
- `SERVER_HOST` - Server IP address or domain
- `SERVER_USER` - Server username (usually `root` or your username)
- `SERVER_SSH_KEY` - Private SSH key for server access

#### Environment Variables:
- `DATABASE_URL` - Production database connection URL
- `JWT_SECRET` - JWT secret key
- `NEXT_PUBLIC_BACKEND_API_URL` - Backend API URL for production

### Server Preparation

#### 1. Install Dependencies *(Server)*
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

#### 2. Setup PostgreSQL (Optional - if not using Docker) *(Server)*
If using external PostgreSQL instead of Docker container:
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
CREATE DATABASE crm;
CREATE USER crm_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE crm TO crm_user;
\q
```

#### 3. Clone Repository *(Server)*
```bash
sudo mkdir -p /var/www
cd /var/www
git clone https://github.com/your-username/LoyaCareCRM.git crm
cd crm
```

#### 4. Configure Environment Variables *(Server)*
Create `.env` files on the server:

**`/var/www/crm/.env.backend`:**
```bash
PORT=4000
DATABASE_URL="postgresql://crm_user:your_secure_password@postgres:5432/crm"
JWT_SECRET="your_jwt_secret_here"
USE_MOCK=false
```

**`/var/www/crm/.env.frontend`:**
```bash
NEXT_PUBLIC_BACKEND_API_URL="https://your-domain.com/api"
```

### GitHub Actions Workflow

The workflow file `.github/workflows/deploy-production.yml` is already configured and will:

1. **Code Validation** *(GitHub Actions)* - Run linting and type checking
2. **Application Build** *(GitHub Actions)* - Build frontend and backend
3. **Database Migration** *(GitHub Actions → Server)* - Apply database migrations
4. **Docker Deployment** *(GitHub Actions → Server)* - Build and start Docker containers
5. **Health Check** *(GitHub Actions → Server)* - Verify application availability

### Important Notes

⚠️ **Security Warning:** Environment files are **NOT** stored in the repository. They are configured manually on the server and contain server-specific configurations.

#### File Structure After Deployment:
```
/var/www/crm/
├── docker-compose.yml    # Docker services configuration
├── .env.backend         # Backend environment variables
├── .env.frontend        # Frontend environment variables
└── docker/              # Dockerfiles and configurations
```

### Manual Deployment Trigger

You can trigger deployment manually:
1. Go to GitHub repository
2. Click `Actions` tab
3. Select `Deploy to Server` workflow
4. Click `Run workflow`

### Automated Deployment via Script

The project includes a convenient deployment script that automates version bumping and tag creation:

```bash
# Standard staging deployment
./deploy.sh -m "fix critical auth bug"

# Create release tag (triggers production deployment)
./deploy.sh -t -m "new features release"

# Or from frontend directory
cd frontend
pnpm run deploy -- -t -m "add new customer dashboard feature"
```

**What the script does:**

**For Regular Commits (Staging):**
1. ✅ Commits unstaged changes with provided message *(Local → GitHub)*
2. ✅ Syncs with remote (`git pull --rebase`) *(Local → GitHub)*
3. ✅ Includes list of all unpushed commits in message *(Local)*
4. ✅ If multiple unpushed commits exist: creates summary commit with `chore(staging): v{VERSION}` *(Local)*
5. ✅ Pushes to main → triggers staging deployment *(Local → GitHub → Server)*

**For Releases (Production with `-t` flag):**
1. ✅ Reads current version from `frontend/package.json` and git tags *(Local)*
2. ✅ Auto-increments patch version (e.g., `0.1.33` → `0.1.34`) *(Local)*
3. ✅ Creates commit with `chore(release): v{VERSION}` message *(Local)*
4. ✅ Includes list of all unpushed commits in commit message *(Local)*
5. ✅ Pushes commit to main *(Local → GitHub)*
6. ✅ Creates and pushes annotated release tag: `v0.1.34` *(Local → GitHub)*
7. ✅ GitHub Actions automatically deploys to production and updates package.json *(GitHub → Server)*

**Command Options:**
- `-m "message"` - **Required**: Custom description for commit/release
- `-t` - Create and push release tag (triggers production deployment)
- `-v VERSION` - Specify exact version (e.g., `-v 1.5.0`), otherwise auto-increments

**Commit Message Formats:**

*Regular staging commit:*
```
fix: critical auth bug

* feat: add new dashboard
* perf: optimize queries
```

*Multiple unpushed commits (auto-generated staging deploy):*
```
chore(staging): v0.1.33 - deploying multiple changes

* feat: add new dashboard
* perf: optimize queries
* fix: critical auth bug
```

*Release commit:*
```
chore(release): v0.1.34 - new features release

* feat: add customer dashboard
* perf: improve database performance
* fix: authentication bug
```

**Examples:**
```bash
# Standard staging push
./deploy.sh -m "fix: authentication bug"
# → Pushes to staging with version 0.1.33+sha.abc123

# Production release
./deploy.sh -t -m "performance improvements and bug fixes"
# → Creates tag v0.1.34, deploys to production

# Release with specific version
./deploy.sh -v 1.5.0 -m "major release"
# → Creates tag v1.5.0, deploys to production
```

### Monitoring and Logs

#### Check Deployment Status:
```bash
# On server
cd /var/www/crm
docker compose ps
docker compose logs
```

#### View Application Logs:
```bash
docker compose logs -f frontend
docker compose logs -f backend
```

### Troubleshooting

#### If Deployment Fails:
1. Check GitHub Actions logs for errors
2. Verify SSH connection: `ssh -T user@server`
3. Check server resources: `df -h` and `free -h`
4. Verify environment variables are set correctly

#### Common Issues:
- **SSH Connection Failed**: Check `SERVER_SSH_KEY` format (should be private key)
- **Build Failed**: Check Docker installation and permissions
- **Migration Failed**: Verify database connection and permissions
- **Services Not Starting**: Check Docker logs and port availability

### Security Best Practices

1. **SSH Keys**: Use separate SSH keys for each server
2. **Environment Variables**: Never commit real values to repository
3. **Database**: Use strong passwords and limit access
4. **Firewall**: Configure UFW or iptables properly
5. **SSL**: Enable HTTPS with Let's Encrypt

### Useful Commands

```bash
# Check all services
docker compose ps

# View real-time logs
docker compose logs --tail 50

# Restart services
docker compose restart

# Check system resources
htop
df -h
free -h

# Backup database
docker compose exec postgres pg_dump crm > backup_$(date +%Y%m%d).sql
```

This setup provides a complete CI/CD pipeline for automated Docker deployment of your LoyaCareCRM application! 🎉

