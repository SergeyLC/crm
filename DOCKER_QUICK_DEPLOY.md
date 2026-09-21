# 🚀 Quick Docker Deployment Guide

This is a short guide for deploying LoyaCare CRM with Docker on a new server.

## ✅ Prerequisites

- Ubuntu 22.04+ or a similar OS
- SSH access with root privileges
- At least 2GB RAM and 10GB free disk space

## 📝 Step 1: Install Docker

```bash
# Update the system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker compose version
```

## 📁 Step 2: Prepare files

### 2.1 Copy source code to the server
```bash
# On the local machine
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  ./LoyaCareCRM/ root@YOUR_SERVER_IP:/var/www/crm-source/
```

### 2.2 Create the deployment directory
```bash
# On the server
mkdir -p /var/www/crm-production/{nginx/conf.d,backups}
cd /var/www/crm-production
```

### 2.3 Create the nginx configuration
```bash
cat > nginx/conf.d/crm.conf << 'EOF'
upstream backend {
    server backend:4000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

### 2.4 Create docker-compose.yml
```bash
cat > docker-compose.yml << 'EOF'
services:
  nginx:
    image: nginx:alpine
    container_name: crm-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - frontend
      - backend
    networks: [crm-network]

  frontend:
    image: crm-frontend:latest
    container_name: crm-frontend
    restart: unless-stopped
    environment:
      - PORT=3000
      - NODE_ENV=production
      - NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api
      - NEXT_PUBLIC_APP_VERSION=production
    networks: [crm-network]

  backend:
    image: crm-backend:latest
    container_name: crm-backend
    restart: unless-stopped
    environment:
      - PORT=4000
      - NODE_ENV=production
      - LOG_LEVEL=info
      - CORS_ORIGIN=http://YOUR_SERVER_IP
      - DATABASE_URL=postgresql://crm:CHANGE_THIS_PASSWORD@postgres:5432/crm
      - JWT_SECRET=CHANGE_THIS_SECRET
    depends_on:
      postgres:
        condition: service_healthy
    networks: [crm-network]

  postgres:
    image: postgres:16-alpine
    container_name: crm-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
      - POSTGRES_USER=crm
      - POSTGRES_DB=crm
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crm"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks: [crm-network]

volumes:
  pg_data:
    name: crm_pg_data

networks:
  crm-network:
    driver: bridge
EOF
```

**⚠️ IMPORTANT:** In docker-compose.yml replace:
- `YOUR_SERVER_IP` with your server IP address
- `CHANGE_THIS_PASSWORD` with a strong database password
- `CHANGE_THIS_SECRET` with a random JWT string (you can generate one with: `openssl rand -base64 32`)

## 🏗️ Step 3: Build Docker images

```bash
cd /var/www/crm-source

# Build backend image
docker build -f docker/backend/Dockerfile -t crm-backend:latest .

# Build frontend image
docker build -f docker/frontend/Dockerfile -t crm-frontend:latest .
```

**Note:** The build may take 5–10 minutes.

## 🗄️ Step 4: Start and configure the database

```bash
cd /var/www/crm-production

# Start containers
docker compose up -d

# Wait for containers to start
sleep 30

# Apply migrations
docker exec crm-backend sh -c 'cd db && npx prisma migrate deploy'

# Create initial data
docker exec crm-backend sh -c 'cd db && npx ts-node prisma/seed.ts'
```

## ✅ Step 5: Verify the deployment

```bash
# Check container status
docker compose ps

# Check API health
curl http://localhost/api/health

# Check login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@loya.care", "password": "1"}'
```

## 🌐 Accessing the application

Open in a browser: `http://YOUR_SERVER_IP`

### Login credentials:
- **Email:** admin@loya.care
- **Password:** 1

## 🔧 Management

### View logs
```bash
cd /var/www/crm-production
docker compose logs -f
```

### Restart services
```bash
docker compose restart
```

### Stop
```bash
docker compose down
```

### Full reinstall (deletes data)
```bash
docker compose down -v
docker volume rm crm_pg_data
# Then repeat steps 4–5
```

## 🐛 Troubleshooting

### Nginx does not start
```bash
# Check configuration
docker exec crm-nginx nginx -t

# View logs
docker logs crm-nginx
```

### Backend cannot connect to the database
```bash
# Check that postgres is running and healthy
docker compose ps

# Check postgres logs
docker logs crm-postgres

# Check DATABASE_URL
docker exec crm-backend sh -c 'echo $DATABASE_URL'
```

### Pages do not load
```bash
# Check frontend logs
docker logs crm-frontend

# Check nginx logs
docker logs crm-nginx

# Check network connectivity
docker network inspect crm-production_crm-network
```

## 📋 Server requirements

| Parameter | Minimum | Recommended |
|----------|---------|---------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Disk | 10 GB | 20 GB |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 LTS |

## 🔒 Security

⚠️ **Important for production:**
1. Change all passwords and secrets
2. Configure SSL/TLS (Let's Encrypt)
3. Configure the firewall (UFW)
4. Set up regular database backups
5. Prefer Docker secrets over plain environment variables

## 📚 Additional documentation

- Full documentation: `DOCKER_DEPLOYMENT.md`
- Deployment report: `DOCKER_DEPLOYMENT_REPORT_217.154.173.36.md`
- Optimization: `docs/deployment/DEPLOYMENT_OPTIMIZATION.md`

---

**Last updated:** December 18, 2025
