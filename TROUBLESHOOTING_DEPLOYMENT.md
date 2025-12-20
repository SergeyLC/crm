# Решение проблемы: Deploy with Docker - skipped

## Проблема
После push на GitHub этап "Deploy with Docker" пропускается (skipped), хотя этап "Setup Deployment Configuration" проходит успешно.

## Причина
Этап деплоя пропускается, если не выполняется одно из условий:
- `needs.setup.outputs.should_deploy == 'true'`
- `needs.setup.outputs.deployment_type == 'docker'`

Наиболее вероятная причина - в репозитории GitHub не установлена переменная `DEPLOYMENT_TYPE` или она имеет неправильное значение.

## Решение

### Вариант 1: Установить переменную репозитория (рекомендуется)

1. Перейдите в репозиторий на GitHub
2. **Settings → Secrets and variables → Actions → Variables**
3. Нажмите **New repository variable**
4. Создайте переменную:
   - **Name**: `DEPLOYMENT_TYPE`
   - **Value**: `docker`
   - **Description** (optional): Default deployment type for all pushes

### Вариант 2: Использовать manual workflow dispatch

Если переменная репозитория не установлена, можно запустить деплой вручную:

1. Перейдите в **Actions** в репозитории
2. Выберите workflow **Deploy Application**
3. Нажмите **Run workflow**
4. В поле `deployment_type` введите: `docker`
5. Нажмите **Run workflow**

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

## Проверка текущих настроек

### Проверить переменные репозитория:
```bash
# Через GitHub CLI
gh variable list

# Или вручную:
# Settings → Secrets and variables → Actions → Variables
```

### Проверить secrets репозитория:
```bash
# Через GitHub CLI
gh secret list

# Должны быть установлены:
# - SERVER_HOST
# - SERVER_USER
# - SERVER_SSH_KEY
```

### Проверить environment secrets:

**Production environment:**
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`

**Staging environment:**
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`

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
