# ============================================================
# Stage 1: Builder - install dependencies and build
# ============================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY ../pnpm-workspace.yaml ./
COPY ../pnpm-lock.yaml ./

# Copy package.json for backend and db
COPY ../backend/package.json ./backend/package.json
COPY ../db/package.json ./db/package.json

# Copy db prisma files for client generation
COPY ../db/prisma/ ./db/prisma/

# Install pnpm and prisma globally
RUN npm install -g pnpm prisma

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --no-frozen-lockfile

# Copy backend source code
COPY ../backend/ ./backend/

# Copy db source code
COPY ../db/ ./db/

# Generate Prisma client in backend
RUN cd backend && prisma generate --schema ../db/prisma/schema.prisma

# Build TypeScript code
RUN cd backend && pnpm run build

# Use pnpm deploy to create isolated production bundle
# This extracts only production dependencies into /app/deploy
RUN pnpm deploy --filter=loya-crm-backend --prod /app/deploy

# Copy built files and generated Prisma client to deploy folder
RUN cp -r /app/backend/dist /app/deploy/dist && \
    cp -r /app/backend/generated /app/deploy/generated 2>/dev/null || true

# ============================================================
# Stage 2: Production - minimal runtime image
# ============================================================
FROM node:24-alpine

# Install only what's needed for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy the deployed bundle (includes only production node_modules)
COPY --from=builder /app/deploy ./

# Copy Prisma schema for runtime
COPY ../db/prisma/schema.prisma ./prisma/schema.prisma

# Regenerate Prisma client for Alpine (different binary)
RUN npx prisma generate --schema ./prisma/schema.prisma

# Expose ports
EXPOSE 4002 4003 4004

# Start command - running directly from deployed bundle
CMD ["sh", "-c", "PORT=${PORT:-4002} node dist/server.js"]