# 🚀 LoyaCareCRM Docker Deployment Guide

*Production deployment с Docker: containerized application*

*[🇸 English | [🇩🇪 Deutsch](DEPLOYMENT.de.md)*

## 📋 Обзор

Этот документ описывает production deployment LoyaCareCRM с использованием Docker. Docker обеспечивает изоляцию, масштабируемость и консистентность production среды.

### Архитектура Production Deployment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Backend       │    │   Frontend      │    │   Nginx Proxy   │
│   (External)    │    │   (Docker)      │    │   (Docker)      │    │   (Host)        │
│   Port: 5434    │◄──►│   Port: 4002    │◄──►│   Port: 3002    │◄──►│   Port: 82      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Порты для Production Environment

- **PostgreSQL:** 5434 (external database)
- **Backend:** 4002 (internal container port)
- **Frontend:** 3002 (internal container port)
- **Nginx Proxy:** 82 (host reverse proxy)

### Особенности Production Setup

- **External PostgreSQL:** Использует внешнюю базу данных для persistence
- **Nginx Reverse Proxy:** Host-based proxy для routing
- **SSL Termination:** HTTPS на nginx уровне
- **Environment Variables:** Production secrets через .env файлы
- **CI/CD Integration:** Автоматический deployment через GitHub Actions

## 🛠️ Шаг 1: Установка Docker

### На сервере Ubuntu выполните:

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установите Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузитесь или примените изменения группы
newgrp docker

# Проверьте установку
docker --version
docker-compose --version
```

## 📁 Шаг 2: Подготовка Docker конфигурации

### 2.1 Структура файлов

Все необходимые файлы уже созданы в репозитории:

```
docker/
├── backend/
│   └── Dockerfile          # Конфигурация для backend
├── frontend/
│   └── Dockerfile          # Конфигурация для frontend
docker-compose.yml           # Оркестрация сервисов
.env.docker                  # Переменные окружения для Docker
DOCKER_QUICK_START.md        # Быстрый старт
```

### 2.2 Настройка переменных окружения

#### Разница между .env файлами:

| Файл | Режим | Назначение | Создание |
|------|-------|------------|----------|
| **`.env.dev`** | Локальная разработка | Фиксированные dev значения для `./docker-dev-start.sh` | Из `.env.docker.example` |
| **`.env.docker`** | Production Docker | Реальные секреты для production развертывания | Динамически в CI/CD из GitHub Secrets |

**Локальная разработка** использует `.env.dev` (загружается через `env_file: - .env.dev` в `docker-compose.dev.yml`).

**Production** использует `.env.docker` (создается автоматически в GitHub Actions из секретов или вручную на сервере).

#### Настройка для production:

**Вариант 1: Ручная настройка на сервере**

Скопируйте шаблон и настройте переменные окружения:

```bash
cd /var/www/loyacrm
cp .env.docker.example .env.docker
nano .env.docker
```

**Вариант 2: Автоматическая настройка через CI/CD**

Файл `.env.docker` создается автоматически в GitHub Actions из секретов репозитория (GitHub Secrets) во время деплоя.

Заполните `.env.docker` реальными значениями:

```bash
# Database
POSTGRES_DB=loyacrm
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=your_actual_strong_password

# Backend
DATABASE_URL=postgresql://loyacrm:your_actual_strong_password@postgres:5432/loyacrm
JWT_SECRET=your_actual_jwt_secret_key_here
PORT=4002
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4002
NEXT_PUBLIC_APP_VERSION=docker
```

⚠️ **Важно:** Файл `.env.docker` содержит чувствительные данные и НЕ должен коммититься в git. Он уже добавлен в `.gitignore`.

**Примечание:** В CI/CD процессах (GitHub Actions) секреты автоматически подставляются из GitHub Secrets репозитория, обеспечивая безопасность хранения конфиденциальных данных.

## 🗄️ Шаг 3: Подготовка базы данных

### 3.1 Выполните миграции для Docker базы

```bash
cd /var/www/loyacrm

# Установите переменные окружения для Docker базы
export DATABASE_URL="postgresql://loyacrm:your_strong_password@localhost:5434/loyacrm"

# Выполните миграции
cd db
pnpm run migrate:deploy
pnpm run generate
```

### 3.2 Копирование данных (опционально)

Если нужно скопировать данные из текущей базы:

```bash
# Создайте дамп текущей базы
pg_dump -h localhost -U loyacrm loyacrm > current_db_backup.sql

# Запустите Docker базу (временно)
docker compose up -d postgres

# Подождите 30 секунд, затем восстановите
docker exec -i loyacrm-postgres-docker psql -U loyacrm loyacrm < current_db_backup.sql

# Остановите Docker базу
docker compose down
```

## 🚀 Шаг 4: Запуск Docker сервисов

### 4.1 Production запуск

```bash
cd /var/www/loyacrm

# Сборка образов
docker compose build

# Запуск сервисов
docker compose up -d

# Проверьте статус
docker compose ps
```

### 4.2 Проверка логов

```bash
# Логи всех сервисов
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
```

```bash
# Логи всех сервисов
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

## ✅ Шаг 5: Тестирование

### 5.1 Проверка доступности

```bash
# Backend API
curl http://localhost:4002/api/health

# Frontend
curl http://localhost:3002

# Database (external)
psql -h localhost -p 5434 -U loyacrm loyacrm -c "SELECT version();"
```

### 5.2 Функциональное тестирование

Откройте в браузере: `http://your-server-ip:82`

Убедитесь что:
- ✅ Приложение загружается
- ✅ API запросы работают
- ✅ База данных доступна
- ✅ Nginx proxy работает корректно

## 🌐 Шаг 6: Настройка Nginx для Docker

### 6.1 Создайте конфигурацию

Создайте `/etc/nginx/sites-available/loyacrm-docker`:

```nginx
server {
    listen 82;
    server_name your-domain.com your-server-ip;

    # Docker Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Docker Backend API
    location /api/ {
        proxy_pass http://localhost:4002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static files
    location /_next/static/ {
        proxy_pass http://localhost:3002;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 6.2 Активируйте конфигурацию

```bash
sudo ln -s /etc/nginx/sites-available/loyacrm-docker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Теперь Docker версия доступна на: `http://your-server-ip:82`

## 📊 Шаг 7: Мониторинг и управление

### 7.1 Используйте готовые скрипты

```bash
# Запуск Docker сервисов
./docker-start.sh

# Остановка
./docker-stop.sh

# Просмотр логов
./docker-logs.sh

# Обновление (git pull + rebuild)
./docker-update.sh
```

### 7.2 Мониторинг состояния

```bash
# Статус контейнеров
docker compose ps

# Использование ресурсов
docker stats

# Проверка здоровья
curl http://localhost:4003/api/health
curl http://localhost:3003
```

## 🔄 Шаг 8: Полный переход на Docker

**⚠️ Выполняйте только после тщательного тестирования!**

### 8.1 Остановите текущие сервисы

```bash
# Остановите PM2 сервисы
pm2 stop all

# Остановите PostgreSQL
sudo systemctl stop postgresql
```

### 8.2 Переключите Nginx

Измените `/etc/nginx/sites-available/loyacrm`:

```nginx
# Измените порты в proxy_pass
proxy_pass http://localhost:3001;  # вместо 3000
proxy_pass http://localhost:4001/api/;  # вместо 4000
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 8.3 Обновите переменные окружения

Обновите `.env` файлы для использования Docker портов.

## 🔧 Управление Docker развертыванием

### Полезные команды

```bash
# Просмотр логов
docker compose logs -f

# Перезапуск сервиса
docker compose restart backend

# Вход в контейнер
docker exec -it loyacrm-backend-docker sh

# Очистка
docker system prune -a
docker volume prune

# Мониторинг
docker stats
docker compose ps
```

### Резервное копирование

```bash
# Бэкап базы данных
docker exec loyacrm-postgres-docker pg_dump -U loyacrm loyacrm > backup_$(date +%Y%m%d).sql

# Бэкап volume
docker run --rm -v loyacrm_postgres_data:/data -v /backup:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
```

## 🚨 Troubleshooting

### Контейнеры не запускаются
```bash
docker compose logs
docker compose config
```

### База данных недоступна
```bash
# Проверьте external PostgreSQL
psql -h localhost -p 5434 -U loyacrm loyacrm -c "SELECT version();"
```

### Приложение не отвечает
```bash
docker compose logs backend
docker compose logs frontend
```

### Port conflicts

**Port already in use:**
```bash
# Найдите процесс использующий порт
lsof -i :3002
lsof -i :4002

# Остановите конфликтующий сервис или измените порты
```

## 📋 Контрольный список Deployment

- [ ] Docker и Docker Compose установлены
- [ ] External PostgreSQL настроена на порту 5434
- [ ] Переменные окружения настроены в `.env.backend` и `.env.frontend`
- [ ] Docker сервисы собраны и запущены
- [ ] Приложение доступно на портах 3002/4002
- [ ] Nginx настроен для порта 82
- [ ] Функциональное тестирование пройдено
- [ ] **После тестирования:** Переход на Docker завершен

## 🎯 Преимущества Docker Deployment

- **Изоляция:** Каждый компонент в отдельном контейнере
- **Масштабируемость:** Легко масштабировать сервисы
- **Воспроизводимость:** Консистентная среда на всех серверах
- **Управление:** Упрощенное управление зависимостями
- **Откат:** Быстрый откат к предыдущей версии
- **Production Ready:** Nginx proxy, external database, SSL support

---

**Автор:** Sergey Daub
**Дата:** 26 ноября 2025
**Версия:** 3.0 - Production deployment guide (separated from development)