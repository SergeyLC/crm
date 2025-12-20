# Troubleshooting Guide

Common issues and solutions for LoyaCRM deployment.

## Quick Diagnosis

Run these commands first to identify issues:

```bash
# Check container status
docker ps -a

# Check recent logs
docker compose logs --tail 100

# Check resource usage
docker stats --no-stream

# Check disk space
df -h

# Check system resources
free -h
```

## Container Issues

### Container Keeps Restarting

**Symptom:**
```bash
docker ps
# Shows STATUS: Restarting (X) Y seconds ago
```

**Diagnosis:**

```bash
# Check why container is failing
docker compose logs --tail 50 CONTAINER_NAME

# Check exit code
docker inspect CONTAINER_NAME | grep -A 5 State
```

**Common Causes & Solutions:**

1. **Application Error**
   ```bash
   # Check application logs
   docker compose logs backend
   
   # Look for stack traces, errors
   # Fix code and rebuild image
   ```

2. **Port Already in Use**
   ```bash
   # Check port usage
   sudo netstat -tulpn | grep :80
   
   # Kill process or change port in docker-compose.yml
   sudo kill -9 PID
   ```

3. **Missing Environment Variables**
   ```bash
   # Verify .env file exists
   cat .env
   
   # Check container environment
   docker exec CONTAINER_NAME env
   
   # Add missing variables to .env
   ```

4. **Database Connection Failed**
   ```bash
   # Check DATABASE_URL
   docker exec loyacrm-backend env | grep DATABASE_URL
   
   # Test connection
   docker exec loyacrm-backend sh -c \
     'psql $DATABASE_URL -c "SELECT 1;"'
   ```

### Container Won't Start

**Symptom:**
```bash
docker compose up -d
# Error: ... failed to start
```

**Solutions:**

1. **Check Compose File Syntax**
   ```bash
   # Validate compose file
   docker compose config
   
   # Fix any YAML errors shown
   ```

2. **Check Image Exists**
   ```bash
   # List images
   docker images
   
   # If missing, build or load image
   docker compose build
   # or
   docker load < image.tar.gz
   ```

3. **Check Volumes**
   ```bash
   # List volumes
   docker volume ls
   
   # Inspect volume
   docker volume inspect VOLUME_NAME
   
   # Remove and recreate if corrupted
   docker volume rm VOLUME_NAME
   docker compose up -d
   ```

4. **Platform Mismatch**
   ```bash
   # Check image architecture
   docker inspect IMAGE_NAME | grep Architecture
   
   # Check server architecture
   uname -m
   
   # If mismatch: rebuild for correct platform
   docker buildx build --platform linux/amd64 ...
   ```

### Container Unhealthy

**Symptom:**
```bash
docker ps
# Shows STATUS: Up (unhealthy)
```

**Diagnosis:**

```bash
# Check health check details
docker inspect loyacrm-backend | grep -A 20 Health

# Check logs
docker compose logs backend
```

**Solutions:**

1. **Application Not Ready**
   ```bash
   # Wait longer for startup
   sleep 30
   docker ps
   
   # Increase healthcheck interval in docker-compose.yml
   healthcheck:
     interval: 30s
     timeout: 10s
     retries: 5
   ```

2. **Health Check Endpoint Failing**
   ```bash
   # Test health endpoint manually
   docker exec loyacrm-backend curl -f http://localhost:5000/api/health
   
   # If fails, check application logs
   docker compose logs backend
   ```

3. **Restart Container**
   ```bash
   docker compose restart backend
   docker compose logs -f backend
   ```

## Network Issues

### Cannot Access Application

**Symptom:** Browser shows "Connection refused" or timeout

**Diagnosis:**

```bash
# Check if nginx is running
docker ps | grep nginx

# Check nginx logs
docker compose logs nginx

# Check port binding
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep nginx

# Test locally on server
curl -I http://localhost/de
```

**Solutions:**

