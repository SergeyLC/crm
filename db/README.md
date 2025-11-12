# LoyaCare CRM Database

This directory contains the Prisma ORM database schema and configuration for the LoyaCare CRM system.

## 📋 Overview

The database layer is built with **Prisma ORM** and uses **PostgreSQL** as the database engine. It provides a type-safe database access layer for the CRM application, managing leads, deals, users, contacts, appointments, and notes.

## 🔧 Requirements

- **Node.js**: Version 24+ (see `.nvmrc` in project root)
- **Database**: PostgreSQL 13+
- **Prisma CLI**: Included as dev dependency

## 🚀 Quick Start

### 1. Database Setup
```bash
# Reset database and apply all migrations
npm run migrate:reset

# Or run migrations in development mode
npm run migrate
```

**💡 Note:** This project is already initialized. **DO NOT run `npx prisma init`** as it will overwrite existing configuration.

### 2. Seed Database (Optional)
```bash
# Populate database with test data
npm run seed
```

### 3. Generate Prisma Client
```bash
# Generate client and copy to frontend/backend
npm run generate
```

## � Database Schema

The schema includes the following main entities:

- **Users**: Admin and employee accounts with role-based access
- **Leads**: Potential customers and their information
- **Deals**: Sales opportunities with status tracking
- **Contacts**: Customer contact information
- **Appointments**: Scheduled meetings and calls
- **Notes**: Activity logs and comments

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
npm run migrate

# Deploy migrations to production
npm run migrate:deploy

# Reset database and reapply all migrations (⚠️ DELETES ALL DATA)
npm run migrate:reset

# Check migration status
npm run migrate:status
```

### Development Tools
```bash
# Generate Prisma client and copy to projects
npm run generate

# Open Prisma Studio (database GUI)
npm run studio

# Run database seeding
npm run seed
```

### Code Quality
```bash
# TypeScript type checking
npm run type-check

# Linting (not configured)
npm run lint

# Lint checking (not configured)
npm run lint:check
```

## 🔄 Development Workflow

### Making Schema Changes
1. Update `prisma/schema.prisma`
2. Run `npm run migrate` to create and apply migration
3. Run `npm run generate` to update the client
4. Restart your development servers

### Database Reset (Development)
```bash
# Complete reset with fresh data
npm run migrate:reset && npm run seed && npm run generate
```

## 📁 Project Structure

```
db/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   ├── seed.ts           # Database seeding script
│   └── migrations/       # Migration files
├── generated/            # Generated Prisma client (local)
├── .env                  # Database connection (gitignored)
└── package.json          # Database-specific scripts
```

## ⚙️ Configuration

### Environment Variables
Create a `.env.staging.local` or `.env.production.local` file in the `db/` directory:

```env
# Staging
DATABASE_URL="postgresql://loyacare_staging:password@localhost:5432/loya_care_crm_staging"
PRISMA_LOG_LEVEL=warn

# Production
DATABASE_URL="postgresql://loyacare_prod:password@localhost:5432/loya_care_crm_prod"
PRISMA_LOG_LEVEL=warn
```

**Important:**
- The `seed.ts` script automatically loads `.env` files in this priority:
  1. `.env.staging.local`
  2. `.env.production.local`
  3. `.env.local`
  4. `.env`
- Make sure the `.env` file exists in the `db/` directory before running `seed` or `migrate` commands
- See `DATABASE_ENV_CONFIG.md` in `.github/` for detailed configuration

### Schema Configuration
The schema is configured in `prisma/schema.prisma` with:
- PostgreSQL datasource
- Custom generators for client distribution
- Database schema definitions

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