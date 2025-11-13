# Production Deployment Guide

This guide covers deploying the LoyaCare CRM to production with proper security practices for environment variables and secrets.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Deployment Methods](#deployment-methods)
- [PM2 Deployment](#pm2-deployment)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Variables Setup](#environment-variables-setup)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)

## Prerequisites on Production Server

   - Ubuntu/Debian server with root access
   - Node.js 24+ installed
   - PostgreSQL 14+ installed

2. **Prepare Secrets**
   ```bash
   # Generate JWT secret (32+ characters)
   openssl rand -hex 32
   
   # Prepare database credentials
   # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

3. **Build the Application**
   ```bash
   # Backend
   cd backend
   pnpm run build
   
   # Frontend
   cd ../frontend
   pnpm run build
   ```

## Deployment Methods

### Method 1: PM2 Deployment (Recommended)

PM2 is a production process manager for Node.js applications.

#### Install PM2
```bash
pnpm install -g pm2
```

#### Configure PM2

Update `ecosystem.config.js` in the project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'loyacare-backend',
      script: './backend/dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        // Secrets from environment
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'loyacare-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    }
  ]
};
```

#### Set Environment Variables on Server

**Important:** PM2 uses `process.env`, so variables must be available in the environment where PM2 is running. There are several approaches:

##### Method A: User Environment Variables (easier for testing)

```bash
# Add to ~/.bashrc or ~/.zshrc (for current user)
nano ~/.bashrc  # or ~/.zshrc for zsh

# Add at the end of file:
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export JWT_SECRET="your-secret-key-min-32-chars"
export CORS_ORIGIN="https://your-domain.com"
export NEXT_PUBLIC_API_URL="https://your-domain.com"
export NEXT_PUBLIC_BACKEND_API_URL="https://api.your-domain.com/api"

# Apply changes
source ~/.bashrc

# Verify variables are set
echo $DATABASE_URL
echo $JWT_SECRET
```

**Disadvantages:**
- Works only for the current user
- If PM2 is started via sudo or systemd, variables may be unavailable
- Secrets visible in command history

##### Method B: System Variables (recommended for production)

```bash
# Create environment variables file
sudo nano /etc/environment

# Add (WITHOUT the word export):
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key-min-32-chars"
CORS_ORIGIN="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://your-domain.com"
NEXT_PUBLIC_BACKEND_API_URL="https://api.your-domain.com/api"

# Reload session or re-login
# Or reboot the system
sudo reboot

# Verify
echo $DATABASE_URL
```

**Advantages:**
- Available to all users and services
- Works with systemd and sudo

##### Method C: .env file for PM2 (more convenient and secure)

PM2 can load variables from a file, but **only if you use the `--env-file` option**:

```bash
# 1. Create secrets file (DO NOT commit to git!)
cp .env.production.local.example .env.production.local

# 2. Fill with real values
nano .env.production.local

DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key-min-32-chars"
CORS_ORIGIN="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://your-domain.com"
NEXT_PUBLIC_BACKEND_API_URL="https://api.your-domain.com/api"

# 3. Protect the file
chmod 600 .env.production.local

# 4. Start PM2 with the file
pm2 start ecosystem.config.js --env production --env-file .env.production.local
```

**Advantages:**
- Secrets in a separate file, not in shell history
- Easy to manage and update
- Can have different files for different environments

**Disadvantages:**
- Need to remember to specify `--env-file` on every restart

##### Method D: PM2 ecosystem.config.js with env_file (most convenient)

Updated `ecosystem.config.js` configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'loyacare-backend',
      script: './backend/dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      // Specify environment variables file
      env_file: './.env.production.local',
      // Additional variables (override env_file)
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        // These values will be taken from .env.production.local
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'loyacare-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      env_file: './.env.production.local',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    }
  ]
};
```

Now simply:
```bash
pm2 start ecosystem.config.js --env production
```

**Recommendation:** Use **Method D** (env_file in ecosystem.config.js) or **Method B** (system variables) for production.

#### Start with PM2

```bash
# Option 1: If using env_file in ecosystem.config.js
pm2 start ecosystem.config.js --env production

# Option 2: If using separate .env file
pm2 start ecosystem.config.js --env production --env-file .env.production.local

# Option 3: If variables are already in system environment
pm2 start ecosystem.config.js --env production

# Save PM2 configuration (for auto-start)
pm2 save

# Configure PM2 auto-start on server boot
pm2 startup
# !!! IMPORTANT: Copy and execute the command that pm2 startup outputs

# Example pm2 startup output:
# [PM2] You have to run this command as root. Execute the following command:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your_user --hp /home/your_user

# Check application status
pm2 status

# View logs
pm2 logs

# Interactive monitoring
pm2 monit

# Check which environment variables the application sees
pm2 env 0  # 0 is the application ID from pm2 status
```

**Verifying Environment Variables:**

```bash
# View all variables for a specific process
pm2 env loyacare-backend

# Or by ID
pm2 env 0

# Ensure DATABASE_URL and JWT_SECRET are present
pm2 env 0 | grep DATABASE_URL
pm2 env 0 | grep JWT_SECRET
```

**If variables are not visible in PM2:**

```bash
# 1. Stop all processes
pm2 delete all

# 2. Ensure variables are available in the current session
echo $DATABASE_URL
echo $JWT_SECRET

# 3. If variables are missing - re-login or source
source ~/.bashrc
# or
exit  # and log in again

# 4. Start PM2 again
pm2 start ecosystem.config.js --env production

# 5. Verify
pm2 env 0 | grep DATABASE_URL
```

#### PM2 Useful Commands

```bash
# Restart applications
pm2 restart all

# Stop applications
pm2 stop all

# Delete from PM2
pm2 delete all

