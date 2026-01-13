# Deployment Session Summary - 13 Jan 2026

## Проблема: Неправильная версия на сайте

### Исходная ситуация
- GitHub Actions успешно деплоил приложение
- Production сайт работал на http://217.154.173.36
- Проблема: на сайте отображалась версия **0.1.42** вместо актуальной **0.1.43**

### Корневая причина
Next.js встраивает переменные окружения `NEXT_PUBLIC_*` **во время сборки** (build time), а не во время выполнения (runtime). Переменная `NEXT_PUBLIC_APP_VERSION` должна передаваться как **build argument** в Docker, но это не было настроено.

## Исправления

### 1. Передача версии в Docker build

**Файл:** `.github/actions/docker-deploy/action.yml`

Добавлен `NEXT_PUBLIC_APP_VERSION` в build args для frontend:

```yaml
- name: Build and push frontend Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./docker/frontend/Dockerfile
    push: true
    tags: ${{ steps.meta-frontend.outputs.tags }}
    labels: ${{ steps.meta-frontend.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      BUILD_VERSION=${{ steps.version.outputs.BUILD_VERSION }}
      NEXT_PUBLIC_APP_VERSION=${{ steps.version.outputs.BUILD_VERSION }}  # ← Добавлено
```

### 2. Обработка ARG в Dockerfile

**Файл:** `docker/frontend/Dockerfile`

Добавлены ARG и ENV для передачи версии в Next.js build:

```dockerfile
# Генерируйте Prisma клиент для frontend
RUN cd db && pnpm run generate

# Build args для Next.js
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# Соберите Next.js приложение
RUN cd frontend && pnpm run build
```

### 3. DATABASE_URL на Production

**Проблема:** В production `.env` была явно указана `DATABASE_URL`, что усложняло поддержку.

**Решение:** Удалили явную `DATABASE_URL` из `.env`. Теперь она автоматически формируется в `docker-compose.yml`:

```yaml
backend:
  environment:
    - DATABASE_URL=postgresql://${POSTGRES_USER:-loyacrm}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-loyacrm}
```

Переменные берутся из `.env`:
```env
POSTGRES_DB=loyacrm
POSTGRES_USER=loyacrm
POSTGRES_PASSWORD=loyacrm2024secure
```

## История проблем и их решения

### Проблемы с GitHub Actions (решены ранее)

1. **Composite actions не могут использовать `secrets.*` контекст**
   - Решение: Передавать secrets как inputs в composite actions

2. **Missing GHCR permissions**
   - Решение: Добавить `permissions: packages: write` в workflow

3. **Lowercase repository names в Docker**
   - Решение: `REPO_LOWER=$(echo "${{ github.repository }}" | tr '[:upper:]' '[:lower:]')`

4. **Идентичные Docker images для frontend и backend**
   - Корневая причина: `metadata-action` генерировал одинаковые tags для обоих образов
   - Решение: Разделить metadata на `meta-frontend` и `meta-backend`

5. **Frontend container restarting на production**
   - Причина: Отсутствовала `DATABASE_URL` (требуется для Prisma в Next.js)
   - Решение: Автоматическое формирование через docker-compose

## Текущее состояние систем

### Production (http://217.154.173.36)
- ✅ Все контейнеры healthy
- ✅ DATABASE_URL формируется автоматически
- ✅ Сайт работает корректно
- ⏳ После деплоя v0.1.45 будет показывать правильную версию

### Staging (http://217.154.173.36:8080)
- ✅ Все контейнеры healthy
- ✅ DATABASE_URL формируется автоматически (всегда работало)
- ✅ Сайт работает корректно
- ℹ️ Иногда требуется `docker compose restart nginx` после изменения IP контейнеров

### Контейнеры

**Production:**
```
loyacrm-frontend     Up (healthy)
loyacrm-backend      Up (healthy)
loyacrm-postgres     Up (healthy)
loyacrm-nginx        Up
```

**Staging:**
```
loyacrm-staging-frontend   Up (healthy)
loyacrm-staging-backend    Up (healthy)
loyacrm-staging-postgres   Up (healthy)
loyacrm-staging-nginx      Up
```

## Deployment Process

### Создание релиза

Используйте скрипт `deploy.sh`:

```bash
# Автоматический инкремент patch версии
./deploy.sh -m "fix: description" -t

# Или указать версию явно
./deploy.sh -m "feat: new feature" -v 1.4.2
```

Скрипт автоматически:
1. Создаёт коммит с правильным сообщением
2. Создаёт git tag (например, `v0.1.45`)
3. Пушит в GitHub
4. GitHub Actions запускается и:
   - Обновляет `frontend/package.json` до новой версии
   - Создаёт GitHub Release
   - Собирает Docker образы **с правильной версией**
   - Деплоит на production

### После завершения деплоя

**Обязательно** синхронизировать локальный репозиторий:

```bash
git pull --rebase
```

Это обновит `package.json` с версией, которую GitHub Actions изменил.

## Важные файлы конфигурации