1. **Port Not Exposed**
   ```bash
   # Check docker-compose.yml
   services:
     nginx:
       ports:
         - "80:80"  # Must be exposed
   
   # Restart
   docker compose up -d
   ```

2. **Firewall Blocking**
   ```bash
   # Check UFW status
   sudo ufw status
   
   # Allow port
   sudo ufw allow 80/tcp
   
   # Check hosting provider firewall too!
   ```

3. **Wrong IP Address**
   ```bash
   # Get server IP
   ip addr show | grep "inet "
   curl ifconfig.me
   
   # Use correct IP in browser
   ```

4. **Service Not Running**
   ```bash
   # Start services
   docker compose up -d
   
   # Check status
   docker compose ps
   ```

### Frontend Shows "Network Error"

**Symptom:** Frontend loads but API calls fail

**Diagnosis:**

```bash
# Check browser console (F12)
# Look for CORS errors or network errors

# Test API directly
curl http://SERVER_IP/api/health

# Check backend logs
docker compose logs backend
```

**Solutions:**

1. **Wrong API URL in Frontend**
   ```bash
   # Check frontend environment
   docker exec loyacrm-frontend cat /app/.env.local
   
   # Should show correct API URL
   # NEXT_PUBLIC_BACKEND_API_URL=http://SERVER_IP/api
   
   # If wrong, rebuild frontend with correct build arg
   docker buildx build --platform linux/amd64 \
     --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://SERVER_IP/api \
     -t loyacrm-frontend:latest \
     -f docker/frontend/Dockerfile .
   ```

2. **Backend Not Accessible from Frontend Container**
   ```bash
   # Test from frontend container
   docker exec loyacrm-frontend curl http://backend:5000/api/health
   
   # If fails, check network
   docker network inspect loyacrm-network
   
   # Ensure both containers on same network
   ```

3. **Nginx Misconfigured**
   ```bash
   # Check nginx config
   docker exec loyacrm-nginx cat /etc/nginx/nginx.conf
   
   # Test nginx config
   docker exec loyacrm-nginx nginx -t
   
   # If errors, fix nginx.conf and restart
   docker compose restart nginx
   ```

### Container Cannot Reach Internet

**Symptom:** Updates fail, external API calls timeout

**Diagnosis:**

```bash
# Test from container
docker exec loyacrm-backend curl -I https://google.com

# Check DNS
docker exec loyacrm-backend nslookup google.com
```

**Solutions:**

1. **DNS Issues**
   ```bash
   # Add DNS servers to docker-compose.yml
   services:
     backend:
       dns:
         - 8.8.8.8
         - 8.8.4.4
   
   # Restart
   docker compose up -d
   ```

2. **Proxy Required**
   ```bash
   # Add proxy to docker-compose.yml
   services:
     backend:
       environment:
         - HTTP_PROXY=http://proxy:port
         - HTTPS_PROXY=http://proxy:port
   ```

## Database Issues

### Cannot Connect to Database

**Symptom:** Backend logs show "Connection refused" or "Authentication failed"

**Diagnosis:**

```bash
# Check postgres is running
docker ps | grep postgres

# Check postgres logs
docker compose logs postgres

# Test connection
docker exec loyacrm-backend sh -c \
  'psql $DATABASE_URL -c "SELECT 1;"'
```

**Solutions:**

1. **Database Not Ready**
   ```bash
   # Wait for postgres to be healthy
   docker compose ps
   # postgres should show (healthy)
   
   # Check healthcheck
   docker inspect loyacrm-postgres | grep -A 10 Health
   
   # Increase startup time in depends_on
   services:
     backend:
       depends_on:
         postgres:
           condition: service_healthy
   ```

2. **Wrong DATABASE_URL**
   ```bash
   # Check DATABASE_URL in backend
   docker exec loyacrm-backend env | grep DATABASE_URL
   
   # Should be: postgresql://user:password@postgres:5432/dbname?schema=public
   
   # Fix in .env file
   nano .env
   # DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
   
   # Restart backend
   docker compose restart backend
   ```

