# Container Management

Day-to-day operations for production and staging environments.

## Overview

This guide covers routine tasks for managing Docker containers including:
- Starting, stopping, and restarting services
- Viewing logs and monitoring
- Updating applications
- Database operations
- Backups and restore
- Performance monitoring

## Quick Commands Reference

### Production

```bash
cd /var/www/loyacrm-production

# Start services
docker compose up -d

# Stop services
docker compose stop

# Restart services
docker compose restart

# View logs
docker compose logs -f

# Check status
docker compose ps
```

### Staging

```bash
cd /var/www/loyacrm-staging

# Start services
docker compose -f docker-compose.stage.yml --env-file .env.stage up -d

# Stop services
docker compose -f docker-compose.stage.yml stop

# Restart services
docker compose -f docker-compose.stage.yml restart

# View logs
docker compose -f docker-compose.stage.yml logs -f

# Check status
docker compose -f docker-compose.stage.yml ps
```

## Container Operations

### Starting Services

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d backend

# Start with rebuild
docker compose up -d --build

# Start with force recreate
docker compose up -d --force-recreate
```

### Stopping Services

```bash
# Stop all services (keeps containers)
docker compose stop

# Stop specific service
docker compose stop backend

# Stop and remove containers
docker compose down

# Stop and remove volumes (DELETES DATA!)
docker compose down -v
```

### Restarting Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# Restart with new images
docker compose up -d --force-recreate backend
```

### Checking Status

```bash
# List all services
docker compose ps

# List all containers
docker ps

# List all containers (including stopped)
docker ps -a

# Detailed inspect
docker inspect loyacrm-backend

# Check health status
docker inspect --format='{{.State.Health.Status}}' loyacrm-backend
```

## Log Management

### Viewing Logs

```bash
# All services, follow mode
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail 100

# Last 100 lines, specific service
docker compose logs --tail 100 backend

# Logs with timestamps
docker compose logs -f --timestamps

# Logs since specific time
docker compose logs --since 30m  # Last 30 minutes
docker compose logs --since 2024-01-01T00:00:00
```

### Filtering Logs

```bash
# Search for errors
docker compose logs | grep -i error

# Search for specific pattern
docker compose logs | grep "user login"

# Count occurrences
docker compose logs | grep -c "error"

# Save logs to file
docker compose logs > logs-$(date +%Y%m%d).txt
```

### Log Size Management

```bash
# Check log sizes
du -sh /var/lib/docker/containers/*/*-json.log

# Configure log rotation (edit docker-compose.yml)
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Database Operations

### Database Migrations

```bash
# Check migration status
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate status'

# Apply pending migrations
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Create new migration (development)
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate dev --name description'

# Reset database (WARNING: DELETES ALL DATA!)
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate reset'
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it loyacrm-postgres psql -U loyacrm -d loyacrm

# Run SQL query
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "SELECT COUNT(*) FROM users;"

# List tables
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "\dt"

# Describe table
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "\d users"

# Database size
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "SELECT pg_size_pretty(pg_database_size('loyacrm'));"
```

### Seed Data

```bash
# Run seed script
docker exec loyacrm-backend sh -c 'cd /app/db && npm run seed'

# Verify seed data
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "SELECT COUNT(*) FROM users;"
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "SELECT COUNT(*) FROM contacts;"
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "SELECT COUNT(*) FROM deals;"
```

## Backup and Restore

### Database Backup

```bash
# Create backup directory
mkdir -p /var/backups/loyacrm

# Full database backup
docker exec loyacrm-postgres pg_dump -U loyacrm -d loyacrm > \
  /var/backups/loyacrm/backup-$(date +%Y%m%d-%H%M%S).sql

# Compressed backup
docker exec loyacrm-postgres pg_dump -U loyacrm -d loyacrm | \
  gzip > /var/backups/loyacrm/backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Custom format backup (faster restore)
docker exec loyacrm-postgres pg_dump -U loyacrm -d loyacrm -Fc -f \
  /tmp/backup.dump

docker cp loyacrm-postgres:/tmp/backup.dump \
  /var/backups/loyacrm/backup-$(date +%Y%m%d-%H%M%S).dump

# Backup specific tables
docker exec loyacrm-postgres pg_dump -U loyacrm -d loyacrm -t users -t contacts > \
  /var/backups/loyacrm/users-contacts-$(date +%Y%m%d).sql
```

### Automated Backup Script

Create `/usr/local/bin/backup-loyacrm.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/loyacrm"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup production database
echo "Backing up production database..."
docker exec loyacrm-postgres pg_dump -U loyacrm -d loyacrm -Fc > \
  $BACKUP_DIR/production-$DATE.dump

