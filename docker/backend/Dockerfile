FROM node:24-alpine

# Установите рабочую директорию
WORKDIR /app

# Скопируйте package.json и pnpm-lock.yaml
COPY ../backend/package*.json ./
COPY ../pnpm-lock.yaml ./

# Установите pnpm
RUN npm install -g pnpm

# Установите зависимости
RUN pnpm install --frozen-lockfile

# Скопируйте исходный код backend
COPY ../backend/ .

# Скопируйте сгенерированные Prisma файлы
COPY ../db/generated/prisma-client ./generated/prisma/

# Соберите приложение
RUN pnpm run build

# Экспонируйте порт
EXPOSE 4002

# Команда запуска
CMD ["pnpm", "run", "start:prod"]