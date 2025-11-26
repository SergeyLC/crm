# 🚀 LoyaCareCRM Docker Deployment Guide

*Постепенный переход на Docker развертывание с сохранением текущей схемы*

## 📋 Обзор

Этот документ описывает **постепенный** переход проекта LoyaCareCRM на Docker развертывание. Docker версия работает параллельно с текущей PM2 схемой на **других портах**, обеспечивая бесперебойную работу и возможность тестирования.

### Архитектура Docker развертывания

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Backend       │    │   Frontend      │    │   Nginx Proxy   │
│   (Docker)      │    │   (Docker)      │    │   (Docker)      │    │   (Docker)      │
│   Port: 5435    │◄──►│   Port: 4003    │◄──►│   Port: 3003    │◄──►│   Port: 80      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲                       ▲
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                    ┌─────────────────┐         ┌─────────────────┐
                    │   Health Checks │         │   Hot Reload    │
                    │   & Volumes     │         │   (HMR)         │
                    └─────────────────┘         └─────────────────┘
```

### Порты для Development Environment (docker-compose.dev.yml)

- **PostgreSQL:** 5435 (вместо 5432)
- **Backend:** 4003 (вместо 4000)
- **Frontend:** 3003 (вместо 3000)
- **Nginx Proxy:** 80 (reverse proxy для frontend и backend)

### Особенности Development Setup

- **Nginx Reverse Proxy:** Объединяет frontend и backend под одним портом 80
- **Health Checks:** Автоматическая проверка готовности сервисов
- **Named Volumes:** Постоянное хранение данных PostgreSQL
- **Database Seeding:** Автоматическое заполнение БД тестовыми данными
- **Hot Module Replacement (HMR):** Поддержка WebSocket для live reloading
- **API Health Endpoint:** `/api/health` для проверки backend состояния

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

### 4.2 Локальная разработка

Для локальной разработки используйте отдельную конфигурацию с hot-reload:

```bash
# Запуск с hot-reload для разработки
./docker-dev-start.sh

# Или вручную
docker compose -f docker-compose.dev.yml up -d
```

**Порты для локальной разработки:**
- Frontend: 80 (nginx proxy) / 3003 (direct access)
- Backend: 80/api (nginx proxy) / 4003 (direct access)
- Database: 5435
- Nginx: 80 (reverse proxy)

**Управление локальной разработкой:**
```bash
# Запуск с hot-reload для разработки
./docker-dev-start.sh

# Или вручную
docker-compose -f docker-compose.dev.yml up -d

# Логи
./docker-dev-logs.sh

# Остановка
./docker-dev-stop.sh

# Проверка здоровья
curl http://localhost/api/health
```

**Особенности среды разработки:**
- **Health checks** для PostgreSQL и Backend сервисов
- **Именованные volumes** для постоянных данных БД (`loyacrm_pg_data`)
- **Database seeding** с тестовыми пользователями и сделками
- **Nginx reverse proxy** для объединения frontend и backend
- **Hot Module Replacement (HMR)** через WebSocket proxy
- **API health endpoint** для проверки состояния backend

#### Database Seeding

При первом запуске development environment автоматически выполняется seeding базы данных:

- **Пользователи:** admin@example.com, employee@example.com, lead@example.com
- **Пароли:** password123 (для всех пользователей)
- **Роли:** Admin, Employee, Lead
- **Сделки:** Несколько тестовых сделок для демонстрации

#### Hot Module Replacement (HMR)

Development setup поддерживает HMR для быстрой разработки:

- **WebSocket Proxy:** Nginx проксирует WebSocket соединения для `/_next/webpack-hmr`
- **Direct Access:** Для полной HMR функциональности используйте `http://localhost:3003`
- **Turbopack Notes:** Если возникают проблемы с HMR, попробуйте прямой доступ к порту 3003

**Использование HMR:**
```bash
# Через nginx proxy (может иметь ограничения)
open http://localhost

# Direct access для полной HMR функциональности
open http://localhost:3003
```

### 4.2 Проверка логов

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
# Backend API через nginx proxy
curl http://localhost/api/health

# Backend API direct
curl http://localhost:4003/api/health

# Frontend через nginx proxy
curl http://localhost

# Frontend direct
curl http://localhost:3003

