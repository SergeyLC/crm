# Docker Ports Architecture

## How It Works

### Inside Docker Network (Container-to-Container)

All services use **standard ports** across all environments:

- **Frontend**: port `3000`
- **Backend**: port `4000`
- **PostgreSQL**: port `5432`

Containers communicate with each other by service names within the Docker network:
- `http://frontend:3000` - frontend access
- `http://backend:4000/api` - backend API access
- `postgresql://postgres:5432` - database access

### External Port Mapping (Host Machine)

**Nginx** proxies internal ports to external ones, different for each environment:

#### Development (docker-compose.dev.yml)
```
Host (your machine)      →  Nginx (inside Docker)  →  Service
localhost:3003           →  nginx:80               →  frontend:3000
localhost:3003/api       →  nginx:80               →  backend:4000/api
localhost:5435           →  direct mapping         →  postgres:5432
```

#### Staging (docker-compose.stage.yml)
```
Host                     →  Nginx                  →  Service
localhost:3001           →  nginx:80               →  frontend:3000
localhost:3001/api       →  nginx:80               →  backend:4000/api
localhost:5433           →  direct mapping         →  postgres:5432
```

#### Production (docker-compose.yml)
```
Host                     →  Nginx                  →  Service
:80 / :443               →  nginx:80/443           →  frontend:3000
:80/api / :443/api       →  nginx:80/443           →  backend:4000/api
(DB not exposed)         →  internal only          →  postgres:5432
```

## Architecture Benefits

### 1. Simplicity and Consistency
- ✅ Always same ports inside containers (3000/4000)
- ✅ No need to change code or environment variables when switching environments
- ✅ Dockerfile works the same way for all environments

### 2. Security
- ✅ Containers don't expose ports directly (except nginx)
- ✅ All requests go through single entry point (nginx)
- ✅ Easy to add SSL, rate limiting, authentication at nginx level

### 3. Flexibility
- ✅ Can run multiple environments simultaneously on one machine
- ✅ External ports don't conflict (3003 for dev, 3001 for stage)
- ✅ Easy to add new environments

### 4. Scalability
- ✅ Nginx can balance load between multiple instances
- ✅ Easy to add new services to Docker network

## Configuration Files

### .env.dev
```env
# Backend always runs on port 4000 inside container
PORT=4000

# Frontend accesses backend through Docker network
NEXT_PUBLIC_BACKEND_API_URL=http://backend:4000/api

# Client (browser) accesses API via relative path
NEXT_PUBLIC_API_URL=/api
```

### docker-compose.dev.yml
```yaml
backend:
  expose:
    - "4000"  # Only inside Docker network

frontend:
  environment:
    - PORT=3000
  expose:
    - "3000"  # Only inside Docker network

nginx:
  ports:
    - "3003:80"  # External mapping: localhost:3003 → nginx:80
```

### nginx.conf
```nginx
upstream backend {
    server backend:4000;  # Standard internal port
}

upstream frontend {
    server frontend:3000;  # Standard internal port
}

server {
    listen 80;  # Nginx listens on 80 inside container

    location /api {
        proxy_pass http://backend;  # → backend:4000
    }

    location / {
        proxy_pass http://frontend;  # → frontend:3000
    }
}
```

## Common Usage Scenarios

### Development
1. Run: `./docker-dev-start.sh`
2. Open browser: `http://localhost:3003`
3. API available at: `http://localhost:3003/api`

### Staging Testing
1. Run: `./docker-stage-start.sh`
2. Open browser: `http://localhost:3001`
3. API available at: `http://localhost:3001/api`

### Production
1. Run: `docker compose up -d`
2. Open browser: `https://your-domain.com`
3. API available at: `https://your-domain.com/api`

## Debugging

### Check Container Ports
```bash
docker compose -f docker-compose.dev.yml ps
```

### Check Environment Variables
```bash
docker exec crm-backend-dev env | grep PORT
docker exec crm-frontend-dev env | grep PORT
```

### Test Directly (Bypassing Nginx)
```bash
# Backend (inside Docker network)
docker exec crm-backend-dev curl http://localhost:4000/api/health

# Frontend liveness (inside Docker network)
docker exec crm-frontend-dev wget -q -O- http://127.0.0.1:3000/api/health
```

### Check Nginx Logs
```bash
docker compose -f docker-compose.dev.yml logs nginx
```

## Frontend Docker healthcheck

Healthchecks run **inside** the frontend container. They must hit the process bind port (`PORT`), not the host/nginx publish port.

```yaml
environment:
  - PORT=${FRONTEND_PORT:-3000}
healthcheck:
  # $$PORT → container env at runtime. A bare ${FRONTEND_PORT} would be
  # interpolated by Compose from the *host* .env and can point at nginx's
  # external port (8080/8081), which nothing listens on inside the container.
  test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://127.0.0.1:$${PORT:-3000}/api/health || exit 1"]
```

| Probe | Purpose |
|---|---|
| `GET /api/health` | Liveness only — cheap JSON, no SSR. Used by Docker/autoheal. |
| `GET /` or app pages | Full site / SSR — **not** for healthchecks (was driving memory growth every 30s). |

Stages differ by **nginx host ports** (`80` / `8080` / `8081`). Inside the network, frontend stays on `PORT` (default `3000`) unless you intentionally change `FRONTEND_PORT`/`PORT` and keep nginx `upstream` in sync.

## Migration from Old Schema

### Before (Incorrect)
- Dev: backend on 4003, frontend on 3003
- Stage: backend on 4001, frontend on 3001
- Prod: backend on 4000, frontend on 3000
- Port confusion across different environments

### After (Correct)
- **Inside always**: backend on 4000, frontend on 3000
- **Outside**: Nginx proxies to different ports (3003 for dev, 3001 for stage, 80/443 for prod)
- Application code doesn't know about external ports
