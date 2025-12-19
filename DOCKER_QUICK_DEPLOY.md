# 🚀 Quick Docker Deployment Guide

Это краткое руководство по развертыванию LoyaCare CRM с использованием Docker на новом сервере.

## ✅ Предварительные требования

- Ubuntu 22.04+ или аналогичная ОС
- SSH доступ с правами root
- Минимум 2GB RAM и 10GB свободного места на диске

## 📝 Шаг 1: Установка Docker

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Проверка установки
docker --version
docker compose version
```

## 📁 Шаг 2: Подготовка файлов

### 2.1 Скопировать исходный код на сервер
```bash
# На локальной машине
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  ./LoyaCareCRM/ root@YOUR_SERVER_IP:/var/www/loyacrm-source/
```

### 2.2 Создать директорию для развертывания
```bash
# На сервере
mkdir -p /var/www/loyacrm-production/{nginx/conf.d,backups}
cd /var/www/loyacrm-production
```

### 2.3 Создать конфигурацию nginx
```bash
cat > nginx/conf.d/loyacrm.conf << 'EOF'
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

### 2.4 Создать docker-compose.yml
```bash
cat > docker-compose.yml << 'EOF'
services:
  nginx:
    image: nginx:alpine
    container_name: loyacrm-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - frontend
      - backend
    networks: [loyacrm-network]

  frontend:
    image: loyacrm-frontend:latest
    container_name: loyacrm-frontend
    restart: unless-stopped
    environment:
      - PORT=3000
      - NODE_ENV=production
      - NEXT_PUBLIC_BACKEND_API_URL=http://YOUR_SERVER_IP/api
      - NEXT_PUBLIC_APP_VERSION=production
    networks: [loyacrm-network]

  backend:
    image: loyacrm-backend:latest
    container_name: loyacrm-backend
    restart: unless-stopped
    environment:
      - PORT=4000
      - NODE_ENV=production
      - LOG_LEVEL=info
      - CORS_ORIGIN=http://YOUR_SERVER_IP
      - DATABASE_URL=postgresql://loyacrm:CHANGE_THIS_PASSWORD@postgres:5432/loyacrm
      - JWT_SECRET=CHANGE_THIS_SECRET
    depends_on:
      postgres:
        condition: service_healthy
    networks: [loyacrm-network]

  postgres:
    image: postgres:16-alpine
    container_name: loyacrm-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
      - POSTGRES_USER=loyacrm
      - POSTGRES_DB=loyacrm
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U loyacrm"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks: [loyacrm-network]

volumes:
  pg_data:
    name: loyacrm_pg_data

networks:
  loyacrm-network:
    driver: bridge
EOF
```

**⚠️ ВАЖНО:** Замените в docker-compose.yml:
- `YOUR_SERVER_IP` на IP адрес вашего сервера
- `CHANGE_THIS_PASSWORD` на надежный пароль для базы данных
- `CHANGE_THIS_SECRET` на случайную строку для JWT (можно сгенерировать: `openssl rand -base64 32`)

## 🏗️ Шаг 3: Сборка Docker образов

```bash
cd /var/www/loyacrm-source

# Сборка backend образа
docker build -f docker/backend/Dockerfile -t loyacrm-backend:latest .

# Сборка frontend образа
docker build -f docker/frontend/Dockerfile -t loyacrm-frontend:latest .
```

**Примечание:** Сборка может занять 5-10 минут.

## 🗄️ Шаг 4: Запуск и настройка базы данных

```bash
cd /var/www/loyacrm-production

# Запуск контейнеров
docker compose up -d

# Ожидание запуска контейнеров
sleep 30

# Применение миграций
docker exec loyacrm-backend sh -c 'cd db && npx prisma migrate deploy'

# Создание начальных данных
docker exec loyacrm-backend sh -c 'cd db && npx ts-node prisma/seed.ts'
```

## ✅ Шаг 5: Проверка развертывания

```bash
# Проверка статуса контейнеров
docker compose ps

# Проверка работы API
curl http://localhost/api/health

# Проверка логина
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@loya.care", "password": "1"}'
```

## 🌐 Доступ к приложению

Откройте в браузере: `http://YOUR_SERVER_IP`

### Учетные данные для входа:
- **Email:** admin@loya.care
- **Password:** 1

## 🔧 Управление

### Просмотр логов
```bash
cd /var/www/loyacrm-production
docker compose logs -f
```

### Перезапуск сервисов
```bash
docker compose restart
```

### Остановка
```bash
docker compose down
```

### Полная переустановка (с удалением данных)
```bash
docker compose down -v
docker volume rm loyacrm_pg_data
# Затем повторить шаги 4-5
```

## 🐛 Устранение неполадок

### Nginx не запускается
```bash
# Проверить конфигурацию
docker exec loyacrm-nginx nginx -t

# Посмотреть логи
docker logs loyacrm-nginx
```

### Backend не может подключиться к базе
```bash
# Проверить, что postgres запущен и healthy
docker compose ps

# Проверить логи postgres
docker logs loyacrm-postgres

# Проверить переменную DATABASE_URL
docker exec loyacrm-backend sh -c 'echo $DATABASE_URL'
```

### Страницы не загружаются
```bash
# Проверить логи frontend
docker logs loyacrm-frontend

# Проверить логи nginx
docker logs loyacrm-nginx

# Проверить сетевое подключение
docker network inspect loyacrm-production_loyacrm-network
```

## 📋 Требования к серверу

| Параметр | Минимум | Рекомендуется |
|----------|---------|---------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Disk | 10 GB | 20 GB |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 LTS |

## 🔒 Безопасность

⚠️ **Важно для production:**
1. Измените все пароли и секреты
2. Настройте SSL/TLS (Let's Encrypt)
3. Настройте firewall (UFW)
4. Настройте регулярные бэкапы базы данных
5. Используйте Docker secrets вместо переменных окружения

## 📚 Дополнительная документация

- Полная документация: `DOCKER_DEPLOYMENT.md`
- Отчет о развертывании: `DOCKER_DEPLOYMENT_REPORT_217.154.173.36.md`
- Оптимизация: `docs/deployment/DEPLOYMENT_OPTIMIZATION.md`

---

**Последнее обновление:** 18 декабря 2025
