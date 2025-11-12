# Исправление ошибки "Environment variable not found: DATABASE_URL"

## Проблема

```
Error during seeding: PrismaClientInitializationError: 
error: Environment variable not found: DATABASE_URL.
```

## Причина

Скрипт `seed.ts` не может найти файл `.env.staging.local` в директории `db/`.

## Решение

### Шаг 1: Проверить наличие файла

```bash
cd /var/www/loyacrm-staging/db
ls -la .env.staging.local
```

**Если файла нет:**

### Шаг 2: Создать .env.staging.local

```bash
cd /var/www/loyacrm-staging/db
nano .env.staging.local
```

Добавить следующее содержимое (замените пароль на ваш):

```bash
DATABASE_URL="postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging"
PRISMA_LOG_LEVEL=warn
```

Сохранить: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 3: Защитить файл

```bash
chmod 600 .env.staging.local
```

### Шаг 4: Проверить подключение к БД

```bash
# Проверить что БД существует
psql -U loyacare_staging -d loya_care_crm_staging -c "SELECT version();"

# Если БД не существует - создать её
sudo -u postgres psql -c "CREATE DATABASE loya_care_crm_staging OWNER loyacare_staging;"
```

### Шаг 5: Установить зависимости (если еще не установлены)

```bash
cd /var/www/loyacrm-staging/db
pnpm install
```

### Шаг 6: Применить миграции

```bash
cd /var/www/loyacrm-staging/db
pnpm run migrate:deploy
```

### Шаг 7: Запустить seed

```bash
cd /var/www/loyacrm-staging/db
pnpm run seed
```

## Ожидаемый успешный вывод

```
✅ Loaded environment from: .env.staging.local
Starting seed.ts...
PrismaClient created
Entering main function...
Testing database connection...
Database connected successfully
Password hashed successfully
Starting seeding process...
Admin users: admin@loya.care
Admin users: admin@beispiel.de
Admin users: admin@example.com
...
✅ Seeding completed successfully
```

## Проверка результата

Проверить что пользователи созданы:

```bash
psql -U loyacare_staging -d loya_care_crm_staging -c 'SELECT email, role FROM "User" LIMIT 5;'
```

Должно показать:

```
       email        |   role   
--------------------+----------
 admin@loya.care    | ADMIN
 admin@beispiel.de  | ADMIN
 admin@example.com  | ADMIN
 v1@loya.care       | EMPLOYEE
 v2@loya.care       | EMPLOYEE
```

## Дополнительная проверка

Попробовать войти в приложение:

```
URL: https://staging.your-domain.com
Email: admin@loya.care
Password: 1
```

## Автоматизация через GitHub Actions

После ручного исправления, убедитесь что GitHub Secrets настроены:

```
STAGING_DATABASE_URL=postgresql://loyacare_staging:staging_password@localhost:5432/loya_care_crm_staging
```

При следующем push в main, GitHub Actions автоматически:
1. Создаст `.env.staging.local` из секретов
2. Применит миграции
3. Запустит seed

## Примечание

**Только для staging!** На production сервере seed НЕ запускается, так как там используются реальные данные пользователей.
