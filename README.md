# CRM

## Project Description

CRM is a modern Customer Relationship Management (CRM) system built with modular architecture. The system is designed for managing leads, deals, contacts, and users with an intuitive interface based on Kanban boards and tables.

## Quick Start

### Automated Deployment (Recommended)

The project uses automated deployment with GitHub Actions (Docker by default):

| Trigger | Environment | Port | Deploy directory |
|---------|-------------|------|------------------|
| Push to **`main`** | `stage-main` | **8080** | `/var/www/crm-stage-main` |
| Push to **`develop`** | `stage-develop` | **8081** | `/var/www/crm-stage-develop` |
| Git tag **`v*`** (e.g. `v1.0.7`) | `production` | **80** | `/var/www/crm-production` |

CI runs **database migrations** (`prisma migrate deploy`). It does **not** run seed; seed demo users manually after a fresh database if needed.

#### Configuration
1. Set `DEPLOYMENT_TYPE=docker` in GitHub repository variables (optional; docker is the default)
2. Create environments `production`, `stage-main`, and `stage-develop` with secrets
3. Push to the branch or push a `v*` tag to deploy

**Guides:** [Deployment overview](docs/deployment/README.md) · [CI/CD setup](.github/CI_CD_SETUP.md) · [Deployment config](DEPLOYMENT_CONFIG.md)

### 🐳 Docker (Local Development)

#### Development Environment
```bash
# Clone repository
git clone <your-repository-url> crm
cd crm

# Copy environment file
cp .env.dev.example .env.dev

# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up --build -d

# Access application
# Frontend: http://localhost
# Backend API: http://localhost/api
# Database: localhost:5435
# Health check: http://localhost/api/health
```

#### Production Environment
```bash
# Configure production environment
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend

# Edit environment variables
nano .env.backend  # Database and secrets
nano .env.frontend # API URLs

# Start production environment
docker-compose up --build -d

# Access application
# Frontend: http://localhost:3002
# Backend API: http://localhost:4002/api
```

### Manual / server setup

- [Deployment documentation](docs/deployment/README.md) (canonical numbered guides)
- [Server setup](docs/deployment/01-server-setup.md)
- Local Docker development: `docker-compose -f docker-compose.dev.yml up --build -d` (see [Docker ports](docs/DOCKER_PORTS_ARCHITECTURE.md))

## 🏗️ Project Architecture

The project consists of three main parts:

```
CRM/
├── frontend/     # Next.js 16 + React 19 application
├── backend/      # Node.js + Express API server
├── db/           # Prisma ORM database schema and migrations
└── scripts/      # Deployment and utility scripts
```

## 🛠 Tech Stack

### Frontend
- **React 19** - library for building user interfaces
- **Next.js 16** - React framework for production

## 🚀 Technology Stack

### Frontend
- **React 19** - library for building user interfaces
- **Next.js 16** - React framework for production
- **TypeScript** - static typing
- **Material-UI v7** - UI component library
- **Redux Toolkit + RTK Query** - state management and API
- **@dnd-kit** - drag & drop functionality for Kanban
- **React Hook Form + Yup** - form management and validation
- **Storybook** - component development and documentation

### Backend
- **Node.js** - server runtime environment
- **Express.js** - web framework
- **TypeScript** - static typing
- **Prisma ORM** - database interaction
- **JWT** - authentication and authorization
- **bcrypt** - password hashing
- **UUID** - unique identifier generation

### Database
- **PostgreSQL** - relational database
- **Prisma** - modern ORM for TypeScript

## 🐳 Docker Management

See [docs/deployment/README.md](docs/deployment/README.md) and [docs/DOCKER_PORTS_ARCHITECTURE.md](docs/DOCKER_PORTS_ARCHITECTURE.md).

### Development Environment
```bash
# Start development containers with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Start with rebuild
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop containers
docker-compose -f docker-compose.dev.yml down

# Access database
docker-compose -f docker-compose.dev.yml exec postgres psql -U crm -d crm

# Run backend commands
docker-compose -f docker-compose.dev.yml exec backend sh -c "cd /app/db && pnpm run migrate"

# Check health
curl http://localhost/api/health
```

**Development Environment Features:**
- **Health checks** for PostgreSQL and Backend services
- **Named volumes** for persistent database data
- **Backup directory** mounted at `./backups` for database backups
- **Hot reload** for frontend and backend development

### Production Environment
```bash
# Start production containers
docker-compose up -d

# Update and restart
docker-compose pull && docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Useful Docker Commands
```bash
# Check container status
docker ps

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## 🏛️ Frontend Architecture (Feature-Sliced Design)

The project uses **Feature-Sliced Design** architecture for scalability and maintainability:

