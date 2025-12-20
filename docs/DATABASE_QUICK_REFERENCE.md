# Database Configuration - Quick Reference

## How Prisma Gets DATABASE_URL in Docker Deployment

### Short Answer
**From Docker Compose environment variables**, not from `.env` files in `db/` directory.

### Detailed Explanation

```
Root directory:
  ├── .env                    ← Production: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
  ├── .env.stage              ← Staging: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
  ├── docker-compose.yml      ← Constructs DATABASE_URL from variables
  └── docker-compose.stage.yml ← Constructs DATABASE_URL from variables

db/ directory (for local development only):
  ├── .env                    ← Local: DATABASE_URL for development
  ├── .env.development.local  ← Local: DATABASE_URL override
  └── prisma/
      └── schema.prisma       ← No url specified, uses environment
```

### How Docker Deployment Works

1. **Docker Compose** constructs `DATABASE_URL` from variables in `.env` or `.env.stage`:
   
   **Production** (`.env`):
   ```bash
   POSTGRES_DB=loyacrm
   POSTGRES_USER=loyacrm
   POSTGRES_PASSWORD=your_password
   ```
   
   **Staging** (`.env.stage`):
   ```bash
   POSTGRES_DB=loyacrm_staging
   POSTGRES_USER=loyacrm
   POSTGRES_PASSWORD=your_staging_password
   ```

2. **docker-compose.yml** creates the connection string:
   ```yaml
   backend:
     environment:
       - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
   ```

3. **Prisma commands** inside container use the environment variable:
   ```bash
   docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate deploy'
   ```

### Local Development (Non-Docker)

For local development, Prisma reads from `db/.env` files:

```bash
# db/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/loyacrm_dev"
```

```bash
cd db
pnpm run migrate:deploy  # Uses DATABASE_URL from db/.env
pnpm run seed            # Uses DATABASE_URL from db/.env
```

## Should You Run Seed After Migrations?

### Short Answer

- ✅ **Staging:** YES, always run seed
- ❌ **Production:** NO, never run seed

### Detailed Explanation

### Staging Environment

**YES, seed is required** to create test data:

**Docker Deployment:**
```bash
# Run migrations
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Run seed
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npm run seed'
```

**Local Development:**
```bash
cd db
pnpm run migrate:deploy  # Apply migrations
pnpm run seed            # Fill with test data
```

**What seed.ts creates:**
- **3 admin users:** `admin@loya.care`, `admin@beispiel.de`, `admin@example.com`
- **10 employee users:** `v1@loya.care` through `v10@loya.care`
- **Password for all:** `1`
- **110 contacts** (11 per employee)
- **110 deals** (11 per employee with various stages)
- Test groups, notes, and appointments

**Why:** Testing requires users and data.

### Production Environment

**NO, seed is NOT needed:**

**Docker Deployment:**
```bash
# Only migrations
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# ❌ DO NOT run seed in production!
```

**Why:** Production already has real user data.

---

## Docker Deployment Workflow

### Production Deployment

```bash
# 1. Build Docker images with correct platform
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t loyacrm-frontend:latest \
  -f docker/frontend/Dockerfile .

docker buildx build --platform linux/amd64 \
  -t loyacrm-backend:latest \
  -f docker/backend/Dockerfile .

# 2. Export and transfer to server
docker save loyacrm-frontend:latest | gzip > frontend.tar.gz
docker save loyacrm-backend:latest | gzip > backend.tar.gz
scp *.tar.gz root@SERVER_IP:/tmp/

# 3. On server: load images and start
ssh root@SERVER_IP
cd /var/www/loyacrm-production
docker load < /tmp/frontend.tar.gz
docker load < /tmp/backend.tar.gz
docker compose up -d

# 4. Run migrations (NO SEED!)
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate deploy'
```

### Staging Deployment

```bash
# 1. Build staging images
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api \
  -t loyacrm-frontend:staging \
  -f docker/frontend/Dockerfile .

docker buildx build --platform linux/amd64 \
  -t loyacrm-backend:staging \
  -f docker/backend/Dockerfile .

# 2. Export and transfer
docker save loyacrm-frontend:staging | gzip > frontend-staging.tar.gz
docker save loyacrm-backend:staging | gzip > backend-staging.tar.gz
scp *-staging.tar.gz root@SERVER_IP:/tmp/

# 3. On server: load and start
ssh root@SERVER_IP
cd /var/www/loyacrm-staging
docker load < /tmp/frontend-staging.tar.gz
docker load < /tmp/backend-staging.tar.gz
docker compose -f docker-compose.stage.yml --env-file .env.stage up -d

# 4. Run migrations AND seed
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npm run seed'
```

