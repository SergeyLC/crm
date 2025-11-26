# 🚀 LoyaCareCRM Docker Development Guide

*Локальная разработка с Docker: nginx proxy, health checks, volumes, seeding*

## 📋 Обзор

Этот документ описывает настройку локальной среды разработки LoyaCareCRM с использованием Docker. Docker обеспечивает изоляцию, консистентность и удобство разработки с hot-reload, health checks и автоматическим seeding базы данных.

### Архитектура Development Setup

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

### Порты для Development Environment

- **PostgreSQL:** 5435 (с named volume для данных)
- **Backend:** 4003 (direct) / 80/api (nginx proxy)
- **Frontend:** 3003 (direct) / 80 (nginx proxy)
- **Nginx Proxy:** 80 (reverse proxy для frontend и backend)

### Особенности Development Setup

- **Nginx Reverse Proxy:** Объединяет frontend и backend под одним портом 80
- **Health Checks:** Автоматическая проверка готовности сервисов
- **Named Volumes:** Постоянное хранение данных PostgreSQL (`loyacrm_pg_data`)
- **Database Seeding:** Автоматическое заполнение БД тестовыми данными
- **Hot Module Replacement (HMR):** Поддержка WebSocket для live reloading
- **API Health Endpoint:** `/api/health` для проверки backend состояния

## 🛠️ Установка Docker

### На локальной машине выполните:

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

## 📁 Подготовка Development Environment

### 1. Клонирование репозитория

```bash
git clone <your-repository-url> loyacrm
cd loyacrm
```

### 2. Настройка переменных окружения

Создайте `.env.dev` файл на основе шаблона:

```bash
cp .env.dev.example .env.dev
```

Содержимое `.env.dev`:
```bash
# Database
POSTGRES_DB=loyacrm
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=password123

# Backend
DATABASE_URL="postgresql://loyacrm:password123@postgres:5432/loyacrm"
JWT_SECRET="your_dev_jwt_secret_here"
PORT=4003
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_APP_VERSION=dev
```

## 🚀 Запуск Development Environment

### Быстрый старт

```bash
# Запуск всех сервисов
./docker-dev-start.sh

# Или вручную
docker compose -f docker-compose.dev.yml up -d
```

### Проверка статуса

```bash
# Статус контейнеров
docker compose -f docker-compose.dev.yml ps

# Логи
./docker-dev-logs.sh

# Остановка
./docker-dev-stop.sh
```

## ✅ Тестирование Development Setup

### Проверка доступности

```bash
# Backend API через nginx proxy
curl http://localhost/api/health

# Backend API direct
curl http://localhost:4003/api/health

# Frontend через nginx proxy
curl http://localhost

# Frontend direct (для полной HMR)
curl http://localhost:3003

# Database
psql -h localhost -p 5435 -U loyacrm loyacrm -c "SELECT version();"
```

### Функциональное тестирование

Откройте в браузере:
- **Через nginx proxy:** `http://localhost` (рекомендуется для production-like experience)
- **Direct access:** `http://localhost:3003` (для полной HMR функциональности)

Убедитесь что:
- ✅ Приложение загружается
- ✅ API запросы работают (login, deals, etc.)
- ✅ База данных доступна и содержит seeded data
- ✅ Hot reload работает (при изменениях в коде)

## 🗄️ Database Seeding

При первом запуске development environment автоматически выполняется seeding базы данных:

- **Пользователи:** admin@example.com, employee@example.com, lead@example.com
- **Пароли:** password123 (для всех пользователей)
- **Роли:** Admin, Employee, Lead
- **Сделки:** Несколько тестовых сделок для демонстрации

### Ручное reseeding

```bash
# Остановить сервисы
docker compose -f docker-compose.dev.yml down

# Удалить volume для сброса БД
docker volume rm loyacarecrm_loyacrm_pg_data

# Перезапустить
docker compose -f docker-compose.dev.yml up -d
```

## 🔄 Hot Module Replacement (HMR)

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

