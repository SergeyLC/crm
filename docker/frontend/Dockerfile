FROM node:24-alpine

# Установите рабочую директорию
WORKDIR /app

# Скопируйте package.json и pnpm-lock.yaml
COPY ../frontend/package*.json ./
COPY ../pnpm-lock.yaml ./

# Установите pnpm
RUN npm install -g pnpm

# Установите зависимости
RUN pnpm install --frozen-lockfile

# Скопируйте исходный код frontend
COPY ../frontend/ .

# Соберите приложение
RUN pnpm run build

# Экспонируйте порт
EXPOSE 3002

# Команда запуска
CMD ["pnpm", "run", "start"]