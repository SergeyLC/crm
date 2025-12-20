# Database Environment Configuration

## Overview

This document explains how Prisma finds and uses `DATABASE_URL` in the LoyaCareCRM project. The project now uses **Docker-based deployment** with environment variables managed through Docker Compose.

## Project Structure

```
db/
  ├── .env                         ← Local development (not in git)
  ├── .env.production.local        ← Production secrets (not in git)
  ├── .env.production.local.example ← Example template
  ├── .env.development.local       ← Development override (not in git)
  ├── .env.development.example     ← Example template
  ├── .env.test                    ← Test environment
  ├── .env.production              ← Production defaults
  ├── prisma/
  │   ├── schema.prisma            ← Defines datasource (no url specified)
  │   └── seed.ts                  ← Seed script with dotenv loading
  └── package.json                 ← Contains seed script
```

## Docker-Based Deployment (Current Method)

### Environment Variables in Docker

In Docker deployments, `DATABASE_URL` is **NOT read from `.env` files in `db/`**. Instead, it's constructed by Docker Compose from environment variables:

**Root directory files:**
- `.env` - Production environment variables
- `.env.stage` - Staging environment variables

**Docker Compose configuration:**

```yaml
# docker-compose.yml (Production)
backend:
  environment:
    - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

postgres:
  environment:
    - POSTGRES_DB=${POSTGRES_DB}      # e.g., loyacrm
    - POSTGRES_USER=${POSTGRES_USER}  # e.g., loyacrm
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

```yaml
# docker-compose.stage.yml (Staging)
backend:
  environment:
    - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

postgres:
  environment:
    - POSTGRES_DB=${POSTGRES_DB}      # e.g., loyacrm_staging
    - POSTGRES_USER=${POSTGRES_USER}
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

### Example `.env` for Production

```bash
# Database
POSTGRES_DB=loyacrm
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=your_secure_password_here

# Backend JWT
JWT_SECRET=your_jwt_secret_here

# API URLs
NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api
```

### Example `.env.stage` for Staging

```bash
# Database (different database name!)
POSTGRES_DB=loyacrm_staging
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=your_staging_password_here

# Backend JWT (different secret!)
JWT_SECRET=your_staging_jwt_secret

# API URLs (note the :8080 port!)
NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api
```

## Prisma Schema Configuration

The `db/prisma/schema.prisma` file does **NOT** specify a hardcoded database URL:

```prisma
generator client_backend {
  provider      = "prisma-client-js"
  output        = "../generated/prisma-client"
  binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  // No url specified - DATABASE_URL comes from environment
}
```

## Running Migrations in Docker

### Production

```bash
# Connect to backend container
docker exec -it loyacrm-backend sh

# Inside container
cd /app/db
npx prisma migrate deploy
```

### Staging

```bash
# Connect to staging backend container
docker exec -it loyacrm-staging-backend sh

# Inside container
cd /app/db
npx prisma migrate deploy
```

The backend container already has `DATABASE_URL` set by Docker Compose, so Prisma will use it automatically.

## Seed Data in Docker

### Running Seed Script

The seed script checks for `DATABASE_URL` environment variable and exits if not found:

```typescript
// db/prisma/seed.ts
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not found!');
  process.exit(1);
}
```

### Production (DON'T Seed!)

```bash
# ⚠️ DO NOT run seed in production!
# Production database should contain real data only
```

### Staging (Always Seed!)

```bash
# Connect to staging backend container
docker exec -it loyacrm-staging-backend sh

# Inside container
cd /app/db
npm run seed
```

### What Seed Creates

The seed script (`db/prisma/seed.ts`) creates:
- **3 admin users:**
  - `admin@loya.care`
  - `admin@beispiel.de`
  - `admin@example.com`
- **10 employee users:** `v1@loya.care` through `v10@loya.care`
- **Password for all users:** `1`
- **110 contacts** (11 per employee)
- **110 deals** (11 per employee with various stages)
- Test groups, notes, and appointments

Seed uses `upsert`, so running it multiple times won't create duplicates.

## Local Development (Non-Docker)

For local development without Docker, you can use `.env` files in the `db/` directory:

### Development: `db/.env` or `db/.env.development.local`

```bash
# Local PostgreSQL database
DATABASE_URL="postgresql://postgres:password@localhost:5432/loyacrm_dev"
```

### Running Local Commands

```bash
cd db

# Generate Prisma Client
pnpm run generate

# Run migrations
pnpm run migrate:deploy

# Seed database
pnpm run seed

# Open Prisma Studio
pnpm run studio
```

The seed script automatically loads environment variables from `.env` files in this priority order:
1. `.env.production.local`
2. `.env.local`
3. `.env`

## Package.json Scripts

Current scripts in `db/package.json`:

