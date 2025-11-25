# Быстрый запуск Docker версии для тестирования

## 🚀 Локальная разработка (Development)

### Предварительные требования
- Docker и Docker Compose установлены
- Проект склонирован локально

### Быстрый старт разработки

```bash
# Запуск всех сервисов с hot-reload
./docker-dev-start.sh

# Или вручную:
docker compose -f docker-compose.dev.yml up -d
```

**Доступ к сервисам:**
- Frontend: http://localhost:3003 (с hot-reload)
- Backend API: http://localhost:4003 (с hot-reload)
- Database: localhost:5435

### Управление разработкой

```bash
# Просмотр логов
./docker-dev-logs.sh

# Остановка
./docker-dev-stop.sh

# Статус
docker compose -f docker-compose.dev.yml ps
```

## 🏭 Production развертывание (Production)

### Предварительные требования
- Docker и Docker Compose установлены
- Проект склонирован в /var/www/loyacrm
- **Создан `.env.docker` файл с реальными паролями (скопируйте из `.env.docker.example`)**

### Быстрый старт

1. **Настройте переменные окружения:**
   ```bash
   cd /var/www/loyacrm
   cp .env.docker.example .env.docker
   # Отредактируйте .env.docker с реальными значениями
   nano .env.docker
   ```

2. **Запустите сервисы:**
   ```bash
   docker compose up -d
   ```

3. **Проверьте статус:**
   ```bash
   docker compose ps
   ```

4. **Посмотрите логи:**
   ```bash
   docker compose logs -f
   ```

## 📊 Доступ к сервисам

### Development (локальная разработка)
- **Frontend:** http://localhost:3003
- **Backend API:** http://localhost:4003
- **Database:** localhost:5435

### Production (сервер)
- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:4002
- **Database:** localhost:5434

## 🛠️ Управление

### Development
```bash
# Запуск
./docker-dev-start.sh

# Логи
./docker-dev-logs.sh

# Остановка
./docker-dev-stop.sh
```

### Production
```bash
# Запуск
./docker-start.sh

# Логи
./docker-logs.sh

# Остановка
./docker-stop.sh

# Обновление
./docker-update.sh
```

## 🔄 Пересборка (после изменений в коде)

### Development
```bash
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

### Production
```bash
docker compose build --no-cache
docker compose up -d
```