# Database
psql -h localhost -p 5435 -U loyacrm loyacrm -c "SELECT version();"
```

### 5.2 Функциональное тестирование

Откройте в браузере:
- **Через nginx proxy:** `http://localhost` (рекомендуется для production-like experience)
- **Direct access:** `http://localhost:3003` (для полной HMR функциональности)

Убедитесь что:
- ✅ Приложение загружается
- ✅ API запросы работают (login, deals, etc.)
- ✅ База данных доступна и содержит seeded data
- ✅ Hot reload работает (при изменениях в коде)
- ✅ Текущая версия (PM2) все еще работает на портах 3000/4000

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
docker compose ps postgres
docker compose logs postgres
```

### Приложение не отвечает
```bash
docker compose logs backend
docker compose logs frontend
docker compose logs nginx
docker network inspect loyacarecrm_loyacrm-dev-network
```

### Проблемы с Hot Module Replacement (HMR)

**Симптомы:**
- WebSocket connection failed errors в консоли браузера
- Изменения в коде не отражаются автоматически
- 404 ошибки на `/_next/webpack-hmr`

**Решения:**

1. **Используйте direct access для полной HMR:**
   ```bash
   open http://localhost:3003
   ```

2. **Проверьте nginx конфигурацию:**
   - Убедитесь что `nginx.conf` содержит WebSocket proxy для `/_next/webpack-hmr`
   - Проверьте логи nginx: `docker compose logs nginx`

3. **Turbopack compatibility:**
   - Next.js может использовать Turbopack, который имеет ограниченную поддержку WebSocket proxy
   - Для надежной HMR используйте direct access к порту 3003

4. **Проверьте frontend логи:**
   ```bash
   docker compose logs frontend
   ```

### Database Seeding проблемы

**Seeding не выполняется:**
```bash
# Проверьте логи backend
docker compose logs backend

# Выполните seeding вручную
docker compose exec backend sh -c "cd db && pnpm run seed"
```

**Пользователи не созданы:**
```bash
# Подключитесь к БД
psql -h localhost -p 5435 -U loyacrm loyacrm

# Проверьте пользователей
SELECT * FROM "User";
```

### Health Check failures

**Сервис не проходит health check:**
```bash
# Проверьте статус
docker compose ps

# Детальные логи
docker compose logs [service-name]
```

**Database health check fails:**
- Убедитесь что PostgreSQL полностью запущен
- Проверьте credentials в docker-compose.dev.yml

### Port conflicts

**Port already in use:**
```bash
# Найдите процесс использующий порт
lsof -i :3003
lsof -i :4003
lsof -i :5435
lsof -i :80

# Остановите конфликтующий сервис или измените порты
```

## 📋 Контрольный список перехода

- [ ] Docker и Docker Compose установлены
- [ ] Переменные окружения настроены в `.env.dev`
- [ ] Docker сервисы собраны и запущены (`./docker-dev-start.sh`)
- [ ] Приложение доступно на портах 80 (nginx) и 3003 (direct)
- [ ] API доступен на портах 80/api (nginx) и 4003 (direct)
- [ ] База данных доступна на порту 5435 с seeded данными
- [ ] Health checks проходят для всех сервисов
- [ ] Hot Module Replacement работает (через direct access localhost:3003)
- [ ] Nginx reverse proxy корректно проксирует WebSocket для HMR
- [ ] Функциональное тестирование пройдено (login, deals, etc.)
- [ ] Текущая версия (PM2) все еще работает на портах 3000/4000
- [ ] **После тестирования:** Переход на Docker завершен

## 🎯 Преимущества Docker развертывания

- **Изоляция:** Каждый компонент в отдельном контейнере
- **Масштабируемость:** Легко масштабировать сервисы
- **Воспроизводимость:** Консистентная среда на всех серверах
- **Управление:** Упрощенное управление зависимостями
- **Откат:** Быстрый откат к предыдущей версии
- **Development Experience:** Hot reload, health checks, automatic seeding
- **Production Ready:** Nginx proxy, named volumes, health monitoring
- **WebSocket Support:** HMR через proxy с fallback на direct access

---

**Автор:** Sergey Daub
**Дата:** 25 ноября 2025
**Версия:** 2.1 - Updated with nginx proxy, health checks, volumes, seeding, and HMR support