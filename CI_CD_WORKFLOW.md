# CI/CD Workflow Documentation

## Обзор

Наша CI/CD инфраструктура разделена на три основных workflow:

1. **Tests** - запуск тестов при каждом push
2. **Build and Deploy Staging** - сборка и деплой на staging при push в main
3. **Production Release** - релиз на production по тегу

## 1. Tests Workflow

**Триггер:** Push в любую ветку (исключая теги)

**Файл:** `.github/workflows/checks.yml`

**Шаги:**
- Установка зависимостей
- Генерация Prisma client
- Генерация i18n файлов
- Type checking (TypeScript)
- Lint проверка
- Запуск unit тестов

**Назначение:** Обеспечить качество кода на всех ветках перед merge.

---

## 2. Build and Deploy Staging

**Триггер:** Push в ветку `main` (исключая теги)

**Файл:** `.github/workflows/build-staging.yml`

**Генерация Build Version:**
- Читается стабильная версия из `frontend/package.json` (например, `1.4.2`)
- Добавляется build metadata с хешем коммита: `1.4.2+sha.a3f09e1`
- Build версия записывается в `NEXT_PUBLIC_APP_VERSION` в `.env.production.local`

**Шаги:**
1. Запуск тестов и проверок
2. Генерация build версии
3. Деплой на staging сервер
4. Создание environment файлов с build версией
5. Установка зависимостей
6. Сборка frontend и backend
7. Применение миграций БД
8. **Заполнение БД тестовыми данными** (`pnpm run seed`)
9. Перезапуск PM2 сервисов

**Назначение:** Автоматическая сборка и деплой каждого изменения в main на staging для тестирования.

**Важно:** Staging БД заполняется тестовыми данными через `seed.ts` при каждом деплое. Это создает пользователей (`admin@loya.care`, `v1@loya.care` и т.д.) с паролем `1` для тестирования.

**Секреты (staging):**
- `STAGING_SERVER_HOST`
- `STAGING_SERVER_USER`
- `STAGING_SERVER_SSH_KEY`
- `STAGING_DATABASE_URL`
- `STAGING_JWT_SECRET`
- `STAGING_CORS_ORIGIN`
- `STAGING_NEXT_PUBLIC_API_URL`
- `STAGING_NEXT_PUBLIC_BACKEND_API_URL`

---

## 3. Production Release

**Триггер:** Push тега с префиксом `v*` (например, `v1.4.2`)

**Файл:** `.github/workflows/deploy.yml`

**Release Job:**
1. Проверка, что тег на ветке `main`
2. Извлечение версии из тега (v1.4.2 → 1.4.2)
3. Обновление `frontend/package.json` с новой версией
4. Commit изменений в main
5. Создание GitHub Release

**Deploy Job:**
1. Деплой на production сервер
2. Создание environment файлов с release версией
3. Установка зависимостей
4. Сборка frontend и backend
5. Применение миграций БД (БЕЗ seed - это production!)
6. Перезапуск PM2 сервисов

**Назначение:** Официальный релиз на production с обновлением версии в package.json и созданием GitHub Release.

**Важно:** Production деплой НЕ запускает seed - работает только с реальными данными через миграции.

**Секреты (production):**
- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_SSH_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BACKEND_API_URL`

---

## Версионирование

### Стабильная версия в package.json

`frontend/package.json` содержит **только стабильную release версию**.

- Формат: `X.Y.Z` (например, `1.4.2`)
- Обновляется **только** при создании production релиза через GitHub Actions
- Не изменяется вручную при каждом commit

### Build Metadata (Staging)

При каждом push в `main`:
- Формат: `X.Y.Z+sha.HASH` (например, `1.4.2+sha.a3f09e1`)
- Используется только в CI/CD и staging
- Записывается в `NEXT_PUBLIC_APP_VERSION` в `.env` файлах

### Release Version (Production)

При создании тега:
- Формат: `vX.Y.Z` (например, `v1.4.2`)
- GitHub Actions обновит `package.json` до версии `X.Y.Z`
- Создаст GitHub Release
- Задеплоит на production с этой версией в `NEXT_PUBLIC_APP_VERSION`

---

## Использование deploy.sh

Скрипт `deploy.sh` помогает автоматизировать процесс деплоя:

### Простой push в main (staging)

```bash
./deploy.sh -m "Add new feature"
```

**Результат:**
- Commit с сообщением "Add new feature"
- Push в main
- GitHub Actions запустит tests и staging deploy
- Staging получит версию типа `1.4.2+sha.a3f09e1`

### Создание release (production)

```bash
./deploy.sh -v 1.5.0 -m "Major release with new features"
```

**Результат:**
- Commit с изменениями
- Push в main
- Создание тега `v1.5.0`
- GitHub Actions:
  - Обновит `package.json` до версии `1.5.0`
  - Создаст GitHub Release
  - Задеплоит на production

### Параметры deploy.sh

- `-m "message"` - сообщение для commit
- `-v VERSION` - создать release tag (например, `-v 1.5.0`)
- `--clear` - не включать список коммитов в сообщение

---

## Workflow Diagram

```
┌─────────────────┐
│  Push to any    │
│     branch      │──────► Tests (checks.yml)
└─────────────────┘

