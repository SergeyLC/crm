# Архитектура портов Docker

## Принцип работы

### Внутри Docker-сети (между контейнерами)

Все сервисы используют **стандартные порты** для всех окружений:

- **Frontend**: порт `3000`
- **Backend**: порт `4000`
- **PostgreSQL**: порт `5432`

Контейнеры общаются друг с другом по именам сервисов внутри Docker-сети:
- `http://frontend:3000` - доступ к frontend
- `http://backend:4000/api` - доступ к backend API
- `postgresql://postgres:5432` - доступ к базе данных

### Проброс портов наружу (host machine)

**Nginx** проксирует внутренние порты на внешние, разные для каждого окружения:

#### Development (docker-compose.dev.yml)
```
Host (ваш компьютер)     →  Nginx (внутри Docker)  →  Сервис
localhost:3003           →  nginx:80               →  frontend:3000
localhost:3003/api       →  nginx:80               →  backend:4000/api
localhost:5435           →  прямой проброс         →  postgres:5432
```

#### Staging (docker-compose.stage.yml)
```
Host                     →  Nginx                  →  Сервис
localhost:3001           →  nginx:80               →  frontend:3000
localhost:3001/api       →  nginx:80               →  backend:4000/api
localhost:5433           →  прямой проброс         →  postgres:5432
```

#### Production (docker-compose.yml)
```
Host                     →  Nginx                  →  Сервис
:80 / :443               →  nginx:80/443           →  frontend:3000
:80/api / :443/api       →  nginx:80/443           →  backend:4000/api
(БД не проброшена)       →  только внутри Docker   →  postgres:5432
```

## Преимущества такой архитектуры

### 1. Простота и консистентность
- ✅ Внутри контейнеров всегда одни и те же порты (3000/4000)
- ✅ Не нужно менять код или переменные окружения при смене окружения
- ✅ Dockerfile работает одинаково для всех окружений

### 2. Безопасность
- ✅ Контейнеры не открывают порты напрямую наружу (кроме nginx)
- ✅ Все запросы идут через единую точку входа (nginx)
- ✅ Легко добавить SSL, rate limiting, аутентификацию на уровне nginx

### 3. Гибкость
- ✅ Можно запускать несколько окружений одновременно на одной машине
- ✅ Внешние порты не конфликтуют (3003 для dev, 3001 для stage)
- ✅ Легко добавить новые окружения

### 4. Масштабируемость
- ✅ Nginx может балансировать нагрузку между несколькими инстансами
- ✅ Легко добавить новые сервисы в Docker-сеть

## Конфигурационные файлы

### .env.dev
```env
# Backend всегда на порту 4000 внутри контейнера
PORT=4000

# Frontend обращается к backend через Docker-сеть
NEXT_PUBLIC_BACKEND_API_URL=http://backend:4000/api

# Клиент (браузер) обращается к API через относительный путь
NEXT_PUBLIC_API_URL=/api
```

### docker-compose.dev.yml
```yaml
backend:
  expose:
    - "4000"  # Только внутри Docker-сети

frontend:
  environment:
    - PORT=3000
  expose:
    - "3000"  # Только внутри Docker-сети

nginx:
  ports:
    - "3003:80"  # Проброс наружу: localhost:3003 → nginx:80
```

### nginx.conf
```nginx
upstream backend {
    server backend:4000;  # Стандартный внутренний порт
}

upstream frontend {
    server frontend:3000;  # Стандартный внутренний порт
}

server {
    listen 80;  # Nginx слушает на 80 внутри контейнера

    location /api {
        proxy_pass http://backend;  # → backend:4000
    }

    location / {
        proxy_pass http://frontend;  # → frontend:3000
    }
}
```

## Типичные сценарии использования

### Разработка (Development)
1. Запустите: `./docker-dev-start.sh`
2. Откройте браузер: `http://localhost:3003`
3. API доступно по: `http://localhost:3003/api`

### Тестирование на stage
1. Запустите: `./docker-stage-start.sh`
2. Откройте браузер: `http://localhost:3001`
3. API доступно по: `http://localhost:3001/api`

### Production
1. Запустите: `docker compose up -d`
2. Откройте браузер: `https://your-domain.com`
3. API доступно по: `https://your-domain.com/api`

## Отладка

### Проверить порты контейнеров
```bash
docker compose -f docker-compose.dev.yml ps
```

### Проверить переменные окружения
```bash
docker exec loyacrm-backend-dev env | grep PORT
docker exec loyacrm-frontend-dev env | grep PORT
```

### Тестировать напрямую (минуя Nginx)
```bash
# Backend (внутри Docker-сети)
docker exec loyacrm-backend-dev curl http://localhost:4000/api/health

# Frontend (внутри Docker-сети)
docker exec loyacrm-frontend-dev curl http://localhost:3000
```

### Проверить логи Nginx
```bash
docker compose -f docker-compose.dev.yml logs nginx
```

## Миграция со старой схемы

### Было (неправильно)
- Dev: backend на 4003, frontend на 3003
- Stage: backend на 4001, frontend на 3001
- Prod: backend на 4000, frontend на 3000
- Путаница с портами в разных окружениях

### Стало (правильно)
- **Внутри всегда**: backend на 4000, frontend на 3000
- **Снаружи**: Nginx проксирует на разные порты (3003 для dev, 3001 для stage, 80/443 для prod)
- Код приложения не знает о внешних портах
