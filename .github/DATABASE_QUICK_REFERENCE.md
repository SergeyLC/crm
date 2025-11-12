# Database Configuration - Quick Reference

## Откуда Prisma берет DATABASE_URL?

### Короткий ответ
Из файла `.env.production.local` или `.env.production.local` в директории **`db/`**

**Важно:** Скрипт `seed.ts` был обновлен для автоматической загрузки `.env` файлов.

### Подробно

```
db/
  ├── .env.production.local     ← ОТСЮДА берется DATABASE_URL для staging
  ├── .env.production.local  ← ОТСЮДА берется DATABASE_URL для production
  └── prisma/
      └── schema.prisma      ← Определяет: url = env("DATABASE_URL")
```

### Как это работает

1. Команда запускается из директории `db/`:
   ```bash
   cd /var/www/loyacrm-staging/db
   pnpm run migrate:deploy
   ```

2. Prisma CLI ищет `.env` файлы в **текущей директории** (`db/`):
   - `.env.production.local` (для staging)
   - `.env.production.local` (для production)
   - `.env` (для development)

3. Читает `DATABASE_URL` из найденного файла:
   ```bash
   DATABASE_URL="postgresql://loyacare_staging:password@localhost:5432/loya_care_crm_staging"
   ```

**Примечание:** `seed.ts` теперь автоматически загружает `.env` файлы благодаря `dotenv` пакету, который был добавлен в зависимости.

### В GitHub Actions

**Staging Workflow** создает файл из секретов:
```yaml
cat > db/.env.production.local << 'EOF'
DATABASE_URL=${{ secrets.STAGING_DATABASE_URL }}
PRISMA_LOG_LEVEL=warn
EOF

cd db
pnpm run migrate:deploy  # Использует DATABASE_URL из db/.env.production.local
pnpm run seed            # Использует DATABASE_URL из db/.env.production.local
```

**Production Workflow** создает другой файл:
```yaml
cat > db/.env.production.local << 'EOF'
DATABASE_URL=${{ secrets.DATABASE_URL }}
PRISMA_LOG_LEVEL=warn
EOF

cd db
pnpm run migrate:deploy  # Использует DATABASE_URL из db/.env.production.local
# НЕТ seed для production!
```

---

## Нужно ли применять seed после миграций?

### Короткий ответ

- ✅ **Staging:** ДА, всегда запускать `pnpm run seed`
- ❌ **Production:** НЕТ, никогда не запускать seed

### Подробно

### Staging (тестовое окружение)

**ДА, нужен seed** для создания тестовых данных:

```bash
cd /var/www/loyacrm-staging/db
pnpm run migrate:deploy  # Применить миграции
pnpm run seed            # Заполнить тестовыми данными
```

**Что создает seed.ts:**
- 3 администратора: `admin@loya.care`, `admin@beispiel.de`, `admin@example.com`
- 10 сотрудников: `v1@loya.care` до `v10@loya.care`
- Пароль для всех: `1`
- Тестовые сделки, контакты, группы и т.д.

**Зачем:** Для тестирования приложения нужны пользователи и данные.

### Production (боевое окружение)

**НЕТ, seed НЕ нужен:**

```bash
cd /var/www/loyacrm/db
pnpm run migrate:deploy  # Только миграции
# НЕ запускать seed!
```

**Почему:** В production уже есть реальные данные пользователей.

---

## Workflows Summary

### Tests (на всех ветках)
```
Push в любую ветку → Тесты (type-check, lint, unit tests)
```

### Staging (при push в main)
```
Push в main → Tests + Build + Deploy Staging
  ├── Создать .env с build версией (1.4.2+sha.abc123)
  ├── Применить миграции: pnpm run migrate:deploy
  └── ✅ Заполнить БД: pnpm run seed
```

### Production (при создании тега)
```
Push tag v1.5.0 → Release + Deploy Production
  ├── Обновить package.json → 1.5.0
  ├── Создать GitHub Release
  ├── Создать .env с release версией (1.5.0)
  ├── Применить миграции: pnpm run migrate:deploy
  └── ❌ БЕЗ seed (это production!)
```

---

## Практические команды

### На staging сервере

```bash
# Проверить DATABASE_URL
cd /var/www/loyacrm-staging/db
cat .env.production.local | grep DATABASE_URL

# Если файл не существует - создать его
# (должен был быть создан при настройке, см. STAGING_SETUP.md)
ls -la .env.production.local

# Применить миграции
cd /var/www/loyacrm-staging/db
pnpm run migrate:deploy

# Заполнить тестовыми данными (seed автоматически загрузит .env.production.local)
cd /var/www/loyacrm-staging/db
pnpm run seed

# Сбросить БД и заполнить заново
cd /var/www/loyacrm-staging/db
pnpm run migrate:reset  # Автоматически запустит seed
```

### На production сервере

```bash
# Проверить DATABASE_URL
cd /var/www/loyacrm/db
cat .env.production.local | grep DATABASE_URL

# Применить миграции (БЕЗ seed!)
cd /var/www/loyacrm/db
pnpm run migrate:deploy

# ❌ НИКОГДА не запускать на production:
# pnpm run seed          # НЕ ДЕЛАТЬ!
# pnpm run migrate:reset # НЕ ДЕЛАТЬ!
```

---

## Проверка

### Проверить к какой БД подключается Prisma

```bash
# Staging
cd /var/www/loyacrm-staging/db
echo "DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d'=' -f2)"

# Production
cd /var/www/loyacrm/db
echo "DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d'=' -f2)"
```

### Проверить что seed создал пользователей

```bash
# Staging
psql "postgresql://loyacare_staging:password@localhost:5432/loya_care_crm_staging" \
  -c "SELECT email, role FROM \"User\" LIMIT 5;"

# Должно показать:
# admin@loya.care | ADMIN
# v1@loya.care    | EMPLOYEE
# v2@loya.care    | EMPLOYEE
# ...
```

### Логин в staging

После seed можно войти с тестовыми аккаунтами:

```
Email: admin@loya.care
Password: 1

Email: v1@loya.care
Password: 1
```

---

## Документация

Подробнее см.:
- **DATABASE_ENV_CONFIG.md** - детальная конфигурация БД
- **STAGING_SETUP.md** - настройка staging сервера
- **CI_CD_WORKFLOW.md** - описание CI/CD процесса
