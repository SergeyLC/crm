# LoyaCareCRM

*🇺🇸 English  | [🇩🇪 Deutsch](README.de.md)*

## 📋 Project Description

LoyaCareCRM is a modern Customer Relationship Management (CRM) system built with modular architecture. The system is designed for managing leads, deals, contacts, and users with an intuitive interface based on Kanban boards and tables.

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

### Prerequisites
- Node.js 24+
- PostgreSQL
- pnpm 10+

### 1. Clone Repository
```bash
git clone <repository-url>
cd LoyaCRM
```

### 2. Install Dependencies

#### Database
```bash
cd db
pnpm install
```

#### Backend
```bash
cd backend
pnpm install
```

#### Frontend
```bash
cd frontend
pnpm install
```

### 3. Environment Variables Setup

Create `.env` files in respective directories:

#### db/.env
```env
DATABASE_URL="postgresql://username:password@localhost:5432/loyacrm"
```

#### backend/.env
```env
DATABASE_URL="postgresql://username:password@localhost:5432/loyacrm"
JWT_SECRET="your-jwt-secret"
PORT=4000
```

### 4. Database Initialization
```bash
cd db
pnpm exec prisma migrate dev
pnpm exec prisma db seed  # if seed script exists
```

### 5. Run Project

#### Development Mode (all services simultaneously)
```bash
# Terminal 1: Backend
cd backend
pnpm run dev

# Terminal 2: Frontend  
cd frontend
pnpm run dev
```

#### Production Build
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

### What gets checked:
- **Frontend TypeScript compilation** (`pnpm run type-check`)
- **Frontend ESLint validation** (`pnpm run lint:check`)
- **Frontend build integrity** (`pnpm run build`)
- **Backend TypeScript compilation** (`pnpm run type-check`)
- **Backend ESLint validation** (`pnpm run lint:check`)
- **Backend build integrity** (`pnpm run build`)
- **Backend API functionality** (server startup + ping endpoint)

### How it works:
- Pre-push hook automatically runs when you execute `git push`
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

### Docker (if configured)
```bash
docker-compose up -d
```

### Vercel (Frontend)
```bash
cd frontend
vercel deploy
```

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