## 📊 Мониторинг Development Environment

### Health Checks

```bash
# Проверка здоровья всех сервисов
curl http://localhost/api/health

# Статус контейнеров
docker compose -f docker-compose.dev.yml ps

# Использование ресурсов
docker stats
```

### Работа с базой данных

```bash
# Подключение к PostgreSQL
psql -h localhost -p 5435 -U loyacrm loyacrm

# Просмотр таблиц
\dt

# Выполнение команд в контейнере
docker compose -f docker-compose.dev.yml exec postgres psql -U loyacrm -d loyacrm
```

### Логи сервисов

```bash
# Все логи
docker compose -f docker-compose.dev.yml logs -f

# Логи конкретного сервиса
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f nginx
```

## 🔧 Управление Development Environment

### Перезапуск сервисов

```bash
# Перезапуск всех сервисов
docker compose -f docker-compose.dev.yml restart

# Перезапуск конкретного сервиса
docker compose -f docker-compose.dev.yml restart backend

# Rebuild и перезапуск
docker compose -f docker-compose.dev.yml up --build --force-recreate
```

### Очистка

```bash
# Остановка и удаление контейнеров
docker compose -f docker-compose.dev.yml down

# Удаление volumes (сброс БД)
docker compose -f docker-compose.dev.yml down -v

# Очистка неиспользуемых ресурсов
docker system prune -a
```

## 🚨 Troubleshooting

### Контейнеры не запускаются
```bash
docker compose -f docker-compose.dev.yml logs
docker compose -f docker-compose.dev.yml config
```

### База данных недоступна
```bash
docker compose -f docker-compose.dev.yml ps postgres
docker compose -f docker-compose.dev.yml logs postgres
```

### Приложение не отвечает
```bash
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend
docker compose -f docker-compose.dev.yml logs nginx
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
   - Проверьте логи nginx: `docker compose -f docker-compose.dev.yml logs nginx`

3. **Turbopack compatibility:**
   - Next.js может использовать Turbopack, который имеет ограниченную поддержку WebSocket proxy
   - Для надежной HMR используйте direct access к порту 3003

4. **Проверьте frontend логи:**
   ```bash
   docker compose -f docker-compose.dev.yml logs frontend
   ```

### Database Seeding проблемы

**Seeding не выполняется:**
```bash
# Проверьте логи backend
docker compose -f docker-compose.dev.yml logs backend

# Выполните seeding вручную
docker compose -f docker-compose.dev.yml exec backend sh -c "cd db && pnpm run seed"
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
docker compose -f docker-compose.dev.yml ps

# Детальные логи
docker compose -f docker-compose.dev.yml logs [service-name]
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

## 📋 Контрольный список Development Setup

- [ ] Docker и Docker Compose установлены
- [ ] Репозиторий клонирован
- [ ] `.env.dev` настроен с правильными credentials
- [ ] Development сервисы запущены (`./docker-dev-start.sh`)
- [ ] Приложение доступно на портах 80 (nginx) и 3003 (direct)
- [ ] API доступен на портах 80/api (nginx) и 4003 (direct)
- [ ] База данных доступна на порту 5435 с seeded данными
- [ ] Health checks проходят для всех сервисов
- [ ] Hot Module Replacement работает (через direct access localhost:3003)
- [ ] Nginx reverse proxy корректно проксирует WebSocket для HMR

## 🎯 Преимущества Development Setup

- **Быстрая настройка:** Один скрипт запускает всю среду
- **Изоляция:** Каждый компонент в отдельном контейнере
- **Hot Reload:** Мгновенные изменения без перезапуска
- **Seeding:** Автоматическое заполнение тестовыми данными
- **Health Checks:** Автоматический мониторинг состояния
- **Persistent Data:** Named volumes сохраняют данные между запусками
- **WebSocket Support:** HMR через proxy с fallback на direct access

---

**Автор:** Sergey Daub
**Дата:** 26 ноября 2025
**Версия:** 1.0 - Docker development environment setup