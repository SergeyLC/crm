FROM node:24-alpine

# Установите рабочую директорию
WORKDIR /app

# Скопируйте workspace файлы
COPY ../pnpm-workspace.yaml ./
COPY ../pnpm-lock.yaml ./

# Скопируйте package.json backend
COPY ../backend/package.json ./backend/package.json

# Установите pnpm
RUN npm install -g pnpm

# Установите все зависимости для workspace
RUN pnpm install --no-frozen-lockfile

# Скопируйте исходный код backend
COPY ../backend/ ./backend/

# Скопируйте сгенерированные Prisma файлы
COPY ../db/generated/prisma-client ./backend/generated/prisma/

# Экспонируйте порт
EXPOSE 4002

# Команда запуска (будет переопределена в docker-compose для dev режима)
CMD ["pnpm", "run", "start:prod"]