# LoyaCareCRM

*🇺🇸 English  | [🇩🇪 Deutsch](README.de.md)*

## 📋 Project Description

LoyaCareCRM is a modern Customer Relationship Management (CRM) system built with modular architecture. The system is designed for managing leads, deals, contacts, and users with an intuitive interface based on Kanban boards and tables.

## 🏗️ Project Architecture

The project consists of three main parts:

```
LoyaCRM/
├── frontend/     # Next.js 15 + React 18 application
├── backend/      # Express.js + TypeScript API
└── db/           # Prisma ORM + PostgreSQL schema
```

## 🚀 Technology Stack

### Frontend
- **React 18** - library for building user interfaces
- **Next.js 15** - React framework for production
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
│   ├── kanban/            # Kanban components
│   ├── appointment/       # Appointments
│   └── note/              # Notes
├── features/              # Functional capabilities
│   ├── auth/              # Authentication
│   ├── deal/              # Deal management
│   ├── lead/              # Lead management
│   ├── user/              # User management
│   ├── BaseTable/         # Universal tables
│   ├── kanban/            # Kanban functionality
│   └── app/               # Common app functions
├── shared/                # Reusable resources
│   ├── ui/                # UI components
│   ├── lib/               # Utilities and hooks
│   ├── config/            # Configuration
│   └── theme/             # Material-UI theme
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
- Node.js 18+
- PostgreSQL
- npm or yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd LoyaCRM
```

### 2. Install Dependencies

#### Database
```bash
cd db
npm install
```

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
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
npx prisma migrate dev
npx prisma db seed  # if seed script exists
```

### 5. Run Project

#### Development Mode (all services simultaneously)
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

#### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

## 📚 Additional Commands

### Storybook (Frontend)
```bash
cd frontend
npm run storybook
```

### Database
```bash
cd db
npx prisma studio          # Database GUI
npx prisma generate         # Generate Prisma Client
npx prisma migrate reset    # Reset migrations
```

### Linting and Formatting
```bash
cd frontend
npm run lint
npm run lint:fix
```

### Quality Checks
```bash
# Test pre-push hook manually
./test-pre-push.sh

# Run individual checks
cd frontend && npm run type-check && npm run lint:check
cd backend && npm run type-check && npm run lint:check
```

## �️ Pre-push Quality Checks

The project includes automatic quality checks that run before each `git push`:

### What gets checked:
- **Frontend TypeScript compilation** (`npm run type-check`)
- **Frontend ESLint validation** (`npm run lint:check`)
- **Backend TypeScript compilation** (`npm run type-check`)
- **Backend ESLint validation** (`npm run lint:check`)

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

## �🔗 API Endpoints

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
npm run test
npm run test:coverage
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