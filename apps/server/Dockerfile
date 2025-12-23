# Build stage
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm build

# Build server
WORKDIR /app/apps/server
RUN pnpm build

# Production stage
FROM oven/bun:1.1-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 elysia

# Copy built files
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Set user
USER elysia

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start server
ENV NODE_ENV=production
ENV PORT=8080

CMD ["bun", "run", "dist/index.js"]
