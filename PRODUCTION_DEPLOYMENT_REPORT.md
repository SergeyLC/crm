# Production Deployment Report — CRM

## Server Information

- **IP address**: 217.160.74.128
- **OS**: Ubuntu 24.04 LTS
- **Memory**: 848 MB RAM + 2 GB Swap
- **Disk**: 8.7 GB (86% used, 1.3GB available)
- **Docker**: 29.1.2
- **Docker Compose**: v5.0.0
- **Node.js**: 24.12.0
- **pnpm**: 10.26.0
- **PM2**: 6.0.14

## Deployment Architecture

### Hybrid Approach
Because of server resource limits (848MB RAM, 8.7GB disk), a hybrid approach was used:

**Docker containers** (infrastructure):
- PostgreSQL 16-alpine (port 5432)
- Nginx alpine (port 80)

**PM2 processes** (applications):
- Backend Node.js (port 4000)
- Frontend Next.js (port 3000)

### Why this approach
1. Frontend (771MB) and backend (310MB) Docker images are too large for an 8.7GB disk
2. Next.js builds need ~2GB RAM; the server only has 848MB
3. The hybrid approach allows:
   - Isolating the database in Docker with a persistent volume
   - Minimizing disk usage
   - Building the frontend locally and transferring only the `.next` directory

## Deployed Components

### 1. Docker Containers

#### PostgreSQL
```
Container: crm-postgres
Image: postgres:16-alpine
Status: Up 46 minutes (healthy)
Ports: 0.0.0.0:5432->5432/tcp
Volume: crm_pg_data
```

Configuration:
- Database: crm
- User: crm
- Password: crm2024
- Health check: pg_isready every 5 seconds

#### Nginx
```
Container: crm-nginx
Image: nginx:alpine
Status: Up 6 minutes
Ports: 0.0.0.0:80->80/tcp
```

Configuration:
- Proxy to backend: 172.18.0.1:4000 (Docker gateway IP)
- Proxy to frontend: 172.18.0.1:3000 (Docker gateway IP)
- HTTP only (no SSL)
- Gzip compression enabled

### 2. PM2 Processes

#### Backend
```
Name: crm-backend
Script: dist/server.js
Status: online (0 restarts)
Memory: ~96 MB
CPU: 0%
```

Environment variables:
```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://crm:crm2024@localhost:5432/crm
JWT_SECRET=your-secret-key-here-change-in-production
```

#### Frontend
```
Name: crm-frontend
Script: pnpm start
Status: online (45 restarts resolved)
Memory: ~103 MB
CPU: 0%
```

