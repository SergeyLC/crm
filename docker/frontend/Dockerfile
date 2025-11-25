FROM node:24-alpine

# Установите рабочую директорию
WORKDIR /app

# Скопируйте workspace файлы
COPY ../pnpm-workspace.yaml ./
COPY ../pnpm-lock.yaml ./

# Скопируйте package.json frontend
COPY ../frontend/package.json ./frontend/package.json

# Установите pnpm
RUN npm install -g pnpm

# Установите все зависимости для workspace
RUN pnpm install --no-frozen-lockfile

# Скопируйте исходный код frontend
COPY ../frontend/ ./frontend/

# Экспонируйте порт
EXPOSE 3002

# Команда запуска (будет переопределена в docker-compose для dev режима)
CMD ["pnpm", "run", "start"]