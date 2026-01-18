# Autoheal - Automatic Restart of Unhealthy Containers

## Overview

Automatic monitoring and restart of containers when they become unhealthy is configured using [willfarrell/autoheal](https://github.com/willfarrell/docker-autoheal).

## Configuration

### Autoheal Parameters

- **AUTOHEAL_CONTAINER_LABEL**: `all` - monitors all containers with `autoheal=true` label
- **AUTOHEAL_INTERVAL**: `10` seconds - checks every 10 seconds
- **AUTOHEAL_START_PERIOD**: `120` seconds - waits 2 minutes before starting monitoring (gives containers time to start)
- **AUTOHEAL_DEFAULT_STOP_TIMEOUT**: `10` seconds - container stop timeout

### Monitored Containers

**Production:**
- `loyacrm-frontend` - checked every 30s, restarts when unhealthy
- `loyacrm-backend` - checked every 30s, restarts when unhealthy

**Staging:**
- `loyacrm-staging-frontend` - checked every 30s, restarts when unhealthy
- `loyacrm-staging-backend` - checked every 30s, restarts when unhealthy

### Healthcheck Configuration

**Frontend:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Backend:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --spider -q http://localhost:4000/api/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 20s
```

## How It Works

1. Containers have a `healthcheck` that verifies their status every 30 seconds
2. If the healthcheck fails 3 times in a row, the container is marked as **unhealthy**
3. Autoheal detects the unhealthy container (checks every 10 seconds)
4. Autoheal stops and restarts the container
5. The container gets a fresh start

## Verification

### Check autoheal container status
```bash
ssh root@217.154.173.36 "docker ps --filter 'name=autoheal'"
```

### Autoheal logs (Production)
```bash
ssh root@217.154.173.36 "docker logs loyacrm-autoheal -f"
```

### Autoheal logs (Staging)
```bash
ssh root@217.154.173.36 "docker logs loyacrm-staging-autoheal -f"
```

### Check healthcheck status of all containers
```bash
ssh root@217.154.173.36 "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

## Testing

To test autoheal, you can simulate an unhealthy container:

```bash
# 1. Make container unhealthy (break the healthcheck)
ssh root@217.154.173.36 "docker exec loyacrm-frontend sh -c 'rm /usr/bin/wget'"

# 2. Wait ~90 seconds (3 retries * 30s)
# 3. Verify container became unhealthy
docker ps --filter 'name=loyacrm-frontend'

# 4. Autoheal should automatically restart the container in ~10 seconds
# 5. After restart, container will be healthy again
```

**Note:** In reality, you don't need to do this - autoheal will work automatically when issues arise.

## Issue History

### January 13-18, 2026

**Problem:** Production frontend container became unhealthy due to `EAGAIN` error (resource exhaustion).

```
Error: spawn /bin/sh EAGAIN
  errno: -11,
  code: 'EAGAIN',
  syscall: 'spawn /bin/sh'
```

**Cause:** Container was running for 4 days without restart, accumulated resource leaks.

**Solution:** 
1. Manual restart: `docker compose restart frontend`
2. Implemented autoheal for automatic restarts in the future

## Disabling Autoheal

If you need to temporarily disable autoheal:

```bash
# Production
ssh root@217.154.173.36 "cd /var/www/loyacrm-production && docker compose stop autoheal"

# Staging
ssh root@217.154.173.36 "cd /var/www/loyacrm-staging && docker compose -f docker-compose.stage.yml stop autoheal"
```

## Enabling Autoheal

```bash
# Production
ssh root@217.154.173.36 "cd /var/www/loyacrm-production && docker compose start autoheal"

# Staging
ssh root@217.154.173.36 "cd /var/www/loyacrm-staging && docker compose -f docker-compose.stage.yml start autoheal"
```

## Implementation Date

**January 18, 2026** - Added autoheal for automatic restart of unhealthy containers on production and staging environments.

## References

- [docker-autoheal GitHub](https://github.com/willfarrell/docker-autoheal)
- [Docker healthcheck documentation](https://docs.docker.com/engine/reference/builder/#healthcheck)