# Backup staging database (if exists)
if docker ps | grep -q loyacrm-staging-postgres; then
  echo "Backing up staging database..."
  docker exec loyacrm-staging-postgres pg_dump -U loyacrm -d loyacrm_staging -Fc > \
    $BACKUP_DIR/staging-$DATE.dump
fi

# Compress backups
gzip $BACKUP_DIR/*-$DATE.dump

# Delete backups older than retention period
find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_DIR/*-$DATE.dump.gz"
```

Make executable and schedule:

```bash
chmod +x /usr/local/bin/backup-loyacrm.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-loyacrm.sh >> /var/log/loyacrm-backup.log 2>&1
```

### Database Restore

```bash
# Stop backend to prevent connections
docker compose stop backend

# Restore from SQL dump
docker exec -i loyacrm-postgres psql -U loyacrm -d loyacrm < \
  /var/backups/loyacrm/backup-20240101-120000.sql

# Restore from compressed SQL
gunzip -c /var/backups/loyacrm/backup-20240101-120000.sql.gz | \
  docker exec -i loyacrm-postgres psql -U loyacrm -d loyacrm

# Restore from custom format
docker cp /var/backups/loyacrm/backup-20240101-120000.dump \
  loyacrm-postgres:/tmp/restore.dump

docker exec loyacrm-postgres pg_restore -U loyacrm -d loyacrm \
  -c /tmp/restore.dump

# Restart backend
docker compose start backend
```

### Volume Backup

```bash
# Backup database volume
docker run --rm \
  -v loyacrm_pg_data:/data \
  -v /var/backups/loyacrm:/backup \
  alpine tar -czf /backup/pg_data-$(date +%Y%m%d).tar.gz -C /data .

# Restore database volume
docker run --rm \
  -v loyacrm_pg_data:/data \
  -v /var/backups/loyacrm:/backup \
  alpine tar -xzf /backup/pg_data-20240101.tar.gz -C /data
```

## Updating Applications

### Update Process Overview

1. Backup database
2. Pull/load new images
3. Stop services
4. Start with new images
5. Run migrations
6. Verify deployment

### Update from GitHub Container Registry

```bash
cd /var/www/loyacrm-production

# Backup database first!
docker exec loyacrm-postgres pg_dump -U loyacrm -d loyacrm > \
  /var/backups/loyacrm/pre-update-$(date +%Y%m%d-%H%M%S).sql

# Pull new images
docker compose pull

# Restart with new images
docker compose up -d

# Run migrations
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Check logs
docker compose logs -f --tail 50
```

### Update from Manual Build

```bash
# Transfer new images to server (from local machine)
scp loyacrm-frontend.tar.gz root@SERVER_IP:/tmp/
scp loyacrm-backend.tar.gz root@SERVER_IP:/tmp/

# On server
cd /var/www/loyacrm-production

# Backup database
docker exec loyacrm-postgres pg_dump -U loyacrm -d loyacrm > \
  /var/backups/loyacrm/pre-update-$(date +%Y%m%d-%H%M%S).sql

# Load new images
docker load < /tmp/loyacrm-frontend.tar.gz
docker load < /tmp/loyacrm-backend.tar.gz

# Restart services
docker compose up -d --force-recreate

# Run migrations
docker exec loyacrm-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# Cleanup
rm /tmp/loyacrm-*.tar.gz
```

### Rollback

```bash
# If update fails, restore from backup
cd /var/www/loyacrm-production

# Stop services
docker compose stop

# Restore database
docker exec -i loyacrm-postgres psql -U loyacrm -d loyacrm < \
  /var/backups/loyacrm/pre-update-20240101-120000.sql

# Load previous images
docker load < /var/backups/loyacrm/images/loyacrm-frontend-v1.0.0.tar.gz
docker load < /var/backups/loyacrm/images/loyacrm-backend-v1.0.0.tar.gz

# Restart with old images
docker compose up -d

# Verify
docker compose ps
```

## Monitoring

### Container Health

```bash
# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health check
docker inspect loyacrm-backend | grep -A 20 Health

# Monitor in real-time
watch -n 5 'docker ps --format "table {{.Names}}\t{{.Status}}"'
```

### Resource Usage

```bash
# Real-time resource usage
docker stats

# Specific container
docker stats loyacrm-backend

# One-time snapshot
docker stats --no-stream

# Format output
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Disk Usage

```bash
# Docker disk usage summary
docker system df

# Detailed disk usage
docker system df -v

# Container sizes
docker ps --size

# Image sizes
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Volume sizes
docker volume ls -q | xargs docker volume inspect | grep Mountpoint | \
  awk '{print $2}' | xargs sudo du -sh
```

### Network Diagnostics

```bash
# List networks
docker network ls

# Inspect network
docker network inspect loyacrm-network

# Test connectivity between containers
docker exec loyacrm-backend ping -c 3 postgres

# Check listening ports
docker exec loyacrm-backend netstat -tuln

# Test external connectivity
docker exec loyacrm-backend curl -I http://google.com
```

## Performance Optimization

### Container Resources

Edit `docker-compose.yml` to set resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

Restart after changes:
```bash
docker compose up -d
```

### Database Optimization

```bash
# Analyze database
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "ANALYZE;"

# Vacuum database
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "VACUUM ANALYZE;"

# Reindex
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "REINDEX DATABASE loyacrm;"

# Check slow queries
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c \
  "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Log Rotation

Configure in `docker-compose.yml`:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"
```

### Image Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Clean everything (CAREFUL!)
docker system prune -a --volumes
```

## Security

### Update Base Images

```bash
# Rebuild with latest base images
docker compose build --pull --no-cache

# Update and restart
docker compose up -d --build
```

### Security Scanning

```bash
# Scan image for vulnerabilities
docker scan loyacrm-backend:latest

# Scan with specific severity
docker scan --severity high loyacrm-backend:latest
```

### Secrets Management

Never store secrets in images or docker-compose.yml!

Use `.env` files:
```bash
# Restrict .env permissions
chmod 600 .env

# Verify
ls -la .env
# Should show: -rw------- (600)
```

### Container Security

```bash
# Run as non-root user (in Dockerfile)
USER node

# Read-only root filesystem
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp

# Drop capabilities
services:
  backend:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs backend

# Inspect container
docker inspect loyacrm-backend

# Try manual start with verbose output
docker compose up backend

# Check resource availability
free -h
df -h
```

### Database Connection Issues

```bash
# Test connection from backend
docker exec loyacrm-backend sh -c \
  'psql $DATABASE_URL -c "SELECT 1;"'

# Check DATABASE_URL
docker exec loyacrm-backend env | grep DATABASE_URL

# Verify PostgreSQL is ready
docker exec loyacrm-postgres pg_isready -U loyacrm
```

### Port Conflicts

```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80

# Check all Docker ports
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Change port in docker-compose.yml
services:
  nginx:
    ports:
      - "8080:80"  # Change 8080 to available port
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Remove old logs
find /var/lib/docker/containers -name "*.log" -mtime +7 -delete

# Remove old backups
find /var/backups/loyacrm -name "*.dump.gz" -mtime +30 -delete
```

## Useful Scripts

### Health Check Script

Create `/usr/local/bin/check-loyacrm.sh`:

```bash
#!/bin/bash

SERVICES="loyacrm-nginx loyacrm-frontend loyacrm-backend loyacrm-postgres"

echo "=== LoyaCRM Health Check ==="
echo "Time: $(date)"
echo

for service in $SERVICES; do
  if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
    status=$(docker inspect --format='{{.State.Status}}' $service)
    health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}N/A{{end}}' $service)
    echo "✓ $service: $status (Health: $health)"
  else
    echo "✗ $service: NOT RUNNING"
  fi
done

echo
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo
echo "=== Disk Usage ==="
docker system df
```

Make executable:
```bash
chmod +x /usr/local/bin/check-loyacrm.sh
```

Run:
```bash
check-loyacrm.sh
```

### Restart All Script

Create `/usr/local/bin/restart-loyacrm.sh`:

```bash
#!/bin/bash
set -e

echo "Restarting LoyaCRM services..."

# Production
if [ -d "/var/www/loyacrm-production" ]; then
  echo "Restarting production..."
  cd /var/www/loyacrm-production
  docker compose restart
fi

# Staging
if [ -d "/var/www/loyacrm-staging" ]; then
  echo "Restarting staging..."
  cd /var/www/loyacrm-staging
  docker compose -f docker-compose.stage.yml restart
fi

echo "All services restarted!"
docker ps
```

## Next Steps

- **[Troubleshooting Guide](06-troubleshooting.md)** - Detailed problem resolution
- **[Production Deployment](02-production-github-actions.md)** - Deploy new instances
- **[Staging Deployment](04-staging-deployment.md)** - Test environment setup

---

[← Back to Staging Deployment](04-staging-deployment.md) | [Next: Troubleshooting →](06-troubleshooting.md)
