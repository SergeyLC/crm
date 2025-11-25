# Быстрый запуск Docker версии для тестирования

## Предварительные требования
- Docker и Docker Compose установлены
- Проект склонирован в /var/www/loyacrm
- **Создан `.env.docker` файл с реальными паролями (скопируйте из `.env.docker.example`)**

## Быстрый старт

1. **Настройте переменные окружения:**
   ```bash
   cd /var/www/loyacrm
   cp .env.docker.example .env.docker
   # Отредактируйте .env.docker с реальными значениями
   nano .env.docker
   ```

2. **Запустите сервисы:**
   ```bash
   docker-compose up -d
   ```

3. **Проверьте статус:**
   ```bash
   docker-compose ps
   ```

4. **Посмотрите логи:**
   ```bash
   docker-compose logs -f
   ```

## Доступ к сервисам

- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:4002
- **Database:** localhost:5434

## Остановка

```bash
docker-compose down
```

## Пересборка (после изменений в коде)

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Управление

Используйте скрипты:
- `./docker-start.sh` - запуск
- `./docker-stop.sh` - остановка
- `./docker-logs.sh` - логи
- `./docker-update.sh` - обновление