# ==================== Build Stage ====================
FROM node:24-alpine AS builder

# Установите рабочую директорию
WORKDIR /app

# Установите pnpm глобально
RUN npm install -g pnpm

# Скопируйте workspace файлы
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Скопируйте package.json файлы
COPY frontend/package.json ./frontend/package.json
COPY db/package.json ./db/package.json

# Установите зависимости
RUN pnpm install --frozen-lockfile

# Скопируйте исходный код
COPY db/ ./db/
COPY frontend/ ./frontend/

# Генерируйте Prisma клиент
RUN cd db && pnpm run generate

# Build args для Next.js
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# Соберите Next.js приложение
RUN cd frontend && pnpm run build

# ==================== Production Stage ====================
FROM node:24-alpine

WORKDIR /app

# Установите pnpm
RUN npm install -g pnpm

# Копируем только необходимые файлы для production
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/frontend/next.config.js ./frontend/next.config.js
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Установите только production зависимости
RUN cd frontend && pnpm install --prod --frozen-lockfile

# Экспонируйте порт
EXPOSE 3000

# Команда запуска
CMD ["sh", "-c", "cd frontend && PORT=${PORT:-3000} pnpm run start"]