```
frontend/src/
├── app/                    # Application configuration (Next.js App Router)
├── entities/               # Business entities
│   ├── deal/              # Deals
│   ├── lead/              # Leads  
│   ├── contact/           # Contacts
│   ├── user/              # Users
│   ├── group/             # Groups
│   ├── pipeline/          # Pipelines
│   ├── kanban/            # Kanban components
│   ├── appointment/       # Appointments
│   └── note/              # Notes
├── features/              # Functional capabilities
│   ├── auth/              # Authentication
│   ├── deal/              # Deal management
│   ├── lead/              # Lead management
│   ├── user/              # User management
│   ├── group/             # Group management
│   ├── pipeline/          # Pipeline management
│   ├── base-table/        # Universal tables
│   ├── kanban/            # Kanban functionality
│   ├── form/              # Form components
│   └── side-menu/         # Side menu functionality
├── widgets/               # Complex UI blocks
│   └── UserPipelinesDashboard/  # User pipelines dashboard
├── shared/                # Reusable resources
│   ├── ui/                # UI components
│   ├── lib/               # Utilities and hooks
│   ├── api/               # API layer
│   ├── config/            # Configuration
│   ├── types/             # TypeScript types
│   ├── model/             # Data models
│   └── generated/         # Generated files
├── locales/               # Internationalization
├── components/            # Legacy components (being migrated)
└── stories/               # Storybook stories
```

## 🗄️ Data Model

### Main entities:

- **User** - System users (administrators and employees)
- **Contact** - Customer contact information
- **Deal** - Deals with various stages and statuses
- **Note** - Deal notes
- **Appointment** - Meetings and calls

### Deal stages:
- `LEAD` - Lead
- `QUALIFIED` - Qualified
- `CONTACTED` - Contacted
- `DEMO_SCHEDULED` - Demo scheduled
- `PROPOSAL_SENT` - Proposal sent
- `NEGOTIATION` - Negotiation
- `WON` - Won
- `LOST` - Lost

## 🎯 Key Features

### 1. Deal Management
- **Kanban board** for visual deal management
- **Tables** with sorting, filtering and bulk operations
- **Drag & Drop** moving deals between stages
- **Archiving** and restoring deals
- **Bulk operations** (archiving, restoring)

### 2. Authentication System
- JWT-based authentication
- User roles (ADMIN, EMPLOYEE)
- Protected routes

### 3. Interactive Components
- **BaseTable** - universal table with selection, sorting and actions
- **Kanban Board** - with drag & drop and visual feedback
- **Responsive design** for various devices

### 4. UX/UI Features
- **Dark/light theme** Material-UI
- **Semantic colors** for different actions (win - green, loss - red)
- **Animations and transitions** for improved user experience
- **Visual feedback** during drag & drop operations

## 🛠️ Installation and Setup

### 🐳 Docker Setup (Recommended)

#### Prerequisites
- Docker 24.0+
- Docker Compose 2.0+
- Git

#### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd crm

# Development environment
cp .env.dev.example .env.dev
docker-compose -f docker-compose.dev.yml up --build -d

# Production environment
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend
docker-compose up --build -d
```

### 🖥️ Manual Setup

#### Prerequisites
- Node.js 24+
- PostgreSQL
- pnpm 10+

#### 1. Clone Repository
```bash
git clone <repository-url>
cd crm
```

#### 2. Install Dependencies

##### Database
```bash
cd db
pnpm install
```

##### Backend
```bash
cd backend
pnpm install
```

##### Frontend
```bash
cd frontend
pnpm install
```

#### 3. Environment Variables Setup

Create `.env` files in respective directories:

##### db/.env
```env
DATABASE_URL="postgresql://username:password@localhost:5432/crm"
```

##### backend/.env
```env
DATABASE_URL="postgresql://username:password@localhost:5432/crm"
JWT_SECRET="your-jwt-secret"
PORT=4000
```

#### 4. Database Initialization
```bash
cd db
pnpm exec prisma migrate dev
pnpm exec prisma db seed  # if seed script exists
```

#### 5. Run Project

##### Development Mode (all services simultaneously)
```bash
# Terminal 1: Backend
cd backend
pnpm run dev

# Terminal 2: Frontend  
cd frontend
pnpm run dev
```

##### Production Build
```bash
# Backend
cd backend
pnpm run build
pnpm start

# Frontend
cd frontend
pnpm run build
pnpm start
```

## 📚 Additional Commands

### Storybook (Frontend)
```bash
cd frontend
pnpm run storybook
```

### Database
```bash
cd db
pnpm exec prisma studio          # Database GUI
pnpm exec prisma generate         # Generate Prisma Client
pnpm exec prisma migrate reset    # Reset migrations
```

### Linting and Formatting
```bash
cd frontend
pnpm run lint
pnpm run lint:fix
```

### Quality Checks
```bash
# Test pre-push hook manually
./test-pre-push.sh