┌─────────────────┐
│  Push to main   │
│  (no tag)       │──────► Tests + Build Staging
└─────────────────┘        (build-staging.yml)
                           Version: 1.4.2+sha.abc123

┌─────────────────┐
│  Push tag v*    │
│  (on main)      │──────► Release + Deploy Production
└─────────────────┘        (deploy.yml)
                           1. Update package.json → 1.4.2
                           2. Create GitHub Release
                           3. Deploy to production
```

---

## Настройка GitHub Secrets

### Для Staging

В настройках репозитория добавьте:

```
STAGING_SERVER_HOST=staging.example.com
STAGING_SERVER_USER=deploy
STAGING_SERVER_SSH_KEY=<private-key>
STAGING_DATABASE_URL=postgresql://...
STAGING_JWT_SECRET=...
STAGING_CORS_ORIGIN=https://staging.example.com
STAGING_NEXT_PUBLIC_API_URL=https://staging.example.com/api
STAGING_NEXT_PUBLIC_BACKEND_API_URL=https://staging.example.com:3001
```

### Для Production

```
SERVER_HOST=example.com
SERVER_USER=deploy
SERVER_SSH_KEY=<private-key>
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGIN=https://example.com
NEXT_PUBLIC_API_URL=https://example.com/api
NEXT_PUBLIC_BACKEND_API_URL=https://example.com:3001
```

---

## Best Practices

1. **Не изменяйте версию в package.json вручную** - это делает GitHub Actions при релизе
2. **Используйте семантическое версионирование** (semver): MAJOR.MINOR.PATCH
3. **Тестируйте на staging перед релизом** - каждый push в main автоматически деплоится на staging
4. **Создавайте теги только для production релизов**
5. **Используйте понятные сообщения в тегах** - они будут видны в GitHub Releases

---

## Примеры сценариев

### Сценарий 1: Разработка новой фичи

```bash
# Работаете в feature-ветке
git checkout -b feature/new-dashboard

# Делаете изменения
git add .
git commit -m "Add new dashboard"
git push origin feature/new-dashboard

# ✅ Tests workflow запустится автоматически

# Создаете PR в main
# После merge в main:
# ✅ Tests workflow
# ✅ Build and Deploy Staging (версия 1.4.2+sha.xyz)
```

### Сценарий 2: Hotfix на production

```bash
# Фиксите баг в main
git checkout main
git pull

# Делаете изменения
./deploy.sh -v 1.4.3 -m "Hotfix: critical bug"

# ✅ Tests workflow
# ✅ Build and Deploy Staging
# ✅ Production Release (версия 1.4.3)
```

### Сценарий 3: Регулярный релиз

```bash
# Накопилось несколько фич в main
# Все протестированы на staging

# Создаем релиз
./deploy.sh -v 1.5.0 -m "Release: new features and improvements"

# ✅ Production Release workflow
# ✅ package.json обновлен до 1.5.0
# ✅ GitHub Release создан
# ✅ Production deployment выполнен
```

---

## Troubleshooting

### Проблема: Deploy не запустился

**Проверьте:**
- Тег создан на ветке main?
- Формат тега правильный (v1.2.3)?
- GitHub Secrets настроены?

### Проблема: Версия в package.json не обновилась

**Причина:** Скорее всего, вы обновили package.json вручную перед созданием тега.

**Решение:** Откатите изменения, позвольте GitHub Actions обновить версию автоматически.

### Проблема: Staging показывает старую версию

**Проверьте:**
- Деплой завершился успешно?
- Environment переменная `NEXT_PUBLIC_APP_VERSION` установлена?
- Перезапустились ли PM2 процессы?

---

## Заключение

Этот CI/CD workflow обеспечивает:
- ✅ Автоматическое тестирование на всех ветках
- ✅ Автоматический деплой на staging при каждом изменении в main
- ✅ Контролируемые релизы на production через теги
- ✅ Правильное версионирование без ручного вмешательства
- ✅ Build metadata для отслеживания версий в staging