3. **Wrong Password**
   ```bash
   # Check .env file
   cat .env | grep POSTGRES_PASSWORD
   
   # Verify matches in DATABASE_URL
   
   # If changed, need to recreate postgres container
   docker compose down
   docker volume rm loyacrm_pg_data  # WARNING: DELETES DATA!
   docker compose up -d
   ```

4. **Port Conflict**
   ```bash
   # Check if 5432 in use on host
   sudo netstat -tulpn | grep :5432
   
   # If conflict, don't expose postgres port
   # Remove from docker-compose.yml:
   # ports:
   #   - "5432:5432"
   ```

### Database Migrations Failed

**Symptom:** "Migration failed" error in backend logs

**Diagnosis:**

```bash
# Check migration status
docker exec loyacrm-backend sh -c \
  'cd /app/db && npx prisma migrate status'

# Check postgres logs
docker compose logs postgres
```

**Solutions:**

1. **Database Out of Sync**
   ```bash
   # Mark migrations as applied (if already applied manually)
   docker exec loyacrm-backend sh -c \
     'cd /app/db && npx prisma migrate resolve --applied MIGRATION_NAME'
   
   # Or reset and reapply all migrations (WARNING: DELETES DATA!)
   docker exec loyacrm-backend sh -c \
     'cd /app/db && npx prisma migrate reset'
   ```

2. **Schema Conflict**
   ```bash
   # Generate Prisma client
   docker exec loyacrm-backend sh -c \
     'cd /app/db && npx prisma generate'
   
   # Apply migrations
   docker exec loyacrm-backend sh -c \
     'cd /app/db && npx prisma migrate deploy'
   ```

3. **Migration File Missing**
   ```bash
   # Ensure migrations directory exists in image
   docker exec loyacrm-backend ls -la /app/db/prisma/migrations
   
   # If missing, rebuild backend image with migrations
   ```

### Database Out of Space

**Symptom:** "No space left on device" errors

**Diagnosis:**

```bash
# Check disk usage
df -h

# Check Docker volume usage
docker system df -v

# Check database size
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c \
  "SELECT pg_size_pretty(pg_database_size('loyacrm'));"
```

**Solutions:**

1. **Clean Docker Resources**
   ```bash
   # Remove unused containers, images, volumes
   docker system prune -a
   
   # Remove old logs
   find /var/lib/docker/containers -name "*.log" -mtime +7 -delete
   ```

2. **Clean Database**
   ```bash
   # Vacuum database
   docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "VACUUM FULL;"
   
   # Analyze database
   docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "ANALYZE;"
   ```

3. **Expand Disk**
   - Contact hosting provider to expand disk
   - Or move Docker to larger partition

## Performance Issues

### High CPU Usage

**Diagnosis:**

```bash
# Check CPU usage
docker stats

# Identify high CPU container
docker stats --format "table {{.Name}}\t{{.CPUPerc}}"

# Check processes inside container
docker exec loyacrm-backend top -b -n 1
```

**Solutions:**

1. **Limit Container Resources**
   ```yaml
   # In docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1.0'
   ```

2. **Optimize Application**
   ```bash
   # Check for infinite loops in logs
   docker compose logs --tail 1000 backend | grep -i error
   
   # Profile application (if tools available)
   ```

3. **Scale Horizontally**
   ```yaml
   # In docker-compose.yml
   services:
     backend:
       deploy:
         replicas: 2
   ```

### High Memory Usage

**Diagnosis:**

```bash
# Check memory usage
docker stats

# Check memory by container
docker stats --format "table {{.Name}}\t{{.MemUsage}}"

# Check host memory
free -h
```

**Solutions:**

1. **Limit Container Memory**
   ```yaml
   # In docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 1G
   ```

2. **Restart Container**
   ```bash
   # Memory leak? Restart to reclaim
   docker compose restart backend
   ```

3. **Optimize Database**
   ```bash
   # Vacuum database
   docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "VACUUM FULL;"
   
   # Adjust PostgreSQL memory settings
   # Edit postgresql.conf if needed
   ```

