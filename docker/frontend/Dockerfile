# ==================== Build Stage ====================
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy package.json files
COPY frontend/package.json ./frontend/package.json
COPY db/package.json ./db/package.json

# Skip Cypress binary download in Docker builds (not needed for app runtime)
ENV CYPRESS_INSTALL_BINARY=0
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY db/ ./db/
COPY frontend/ ./frontend/

# Generate Prisma client
RUN cd db && pnpm run generate

# Build args for Next.js
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# Build the Next.js application
RUN cd frontend && pnpm run build

# ==================== Production Stage ====================
FROM node:24-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build (includes all required dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public

# Switch to nextjs user
USER nextjs

# Expose port
EXPOSE 3000

# Start the Next.js standalone server
CMD ["node", "frontend/server.js"]
