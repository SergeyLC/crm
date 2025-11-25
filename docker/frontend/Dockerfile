FROM node:24-alpine

# Установите рабочую директорию
WORKDIR /app

# Скопируйте workspace файлы
COPY ../pnpm-workspace.yaml ./
COPY ../pnpm-lock.yaml ./

# Скопируйте package.json frontend
COPY ../frontend/package.json ./frontend/package.json

# Скопируйте db файлы для генерации Prisma клиента
COPY ../db/package.json ./db/package.json
COPY ../db/prisma/ ./db/prisma/

# Установите pnpm глобально
RUN npm install -g pnpm prisma

# Установите все зависимости для workspace (включая devDependencies для генерации Prisma клиента)
RUN pnpm install --no-frozen-lockfile

# Скопируйте исходный код frontend
COPY ../frontend/ ./frontend/

# Скопируйте db исходный код
COPY ../db/ ./db/

# Генерируйте Prisma клиент для frontend
RUN cd db && pnpm run generate

# Соберите Next.js приложение
RUN cd frontend && pnpm run build

# Экспонируйте порт
EXPOSE 3002 3003 3004

# Команда запуска (будет переопределена в docker-compose для dev режима)
CMD ["sh", "-c", "cd frontend && PORT=${PORT:-3002} pnpm run start"]