### Slow Response Times

**Diagnosis:**

```bash
# Test response time
time curl http://localhost/api/health

# Check database queries
docker compose logs backend | grep "slow query"

# Check nginx logs
docker compose logs nginx | grep "upstream_response_time"
```

**Solutions:**

1. **Add Database Indexes**
   ```sql
   -- Connect to database
   docker exec -it loyacrm-postgres psql -U loyacrm -d loyacrm
   
   -- Add indexes for slow queries
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_contacts_user_id ON contacts(user_id);
   ```

2. **Enable Caching**
   ```yaml
   # In docker-compose.yml, add Redis
   services:
     redis:
       image: redis:alpine
       networks:
         - loyacrm-network
   ```

3. **Optimize Nginx**
   ```nginx
   # In nginx.conf
   http {
     gzip on;
     gzip_types text/css application/javascript application/json;
     
     proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
     
     server {
       location / {
         proxy_cache my_cache;
         proxy_cache_valid 200 1h;
       }
     }
   }
   ```

## Image Issues

### "exec format error"

**Symptom:**
```
Error response from daemon: failed to create shim task: 
OCI runtime create failed: ... exec format error
```

**Cause:** Image built for wrong architecture (ARM64 vs AMD64)

**Solution:**

```bash
# Check server architecture
uname -m
# x86_64 = AMD64
# aarch64 = ARM64

# Rebuild image for correct platform
docker buildx build --platform linux/amd64 \
  -t loyacrm-backend:latest \
  -f docker/backend/Dockerfile .

# Export, transfer, load
docker save loyacrm-backend:latest | gzip > backend.tar.gz
scp backend.tar.gz root@SERVER_IP:/tmp/
ssh root@SERVER_IP 'docker load < /tmp/backend.tar.gz'
```

### Image Not Found

**Symptom:**
```
Error: image not found: loyacrm-backend:latest
```

**Solutions:**

```bash
# Check available images
docker images | grep loyacrm

# Pull from registry (if using)
docker compose pull

# Or load from file
docker load < backend.tar.gz

# Or build locally
docker compose build
```

### Image Too Large

**Symptom:** Transfer takes too long, disk space issues

**Solutions:**

1. **Use Multi-Stage Builds**
   ```dockerfile
   # In Dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   FROM node:20-alpine
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY . .
   ```

2. **Use .dockerignore**
   ```
   # In .dockerignore
   node_modules
   .git
   .env*
   *.log
   coverage
   test-results
   ```

3. **Clean Build Cache**
   ```bash
   docker builder prune -a
   ```

## Staging-Specific Issues

### Port 8080 Not Accessible

**Symptom:** Staging works locally but not externally

**Solutions:**

```bash
# Check UFW
sudo ufw status
sudo ufw allow 8080/tcp

# Check hosting firewall in control panel!

# Test locally first
ssh root@SERVER_IP
curl -I http://localhost:8080/de

# If local works, it's firewall issue

# Temporary workaround: SSH tunnel
ssh -L 8080:localhost:8080 root@SERVER_IP
# Access: http://localhost:8080/de
```

### Staging Uses Production Data

**Symptom:** Staging shows production data

**Solutions:**

```bash
# Check database name
docker exec loyacrm-staging-postgres psql -U loyacrm -l

# Should show: loyacrm_staging (not loyacrm)

# If wrong, check .env.stage
cat /var/www/loyacrm-staging/.env.stage | grep POSTGRES_DB

# Should be: POSTGRES_DB=loyacrm_staging

# If wrong, fix and recreate
cd /var/www/loyacrm-staging
docker compose -f docker-compose.stage.yml down -v
nano .env.stage  # Fix POSTGRES_DB
docker compose -f docker-compose.stage.yml up -d
```

### Staging Frontend Has Wrong API URL

**Symptom:** Frontend loads but API calls fail

**Solution:**