---

## Practical Commands

### Docker Production Environment

```bash
# Check DATABASE_URL in container
docker exec loyacrm-backend env | grep DATABASE_URL

# Check .env file on host
cat /var/www/loyacrm-production/.env | grep POSTGRES

# Apply migrations (NO SEED!)
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Check migration status
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate status'

# View backend logs
docker compose -f /var/www/loyacrm-production/docker-compose.yml logs -f backend

# ❌ NEVER run in production:
# docker exec loyacrm-backend sh -c 'cd /app/db && npm run seed'  # DON'T!
# docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate reset'  # DON'T!
```

### Docker Staging Environment

```bash
# Check DATABASE_URL in container
docker exec loyacrm-staging-backend env | grep DATABASE_URL

# Check .env.stage file on host
cat /var/www/loyacrm-staging/.env.stage | grep POSTGRES

# Apply migrations
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Run seed (always for staging!)
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npm run seed'

# Reset database and reseed
docker compose -f /var/www/loyacrm-staging/docker-compose.stage.yml stop backend postgres
docker compose -f /var/www/loyacrm-staging/docker-compose.stage.yml rm -f postgres
docker volume rm loyacrm_pg_data_staging
docker compose -f /var/www/loyacrm-staging/docker-compose.stage.yml up -d
sleep 20
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npm run seed'
```

### Local Development (Non-Docker)

```bash
# Check DATABASE_URL
cd db
cat .env | grep DATABASE_URL

# Apply migrations
cd db
pnpm run migrate:deploy

# Run seed
cd db
pnpm run seed

# Reset database
cd db
pnpm run migrate:reset  # Automatically runs seed

# Open Prisma Studio
cd db
pnpm run studio
```

---

## Verification

### Check Which Database Prisma Connects To

**Docker Production:**
```bash
# Check DATABASE_URL in backend container
docker exec loyacrm-backend env | grep DATABASE_URL
# Should show: postgresql://loyacrm:password@postgres:5432/loyacrm

# Check environment variables on host
cat /var/www/loyacrm-production/.env | grep POSTGRES_DB
# Should show: POSTGRES_DB=loyacrm
```

**Docker Staging:**
```bash
# Check DATABASE_URL in staging backend container
docker exec loyacrm-staging-backend env | grep DATABASE_URL
# Should show: postgresql://loyacrm:password@postgres:5432/loyacrm_staging

# Check environment variables on host
cat /var/www/loyacrm-staging/.env.stage | grep POSTGRES_DB
# Should show: POSTGRES_DB=loyacrm_staging
```

**Local Development:**
```bash
cd db
cat .env | grep DATABASE_URL
# Should show: postgresql://postgres:password@localhost:5432/loyacrm_dev
```

### Verify Seed Created Users

**Docker Staging:**
```bash
# Query users from staging database
docker exec loyacrm-staging-postgres psql -U loyacrm -d loyacrm_staging \
  -c "SELECT email, role FROM \"User\" LIMIT 5;"

# Should show:
# admin@loya.care | ADMIN
# v1@loya.care    | EMPLOYEE
# v2@loya.care    | EMPLOYEE
# ...
```

**Local Development:**
```bash
psql -U postgres -d loyacrm_dev \
  -c "SELECT email, role FROM \"User\" LIMIT 5;"
```

### Test Login Credentials

After running seed, you can login with test accounts:

**Admin Account:**
```
Email: admin@loya.care
Password: 1
```

**Employee Accounts:**
```
Email: v1@loya.care
Password: 1

Email: v2@loya.care
Password: 1

... through v10@loya.care
```

**Access URLs:**
- Production: `http://YOUR_SERVER_IP/de`
- Staging: `http://YOUR_SERVER_IP:8080/de`
- Local: `http://localhost:3000/de`

---

## Related Documentation

For more details, see:
- **[DATABASE_ENV_CONFIG.md](DATABASE_ENV_CONFIG.md)** - Detailed database configuration
- **[deployment/README.md](deployment/README.md)** - Docker deployment guide overview
- **[deployment/04-staging-deployment.md](deployment/04-staging-deployment.md)** - Staging environment setup
- **[deployment/05-management.md](deployment/05-management.md)** - Container management and operations
- **[deployment/06-troubleshooting.md](deployment/06-troubleshooting.md)** - Common issues and solutions

---

**Last Updated:** December 20, 2025  
**Deployment Method:** Docker Compose with manual build
