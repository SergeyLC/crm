# Backend – LoyaCare CRM

**API:** REST  
**ORM:** Prisma  
**Tech Stack:** Node.js 24+, Express 5, TypeScript  
**Database:** PostgreSQL 16 with Prisma adapter-pg

## 📋 Environment Variables

Backend supports loading environment variables from `.env.*` files.

Detailed documentation: [README.env.md](./README.env.md)

### Local Development:

```bash
# 1. Create local environment file
cp .env.example .env.development.local

# 2. Edit and add your secrets
# .env.development.local:
DATABASE_URL="postgresql://postgres:password@localhost:5432/loyacrm_dev"
JWT_SECRET="your-secret-key-min-32-chars"

# 3. Start the server
pnpm run dev
```

### Docker Deployment:

Environment variables are configured in:
- **Production**: Root `.env` file
- **Staging**: Root `.env.stage` file

Docker Compose automatically constructs `DATABASE_URL` from `POSTGRES_*` variables:
```bash
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
```

Check backend logs:
```bash
# Production
docker compose logs backend

# Staging
docker compose -f docker-compose.stage.yml logs backend
```

## Prisma Client

Generated Prisma client files are located in `generated/prisma/` directory. These provide **type-safe database access** and TypeScript types for all database entities.

### Generate Prisma Client

To create or update type definitions after schema changes, run this command in the **db** project:

```bash
cd db
pnpm run generate
```

This will:
1. Generate Prisma client from `db/prisma/schema.prisma`
2. Copy to `backend/generated/prisma/`
3. Copy to `frontend/src/shared/generated/prisma/`

💡 **Note:** The Prisma client is automatically generated from the database schema. Any schema changes require re-running the command above.

### Docker Environment

In Docker containers, Prisma client is generated during image build:
```dockerfile
# Dockerfile
RUN cd db && pnpm run generate
```

## User Management Scripts

Create users via CLI:

```bash
# Create admin user
pnpm exec tsx src/scripts/createUser.ts [Name] [email] [password] ADMIN

# Create employee user
pnpm exec tsx src/scripts/createUser.ts [Name] [email] [password] EMPLOYEE

# Example
pnpm exec tsx src/scripts/createUser.ts "John Doe" john@example.com securepass123 ADMIN
```

### Docker Container

```bash
# Production
docker exec loyacrm-backend sh -c 'cd /app/backend && pnpm exec tsx src/scripts/createUser.ts "Admin" admin@example.com pass123 ADMIN'

# Staging
docker exec loyacrm-staging-backend sh -c 'cd /app/backend && pnpm exec tsx src/scripts/createUser.ts "Admin" admin@example.com pass123 ADMIN'
```

## 📚 API Endpoints

Base path: `/api`

### Authentication (`/auth`)

- `POST /auth/login` - User login
  - Body: `{ email: string, password: string }`
  - Response: 200 OK - `{ token: string, user: User }`

- `GET /auth/me` - Get current authenticated user
  - Headers: `Authorization: Bearer <token>`
  - Response: 200 OK - User object

- `POST /auth/logout` - Logout user
  - Headers: `Authorization: Bearer <token>`
  - Response: 200 OK

### Users (`/users`)

- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
  - Body: `{ name: string, email: string, password: string, role: 'ADMIN' | 'EMPLOYEE' }`
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `PATCH /users/:id/status` - Update user status
- `PATCH /users/:id/block` - Block user
- `PATCH /users/:id/unblock` - Unblock user

### Groups (`/groups`)

- `GET /groups` - List all groups (includes leader and members)
- `GET /groups/:id` - Get group by ID
- `POST /groups` - Create new group
  - Body: `{ name: string, leaderId: string }`
- `PUT /groups/:id` - Update group
  - Body: `{ name?: string, leaderId?: string }`
- `DELETE /groups/:id` - Delete group

**Group Members:**
- `GET /groups/:id/members` - List group members
- `POST /groups/:groupId/members` - Add single user to group
  - Body: `{ userId: string }`
- `DELETE /groups/:groupId/members/:userId` - Remove user from group
- `POST /groups/:groupId/members/batch` - Add multiple users
  - Body: `string[]` (array of userIds)
