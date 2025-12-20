# Решение проблемы: Deploy with Docker - skipped

## Проблема
После push на GitHub этап "Deploy with Docker" пропускается (skipped), хотя этап "Setup Deployment Configuration" проходит успешно.

## Причина
Этап деплоя пропускается, если не выполняется одно из условий:
- `needs.setup.outputs.should_deploy == 'true'`
- `needs.setup.outputs.deployment_type == 'docker'`

**Возможные причины:**

1. **В репозитории GitHub не установлена переменная `DEPLOYMENT_TYPE`** или она имеет неправильное значение
2. **Не настроены Environment secrets** - секреты должны быть на уровне environment (staging/production), а не на уровне репозитория
3. **Environment не существует** - убедитесь, что в Settings → Environments созданы окружения `staging` и `production`

## Решение

### Шаг 1: Создать Environments (ОБЯЗАТЕЛЬНО)

GitHub Actions требует, чтобы окружения были созданы для доступа к environment secrets.

1. Перейдите в репозиторий на GitHub
2. **Settings → Environments**
3. Создайте два окружения:
   - **staging** (для автоматических деплоев из main/develop)
   - **production** (для релизов с тегами)

### Шаг 2: Настроить Environment Secrets

Для каждого окружения (staging и production) добавьте следующие секреты:

**Settings → Environments → [staging/production] → Add Secret**

Обязательные секреты для каждого окружения:
- `POSTGRES_DB` - имя базы данных (например: `loyacrm_staging` или `loyacrm`)
- `POSTGRES_USER` - пользователь БД (например: `loyacrm`)
- `POSTGRES_PASSWORD` - пароль БД (сгенерируйте: `openssl rand -base64 32`)
- `JWT_SECRET` - JWT секрет (сгенерируйте: `openssl rand -base64 64`)

### Шаг 3: Настроить Repository Secrets

Эти секреты общие для всех окружений:

**Settings → Secrets and variables → Actions → Secrets → New repository secret**

- `SERVER_HOST` - IP или домен сервера (например: `217.160.74.128`)
- `SERVER_USER` - SSH пользователь (например: `root`)
- `SERVER_SSH_KEY` - SSH приватный ключ (полностью, включая BEGIN/END)

### Шаг 4: Установить переменную репозитория (опционально)

1. **Settings → Secrets and variables → Actions → Variables**
2. **New repository variable**:
   - **Name**: `DEPLOYMENT_TYPE`
   - **Value**: `docker`

### Вариант 2: Использовать manual workflow dispatch

Если переменная репозитория не установлена, можно запустить деплой вручную:

1. Перейдите в **Actions** в репозитории
2. Выберите workflow **Deploy Application**
3. Нажмите **Run workflow**
4. В поле `deployment_type` введите: `docker`
5. Нажмите **Run workflow**

## Быстрая проверка настроек

### 1. Проверить наличие Environments

```bash
# Вручную:
# Settings → Environments
# Должны быть: staging, production
```

### 2. Проверить environment secrets

**Для staging:**
```bash
# Settings → Environments → staging → Secrets
# Должны быть: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, JWT_SECRET
```

**Для production:**
```bash
# Settings → Environments → production → Secrets  
# Должны быть: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, JWT_SECRET
```

### 3. Проверить repository secrets

```bash
# Settings → Secrets and variables → Actions → Secrets
# Должны быть: SERVER_HOST, SERVER_USER, SERVER_SSH_KEY
```

### Вариант 3: Проверить логи GitHub Actions

После добавления отладочных сообщений проверьте логи этапа "Setup Deployment Configuration":

```
🔍 Debug: GitHub Ref: refs/heads/main
🔍 Debug: deployment_type_override input: ''
🔍 Debug: deployment_type_default input: 'docker'
...
🔍 Debug outputs:
  - environment: staging
  - deployment_type: docker
  - image_tag: staging-abc1234-20241220-120000
  - should_deploy: true
  - is_release: false
```

Убедитесь, что:
- `deployment_type` = `docker`
- `should_deploy` = `true`
- `image_tag` не пустой

## Типичные ошибки

### ❌ Job "Deploy with Docker" skipped

**Причина:** Не созданы окружения (environments) или отсутствуют environment secrets

**Решение:** 
1. Создайте окружения `staging` и `production` в Settings → Environments
2. Добавьте секреты в каждое окружение (см. Шаг 2 выше)
3. Убедитесь, что repository secrets настроены (SERVER_HOST, SERVER_USER, SERVER_SSH_KEY)

### ❌ Error: "Environment 'staging' does not exist"

**Причина:** Окружение не создано в настройках репозитория

**Решение:** Settings → Environments → New environment → staging

### ❌ Secrets не найдены при деплое

**Причина:** Секреты добавлены на уровне репозитория вместо уровня environment

**Решение:** Переместите секреты POSTGRES_*, JWT_SECRET в environment secrets (Settings → Environments → staging/production → Secrets)

## Проверка текущих настроек

### Структура секретов (правильная):

```
Repository Level:
├── Variables
│   └── DEPLOYMENT_TYPE = "docker"
└── Secrets
    ├── SERVER_HOST
    ├── SERVER_USER
    └── SERVER_SSH_KEY

Environment Level (staging):
└── Secrets
    ├── POSTGRES_DB
    ├── POSTGRES_USER
    ├── POSTGRES_PASSWORD
    └── JWT_SECRET

Environment Level (production):
└── Secrets
    ├── POSTGRES_DB
    ├── POSTGRES_USER
    ├── POSTGRES_PASSWORD
    └── JWT_SECRET
```

## Дополнительная информация

### Приоритет настройки deployment_type:
1. 🥇 Manual override (workflow_dispatch input) - наивысший приоритет
2. 🥈 Repository variable `DEPLOYMENT_TYPE`
3. 🥉 Default: `docker` - наименьший приоритет

### Условия для деплоя:

**Staging deployment:**
- Push в ветку `main` или `develop`
- `DEPLOYMENT_TYPE` = `docker` (или не установлен)
- Все тесты прошли успешно

**Production deployment:**
- Push git tag вида `v*` (например, `v1.4.2`)
- `DEPLOYMENT_TYPE` = `docker` (или не установлен)
- Все тесты прошли успешно
- Релиз создан (автоматически)

## См. также

- [CI/CD Setup Guide](.github/CI_CD_SETUP.md) - полная инструкция по настройке
- [Deployment Config](DEPLOYMENT_CONFIG.md) - конфигурация деплоя
- [GitHub Actions Docs](https://docs.github.com/en/actions)
