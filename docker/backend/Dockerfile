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

# ============================================================
# Stage 2: Production - only runtime dependencies
# ============================================================
FROM node:24-alpine

WORKDIR /app

# Copy workspace files
COPY ../pnpm-workspace.yaml ./
COPY ../pnpm-lock.yaml ./

# Copy package.json for backend and db
COPY ../backend/package.json ./backend/package.json
COPY ../db/package.json ./db/package.json

# Copy db prisma files (needed for Prisma client)
COPY ../db/prisma/ ./db/prisma/

# Install pnpm and prisma globally
RUN npm install -g pnpm prisma

# Install ONLY production dependencies
RUN pnpm install --prod --no-frozen-lockfile

# Copy built backend from builder stage
COPY --from=builder /app/backend/dist ./backend/dist

# Copy generated Prisma client from builder stage
COPY --from=builder /app/backend/generated ./backend/generated

# Generate Prisma client in production (needed for runtime)
RUN cd backend && prisma generate --schema ../db/prisma/schema.prisma

# Expose ports
EXPOSE 4002 4003 4004

# Start command
CMD ["sh", "-c", "cd backend && PORT=${PORT:-4002} node dist/server.js"]