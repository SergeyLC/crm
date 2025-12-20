# LoyaCareCRM - Docker Deployment Guide

Полная инструкция по развертыванию проекта на чистом сервере Ubuntu с использованием Docker.

## Содержание

- [Production развертывание](#концепция-развертывания) - основное окружение для работы
- [Staging развертывание](#развертывание-staging-окружения) - тестовое окружение на порту 8080
- [Управление и мониторинг](#управление-контейнерами)
- [Устранение неполадок](#устранение-неполадок)

## Концепция развертывания

**Рекомендуемый подход:** Docker образы собираются на машине разработчика или через CI/CD (GitHub Actions), затем загружаются в Container Registry и разворачиваются на сервере.

**На сервере НЕ требуются исходники проекта** - только конфигурационные файлы (docker-compose.yml, nginx.conf, .env).

Этот гайд описывает:
- **Production развертывание** - основное рабочее окружение (порт 80)
- **Staging развертывание** - тестовое окружение для проверки изменений (порт 8080)

### Способы развертывания Production:
1. **GitHub Actions (рекомендуется)** - автоматическая сборка и публикация в GitHub Container Registry
2. **Ручная сборка локально** - сборка на машине разработчика и загрузка образов на сервер
3. **Сборка на сервере** - для тестирования (не рекомендуется для production)

## Требования к серверу

- **OS**: Ubuntu 20.04 LTS или новее
- **RAM**: Минимум 2GB (рекомендуется 4GB)
- **CPU**: 2+ ядра
- **Disk**: Минимум 10GB свободного места (без исходников)
- **Доступ**: SSH с правами root или sudo

## Шаг 1: Подключение к серверу

```bash
# Замените YOUR_SERVER_IP на IP вашего сервера
ssh root@YOUR_SERVER_IP

# Если используете ключ SSH
ssh -i ~/.ssh/your_key root@YOUR_SERVER_IP
```

## Шаг 2: Обновление системы

```bash
# Обновить список пакетов
apt update

# Обновить установленные пакеты
apt upgrade -y

# Установить необходимые утилиты
apt install -y curl wget git nano
```

## Шаг 3: Установка Docker

```bash
# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Проверить установку
docker --version
# Должно вывести: Docker version 29.x.x или новее

# Включить автозапуск Docker
systemctl enable docker
systemctl start docker
```

## Шаг 4: Установка Docker Compose

```bash
# Docker Compose обычно устанавливается с Docker
# Проверить установку
docker compose version
# Должно вывести: Docker Compose version v5.x.x или новее
```

## Шаг 5: Создание структуры директорий

```bash
# Создать директории для проекта
mkdir -p /var/www/loyacrm-production
mkdir -p /var/www/loyacrm-production/backups

# Установить права
chmod -R 755 /var/www/loyacrm-production
```

## Шаг 6: Подготовка конфигурационных файлов

Есть три способа развертывания:

---

### Способ 1: GitHub Actions + Container Registry (РЕКОМЕНДУЕТСЯ)

**Преимущества:**
- ✅ Автоматическая сборка при push/merge
- ✅ Версионирование образов
- ✅ Образы хранятся в GitHub Container Registry
- ✅ Не нужно вручную собирать образы
- ✅ На сервере только конфигурация

**Шаги:**

1. **Настройте GitHub Actions** (файл уже должен быть в `.github/workflows/docker-publish.yml`)

2. **На локальной машине создайте deployment пакет:**
```bash
cd /path/to/LoyaCareCRM

# Создать директорию для deployment файлов
mkdir -p deployment-package

# Скопировать только необходимые файлы
cp docker-compose.yml deployment-package/
cp .env.example deployment-package/
cp nginx.conf deployment-package/
cp -r nginx deployment-package/ 2>/dev/null || true

# Создать архив
tar -czf loyacrm-deployment.tar.gz deployment-package/

# Скопировать на сервер
scp loyacrm-deployment.tar.gz root@YOUR_SERVER_IP:/var/www/
```

3. **На сервере распаковать и настроить:**
```bash
cd /var/www
tar -xzf loyacrm-deployment.tar.gz
mv deployment-package/* loyacrm-production/
rm -rf deployment-package loyacrm-deployment.tar.gz

cd /var/www/loyacrm-production

# Создать .env из примера
cp .env.example .env
nano .env  # Заполнить значения
```

4. **В docker-compose.yml использовать образы из Registry:**
```yaml
services:
  frontend:
    image: ghcr.io/sergeylc/crm/frontend:latest
    # или конкретная версия:
    # image: ghcr.io/sergeylc/crm/frontend:v1.0.0
  
  backend:
    image: ghcr.io/sergeylc/crm/backend:latest
    # или конкретная версия:
    # image: ghcr.io/sergeylc/crm/backend:v1.0.0
```

5. **При первом запуске может потребоваться авторизация в GitHub Registry:**
```bash
# Создать Personal Access Token в GitHub с правами read:packages
# Settings → Developer settings → Personal access tokens → Tokens (classic)

# Авторизоваться
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

6. **Запустить контейнеры** (см. Шаг 11)

---

### Способ 2: Ручная сборка на локальной машине

**Преимущества:**
- ✅ Полный контроль над процессом сборки
- ✅ Не требует настройки CI/CD
- ✅ На сервере только конфигурация

**Шаги:**

1. **На локальной машине собрать образы:**
```bash
cd /path/to/LoyaCareCRM

# Собрать Backend
docker build -f docker/backend/Dockerfile -t loyacrm-backend:latest .

# Собрать Frontend
docker build --no-cache \
  -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t loyacrm-frontend:latest .

# Проверить образы
docker images | grep loyacrm
```

2. **Сохранить образы в файлы:**
```bash
# Создать директорию для образов
mkdir -p docker-images

# Экспортировать образы
docker save loyacrm-backend:latest | gzip > docker-images/backend.tar.gz
docker save loyacrm-frontend:latest | gzip > docker-images/frontend.tar.gz

# Создать deployment пакет
mkdir -p deployment-package
cp docker-compose.yml deployment-package/
cp .env.example deployment-package/
cp nginx.conf deployment-package/
cp -r nginx deployment-package/ 2>/dev/null || true

# Создать архив со всем необходимым
tar -czf loyacrm-full-deployment.tar.gz deployment-package/ docker-images/
```

3. **Скопировать на сервер:**
```bash
# Скопировать архив (может занять время, ~500MB-1GB)
scp loyacrm-full-deployment.tar.gz root@YOUR_SERVER_IP:/var/www/
```

4. **На сервере распаковать и загрузить образы:**
```bash
cd /var/www
tar -xzf loyacrm-full-deployment.tar.gz

# Загрузить образы в Docker
docker load < docker-images/backend.tar.gz
docker load < docker-images/frontend.tar.gz

# Переместить конфигурацию
mv deployment-package/* loyacrm-production/

# Очистить
rm -rf deployment-package docker-images loyacrm-full-deployment.tar.gz

# Настроить .env
cd /var/www/loyacrm-production
cp .env.example .env
nano .env  # Заполнить значения
```

5. **Запустить контейнеры** (см. Шаг 11)

---

### Способ 3: Сборка на сервере (НЕ рекомендуется для production)

**Использовать только для тестирования!**

**Недостатки:**
- ❌ Требует исходники на сервере
- ❌ Нагрузка на production сервер при сборке
- ❌ Дольше время развертывания
- ❌ Требует больше места на диске

**Шаги:**

1. **Создать директорию для исходников:**
```bash
mkdir -p /var/www/loyacrm-source
```

2. **На локальной машине:**
```bash
cd /path/to/LoyaCareCRM

# Синхронизировать проект (исключая лишнее)
rsync -avz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.git' \
  --exclude='coverage' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  ./ root@YOUR_SERVER_IP:/var/www/loyacrm-source/
```

3. **На сервере собрать образы:**
```bash
cd /var/www/loyacrm-source

# Собрать Backend
docker build -f docker/backend/Dockerfile -t loyacrm-backend:latest .

# Собрать Frontend
docker build --no-cache \
  -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t loyacrm-frontend:latest .

# Скопировать конфигурацию
cp docker-compose.yml /var/www/loyacrm-production/
cp .env.example /var/www/loyacrm-production/
cp nginx.conf /var/www/loyacrm-production/

# Настроить .env
cd /var/www/loyacrm-production
cp .env.example .env
nano .env
```

4. **Запустить контейнеры** (см. Шаг 11)

---

## Шаг 7: Настройка environment переменных

**На сервере:**

```bash
# Перейти в директорию production
cd /var/www/loyacrm-production

# Создать .env файл для Docker Compose
cat > .env << 'EOF'
# Общие настройки
DOMAIN=YOUR_SERVER_IP
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=production

# Frontend настройки
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api

# Backend настройки
BACKEND_PORT=4000
LOG_LEVEL=info
CORS_ORIGIN=http://YOUR_SERVER_IP

# База данных
POSTGRES_DB=loyacrm
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=loyacrm2024secure

# Безопасность
JWT_SECRET=dGhpc2lzYXNlY3JldGp3dHNlY3JldGtleQ==

# Docker образы
FRONTEND_IMAGE=loyacrm-frontend:latest
BACKEND_IMAGE=loyacrm-backend:latest

# Порты
NGINX_PORT=80
EOF

# ВАЖНО: Замените YOUR_SERVER_IP на реальный IP сервера
nano .env

# Для production рекомендуется сгенерировать новые значения:
# JWT_SECRET: openssl rand -base64 32
# POSTGRES_PASSWORD: openssl rand -base64 16
```

## Шаг 8: Настройка docker-compose.yml

```bash
cd /var/www/loyacrm-production

cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: loyacrm-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_USER=${POSTGRES_USER:-loyacrm}
      - POSTGRES_DB=${POSTGRES_DB:-loyacrm}
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-loyacrm}"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - loyacrm-network

  backend:
    image: ${BACKEND_IMAGE:-loyacrm-backend:latest}
    container_name: loyacrm-backend
    restart: unless-stopped
    environment:
      - PORT=${BACKEND_PORT:-4000}
      - NODE_ENV=${NODE_ENV:-production}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - DATABASE_URL=postgresql://${POSTGRES_USER:-loyacrm}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-loyacrm}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:${BACKEND_PORT:-4000}/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    networks:
      - loyacrm-network

  frontend:
    image: ${FRONTEND_IMAGE:-loyacrm-frontend:latest}
    container_name: loyacrm-frontend
    restart: unless-stopped
    environment:
      - PORT=${FRONTEND_PORT:-3000}
      - NODE_ENV=${NODE_ENV:-production}
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api}
      - NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}
      - NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION:-production}
    depends_on:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:${FRONTEND_PORT:-3000} || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - loyacrm-network

  nginx:
    image: nginx:alpine
    container_name: loyacrm-nginx
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    ports:
      - "${NGINX_PORT:-80}:80"
    networks:
      - loyacrm-network

volumes:
  pg_data:
    name: loyacrm_pg_data

networks:
  loyacrm-network:
    driver: bridge
EOF
```

## Шаг 9: Настройка Nginx

```bash
cd /var/www/loyacrm-production

cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:4000;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 10M;

        # Frontend (Next.js)
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
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
```

## Шаг 10: Запуск контейнеров

```bash
cd /var/www/loyacrm-production

# Запустить все сервисы
docker compose up -d

# Проверить статус контейнеров
docker compose ps

# Должно показать все 4 контейнера в статусе "Up (healthy)"
```

## Шаг 11: Применение миграций базы данных

```bash
# Подождать, пока PostgreSQL полностью запустится (30-60 секунд)
sleep 60

# Применить миграции
docker exec loyacrm-backend sh -c "cd /app/db && npx prisma migrate deploy"

# Проверить применённые миграции
docker exec loyacrm-backend sh -c "cd /app/db && npx prisma migrate status"
```

## Шаг 12: Заполнение базы данных (Seeding)

```bash
# Создать seed данные (администраторы, тестовые лиды/сделки)
docker exec loyacrm-backend sh -c "cd /app/db && node prisma/seed.ts"
```

## Шаг 13: Проверка работоспособности

### 13.1 Проверка Backend API

```bash
# Health check
curl http://YOUR_SERVER_IP/api/health
# Должно вернуть: {"status":"ok"}

# Тест авторизации
curl -X POST http://YOUR_SERVER_IP/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loya.care","password":"1"}'
# Должно вернуть JSON с токеном и данными пользователя
```

### 14.2 Проверка Frontend

### 13.2 Проверка Frontend

```bash
# Проверить главную страницу
curl -I http://YOUR_SERVER_IP/de
# Должно вернуть: HTTP/1.1 200 OK

# Проверить страницу логина
curl -I http://YOUR_SERVER_IP/de/login
# Должно вернуть: HTTP/1.1 200 OK
```

### 13.3 Проверка в браузере

Откройте в браузере:
- **Главная**: `http://YOUR_SERVER_IP/de`
- **Логин**: `http://YOUR_SERVER_IP/de/login`

**Тестовые учетные данные:**
- Email: `admin@loya.care`
- Password: `1`

После успешного логина вы должны увидеть дашборд CRM.

## Шаг 14: Настройка автозапуска

Docker контейнеры уже настроены с `restart: unless-stopped`, поэтому они автоматически запустятся после перезагрузки сервера.

Проверить:
```bash
# Перезагрузить сервер
reboot

# После перезагрузки подключиться и проверить
ssh root@YOUR_SERVER_IP
cd /var/www/loyacrm-production
docker compose ps
```

## Управление контейнерами

### Просмотр логов

```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f nginx

# Последние 50 строк
docker compose logs --tail 50 backend
```

### Перезапуск сервисов

```bash
# Перезапустить все
docker compose restart

# Перезапустить конкретный сервис
docker compose restart backend
docker compose restart frontend
```

### Остановка и удаление

```bash
# Остановить все сервисы
docker compose stop

# Остановить и удалить контейнеры (БД сохранится)
docker compose down

# Удалить всё включая БД (ОСТОРОЖНО!)
docker compose down -v
```

### Обновление после изменений кода

**Способ 1: Через GitHub Actions (рекомендуется)**

```bash
# 1. На локальной машине: push код в репозиторий
git push origin main

# 2. GitHub Actions автоматически соберёт и опубликует новые образы

# 3. На сервере: обновить образы и перезапустить
cd /var/www/loyacrm-production

# Скачать новые версии образов
docker compose pull

# Пересоздать контейнеры с новыми образами
docker compose up -d

# Проверить
docker compose ps
```

**Способ 2: Ручная сборка и загрузка**

```bash
# 1. На локальной машине пересобрать образы
cd /path/to/LoyaCareCRM
docker build -f docker/backend/Dockerfile -t loyacrm-backend:latest .
docker build --no-cache -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t loyacrm-frontend:latest .

# 2. Сохранить и скопировать на сервер
docker save loyacrm-backend:latest | gzip > backend.tar.gz
docker save loyacrm-frontend:latest | gzip > frontend.tar.gz
scp backend.tar.gz frontend.tar.gz root@YOUR_SERVER_IP:/tmp/

# 3. На сервере загрузить и обновить
ssh root@YOUR_SERVER_IP
cd /tmp
docker load < backend.tar.gz
docker load < frontend.tar.gz
rm backend.tar.gz frontend.tar.gz

cd /var/www/loyacrm-production
docker compose up -d --force-recreate backend frontend

# 4. Проверить
docker compose ps
```

**Способ 3: Сборка на сервере (не рекомендуется)**

```bash
# 1. Синхронизировать новый код
rsync -avz --exclude='node_modules' --exclude='.next' \
  ./ root@YOUR_SERVER_IP:/var/www/loyacrm-source/

# 2. На сервере пересобрать образы
ssh root@YOUR_SERVER_IP
cd /var/www/loyacrm-source
docker build -f docker/backend/Dockerfile -t loyacrm-backend:latest .
docker build --no-cache -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t loyacrm-frontend:latest .

# 3. Пересоздать контейнеры
cd /var/www/loyacrm-production
docker compose up -d --force-recreate backend frontend

# 4. Проверить
docker compose ps
```

## Бэкапы базы данных

### Создание бэкапа

```bash
# Создать директорию для бэкапов
mkdir -p /var/www/loyacrm-backups

# Создать бэкап
docker exec loyacrm-postgres pg_dump \
  -U loyacrm loyacrm > /var/www/loyacrm-backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Или использовать custom format (сжатый)
docker exec loyacrm-postgres pg_dump \
  -U loyacrm -Fc loyacrm > /var/www/loyacrm-backups/backup_$(date +%Y%m%d_%H%M%S).dump
```

### Восстановление из бэкапа

```bash
# Из SQL файла
cat /var/www/loyacrm-backups/backup_YYYYMMDD_HHMMSS.sql | \
  docker exec -i loyacrm-postgres psql -U loyacrm -d loyacrm

# Из custom format
docker exec -i loyacrm-postgres pg_restore \
  -U loyacrm -d loyacrm < /var/www/loyacrm-backups/backup_YYYYMMDD_HHMMSS.dump
```

### Автоматические бэкапы (cron)

```bash
# Создать скрипт бэкапа
cat > /usr/local/bin/loyacrm-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/var/www/loyacrm-backups
DATE=$(date +%Y%m%d_%H%M%S)
docker exec loyacrm-postgres pg_dump -U loyacrm -Fc loyacrm > $BACKUP_DIR/backup_$DATE.dump
# Удалять бэкапы старше 30 дней
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete
EOF

# Сделать исполняемым
chmod +x /usr/local/bin/loyacrm-backup.sh

# Добавить в cron (каждый день в 3:00 ночи)
crontab -e
# Добавить строку:
# 0 3 * * * /usr/local/bin/loyacrm-backup.sh
```

## Мониторинг

### Проверка здоровья системы

```bash
# Использование диска
df -h

# Использование памяти
free -h

# Docker статистика
docker stats

# Проверка логов на ошибки
docker compose logs --tail 100 | grep -i error
```

## Развертывание Staging окружения

Staging окружение позволяет тестировать изменения перед деплоем в production. Staging использует отдельные контейнеры, базу данных и порты.

### Отличия Staging от Production

| Параметр | Production | Staging |
|----------|-----------|---------|
| HTTP порт | 80 | 8080 |
| База данных | `loyacrm` | `loyacrm_staging` |
| Docker volume | `loyacrm_pg_data` | `loyacrm_pg_data_staging` |
| Имена контейнеров | `loyacrm-*` | `loyacrm-staging-*` |
| Docker образы | `:latest` | `:staging` |
| Сеть | `loyacrm-network` | `loyacrm-staging-network` |
| Директория | `/var/www/loyacrm-production` | `/var/www/loyacrm-staging` |

### Шаг 1: Подготовка конфигурации Staging

На локальной машине уже есть готовые файлы:
- `docker-compose.stage.yml` - конфигурация для staging
- `.env.stage` - шаблон переменных окружения для staging
- `nginx.stage.conf` - nginx конфигурация для staging
- `frontend/.env.staging` - переменные сборки frontend для staging

### Шаг 2: Сборка образов для Staging

```bash
cd /path/to/LoyaCareCRM

# Собрать Backend образ (одинаковый для prod и staging)
docker build --platform linux/amd64 \
  -t loyacrm-backend:staging \
  -f docker/backend/Dockerfile .

# Собрать Frontend образ с staging переменными
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api \
  --build-arg NEXT_PUBLIC_APP_VERSION=staging \
  -t loyacrm-frontend:staging \
  -f docker/frontend/Dockerfile.prod .
```

**⚠️ Важно:** Используйте `--platform linux/amd64` если собираете на Mac (ARM64) для сервера AMD64.

### Шаг 3: Экспорт и копирование образов

```bash
# Экспортировать образы
docker save loyacrm-backend:staging | gzip > loyacrm-backend-staging.tar.gz
docker save loyacrm-frontend:staging | gzip > loyacrm-frontend-staging.tar.gz

# Скопировать на сервер
scp loyacrm-backend-staging.tar.gz loyacrm-frontend-staging.tar.gz \
    docker-compose.stage.yml nginx.stage.conf .env.stage \
    root@YOUR_SERVER_IP:/var/www/loyacrm-staging/
```

### Шаг 4: Настройка на сервере

```bash
ssh root@YOUR_SERVER_IP
cd /var/www/loyacrm-staging

# Создать директорию для бэкапов
mkdir -p backups

# Загрузить Docker образы
docker load < loyacrm-backend-staging.tar.gz
docker load < loyacrm-frontend-staging.tar.gz

# Настроить .env
cp .env.stage .env

# Сгенерировать безопасные пароли
DB_PASS=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Обновить .env с паролями (используйте текстовый редактор)
nano .env
# Замените:
# POSTGRES_PASSWORD=CHANGE_ME_STAGING_PASSWORD  ->  на сгенерированный пароль
# JWT_SECRET=CHANGE_ME_STAGING_JWT_SECRET       ->  на сгенерированный секрет
```

### Шаг 5: Запуск Staging контейнеров

```bash
cd /var/www/loyacrm-staging

# Запустить контейнеры
docker compose -f docker-compose.stage.yml up -d

# Проверить статус
docker ps --filter name=loyacrm-staging

# Проверить логи
docker compose -f docker-compose.stage.yml logs -f
```

### Шаг 6: Применение миграций и Seed данных

```bash
# Применить миграции базы данных
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npx prisma migrate deploy'

# **ВАЖНО:** Запустить seed для создания тестовых данных
docker exec loyacrm-staging-backend sh -c 'cd /app/db && npm run seed'

# Проверить созданные данные
docker exec loyacrm-staging-postgres psql -U loyacrm -d loyacrm_staging \
  -c 'SELECT COUNT(*) as users FROM "User"; SELECT COUNT(*) as contacts FROM "Contact";'
```

**Seed создаст:**
- 13 пользователей (включая admin@loya.care с паролем "1")
- 110 контактов
- 110 сделок в различных стадиях
- Тестовые группы и заметки

### Шаг 7: Открытие порта 8080 (если требуется)

По умолчанию многие хостинг-провайдеры блокируют нестандартные порты. Staging доступен локально на сервере, для доступа извне:

**Вариант 1: Открыть порт у хостинг-провайдера**

Обратитесь в поддержку хостинга для открытия порта 8080.

**Вариант 2: SSH туннель (для разработчиков)**

```bash
# На локальной машине создать туннель
ssh -L 8080:localhost:8080 root@YOUR_SERVER_IP -N

# Затем открыть в браузере: http://localhost:8080/de
```

**Вариант 3: Path-based routing через production nginx**

Настроить production nginx для проксирования `/staging/` на staging.

### Шаг 8: Проверка Staging

```bash
# Тест API (на сервере)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loya.care","password":"1"}'

# Должен вернуть: {"success":true,"user":{...},"token":"..."}

# Тест Frontend
curl -I http://localhost:8080/de
# Должен вернуть: HTTP/1.1 200 OK
```

**Доступ к Staging:**
- URL: `http://YOUR_SERVER_IP:8080/de`
- Email: `admin@loya.care`
- Password: `1`

### Управление Staging

```bash
cd /var/www/loyacrm-staging

# Просмотр логов
docker compose -f docker-compose.stage.yml logs -f

# Перезапуск сервисов
docker compose -f docker-compose.stage.yml restart

# Остановка
docker compose -f docker-compose.stage.yml stop

# Полная очистка (включая БД)
docker compose -f docker-compose.stage.yml down -v
```

### Обновление Staging образов

```bash
# 1. На локальной машине пересобрать
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP:8080/api \
  -t loyacrm-frontend:staging \
  -f docker/frontend/Dockerfile.prod .

# 2. Экспортировать и скопировать
docker save loyacrm-frontend:staging | gzip > loyacrm-frontend-staging.tar.gz
scp loyacrm-frontend-staging.tar.gz root@YOUR_SERVER_IP:/var/www/loyacrm-staging/

# 3. На сервере загрузить и перезапустить
ssh root@YOUR_SERVER_IP
cd /var/www/loyacrm-staging
docker load < loyacrm-frontend-staging.tar.gz
docker compose -f docker-compose.stage.yml restart frontend
```

### Очистка временных файлов

После успешного развертывания удалите архивы образов:

```bash
# На сервере
cd /var/www/loyacrm-staging
rm -f *.tar.gz

# На локальной машине
rm -f loyacrm-*-staging.tar.gz
```

---

## Устранение неполадок

### Контейнер не запускается

```bash
# Проверить логи
docker compose logs backend

# Проверить конфигурацию
docker compose config

# Пересоздать контейнер
docker compose up -d --force-recreate backend
```

### База данных недоступна

```bash
# Проверить статус
docker compose ps postgres

# Проверить логи
docker compose logs postgres

# Проверить подключение
docker exec loyacrm-backend sh -c "cd /app/db && npx prisma db pull"
```

### Frontend показывает ошибки

```bash
# Проверить переменные окружения
docker exec loyacrm-frontend env | grep NEXT_PUBLIC

# Проверить, что .env.production скопирован
docker exec loyacrm-frontend cat /app/frontend/.env.production

# Пересобрать с --no-cache
docker build --no-cache -f docker/frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api \
  -t loyacrm-frontend:latest /var/www/loyacrm-source
```

### Nginx ошибки 502/504

```bash
# Проверить upstream сервисы
docker compose ps

# Проверить конфигурацию nginx
docker exec loyacrm-nginx nginx -t

# Перезагрузить nginx
docker compose restart nginx
```

## Безопасность

### Изменить пароли

**ВАЖНО:** При первом деплое рекомендуется сгенерировать новые значения:

```bash
cd /var/www/loyacrm-production

# Сгенерировать новый пароль БД
NEW_DB_PASSWORD=$(openssl rand -base64 16)
echo "Новый пароль БД: $NEW_DB_PASSWORD"

# Сгенерировать новый JWT секрет
NEW_JWT_SECRET=$(openssl rand -base64 32)
echo "Новый JWT секрет: $NEW_JWT_SECRET"

# Обновить .env файл
nano .env
# Измените:
# POSTGRES_PASSWORD=новый_пароль
# JWT_SECRET=новый_секрет

# Пересоздать контейнеры с новыми значениями
docker compose down
docker compose up -d

# Проверить подключение
docker compose ps
```

**Для смены паролей на существующей системе:**

1. **PostgreSQL пароль:**
```bash
# Остановить сервисы
cd /var/www/loyacrm-production
docker compose stop backend frontend

# Изменить пароль в .env
nano .env
# POSTGRES_PASSWORD=новый_пароль

# Изменить пароль в PostgreSQL
docker exec -it loyacrm-postgres psql -U loyacrm -d loyacrm \
  -c "ALTER USER loyacrm WITH PASSWORD 'новый_пароль';"

# Перезапустить сервисы
docker compose up -d
```

2. **JWT Secret (потребует переавторизации всех пользователей):**
```bash
# Изменить в .env
nano .env
# JWT_SECRET=новый_секрет

# Перезапустить backend
docker compose restart backend
```

### Настройка Firewall

```bash
# Установить ufw
apt install -y ufw

# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP
ufw allow 80/tcp

# Разрешить HTTPS (если используете SSL)
ufw allow 443/tcp

# Включить firewall
ufw enable

# Проверить статус
ufw status
```

## SSL/HTTPS (опционально)

Для production рекомендуется использовать SSL сертификат (Let's Encrypt + Certbot).

```bash
# Установить Certbot
apt install -y certbot python3-certbot-nginx

# Получить сертификат (замените на ваш домен)
certbot --nginx -d your-domain.com

# Автообновление сертификата (уже настроено автоматически)
# Проверить: certbot renew --dry-run
```

## Контакты и поддержка

При возникновении проблем проверьте:
1. Логи контейнеров: `docker compose logs`
2. Статус сервисов: `docker compose ps`
3. Доступность портов: `netstat -tulpn | grep LISTEN`
4. Использование ресурсов: `docker stats`

---

**Дата создания:** 2025-12-19  
**Версия:** 1.0  
**Проект:** LoyaCareCRM  
**Deployment:** Docker Production