# View logs
pm2 logs loyacare-backend
pm2 logs loyacare-frontend

# Monitor
pm2 monit
```

---

### Method 2: Docker Deployment

#### Create Production Dockerfile for Backend

`backend/Dockerfile.prod`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build
RUN pnpm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 4000

CMD ["node", "dist/server.js"]
```

#### Create Production Dockerfile for Frontend

`frontend/Dockerfile.prod`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY next.config.js ./
COPY tsconfig.json ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY src ./src
COPY public ./public

# Build with environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL

RUN pnpm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["pnpm", "start"]
```

#### Docker Compose for Production

`docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 4000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
        NEXT_PUBLIC_BACKEND_API_URL: ${NEXT_PUBLIC_BACKEND_API_URL}
    restart: always
    depends_on:
      - backend
    environment:
      NODE_ENV: production
      PORT: 3000
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - app_network

volumes:
  postgres_data:

networks:
  app_network:
    driver: bridge
```

#### Environment File for Docker

Create `.env.docker.prod` (NOT in git):

```bash
# Database
DB_USER=loyacare_prod
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=loya_care_crm_prod

# Backend
JWT_SECRET=YOUR_32_CHAR_SECRET_HERE
CORS_ORIGIN=https://your-domain.com

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_BACKEND_API_URL=https://api.your-domain.com/api
```

#### Deploy with Docker

```bash
# Build and start
docker-compose -f docker-compose.prod.yml --env-file .env.docker.prod up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend pnpm run db:migrate:deploy

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

### Method 3: Manual Deployment

#### 1. Clone Repository on Server

```bash
cd /var/www
git clone https://github.com/your-org/LoyaCareCRM.git
cd LoyaCareCRM
```

#### 2. Install Dependencies

```bash
# Root
pnpm install

# Backend
cd backend
pnpm install
cd ..

# Frontend
cd frontend
pnpm install
cd ..

# Database
cd db
pnpm install
cd ..
```

#### 3. Setup Environment Variables

```bash
# Create production secret files
cp .env.production.local.example .env.production.local
cp backend/.env.production.local.example backend/.env.production.local
cp frontend/.env.production.local.example frontend/.env.production.local
cp db/.env.production.local.example db/.env.production.local

# Edit each file with real values
nano .env.production.local
nano backend/.env.production.local
nano frontend/.env.production.local
nano db/.env.production.local

# Secure the files
chmod 600 .env.production.local
chmod 600 backend/.env.production.local
chmod 600 frontend/.env.production.local
chmod 600 db/.env.production.local
```

#### 4. Build Applications

```bash
# Backend
cd backend
pnpm run build

# Frontend
cd ../frontend
pnpm run build
```

#### 5. Run Database Migrations

```bash
cd ../db
pnpm run migrate:deploy
```

#### 6. Start Applications

```bash
# Using systemd (recommended)
# Create service files:

# /etc/systemd/system/loyacare-backend.service
# /etc/systemd/system/loyacare-frontend.service

# Enable and start
sudo systemctl enable loyacare-backend
sudo systemctl enable loyacare-frontend
sudo systemctl start loyacare-backend
sudo systemctl start loyacare-frontend

# Or use PM2 (see Method 1)
```

---

## Environment Variables Setup

### Required Production Environment Variables

#### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (32+ chars)
- `CORS_ORIGIN` - Your frontend domain
- `PORT` - Server port (default: 4000)

#### Frontend
- `NEXT_PUBLIC_API_URL` - Your frontend domain
- `NEXT_PUBLIC_BACKEND_API_URL` - Your backend API URL
- `PORT` - Server port (default: 3000)

### Setting Environment Variables

#### Linux/macOS (bash/zsh)
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export JWT_SECRET="your-secret-key"
```

#### Using .env.production.local
```bash
# Copy template
cp .env.production.local.example .env.production.local

# Edit with your values
nano .env.production.local

# Set permissions
chmod 600 .env.production.local
```

---

## Database Setup

### 1. Create Production Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create user
CREATE USER loyacare_prod WITH PASSWORD 'your-strong-password';

-- Create database
CREATE DATABASE loya_care_crm_prod OWNER loyacare_prod;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE loya_care_crm_prod TO loyacare_prod;
```

### 2. Run Migrations

```bash
cd db
pnpm run migrate:deploy
```

### 3. (Optional) Seed Initial Data

```bash
pnpm run seed
```

---

## Post-Deployment

### 1. Setup Nginx Reverse Proxy

`/etc/nginx/sites-available/loyacare`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/loyacare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### 3. Setup Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View metrics
pm2 monit
```

### 4. Verify Deployment

```bash
# Check backend health
curl http://api.your-domain.com/health

# Check frontend
curl http://your-domain.com

```bash
# Check database connection
cd db
pnpm run migrate:status
```
```

---

## Security Checklist

- [ ] Strong database password (20+ characters)
- [ ] JWT secret generated with `openssl rand -hex 32`
- [ ] `.env.production.local` files have `chmod 600` permissions
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall configured (allow only 80, 443, 22)
- [ ] Database not exposed to public internet
- [ ] CORS origin set to exact domain (no wildcards)
- [ ] Regular backups configured for database
- [ ] Log rotation enabled
- [ ] Security updates enabled on server

---

## Troubleshooting

### Cannot Connect to Database
```bash
# Test connection
psql "postgresql://user:pass@host:5432/db"

# Check if PostgreSQL is running
sudo systemctl status postgresql
```

### Backend Won't Start
```bash
# Check logs
pm2 logs loyacare-backend

# Verify environment variables
pm2 env 0

# Test build
cd backend
pnpm run build
```

### Frontend Build Errors
```bash
# Clear cache and rebuild
cd frontend
rm -rf .next
pnpm run build
```

---

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
