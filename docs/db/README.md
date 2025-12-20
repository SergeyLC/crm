# LoyaCare CRM Database

This directory contains the Prisma ORM database schema and configuration for the LoyaCare CRM system.

## 📋 Overview

The database layer is built with **Prisma ORM** and uses **PostgreSQL 16** as the database engine. It provides a type-safe database access layer for the CRM application, managing leads, deals, users, contacts, appointments, and notes.

In Docker deployment, the database runs in a separate PostgreSQL container with persistent volumes for data storage.

## 🔧 Requirements

### Local Development
- **Node.js**: Version 24+ (see `.nvmrc` in project root)
- **Database**: PostgreSQL 16+ (or Docker container)
- **Prisma CLI**: Included as dev dependency
- **pnpm**: Package manager (v9+)

### Docker Deployment
- **Docker & Docker Compose**: For running PostgreSQL container
- **Database URL**: Configured via environment variables in `.env` or `.env.stage`

## 🚀 Quick Start

### Local Development

```bash
# 1. Ensure DATABASE_URL is set in db/.env
cd db
cat .env  # Should contain: postgresql://...

# 2. Run migrations
pnpm run migrate

# 3. Generate Prisma client and copy to frontend/backend
pnpm run generate

# 4. (Optional) Seed database with test data
pnpm run seed
```

### Docker Deployment

```bash
# Migrations run inside backend container
docker exec loyacrm-backend sh -c 'cd /app/db && pnpm run migrate:deploy'

# Seed staging database only (never production!)
docker exec loyacrm-staging-backend sh -c 'cd /app/db && pnpm run seed'

# Generate Prisma client in container
docker exec loyacrm-backend sh -c 'cd /app/db && pnpm run generate'
```

**💡 Note:** This project is already initialized. **DO NOT run `npx prisma init`** as it will overwrite existing configuration.

## 📂 Database Schema

The Prisma schema (`prisma/schema.prisma`) defines the following main entities:

- **Users**: Admin and employee accounts with role-based access (ADMIN, EMPLOYEE)
- **Leads**: Potential customers with contact information and status tracking
- **Deals**: Sales opportunities with stage tracking (NEW, QUALIFIED, PROPOSAL, etc.)
- **Contacts**: Customer contact details linked to leads/deals
- **Appointments**: Scheduled meetings and calls with type classification
- **Notes**: Activity logs and comments for all entities

**Database:** PostgreSQL 16 with adapter-pg for connection pooling

## 🛠️ Available Commands

### ⚠️ Project Initialization (Only for NEW Projects)
```bash
# Initialize NEW Prisma project (⚠️ DO NOT RUN IN EXISTING PROJECTS)
npx prisma init
```

**🚨 WARNINGS:**
- **Only run this in a completely NEW/EMPTY project directory**
- **DO NOT run this command in existing projects** - it will overwrite your current schema
- **This command is NOT needed** if you cloned this repository or the project is already set up
- Use this only when starting a fresh Prisma project from scratch

### Database Management
```bash
# Development migration (creates new migration if schema changed)
pnpm run migrate

# Deploy migrations to production
pnpm run migrate:deploy

# Reset database and reapply all migrations (⚠️ DELETES ALL DATA)
pnpm run migrate:reset

# Check migration status
pnpm run migrate:status
```

### Development Tools
```bash
# Generate Prisma client and copy to projects
pnpm run generate

# Open Prisma Studio (database GUI)
pnpm run studio

# Run database seeding
pnpm run seed
```

### Code Quality
```bash
# TypeScript type checking
pnpm run type-check

# Linting (not configured)
pnpm run lint

# Lint checking (not configured)
pnpm run lint:check
```

## 🔄 Development Workflow

### Making Schema Changes (Local)
1. Update `prisma/schema.prisma`
2. Run `pnpm run migrate` to create and apply migration
3. Run `pnpm run generate` to update the client
4. Restart your development servers

### Making Schema Changes (Docker)
1. Update `prisma/schema.prisma` on host
2. Rebuild Docker images to include schema changes
3. Run migrations in container:
   ```bash
   docker exec loyacrm-backend sh -c 'cd /app/db && pnpm run migrate:deploy'
   ```
4. Restart containers: `docker compose restart backend frontend`

### Database Reset (Development Only)
```bash
# Local development
cd db
pnpm run migrate:reset && pnpm run seed && pnpm run generate

# Docker staging (⚠️ deletes all data)
docker exec loyacrm-staging-backend sh -c 'cd /app/db && pnpm run migrate:reset'
docker exec loyacrm-staging-backend sh -c 'cd /app/db && pnpm run seed'
```

## 📁 Project Structure

```
db/
├── prisma/
│   ├── schema.prisma           # Database schema definition
│   ├── seed.ts                 # Database seeding script
│   ├── client.ts               # Prisma client singleton
│   └── migrations/             # Migration history
├── generated/
│   └── prisma-client/          # Generated Prisma client
├── temp/                       # Compiled TypeScript output
├── .env                        # Local development DB URL
├── .env.production.local       # Production DB URL (gitignored)
├── .env.test.local            # Test DB URL (gitignored)
├── package.json                # Database-specific scripts
├── prisma.config.ts            # Prisma configuration
└── tsconfig.json               # TypeScript configuration
```

## ⚙️ Configuration

### Environment Variables

**Local Development** (`db/.env`):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/loyacrm_dev"
```

**Docker Deployment:**
DATABASE_URL is constructed by Docker Compose from environment variables in root `.env` or `.env.stage`:

```env
# Production (.env)
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=loyacrm

# Staging (.env.stage)
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=loyacrm_staging
```

Docker Compose automatically constructs:
```
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
```

**Important:**
- For local development, use `db/.env`
- For Docker deployment, use root `.env` or `.env.stage`
- The `seed.ts` script checks for `DATABASE_URL` environment variable
- Never commit production credentials to git
- See `docs/DATABASE_ENV_CONFIG.md` for detailed configuration

### Schema Configuration
The schema in `prisma/schema.prisma` includes:
- **Generator**: `prisma-client-js` with output to `generated/prisma-client/`
- **Binary Targets**: `native` and `linux-musl-arm64-openssl-3.0.x` for Docker
- **Datasource**: PostgreSQL (URL from environment)
- **Models**: User, Lead, Deal, Contact, Appointment, Note with relations

## 🔒 Security Notes

- Database credentials are stored in `.env` (gitignored)
- Use strong passwords in production
- Regularly backup your database
- The `migrate:reset` command deletes all data - use with caution

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Studio Guide](https://www.prisma.io/studio)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

When working with database changes:
1. Always test migrations on a copy of production data first
2. Update this README if you add new commands
3. Document any breaking schema changes
4. Ensure seed data remains realistic and useful
5. Never run `seed` in production environments
6. Use `migrate:deploy` (not `migrate`) in production

## 📚 Related Documentation

- **[DATABASE_ENV_CONFIG.md](../DATABASE_ENV_CONFIG.md)** - Detailed database configuration
- **[DATABASE_QUICK_REFERENCE.md](../DATABASE_QUICK_REFERENCE.md)** - Quick command reference
- **[deployment/README.md](../deployment/README.md)** - Docker deployment guide
- **[Prisma Documentation](https://www.prisma.io/docs)** - Official Prisma docs
- **[PostgreSQL Documentation](https://www.postgresql.org/docs/)** - PostgreSQL reference

---

**Last Updated:** December 20, 2024  
**Prisma Version:** 7.0.1  
**PostgreSQL Version:** 16  
**Deployment:** Docker Compose with persistent volumes