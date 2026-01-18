# 🚀 Быстрая настройка CI/CD

## Проблема: Deploy with Docker - skipped?

Следуйте этим шагам по порядку:

### 1️⃣ Создайте Environments (2 минуты)

```
GitHub Repo → Settings → Environments → New environment
```

Создайте два окружения:
- ✅ **staging**
- ✅ **production**

### 2️⃣ Настройте Environment Secrets (5 минут)

Для **КАЖДОГО** окружения (staging и production):

```
Settings → Environments → [выберите staging] → Add Secret
```

Добавьте 4 секрета:

| Secret Name | Example Value | How to Generate |
|-------------|---------------|-----------------|
| `POSTGRES_DB` | `loyacrm_staging` или `loyacrm` | Придумайте имя БД |
| `POSTGRES_USER` | `loyacrm` | Придумайте username |
| `POSTGRES_PASSWORD` | `x7K9mP2qR...` | `openssl rand -base64 32` |
| `JWT_SECRET` | `L8nQ5tV9w...` | `openssl rand -base64 64` |

Повторите для **production** окружения с другими значениями!

### 3️⃣ Настройте Repository Secrets (3 минуты)

```
Settings → Secrets and variables → Actions → Secrets → New repository secret
```

Добавьте 3 секрета:

| Secret Name | Example | Description |
|-------------|---------|-------------|
| `SERVER_HOST` | `217.160.74.128` | IP или домен вашего сервера |
| `SERVER_USER` | `root` | SSH пользователь |
| `SERVER_SSH_KEY` | `-----BEGIN...` | Полный SSH приватный ключ |

**Как получить SSH ключ:**
```bash
cat ~/.ssh/id_rsa  # или другой путь к вашему ключу
# Скопируйте ВСЁ, включая -----BEGIN и -----END строки
```

### 4️⃣ (Опционально) Установите Repository Variable

```
Settings → Secrets and variables → Actions → Variables → New repository variable
```

- **Name**: `DEPLOYMENT_TYPE`
- **Value**: `docker`

## ✅ Готово!

Теперь при push в `main` автоматически запустится деплой на staging (кроме release коммитов с `[skip ci]`).

### Как проверить

1. Сделайте коммит и push в main:
   ```bash
   git push origin main
   ```

2. Откройте Actions и проверьте логи:
   ```
   Actions → Deploy Application → Setup Deployment Configuration
   ```

3. Должны увидеть:
   ```
   ✅ deployment_type: docker
   ✅ should_deploy: true
   ✅ environment: staging
   ```

4. Job "Deploy with Docker" должен запуститься (не skipped)

## ❌ Всё ещё не работает?

См. подробное руководство: [TROUBLESHOOTING_DEPLOYMENT.md](../TROUBLESHOOTING_DEPLOYMENT.md)

## 📚 Дополнительная документация

- [Полная инструкция CI/CD](CI_CD_SETUP.md)
- [Конфигурация деплоя](../DEPLOYMENT_CONFIG.md)
