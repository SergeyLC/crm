# Database Environment Configuration

## Как Prisma находит DATABASE_URL

Prisma CLI команды (`migrate:deploy`, `migrate:reset`, `seed`, `generate`, `studio`) читают `DATABASE_URL` из файла `.env` в директории `db/`.

### Структура проекта

```
db/
  ├── .env.staging.local     ← Staging database URL
  ├── .env.production.local  ← Production database URL
  ├── prisma/
  │   ├── schema.prisma      ← Определяет datasource db { url = env("DATABASE_URL") }
  │   └── seed.ts
  └── package.json
```

### Environment файлы

#### Production: `db/.env.production.local`
```bash
DATABASE_URL="postgresql://loyacare_prod:password@localhost:5432/loya_care_crm_prod"
PRISMA_LOG_LEVEL=warn
```

#### Staging: `db/.env.staging.local`
```bash
DATABASE_URL="postgresql://loyacare_staging:password@localhost:5432/loya_care_crm_staging"
PRISMA_LOG_LEVEL=warn
```

#### Development: `db/.env` (локально)
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/loya_care_crm_dev"
PRISMA_LOG_LEVEL=info
```

### Как это работает

1. **Prisma schema** (`db/prisma/schema.prisma`):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")  ← Читает из переменной окружения
   }
   ```

2. **Prisma CLI** ищет `.env` файлы в директории `db/`:
   - Сначала `.env.{NODE_ENV}.local` (например, `.env.production.local`)
   - Затем `.env.local`
   - Затем `.env`

3. **Команды запускаются из директории `db/`**:
   ```bash
   cd db
   pnpm run migrate:deploy  # Использует DATABASE_URL из db/.env.staging.local
   pnpm run seed            # Использует DATABASE_URL из db/.env.staging.local
   ```

### В GitHub Actions

#### Staging Workflow (`.github/workflows/build-staging.yml`)

```yaml
# Создает .env.staging.local из GitHub Secrets
cat > db/.env.staging.local << 'EOF'
DATABASE_URL=${{ secrets.STAGING_DATABASE_URL }}
PRISMA_LOG_LEVEL=warn
EOF

# Затем запускает миграции и seed
cd db
pnpm run migrate:deploy
pnpm run seed
```

#### Production Workflow (`.github/workflows/deploy.yml`)

```yaml
# Создает .env.production.local из GitHub Secrets
cat > db/.env.production.local << 'EOF'
DATABASE_URL=${{ secrets.DATABASE_URL }}
PRISMA_LOG_LEVEL=warn
EOF

# Затем запускает только миграции (БЕЗ seed!)
cd db
pnpm run migrate:deploy
```

### Backend и Frontend

Backend и Frontend также имеют свои `.env` файлы, но они используются **во время выполнения**:

- `backend/.env.production.local` - для Express сервера (Prisma Client подключается к БД)
- `frontend/.env.production.local` - для Next.js (содержит публичные переменные)

### Важные моменты

1. **Файлы `.env.*.local` НЕ коммитятся в git** (добавлены в `.gitignore`)
2. **Создаются на сервере вручную** при первой настройке
3. **Перезаписываются GitHub Actions** при каждом deploy
4. **Права доступа 600** для безопасности:
   ```bash
   chmod 600 db/.env.staging.local
   chmod 600 db/.env.production.local
   ```

### Проверка

Проверить какую БД использует Prisma:

```bash
cd /var/www/loyacrm-staging/db
cat .env.staging.local | grep DATABASE_URL
```

Протестировать подключение:

```bash
cd /var/www/loyacrm-staging/db
psql "$(grep DATABASE_URL .env.staging.local | cut -d '=' -f2 | tr -d '"')"
```

### Troubleshooting

#### Ошибка: "Environment variable not found: DATABASE_URL"

**Причина:** Файл `.env.staging.local` не существует в директории `db/`

**Решение:**
```bash
cd /var/www/loyacrm-staging/db
ls -la .env.staging.local  # Проверить существование
cat .env.staging.local     # Проверить содержимое
```

#### Ошибка: "Environment variable not found: DATABASE_URL"

**Причина:** Файл `.env.staging.local` не существует в директории `db/` или `seed.ts` не может его загрузить

**Решение:**
```bash
cd /var/www/loyacrm-staging/db

# Проверить существование файла
ls -la .env.staging.local

# Если файла нет - создать его
nano .env.staging.local
# Добавить:
# DATABASE_URL="postgresql://loyacare_staging:password@localhost:5432/loya_care_crm_staging"
# PRISMA_LOG_LEVEL=warn

# Проверить права доступа
chmod 600 .env.staging.local

# Попробовать снова
pnpm run seed
```

#### Ошибка: "Can't reach database server"

**Причина:** Неправильная строка подключения или PostgreSQL не запущен

**Решение:**
```bash
# Проверить PostgreSQL
sudo systemctl status postgresql

# Проверить строку подключения
cd /var/www/loyacrm-staging/db
cat .env.staging.local | grep DATABASE_URL

# Тест подключения напрямую
psql "postgresql://loyacare_staging:password@localhost:5432/loya_care_crm_staging"
```

#### Миграции применяются не к той БД

**Причина:** Неправильный `.env` файл в `db/`

**Решение:**
```bash
cd /var/www/loyacrm-staging/db

# Убедиться что используется правильный файл
ls -la .env*

# Проверить содержимое
cat .env.staging.local
```

### Scripts в package.json

```json
{
  "scripts": {
    "generate": "prisma generate && ...",
    "migrate": "prisma migrate dev",          // Для разработки
    "migrate:deploy": "prisma migrate deploy", // Для staging/production
    "migrate:reset": "prisma migrate reset --force",
    "migrate:status": "prisma migrate status",
    "studio": "prisma studio",                // GUI для БД
    "seed": "tsc && node temp/seed.js"        // Заполнение тестовыми данными
  }
}
```

**Важно:** Скрипт `seed.ts` автоматически загружает `.env` файлы в следующем порядке приоритета:
1. `.env.staging.local`
2. `.env.production.local`
3. `.env.local`
4. `.env`

Первый найденный файл будет использован.

### Когда запускать seed

- ✅ **Staging:** Всегда после `migrate:deploy` (нужны тестовые данные)
- ❌ **Production:** Никогда (реальные данные, не нужны тестовые)
- ✅ **Development:** После первого `migrate:deploy` или `migrate:reset`

### Seed данные

Скрипт `db/prisma/seed.ts` создает:
- Администраторов: `admin@loya.care`, `admin@beispiel.de`, `admin@example.com`
- 10 сотрудников: `v1@loya.care` до `v10@loya.care`
- Пароль для всех: `1`
- Тестовые сделки, контакты, группы и т.д.

Seed использует `upsert`, поэтому повторный запуск не создаст дубликатов.
