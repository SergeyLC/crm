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

# Remove devDependencies after build
RUN cd backend && pnpm prune --prod

# ============================================================
# Stage 2: Production - minimal runtime image
# ============================================================
FROM node:24-alpine

WORKDIR /app

# Copy workspace structure (needed for pnpm workspace resolution)
COPY ../pnpm-workspace.yaml ./
COPY ../backend/package.json ./backend/package.json
COPY ../db/package.json ./db/package.json

# Copy db prisma schema
COPY ../db/prisma/ ./db/prisma/

# Copy pruned node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist

# Copy generated Prisma client
COPY --from=builder /app/backend/generated ./backend/generated

# Install prisma CLI for runtime migrations (optional)
RUN npm install -g prisma

# Expose ports
EXPOSE 4002 4003 4004

# Start command
CMD ["sh", "-c", "cd backend && PORT=${PORT:-4002} node dist/server.js"]

# Start command - running directly from deployed bundle
CMD ["sh", "-c", "PORT=${PORT:-4002} node dist/server.js"]