- `PUT /groups/:groupId/members/batch` - Replace all members (idempotent)
  - Body: `string[]` (array of userIds)
- `DELETE /groups/:groupId/members/batch` - Remove multiple users
  - Body: `string[]` (array of userIds)

### Pipelines (`/pipelines`)

- `GET /pipelines` - List all pipelines
- `GET /pipelines/:id` - Get pipeline by ID
- `POST /pipelines` - Create new pipeline
- `PUT /pipelines/:id` - Update pipeline
- `DELETE /pipelines/:id` - Delete pipeline

**Pipeline Assignments (Users):**
- `POST /pipelines/:id/users` - Assign users to pipeline
  - Body: `{ userIds: string[] }`
- `DELETE /pipelines/:id/users/:userId` - Remove user from pipeline
- `POST /pipelines/:id/users/remove` - Remove multiple users
  - Body: `{ userIds: string[] }`

**Pipeline Assignments (Groups):**
- `POST /pipelines/:id/groups` - Assign groups to pipeline
  - Body: `{ groupIds: string[] }`
- `DELETE /pipelines/:id/groups/:groupId` - Remove group from pipeline
- `POST /pipelines/:id/groups/remove` - Remove multiple groups
  - Body: `{ groupIds: string[] }`

**User Dashboard:**
- `GET /pipelines/user/:userId` - Get pipelines assigned to user

### Deals (`/deals`)

- `GET /deals` - List all deals
- `GET /deals/active` - List active deals only
- `GET /deals/archived` - List archived deals
- `GET /deals/won` - List won deals
- `GET /deals/lost` - List lost deals
- `GET /deals/:id` - Get deal by ID
- `POST /deals` - Create new deal
- `PUT /deals/:id` - Update deal
- `DELETE /deals/:id` - Delete deal

### Leads (`/leads`)

- `GET /leads` - List all leads
- `GET /leads/archived` - List archived leads
- `GET /leads/:id` - Get lead by ID
- `POST /leads` - Create new lead
- `PUT /leads/:id` - Update lead
- `DELETE /leads/:id` - Delete lead

### Contacts (`/contacts`)

- `GET /contacts` - List all contacts
- `GET /contacts/:id` - Get contact by ID
- `POST /contacts` - Create new contact
- `PUT /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact

### Notes (`/notes`)

- `GET /notes` - List all notes
- `GET /notes/:id` - Get note by ID
- `POST /notes` - Create new note
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note

### Appointments (`/appointments`)

- `GET /appointments` - List all appointments
- `GET /appointments/:id` - Get appointment by ID
- `POST /appointments` - Create new appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Delete appointment

### Health Check

- `GET /api/ping` - Health check endpoint
  - Response: `"pong"`

## 🐳 Docker Deployment

### Container Commands

```bash
# Check backend status
docker compose ps backend

# View logs
docker compose logs -f backend

# Restart backend
docker compose restart backend

# Execute command in container
docker exec loyacrm-backend sh -c 'cd /app/backend && pnpm run type-check'

# Check environment variables
docker exec loyacrm-backend env | grep DATABASE_URL
```

### Build and Deploy

```bash
# Build Docker image (from project root)
docker buildx build --platform linux/amd64 \
  -t loyacrm-backend:latest \
  -f docker/backend/Dockerfile .

# Deploy to server
./deploy.sh production
```

See [deployment documentation](../deployment/README.md) for complete deployment guide.

## 📚 Related Documentation

- **[README.env.md](./README.env.md)** - Environment variables configuration
- **[tests/README.md](./tests/README.md)** - Testing documentation
- **[../db/README.md](../db/README.md)** - Database and Prisma guide
- **[../deployment/README.md](../deployment/README.md)** - Docker deployment guide
- **[../DATABASE_ENV_CONFIG.md](../DATABASE_ENV_CONFIG.md)** - Database configuration details

---

**Last Updated:** December 20, 2024  
**Node.js:** 24+  
**Express:** 5.1+  
**Prisma:** 7.0.1  
**Deployment:** Docker Compose
