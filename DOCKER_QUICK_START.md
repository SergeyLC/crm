# Docker Quick Start Guide for Testing

## 🚀 Local Development (Development)

### Prerequisites
- Docker and Docker Compose installed
- Project cloned locally

### Quick Development Start

```bash
# Start all services with hot-reload
./docker-dev-start.sh

# Or manually:
docker compose -f docker-compose.dev.yml up -d
```

**Service Access:**
- Frontend: http://localhost:3003 (with hot-reload)
- Backend API: http://localhost:4003 (with hot-reload)
- Database: localhost:5435

### Development Management

```bash
# View logs
./docker-dev-logs.sh

# Stop
./docker-dev-stop.sh

# Status
docker compose -f docker-compose.dev.yml ps
```

## 🏭 Production Deployment (Production)

### Prerequisites
- Docker and Docker Compose installed
- Project cloned to /var/www/loyacrm
- **Create `.env.docker` file with real passwords (copy from `.env.docker.example`)**

### Quick Start

1. **Configure environment variables:**
   ```bash
   cd /var/www/loyacrm
   cp .env.docker.example .env.docker
   # Edit .env.docker with real values
   nano .env.docker
   ```

2. **Start services:**
   ```bash
   docker compose up -d
   ```

3. **Check status:**
   ```bash
   docker compose ps
   ```

4. **View logs:**
   ```bash
   docker compose logs -f
   ```

## 📊 Service Access

### Development (local development)
- **Frontend:** http://localhost:3003
- **Backend API:** http://localhost:4003
- **Database:** localhost:5435

### Production (server)
- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:4002
- **Database:** localhost:5434

## 🛠️ Management

### Development
```bash
# Start
./docker-dev-start.sh

# Logs
./docker-dev-logs.sh

# Stop
./docker-dev-stop.sh
```

### Production
```bash
# Start
./docker-start.sh

# Logs
./docker-logs.sh

# Stop
./docker-stop.sh

# Update
./docker-update.sh
```

## 🔄 Rebuild (after code changes)

### Development
```bash
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

### Production
```bash
docker compose build --no-cache
docker compose up -d
```