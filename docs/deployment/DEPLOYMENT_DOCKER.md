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
git clone <your-repository-url> loyacrm
cd loyacrm
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

**Important:** PostgreSQL data is stored in a Docker named volume `loyacrm_prod_pg_data`. This volume persists data between container restarts, deployments, and even container recreation. The volume is automatically created by Docker Compose and survives `docker compose down` commands.

**Volume location:** Docker manages the volume storage location automatically. To inspect:
```bash
# List volumes
docker volume ls

# Inspect volume details
docker volume inspect loyacrm_prod_pg_data

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
pg_dump -h localhost -U loyacrm loyacrm > current_db_backup.sql

# Restore to Docker database
docker compose -f docker-compose.yml exec -T postgres psql -U loyacrm loyacrm < current_db_backup.sql
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
docker logs loyacrm-backend-dev
docker logs loyacrm-frontend-dev

# Check resource usage
docker stats

# Inspect container
docker inspect loyacrm-postgres-dev
```

#### Database Operations
```bash
# Access PostgreSQL in development
docker compose -f docker-compose.dev.yml exec postgres psql -U loyacrm -d loyacrm

# Access PostgreSQL in stage
docker compose -f docker-compose.stage.yml exec postgres psql -U loyacrm -d loyacrm

# Access PostgreSQL in production
docker compose -f docker-compose.yml exec postgres psql -U loyacrm -d loyacrm

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
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U loyacrm loyacrm > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose -f docker-compose.dev.yml exec -T postgres psql -U loyacrm loyacrm < backup_20241201.sql
```

### 🔄 Migration from Traditional Deployment

**⚠️ Execute only after thorough testing of Docker setup!**

### Step 1: Stop Current Services
```bash
# Stop PM2 services
pm2 stop all

# Stop PostgreSQL service
sudo systemctl stop postgresql
```

### Step 2: Update Nginx Configuration
If you have host Nginx, update configuration to use Docker ports:

```bash
sudo nano /etc/nginx/sites-available/loyacrm
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

### Step 3: Update Environment Variables
Update `.env` files to use Docker service names and ports if needed.

### Step 4: Start Docker Services
```bash
# Start Docker production environment
docker compose -f docker-compose.yml up -d

# Verify everything works
curl http://localhost/api/health
```

### Step 5: Clean Up (Optional)
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

