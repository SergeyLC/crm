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
# Stage 2: Production - minimal runtime image  
# ============================================================
FROM node:24-alpine AS production

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/dist ./dist

# Copy Prisma schema
COPY ../db/prisma/schema.prisma ./prisma/schema.prisma

# Install pnpm for production dependencies
RUN npm install -g pnpm prisma

# Install only production dependencies (no devDeps)
RUN pnpm install --prod --ignore-scripts

# Generate Prisma client (needs to be regenerated for Alpine)
RUN prisma generate --schema ./prisma/schema.prisma

# Expose ports
EXPOSE 4002 4003 4004

# Start command
CMD ["sh", "-c", "PORT=${PORT:-4002} node dist/server.js"]

# Start command - running directly from deployed bundle
CMD ["sh", "-c", "PORT=${PORT:-4002} node dist/server.js"]