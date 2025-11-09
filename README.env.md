# Environment Configuration Guide

This project uses environment-specific configuration files to manage different deployment scenarios.

## Environment Files Structure

### Root Level
- `.env` - Default environment file (used for development)
- `.env.development` - Development environment settings
- `.env.production` - **Non-sensitive** production settings (committed to git)
- `.env.production.local` - **Sensitive** production secrets (NOT in git)
- `.env.production.local.example` - Template for production secrets
- `.env.test` - Test environment settings
- `.env.local.example` - Template for local developer overrides

### Per-Module Level
Each module (`backend/`, `frontend/`, `db/`) has its own set of environment files:
- `.env.development` - Module-specific development settings
- `.env.production` - **Non-sensitive** production config (committed)
- `.env.production.local.example` - Template for production secrets
- `.env.test` - Module-specific test settings
- `.env.example` - Template with example values

### Security Model

**Files committed to git** (safe, no secrets):
- `.env.development` - Development defaults
- `.env.production` - Production config WITHOUT secrets
- `.env.test` - Test configuration
- `.env*.example` - Templates

**Files NOT in git** (contain secrets):
- `.env` - Local working file
- `.env.local` - Local overrides
- `.env.production.local` - Production secrets
- `.env.*.local` - Any local files

## Loading Priority

Environment variables are loaded in the following order (later files override earlier ones):

1. `.env` - Default values
2. `.env.development` or `.env.production` or `.env.test` - Environment-specific
3. `.env.local` - Local overrides (not committed to git)

## Setup Instructions

### First Time Setup

1. **Copy example files** (if they exist):
   ```bash
   # Root level
   cp .env.local.example .env.local
   
   # Backend
   cd backend
   cp .env.example .env.local
   
   # Frontend
   cd ../frontend
   cp .env.example .env.local
   
   # Database
   cd ../db
   cp .env.example .env.local
   ```

2. **Update sensitive values** in `.env.local` files:
   - Database credentials
   - JWT secrets
   - API keys
   - Production URLs

### Development

For development, use the default `.env.development` files:

```bash
# The .env files are already configured for development
npm run dev
```

### Production

**IMPORTANT**: Production uses a split configuration model for security:
- `.env.production` contains **non-sensitive** settings (committed to git)
- Sensitive values must be provided separately via one of these methods:

#### Method 1: Server Environment Variables (Recommended)

Set environment variables directly on your production server:

```bash
# On your production server
export DATABASE_URL="postgresql://prod_user:password@db.example.com:5432/prod_db"
export JWT_SECRET="your-super-secret-key-min-32-chars"
export CORS_ORIGIN="https://your-domain.com"
export NEXT_PUBLIC_BACKEND_API_URL="https://api.your-domain.com/api"
```

Add to `~/.bashrc`, `~/.zshrc`, or `/etc/environment` to persist.

#### Method 2: .env.production.local File

Create `.env.production.local` on the server (never commit this file):

```bash
# On production server, create from template
cp .env.production.local.example .env.production.local
# Edit and fill in real values
nano .env.production.local
```

#### Method 3: PM2 Ecosystem File

Update `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'loyacare-backend',
    script: './backend/dist/server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
    }
  }, {
    name: 'loyacare-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: './frontend',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
    }
  }]
}
```

Deploy with: `pm2 start ecosystem.config.js --env production`

#### Method 4: Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
    env_file:
      - .env.production
      - .env.production.local  # Not in git!
  
  frontend:
    build: ./frontend
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}
    env_file:
      - frontend/.env.production
      - frontend/.env.production.local  # Not in git!
```

Set secrets in `.env.production.local` or pass via host environment.

#### Production Deployment Checklist

Before deploying to production:

1. ✅ Copy `.env.production.local.example` to `.env.production.local`
2. ✅ Generate strong JWT secret: `openssl rand -hex 32`
3. ✅ Set production `DATABASE_URL` with real credentials
4. ✅ Configure `CORS_ORIGIN` with your domain
5. ✅ Set frontend URLs (`NEXT_PUBLIC_*`)
6. ✅ Verify `.env.production.local` is in `.gitignore`
7. ✅ Test connection to production database
8. ✅ Run database migrations: `npm run db:migrate:deploy`

### Testing

For running tests:

```bash
NODE_ENV=test npm test
```

## Environment Variables Reference

### Backend Variables

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | Server port | `4000` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | See `.env.development` | Yes |
| `JWT_SECRET` | Secret for JWT signing | Dev key | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` | No |
| `USE_MOCK` | Enable mock data | `false` | No |
| `PRISMA_LOG_LEVEL` | Prisma logging level | `info` | No |
| `LOG_LEVEL` | Application log level | `debug` | No |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` | Yes |

### Frontend Variables

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:3000` | Yes |
| `NEXT_PUBLIC_BACKEND_API_URL` | Backend API URL | `http://localhost:4000/api` | Yes |
| `PORT` | Server port | `3000` | No |
| `NEXT_PUBLIC_ENABLE_DEVTOOLS` | Enable dev tools | `true` | No |

### Database Variables

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | See `.env.development` | Yes |
| `PRISMA_LOG_LEVEL` | Prisma logging level | `info` | No |
| `SHADOW_DATABASE_URL` | Shadow DB for migrations | Auto-generated | No |

## Security Best Practices

1. **Never commit** `.env.local` or `.env.production.local` files
2. **Always use strong secrets** in production (minimum 32 characters)
3. **Rotate secrets regularly** in production environments
4. **Use different database users** for different environments
5. **Restrict database access** by IP in production
6. **Enable SSL/TLS** for production database connections
7. **Use environment variables or secrets managers** for sensitive data
8. **Review `.gitignore`** to ensure no secrets are committed
9. **Limit permissions** on `.env.production.local` files: `chmod 600`
10. **Use secrets management tools** in production (AWS Secrets Manager, Vault, etc.)

### What Should NOT Be in Git

❌ Never commit these:
- Database passwords
- JWT secrets
- API keys
- Production URLs with sensitive paths
- Email service credentials
- Third-party service tokens

✅ Safe to commit:
- Port numbers
- Log levels
- Feature flags
- Non-sensitive configuration
- Environment names (development/production/test)

## Generating Secure Secrets

Generate secure JWT secrets:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Production Secret Requirements

- **JWT_SECRET**: Minimum 32 characters, random hex string
- **DATABASE_URL**: Use strong passwords (20+ chars, mixed case, numbers, symbols)
- **CORS_ORIGIN**: Must match your actual production domain exactly

## Troubleshooting

### Variables Not Loading

1. Check file names match exactly (case-sensitive)
2. Ensure files are in the correct directory
3. Restart the development server
4. Check for syntax errors in `.env` files

### Database Connection Issues

1. Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
2. Ensure PostgreSQL is running
3. Check database exists
4. Verify credentials and permissions

### CORS Errors

1. Ensure `CORS_ORIGIN` in backend matches frontend URL
2. Check `NEXT_PUBLIC_BACKEND_API_URL` is correct
3. Verify both services are running

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
