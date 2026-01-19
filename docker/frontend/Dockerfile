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

# Установим curl для healthcheck
RUN apk add --no-cache curl

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем standalone build (включает все необходимые зависимости)
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public

# Переключаемся на пользователя nextjs
USER nextjs

# Экспонируйте порт
EXPOSE 3000

# Запуск standalone сервера Next.js
CMD ["node", "frontend/server.js"]