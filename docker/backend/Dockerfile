FROM node:24-alpine

# Установите рабочую директорию
WORKDIR /app

# Скопируйте workspace файлы
COPY ../pnpm-workspace.yaml ./
COPY ../pnpm-lock.yaml ./

# Скопируйте package.json backend
COPY ../backend/package.json ./backend/package.json

# Скопируйте db файлы для генерации Prisma клиента
COPY ../db/prisma/ ./db/prisma/

# Установите pnpm и prisma глобально
RUN npm install -g pnpm prisma

# Установите все зависимости для workspace (включая devDependencies для генерации Prisma клиента)
RUN pnpm install --no-frozen-lockfile

# Скопируйте исходный код backend
COPY ../backend/ ./backend/

# Скопируйте db исходный код
COPY ../db/ ./db/

# Генерируйте Prisma клиент в backend
RUN cd backend && prisma generate --schema ../db/prisma/schema.prisma

# Соберите TypeScript код
RUN cd backend && pnpm run build

# Экспонируйте порт
EXPOSE 4002

# Команда запуска (будет переопределена в docker-compose для dev режима)
CMD ["sh", "-c", "cd backend && pnpm run start:prod"]