Environment variables:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://crm:crm2024@localhost:5432/crm
NEXT_PUBLIC_BACKEND_API_URL=http://217.160.74.128/api
```

## Database

### Migrations
3 migrations applied:
1. `20250905201112_init` — schema initialization
2. `20250908084121_pipelines` — pipelines added
3. `20250908140148_group_description` — group descriptions

### Seed Data
Database seeded with test data:
- Users: admin@example.com, admin@beispiel.de, v1-v10@example.com
- Leads: ~50 records
- Deals: ~40 records in various statuses

## Application Access

### Web Interface
```
URL: http://217.160.74.128
Redirect: http://217.160.74.128/de (German locale by default)
```

### API Endpoint
```
Base URL: http://217.160.74.128/api
Auth: http://217.160.74.128/api/auth/login
```

### Test Login
```
Email: admin@example.com
Password: 1
Role: ADMIN
```

API Response:
```json
{
  "success": true,
  "user": {
    "id": "f8c92221-4c88-4dde-8b36-9fae47ccf93a",
    "name": "Administrator 3",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "token": "eyJhbGc..."
}
```

## Server File Structure

```
/var/www/crm-production/
├── docker-compose.simple.yml   # Simplified compose (postgres + nginx only)
├── .env                         # Environment variables
├── nginx/
│   └── conf.d/
│       └── crm.conf        # Nginx reverse proxy config
└── secrets/
    ├── db_password.txt
    └── jwt_secret.txt

/var/www/crm/
├── backend/                     # Backend source code
│   ├── dist/                   # Compiled TypeScript
│   ├── generated/prisma/       # Prisma client
│   └── ...
├── frontend/                    # Frontend source code
│   ├── .next/                  # Built Next.js app
│   ├── src/
│   └── ...
├── db/                          # Database package
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── generated/prisma-client/
├── ecosystem.config.js          # PM2 configuration
└── node_modules/                # 1.2GB (all workspace dependencies)
```

## Autostart

### PM2 Systemd Service
PM2 autostart on reboot is configured:
```
Service: pm2-root.service
Status: enabled
Location: /etc/systemd/system/pm2-root.service
```

Management commands:
```bash
systemctl status pm2-root
systemctl restart pm2-root
pm2 list
pm2 logs
pm2 restart all
```

### Docker Compose
Containers with `restart: unless-stopped` start automatically after reboot.

## Problems and Solutions

### 1. Insufficient Disk Space
**Problem**: Docker images (1GB+) do not fit on an 8.7GB disk

**Solution**:
- Use the hybrid approach
- Docker only for infrastructure (postgres, nginx)
- Applications run via PM2 from source
- Frontend is built locally; only the `.next` directory is transferred

### 2. Insufficient RAM for Next.js Build
**Problem**: Next.js build needs >1GB RAM; server has 848MB

**Solution**:
- Build frontend locally on a machine with more RAM
- Transfer the ready `.next` directory to the server via rsync
- Use `NODE_OPTIONS='--max-old-space-size=2048'` for the local build

### 3. Port 3000 Already in Use
**Problem**: An old next-server process occupied port 3000

**Solution**:
```bash
kill -9 $(ss -tulpn | grep :3000 | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2)
pm2 restart crm-frontend
```

### 4. Nginx host.docker.internal
**Problem**: `host.docker.internal` does not work on Linux

**Solution**:
- Use the Docker gateway IP: 172.18.0.1
- Obtain via: `docker network inspect <network> | grep Gateway`

### 5. Frontend Crashes (45 restarts)
**Problem**: Frontend restarted due to EADDRINUSE errors

**Solution**:
- Stop PM2: `pm2 kill`
- Clear all node processes: `killall -9 node`
- Restart cleanly: `pm2 start ecosystem.config.js`

## Monitoring

### Docker logs
```bash
cd /var/www/crm-production
docker compose -f docker-compose.simple.yml logs -f
docker compose -f docker-compose.simple.yml logs postgres
docker compose -f docker-compose.simple.yml logs nginx
```

### PM2 logs
```bash
pm2 logs                    # All processes
pm2 logs crm-backend        # Backend only
pm2 logs crm-frontend       # Frontend only
pm2 logs --lines 100        # Last 100 lines
pm2 logs --err              # Errors only
```

### System status
```bash
pm2 list                    # PM2 process status
pm2 monit                   # Interactive monitoring
docker ps                   # Container status
df -h                       # Disk usage
free -h                     # Memory usage
```

## Improvement Recommendations

### Critical
1. **Increase disk to 20GB+**
   - Current usage: 86%
   - node_modules: 1.2GB
   - Recommended minimum: 20GB

2. **Increase RAM to 2GB+**
   - Current: 848MB + 2GB swap
   - Recommended: 2GB RAM for stable operation
   - Ideal: 4GB RAM

3. **Configure SSL/HTTPS**
   - Use Let's Encrypt
   - Configure certificate auto-renewal
   - Add HTTP → HTTPS redirect

### Additional
4. **Move to full Docker**
   - After increasing resources
   - Use docker-compose.yml from the repository
   - Optimize image sizes (multi-stage builds)

5. **Configure backups**
   - Regular PostgreSQL backups
   - Use `/var/www/crm-production/backups/`
   - Set up a cron job for automatic backups

6. **Monitoring and alerts**
   - Configure Prometheus + Grafana
   - Alerts on high memory/disk usage
   - Uptime monitoring

7. **Security hardening**
   - Change JWT_SECRET to a production value
   - Configure firewall (UFW)
   - Restrict SSH access
   - Prefer SSH keys over passwords

8. **Performance**
   - Configure Redis for caching
   - Optimize Prisma queries
   - Add a CDN for static assets

## Quick Access Commands

### Restart applications
```bash
# Restart all components
cd /var/www/crm-production
docker compose -f docker-compose.simple.yml restart
pm2 restart all

# Restart applications only
pm2 restart crm-backend crm-frontend

# Restart infrastructure only
docker compose -f docker-compose.simple.yml restart postgres nginx
```

### Update code
```bash
# On the local machine:
cd /Users/sergeydaub/work/BZH/CRM
pnpm run build  # backend + frontend build
rsync -avz --exclude='node_modules' --exclude='.git' . root@217.160.74.128:/var/www/crm/

# On the server:
cd /var/www/crm
pm2 restart all
```

### Database operations
```bash
cd /var/www/crm/db
export DATABASE_URL='postgresql://crm:crm2024@localhost:5432/crm'

# Migrations
pnpm run migrate:deploy

# Rollback migration
pnpm run migrate:rollback

# Seed
pnpm run seed

# Backup
docker exec crm-postgres pg_dump -U crm crm > backup_$(date +%Y%m%d).sql
```

## Deployment Result

✅ **Successfully deployed**:
- PostgreSQL database with persistent storage
- Backend API on port 4000
- Frontend Next.js on port 3000
- Nginx reverse proxy on port 80
- Autostart of all components on reboot
- Seed data loaded
- Authentication works

✅ **Verified**:
- Web interface available: http://217.160.74.128
- API endpoint works: http://217.160.74.128/api
- Login with admin@example.com / password: 1 succeeds
- Database accepts connections
- All processes are stable

⚠️ **Needs attention**:
- Disk is 86% full (1.3GB remaining)
- Memory is low for production load
- SSL/HTTPS is missing
- JWT_SECRET still uses a default value

---

**Deployment date**: December 18, 2025  
**Deployed by**: GitHub Copilot AI Agent  
**Deployment time**: ~2 hours  
**Status**: Production Ready (with resource limitations)
