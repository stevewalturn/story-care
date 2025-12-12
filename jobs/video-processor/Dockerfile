# Video Processing Job - Async FFmpeg Scene Assembly for Cloud Run Jobs
# Optimized for long-running video assembly tasks

FROM node:20-alpine

# Install FFmpeg and dependencies
RUN apk add --no-cache \
    ffmpeg \
    bash \
    curl \
    ca-certificates \
    postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (production only)
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy application code
COPY jobs/video-processor ./jobs/video-processor
COPY src/services/VideoService.ts ./src/services/VideoService.ts
COPY src/libs/GCS.ts ./src/libs/GCS.ts
COPY src/libs/Env.ts ./src/libs/Env.ts
COPY src/libs/DB.ts ./src/libs/DB.ts
COPY src/libs/Logger.ts ./src/libs/Logger.ts
COPY src/models/Schema.ts ./src/models/Schema.ts
COPY src/utils ./src/utils

# Create temp directory for FFmpeg operations
RUN mkdir -p /tmp/video-assembly && \
    chmod 777 /tmp/video-assembly

# Accept ENV_FILE build arg and create .env file
ARG ENV_FILE
RUN if [ -n "$ENV_FILE" ]; then \
      echo "$ENV_FILE" > /app/.env; \
    else \
      echo "Warning: ENV_FILE not provided, using runtime environment variables"; \
    fi

# Set environment
ENV NODE_ENV=production \
    TEMP_DIR=/tmp/video-assembly

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app /tmp/video-assembly

USER nodejs

# Execute job (one-time execution, then exit)
CMD ["node", "jobs/video-processor/execute.js"]
