# LoyaCareCRM

*🇺🇸 English  | [🇩🇪 Deutsch](docs/README.de.md)*

## 📋 Project Description

LoyaCareCRM is a modern Customer Relationship Management (CRM) system built with modular architecture. The system is designed for managing leads, deals, contacts, and users with an intuitive interface based on Kanban boards and tables.

## 🚀 Quick Start

### 🐳 Docker (Recommended)

#### Development Environment
```bash
# Clone repository
git clone <your-repository-url> loyacrm
cd loyacrm

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

### 🖥️ Manual Setup

For manual Ubuntu server deployment, see [DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md)

For detailed Docker development setup, see [DOCKER_DEVELOPMENT.md](docs/DOCKER_DEVELOPMENT.md)

For Docker production deployment, see [DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md)

## 🏗️ Project Architecture

The project consists of three main parts:

```
LoyaCareCRM/
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

For detailed Docker development setup, see [DOCKER_DEVELOPMENT.md](docs/deployment/DOCKER_DEVELOPMENT.md)

For Docker production deployment, see [DOCKER_DEPLOYMENT.md](docs/deployment/DOCKER_DEPLOYMENT.md)

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
docker-compose -f docker-compose.dev.yml exec postgres psql -U loyacrm -d loyacrm

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
cd LoyaCRM

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
cd LoyaCRM
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
DATABASE_URL="postgresql://username:password@localhost:5432/loyacrm"
```

##### backend/.env
```env
DATABASE_URL="postgresql://username:password@localhost:5432/loyacrm"
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

### 🖥️ Manual Ubuntu Server Deployment

For detailed manual deployment instructions, see [DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md)

### 🚀 CI/CD with GitHub Actions

The project includes automated deployment via GitHub Actions. See [DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md#github-actions-ci/cd-setup) for details.

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

## 📚 Documentation

All project documentation is organized in the [`docs/`](./docs/) directory:

### 🚀 Deployment & Infrastructure
- **[Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Complete Ubuntu server deployment
- **[Docker Deployment](docs/deployment/DOCKER_DEPLOYMENT.md)** - Production Docker setup
- **[Docker Development](docs/deployment/DOCKER_DEVELOPMENT.md)** - Development Docker environment
- **[Docker Quick Start](docs/deployment/DOCKER_QUICK_START.md)** - Quick Docker setup guide
- **[CI/CD Workflow](docs/deployment/CI_CD_WORKFLOW.md)** - GitHub Actions automation

### 🗄️ Database & Environment
- **[Database Environment Config](docs/DATABASE_ENV_CONFIG.md)** - Database configuration
- **[Database Quick Reference](docs/DATABASE_QUICK_REFERENCE.md)** - Database commands
- **[Environment Setup](docs/README.env.md)** - Environment variables guide

### 🧪 Testing & Quality
- **[Playwright Documentation](docs/PLAYWRIGHT_DOCUMENTATION_INDEX.md)** - E2E testing guide
- **[Playwright Migration](docs/PLAYWRIGHT_MIGRATION_COMPLETE.md)** - Testing framework migration
- **[Testing Strategy](docs/TESTING_STRATEGY.md)** - Testing approach and tools

### ⚡ Performance & Optimization
- **[Next.js Optimization](docs/NEXTJS_BUILD_OPTIMIZATION.md)** - Frontend performance
- **[Nginx Optimization](docs/deployment/NGINX_OPTIMIZATION.md)** - Server optimization
- **[Server Performance](docs/deployment/SERVER_PERFORMANCE.md)** - Performance monitoring

### 🛠️ Development Tools
- **[GitHub Secrets Guide](docs/deployment/GITHUB_SECRETS_GUIDE.md)** - CI/CD secrets setup
- **[PNPM Migration](docs/PNPM_MIGRATION.md)** - Package manager migration
- **[PNPM Summary](docs/PNPM_SUMMARY.md)** - PNPM usage guide

### 📁 Component Documentation
- **[Backend README](docs/backend/README.md)** - Backend architecture and setup
- **[Frontend README](docs/frontend/README.md)** - Frontend architecture and setup
- **[Database README](docs/db/README.md)** - Database schema and migrations

### 🌍 Internationalization
- **[German Documentation](docs/README.de.md)** - German version of main README
- **[German Deployment](docs/deployment/DEPLOYMENT.de.md)** - German deployment guide
- **[German Playwright Migration](docs/PLAYWRIGHT_MIGRATION_COMPLETE.de.md)** - German testing docs

### 🔧 Specialized Guides
- **[Deployment Optimization](docs/deployment/DEPLOYMENT_OPTIMIZATION.md)** - Deployment improvements
- **[Fix Seed Error](docs/deployment/FIX_SEED_ERROR.md)** - Database seeding fixes
- **[Secrets Quickstart](docs/deployment/SECRETS_QUICKSTART.md)** - Quick secrets setup
- **[Server Setup](docs/deployment/SERVER_SETUP.md)** - Server configuration
- **[Staging Setup](docs/deployment/STAGING_SETUP.md)** - Staging environment setup
- **[Staging Commands](docs/deployment/STAGING_COMMANDS.md)** - Staging management
- **[Staging Quick Setup](docs/deployment/STAGING_QUICK_SETUP_IP.md)** - Quick staging setup

### 📖 Additional Resources
- **[Environment Backend](docs/backend/README.env.md)** - Backend environment config
- **[Tests Backend](docs/backend/tests/README.md)** - Backend testing documentation
- **[Playwright Tests Summary](docs/PLAYWRIGHT_TESTS_SUMMARY.md)** - Test results summary
- **[User Entity](docs/frontend/entities/user/README.md)** - User entity documentation
- **[Auth Feature](docs/frontend/features/auth/README.md)** - Authentication feature docs