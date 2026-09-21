# Backend Environment Variables

## 📋 Overview

Backend supports loading environment variables from multiple `.env.*` files with priority:

### Loading Order (from lowest to highest priority):

1. `.env` - base settings for all environments
2. `.env.local` - local overrides (not committed)
3. `.env.{NODE_ENV}` - settings for specific environment (development/production/test)
4. `.env.{NODE_ENV}.local` - local overrides for specific environment (not committed)

### Examples:

```bash
# Development (NODE_ENV=development)
.env                        # base settings
.env.local                  # your local secrets
.env.development            # dev settings (✅ committed)
.env.development.local      # your local dev secrets (❌ not committed)

# Production (NODE_ENV=production)
.env                        # base settings
.env.local                  # your local secrets
.env.production             # prod settings (✅ committed)
.env.production.local       # your local prod secrets (❌ not committed)

# Testing (NODE_ENV=test)
.env                        # base settings
.env.test                   # test settings (✅ committed)
.env.test.local             # your local test secrets (❌ not committed)
```

## 🔐 Security Best Practices

### Safe to commit:
- ✅ `.env.development` - development settings (without secrets)
- ✅ `.env.production` - production settings (without secrets)
- ✅ `.env.test` - test settings
- ✅ `.env.example` - example file with variable descriptions

### Never commit:
- ❌ `.env` - base file with variables
- ❌ `.env.local` - local overrides
- ❌ `.env.*.local` - local overrides for specific environments

### Store secrets in `.local` files:
```bash
# .env.development.local (not committed)
DATABASE_URL="postgresql://postgres:my_real_password@localhost:5432/crm"
JWT_SECRET="my-super-secret-key-min-32-chars-long"
```

## 📝 Environment Variables

### Required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-super-secret-jwt-key-min-32-chars` |

### Optional variables:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Server port | `4000` | `4000` |
| `NODE_ENV` | Environment mode | `development` | `development`/`production`/`test` |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` | `1h`, `7d`, `30d` |
| `USE_MOCK` | Enable mock data | `false` | `true`/`false` |
| `CORS_ORIGIN` | CORS allowed origin | `*` | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` | `debug`/`info`/`warn`/`error` |
| `PRISMA_LOG_LEVEL` | Prisma logging level | `info` | `query`/`info`/`warn`/`error` |

## 🚀 Usage

### Development

1. Copy `.env.example` to `.env.development.local`:
   ```bash
   cp .env.example .env.development.local
   ```

2. Edit `.env.development.local` and add your secrets:
   ```bash
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/crm"
   JWT_SECRET="your-secret-key-min-32-characters-long"
   ```

3. Start the server:
   ```bash
   pnpm run dev
   ```

### Production

**Docker Deployment (Recommended):**

Environment variables are configured in root `.env` or `.env.stage` files:

```bash
# Production (.env)
POSTGRES_USER=crm
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=crm
JWT_SECRET=your-production-jwt-secret-min-32-chars
NODE_ENV=production

# Staging (.env.stage)
POSTGRES_USER=crm
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=crm_staging
JWT_SECRET=your-staging-jwt-secret-min-32-chars
NODE_ENV=production
```

Docker Compose automatically constructs `DATABASE_URL`:
```
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
```

**Traditional Deployment (PM2/systemd):**

Use system environment variables or `.env.production.local`:

```bash
# Via environment variables
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export JWT_SECRET="production-secret-key"
export NODE_ENV="production"
pnpm start

# Or via .env.production.local
echo 'DATABASE_URL="postgresql://user:pass@host:5432/db"' > .env.production.local
echo 'JWT_SECRET="production-secret-key"' >> .env.production.local
NODE_ENV=production pnpm start
```

### Testing

For tests, `.env.test` is used:

```bash
pnpm run test
```

## 🔍 Validation

When starting, backend automatically validates required variables:

```bash
📋 Loading environment variables for: development
✅ Loaded: .env.development.local
✅ Loaded: .env.development
✅ Environment loaded successfully
   - NODE_ENV: development
   - PORT: 4000
   - USE_MOCK: false
```

If required variables are missing:

```bash
❌ Missing required environment variables: DATABASE_URL, JWT_SECRET
```

## 🛠️ Troubleshooting

### Docker Environment

**Problem: Backend can't connect to database in Docker**

```bash
# Check DATABASE_URL in container
docker exec crm-backend env | grep DATABASE_URL

# Check if postgres container is running
docker compose ps postgres

# Check backend logs
docker compose logs backend

# Verify environment variables in docker-compose.yml
cat docker-compose.yml | grep -A 10 "backend:"
```

**Solution**: Ensure root `.env` file has correct `POSTGRES_*` variables.

### Local Development

### Problem: Variables not loading

**Solution 1**: Check file name
- Must be exactly `.env.development`, not `.env.dev`
- No file extension

**Solution 2**: Check NODE_ENV
```bash
echo $NODE_ENV
# Should be: development, production or test
```

**Solution 3**: Check .env file syntax
```bash
# ✅ Correct
DATABASE_URL="postgresql://localhost:5432/db"

# ❌ Wrong (spaces around =)
DATABASE_URL = "postgresql://localhost:5432/db"
```

### Problem: Secrets committed to git

**Solution**: Remove file from git history
```bash
# Remove file from git (keep local copy)
git rm --cached .env.local

# Verify .gitignore is correct
cat .gitignore | grep "\.env\.local"

# Commit changes
git commit -m "Remove .env.local from git"
```

## 📚 References

- [dotenv documentation](https://github.com/motdotla/dotenv)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)

## Related Documentation

- **[README.md](./README.md)** - Backend API documentation
- **[../DATABASE_ENV_CONFIG.md](../DATABASE_ENV_CONFIG.md)** - Database configuration guide
- **[../deployment/README.md](../deployment/README.md)** - Docker deployment guide
- **[../db/README.md](../db/README.md)** - Database and Prisma guide

---

**Last Updated:** December 20, 2024  
**Deployment:** Docker Compose with environment file configuration