### GitHub Actions
- `.github/workflows/deploy.yml` - главный workflow
- `.github/actions/docker-deploy/action.yml` - сборка и деплой Docker
- `.github/actions/create-release/action.yml` - создание релиза
- `.github/actions/setup-deployment/action.yml` - определение окружения

### Docker
- `docker-compose.yml` - production
- `docker-compose.stage.yml` - staging
- `docker/frontend/Dockerfile` - frontend образ (dev)
- `docker/frontend/Dockerfile.prod` - frontend образ (production, не используется)
- `docker/backend/Dockerfile` - backend образ

### Environment
- `/var/www/loyacrm-production/.env` - production на сервере
- `/var/www/loyacrm-staging/.env.stage` - staging на сервере

## Lessons Learned

### Next.js Environment Variables

**Build-time vs Runtime:**
- `NEXT_PUBLIC_*` переменные встраиваются в код во время `next build`
- Изменение `.env` после сборки **не влияет** на эти переменные
- Нужно передавать как `ARG` в Dockerfile и пересобирать образ

### Docker Compose Environment Variables

**Автоформирование vs Явное указание:**
- ✅ **Лучше:** Формировать `DATABASE_URL` из `POSTGRES_*` переменных в compose
- ❌ **Хуже:** Дублировать значение в `.env` файле явно

Преимущества автоформирования:
- Единый источник правды (POSTGRES_* переменные)
- Меньше дублирования
- Проще поддержка

### Docker Metadata Action

**Проблема с множественными образами:**
```yaml
# ❌ Неправильно - генерирует одинаковые tags
- name: Extract metadata
  uses: docker/metadata-action@v5
  with:
    images: |
      ghcr.io/owner/frontend
      ghcr.io/owner/backend
```

```yaml
# ✅ Правильно - отдельные шаги
- name: Extract metadata for frontend
  id: meta-frontend
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/owner/frontend

- name: Extract metadata for backend
  id: meta-backend
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/owner/backend
```

### Nginx в Docker

**DNS кеширование:**
- Nginx может кешировать IP адреса upstream сервисов
- При перезапуске контейнеров IP могут измениться
- Решение: `docker compose restart nginx` или использовать resolver в nginx.conf

## Следующие шаги (опционально)

### Оптимизации

1. **Использовать resolver в nginx.conf**
   ```nginx
   resolver 127.0.0.11 valid=10s;
   set $backend_upstream http://backend:4000;
   proxy_pass $backend_upstream;
   ```

2. **Добавить healthcheck для nginx**
   ```yaml
   nginx:
     healthcheck:
       test: ["CMD", "curl", "-f", "http://localhost/api/health"]
   ```

3. **Автоматизировать обновление NEXT_PUBLIC_APP_VERSION**
   - Текущая ситуация: нужно обновлять `package.json` вручную или через GitHub Actions
   - Возможное улучшение: Извлекать версию из git tag автоматически

### Мониторинг

1. **Логирование версий**
   - Добавить endpoint `/api/version` который возвращает версию backend
   - Сравнивать с `NEXT_PUBLIC_APP_VERSION` на frontend

2. **Alerting**
   - Уведомления при падении контейнеров
   - Мониторинг использования ресурсов

## Полезные команды

### Проверка состояния

```bash
# Статус всех контейнеров
ssh root@217.154.173.36 "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Версия в production
ssh root@217.154.173.36 "docker exec loyacrm-frontend env | grep NEXT_PUBLIC_APP_VERSION"

# Версия образа
ssh root@217.154.173.36 "docker images | grep ghcr.io/sergeylc/crm/frontend"

# Логи контейнера
ssh root@217.154.173.36 "docker logs loyacrm-frontend --tail 50"
```

### Deployment

```bash
# Создать релиз (автоинкремент)
./deploy.sh -m "fix: description" -t

# Пуш без деплоя (для документации)
./deploy.sh -m "docs: update" -s

# После деплоя - синхронизация
git pull --rebase
```

### Troubleshooting

```bash
# Перезапустить контейнеры
ssh root@217.154.173.36 "cd /var/www/loyacrm-production && docker compose restart"

# Пересоздать контейнер с новым .env
ssh root@217.154.173.36 "cd /var/www/loyacrm-production && docker compose up -d --force-recreate frontend"

# Проверить переменные окружения
ssh root@217.154.173.36 "cd /var/www/loyacrm-production && cat .env"
```

## Контакты и ссылки

- **Production:** http://217.154.173.36
- **Staging:** http://217.154.173.36:8080
- **GitHub Repo:** https://github.com/SergeyLC/crm
- **GHCR:** ghcr.io/sergeylc/crm/frontend, ghcr.io/sergeylc/crm/backend

## Заключение

Все основные проблемы с деплоем и отображением версии решены:
1. ✅ GitHub Actions корректно собирает образы с версией
2. ✅ Production и Staging работают стабильно
3. ✅ DATABASE_URL формируется автоматически
4. ✅ Версия передаётся в Docker build и встраивается в Next.js

После завершения деплоя v0.1.45 на сайте будет отображаться правильная версия приложения.