# Run individual checks
cd frontend && pnpm run type-check && pnpm run lint:check && pnpm run build
cd backend && pnpm run type-check && pnpm run lint:check && pnpm run build
```

## 🛡️ Pre-push Quality Checks

The project includes automatic quality checks that run before each `git push`:

### Installation

```bash
# Install git hooks (run once after cloning)
./scripts/install-hooks.sh
```

### What gets checked:
- **Frontend TypeScript compilation** (`pnpm run type-check`)
- **Frontend ESLint validation** (`pnpm run lint:check`)
- **Frontend tests** (`pnpm test`)
- **Frontend E2E tests** (`pnpm run playwright`)
- **Frontend build integrity** (`pnpm run build`)
- **Backend TypeScript compilation** (`pnpm run type-check`)
- **Backend ESLint validation** (`pnpm run lint:check`)
- **Backend tests** (`pnpm test`)
- **Backend build integrity** (`pnpm run build`)
- **DB TypeScript compilation** (`pnpm run type-check`)
- **DB ESLint validation** (`pnpm run lint:check`)

### How it works:
- Pre-push hook automatically runs when you execute `git push` to a branch
- **Tag pushes are skipped** (commit already tested before tagging)
- If any check fails, the push is blocked
- Colored output shows the status of each check
- All checks must pass for the push to proceed

### Manual testing:
```bash
# Test the pre-push hook manually
.git/hooks/pre-push

# Or use the convenience script
./test-pre-push.sh
```

### Skipping checks (not recommended):
```bash
# Push without running checks (bypasses hook)
git push --no-verify
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registration (admin only)
- `POST /api/auth/logout` - Logout

### Deals
- `GET /api/deals` - Get deals list
- `POST /api/deals` - Create deal
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Users
- `GET /api/users` - Get users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user

## 🎨 Theme Customization

The project supports customization through Material-UI theme:

```typescript
// src/shared/theme/index.ts
export const lightThemeOptions: ThemeOptions = {
  palette: {
    primary: { main: '#1976d2' },
    dropZone: {
      main: 'rgba(25, 118, 210, 0.1)',
      light: 'rgba(25, 118, 210, 0.05)',
    },
    // ...
  }
}
```

## 🧪 Testing

```bash
cd frontend
pnpm run test
pnpm run test:coverage
```

## 📦 Deployment

### 🐳 Docker Deployment (Recommended)

#### Development Environment
```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Access URLs:
# Frontend: http://localhost
# Backend API: http://localhost/api
# Database: localhost:5435
# Health check: http://localhost/api/health
```

#### Production Environment
```bash
# Start production containers
docker-compose up -d

# Access URLs:
# Frontend: http://localhost:3002
# Backend API: http://localhost:4002/api
```

#### Update Deployment
```bash
# Pull latest changes
git pull origin main

# Update containers
docker-compose pull && docker-compose up -d

# Check status
docker-compose ps
```

### Manual Ubuntu server deployment

See [docs/deployment/README.md](docs/deployment/README.md) and [01-server-setup.md](docs/deployment/01-server-setup.md).

### CI/CD with GitHub Actions

See [.github/CI_CD_SETUP.md](.github/CI_CD_SETUP.md).

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Developer:** Sergey Daub (sergeydaub@gmail.com)
- **Architect:** Sergey Daub (sergeydaub@gmail.com)

## 🐛 Known Issues

- [ ] Performance optimization for large tables
- [ ] Adding real-time notifications
- [ ] Mobile version improvements

## 🔮 Roadmap

- [ ] Analytics and reports
- [ ] Mobile application
- [ ] Integration API
- [ ] Advanced access permissions

---

## Documentation

Canonical docs live under [`docs/`](./docs/) and [`.github/`](./.github/).

### Deployment and infrastructure
- **[Deployment overview](docs/deployment/README.md)** — numbered guides `01`–`06`
- **[CI/CD setup](.github/CI_CD_SETUP.md)** — branch/tag → environment matrix (source of truth)
- **[Deployment config](DEPLOYMENT_CONFIG.md)** — `DEPLOYMENT_TYPE` and GitHub environments
- **[GitHub Secrets](docs/deployment/GITHUB_SECRETS_GUIDE.md)**

### Database and environment
- **[Database environment config](docs/DATABASE_ENV_CONFIG.md)**
- **[Database quick reference](docs/DATABASE_QUICK_REFERENCE.md)**
- **[Environment variables](docs/README.env.md)**
- **[Database README](docs/db/README.md)**

### Testing
- **[Playwright index](docs/PLAYWRIGHT_DOCUMENTATION_INDEX.md)**
- **[Testing strategy](docs/TESTING_STRATEGY.md)**

### Performance
- **[Next.js build optimization](docs/NEXTJS_BUILD_OPTIMIZATION.md)**
- **[Nginx optimization](docs/deployment/NGINX_OPTIMIZATION.md)**
- **[Server performance](docs/deployment/SERVER_PERFORMANCE.md)**

### App packages
- **[Backend](docs/backend/README.md)** · **[Frontend](docs/frontend/README.md)** · **[DB](docs/db/README.md)**
- **[Auth feature](docs/frontend/features/auth/README.md)** · **[User entity](docs/frontend/entities/user/README.md)**