```json
{
  "scripts": {
    "generate": "prisma generate && copy to frontend/backend",
    "migrate": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "migrate:reset": "prisma migrate reset --force",
    "migrate:status": "prisma migrate status",
    "studio": "prisma studio",
    "seed": "npx tsc && node temp/seed.js"
  }
}
```

**Note:** The `seed` script compiles TypeScript first, then runs the compiled JavaScript. The `DATABASE_URL` environment variable must be available when running the script.

## Troubleshooting

### Docker: "Environment variable not found: DATABASE_URL"

**Symptom:** Seed or migration fails inside Docker container

**Cause:** `DATABASE_URL` not set in Docker container environment

**Solution:**

```bash
# Check if DATABASE_URL is set in container
docker exec loyacrm-staging-backend env | grep DATABASE_URL

# If not found, check Docker Compose configuration
cat docker-compose.stage.yml | grep -A 3 "DATABASE_URL"

# Verify .env.stage file exists and has correct values
cat .env.stage | grep POSTGRES

# Restart containers to apply environment changes
cd /var/www/loyacrm-staging
docker compose -f docker-compose.stage.yml down
docker compose -f docker-compose.stage.yml up -d
```

### Docker: "Can't reach database server"

**Symptom:** Backend or seed script can't connect to PostgreSQL

**Cause:** PostgreSQL container not running or wrong connection parameters

**Solution:**

```bash
# Check if postgres container is running
docker ps | grep postgres

# Check postgres container health
docker inspect loyacrm-staging-postgres | grep -A 10 Health

# Check postgres logs
docker compose -f docker-compose.stage.yml logs postgres

# Test connection from backend container
docker exec loyacrm-staging-backend sh -c \
  'psql $DATABASE_URL -c "SELECT 1;"'
```

### Docker: Migrations applied to wrong database

**Symptom:** Production and staging data mixed up

**Cause:** Wrong `.env` file used or containers connected to wrong database

**Solution:**

```bash
# Check which database backend is using
docker exec loyacrm-staging-backend env | grep DATABASE_URL
# Should show: ...@postgres:5432/loyacrm_staging

docker exec loyacrm-backend env | grep DATABASE_URL
# Should show: ...@postgres:5432/loyacrm

# Check postgres container database
docker exec loyacrm-staging-postgres psql -U loyacrm -l
# Should list loyacrm_staging

# If wrong, update .env.stage and restart
nano .env.stage  # Fix POSTGRES_DB=loyacrm_staging
docker compose -f docker-compose.stage.yml down
docker compose -f docker-compose.stage.yml up -d
```

### Local: "Environment variable not found: DATABASE_URL"

**Symptom:** Seed or migration fails locally

**Cause:** No `.env` file in `db/` directory

**Solution:**

```bash
cd db

# Check for .env files
ls -la .env*

# If missing, create one
cp .env.development.example .env
nano .env  # Edit DATABASE_URL

# Or set environment variable directly
export DATABASE_URL="postgresql://postgres:password@localhost:5432/loyacrm_dev"
pnpm run seed
```

### Local: "Can't reach database server"

**Symptom:** Local Prisma commands fail to connect

**Cause:** PostgreSQL not running locally or wrong connection string

**Solution:**

```bash
# Check if PostgreSQL is running (macOS)
brew services list | grep postgresql

# Start PostgreSQL if needed
brew services start postgresql@16

# Test connection
psql -U postgres -d loyacrm_dev

# If database doesn't exist, create it
psql -U postgres -c "CREATE DATABASE loyacrm_dev;"
```

## When to Seed

| Environment | Seed? | Reason |
|-------------|-------|--------|
| **Production** | ❌ Never | Real data only, no test data |
| **Staging** | ✅ Always | Need test data for testing |
| **Development** | ✅ Optional | Helpful for local development |

## Security Best Practices

1. **Never commit `.env` files** with real passwords to git
2. **Use strong passwords** for production databases
3. **Different passwords** for production and staging
4. **Restrict file permissions** on `.env` files (600)
5. **Use environment variables** in Docker instead of `.env` files in containers
6. **Rotate secrets regularly** especially after team member changes

## Quick Reference

### Check Current Configuration

```bash
# Docker Production
docker exec loyacrm-backend env | grep DATABASE_URL

# Docker Staging  
docker exec loyacrm-staging-backend env | grep DATABASE_URL

# Local
cd db && cat .env | grep DATABASE_URL
```

### Run Migrations

```bash
# Docker Production
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Docker Staging
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Local
cd db && pnpm run migrate:deploy
```

### Run Seed

```bash
# Docker Staging (ONLY!)
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npm run seed'

# Local
cd db && pnpm run seed
```

### Check Migration Status

```bash
# Docker
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate status'

# Local
cd db && pnpm run migrate:status
```

---

**Last Updated:** December 20, 2025  
**Related Documentation:**
- [Docker Deployment Guide](deployment/README.md)
- [Staging Deployment](deployment/04-staging-deployment.md)
- [Container Management](deployment/05-management.md)
