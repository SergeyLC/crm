# Deployment Notes

## Database Configuration

### Production Environment
- Database name: `loyacrm_production`
- User: `loyacrm`
- Password: Set via `POSTGRES_PASSWORD` in `.env`
- Default password: `loyacrm2024secure`

### Stage-Main Environment
- Database name: `loyacrm_staging`
- User: `loyacrm`
- Password: Set via `POSTGRES_PASSWORD` in `.env.stage-main`

### Stage-Develop Environment
- Database name: `loyacrm_stage_develop`
- User: `loyacrm`
- Password: Set via `POSTGRES_PASSWORD` in `.env.stage-develop`

## Docker Configuration Issues Fixed

### 1. Next.js Standalone Build
- **Issue**: Next.js standalone server binds to container hostname instead of 0.0.0.0
- **Fix**: Add `HOSTNAME=0.0.0.0` environment variable to all frontend services
- **Files**: `docker-compose.production.yml`, `docker-compose.stage-main.yml`, `docker-compose.stage-develop.yml`

### 2. Healthcheck IPv6 Issue
- **Issue**: Alpine Linux resolves `localhost` to IPv6 `[::1]`, but Next.js listens on IPv4 only
- **Fix**: Use `127.0.0.1` instead of `localhost` in healthcheck commands
- **Command**: `wget --quiet --tries=1 --spider http://127.0.0.1:3000 || exit 1`

### 3. Docker Image Optimization
- **Issue**: Frontend images were 2.93GB with full node_modules
- **Fix**: Use Next.js standalone output with multi-stage Docker build
- **Result**: Reduced to ~350MB (8.4x smaller)

### 4. PostgreSQL Password After Recreation
- **Issue**: When PostgreSQL container is recreated with existing volume, environment variable password doesn't update the existing user
- **Fix**: Manually update password in PostgreSQL:
  ```bash
  docker exec loyacrm-production-postgres psql -U loyacrm -d postgres -c "ALTER USER loyacrm WITH PASSWORD 'your_password';"
  ```

## Deployment Checklist

### Before Deployment
1. ✅ Ensure `.env` files on server have correct `POSTGRES_DB` names
2. ✅ Verify PostgreSQL user passwords match environment variables
3. ✅ Check that Docker volumes are properly mounted for data persistence

### After Deployment
1. ✅ Verify all containers are healthy: `docker ps`
2. ✅ Test frontend accessibility (should return 307 redirect or 200)
3. ✅ Test backend health endpoint: `curl http://SERVER/api/health`
4. ✅ Test login endpoint with credentials
5. ✅ If nginx returns 502, restart it: `docker compose restart nginx`

### Database Migration
If database needs to be recreated:
1. Backup existing data: `docker exec postgres pg_dump -U loyacrm dbname > backup.sql`
2. Stop containers: `docker compose down`
3. Remove volume: `docker volume rm volume_name` (if needed)
4. Start containers: `docker compose up -d`
5. Restore data: `docker exec -i postgres psql -U loyacrm dbname < backup.sql`

## Server Information
- **Host**: 217.154.173.36
- **Production Port**: 80
- **Stage-Main Port**: 8080
- **Stage-Develop Port**: 8081

## Test Credentials
- **Email**: admin@example.com
- **Password**: 1

## Docker Maintenance

### Cleanup Old Images
```bash
# Remove images older than 24h
docker image prune -a -f --filter 'until=24h'

# Remove all unused images
docker image prune -a -f
```

### Check Disk Space
```bash
df -h /
docker system df
```

### View Container Logs
```bash
docker logs --tail 50 container_name
docker logs -f container_name  # Follow logs
```