```bash
# Check frontend environment
docker exec loyacrm-staging-frontend cat /app/.env.local

# Should show: NEXT_PUBLIC_BACKEND_API_URL=http://SERVER_IP:8080/api
# Note the :8080 port!

# If wrong, rebuild frontend
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://SERVER_IP:8080/api \
  -t loyacrm-frontend:staging \
  -f docker/frontend/Dockerfile .

# Export, transfer, load, restart (see manual build guide)
```

## Backup & Restore Issues

### Backup Fails

**Symptom:** pg_dump errors

**Solutions:**

```bash
# Check postgres is running
docker ps | grep postgres

# Check disk space
df -h /var/backups

# Ensure backup directory exists
mkdir -p /var/backups/loyacrm

# Check permissions
ls -ld /var/backups/loyacrm
# Should be writable

# Try backup again
docker exec loyacrm-postgres pg_dump -U loyacrm -d loyacrm > \
  /var/backups/loyacrm/backup-$(date +%Y%m%d).sql
```

### Restore Fails

**Symptom:** pg_restore errors or "relation already exists"

**Solutions:**

```bash
# Stop backend to prevent connections
docker compose stop backend

# Drop and recreate database
docker exec loyacrm-postgres psql -U loyacrm -c "DROP DATABASE IF EXISTS loyacrm;"
docker exec loyacrm-postgres psql -U loyacrm -c "CREATE DATABASE loyacrm;"

# Restore
docker exec -i loyacrm-postgres psql -U loyacrm -d loyacrm < backup.sql

# Or use --clean option
docker exec -i loyacrm-postgres pg_restore -U loyacrm -d loyacrm -c backup.dump

# Restart backend
docker compose start backend
```

## Emergency Procedures

### Complete System Recovery

If everything fails:

```bash
# 1. Stop all services
cd /var/www/loyacrm-production
docker compose down

# 2. Backup data (if possible)
docker cp loyacrm-postgres:/var/lib/postgresql/data /var/backups/pg_data_emergency

# 3. Remove all containers and volumes
docker compose down -v

# 4. Clean Docker system
docker system prune -a --volumes

# 5. Reload images
docker load < /path/to/frontend.tar.gz
docker load < /path/to/backend.tar.gz

# 6. Start fresh
docker compose up -d

# 7. Restore database (if backed up)
# See Backup & Restore section

# 8. Verify
docker compose ps
curl http://localhost/api/health
```

### Data Loss Recovery

If database is lost but you have backups:

```bash
# 1. Start fresh database
docker compose up -d postgres

# 2. Wait for postgres ready
sleep 10

# 3. Restore from backup
docker exec -i loyacrm-postgres psql -U loyacrm -d loyacrm < \
  /var/backups/loyacrm/latest-backup.sql

# 4. Start other services
docker compose up -d

# 5. Verify data
docker exec loyacrm-postgres psql -U loyacrm -d loyacrm -c "SELECT COUNT(*) FROM users;"
```

## Getting Help

### Collect Diagnostic Information

```bash
# Create diagnostic report
cat > /tmp/loyacrm-diagnostics.txt << EOF
=== System Info ===
$(uname -a)
$(docker --version)
$(docker compose version)

=== Container Status ===
$(docker ps -a)

=== Container Logs ===
$(docker compose logs --tail 100)

=== Disk Usage ===
$(df -h)
$(docker system df)

=== Memory ===
$(free -h)

=== Recent Events ===
$(docker events --since 1h --until 1s)
EOF

# View report
cat /tmp/loyacrm-diagnostics.txt
```

### Contact Support

When reporting issues, include:
1. Error messages from logs
2. Output of `docker ps -a`
3. Output of `docker compose logs --tail 100`
4. Your docker-compose.yml (remove passwords!)
5. Steps to reproduce the issue

### Useful Documentation

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## Next Steps

- **[Container Management](05-management.md)** - Day-to-day operations
- **[Staging Deployment](04-staging-deployment.md)** - Test environment
- **[Server Setup](01-server-setup.md)** - Initial configuration

---

[← Back to Container Management](05-management.md) | [Return to Main Guide](README.md)
