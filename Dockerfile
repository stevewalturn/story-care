# StoryCare - Production Dockerfile for Google Cloud Run
# Multi-stage build optimized for Next.js 16 with App Router

# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:20-alpine AS deps

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with clean install for reproducible builds
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ========================================
# Stage 2: Builder
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build argument for entire .env file content
# This allows passing all env vars at once from GitHub Actions
ARG ENV_FILE

# Write ENV_FILE to a clean .env file and run build
RUN if [ -n "$ENV_FILE" ]; then \
      echo "$ENV_FILE" | grep -v '^#' | grep -v '^$' | grep '=' > /app/.env.build || true; \
    fi && \
    if [ -f /app/.env.build ]; then \
      export $(cat /app/.env.build | xargs) && \
      npm run db:migrate && \
      npm run build:next; \
    else \
      npm run db:migrate && \
      npm run build:next; \
    fi

# ========================================
# Stage 3: Production Runtime
# ========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy migrations for runtime migration checks (if needed)
COPY --from=builder /app/migrations ./migrations

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose Cloud Run port
EXPOSE 8080

# Health check (Cloud Run will use /api/health endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js server
CMD ["node", "server.js"]
