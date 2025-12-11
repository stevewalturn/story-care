# Video Processing Service - Async FFmpeg Scene Assembly for Cloud Run
# Optimized for long-running video assembly jobs

FROM node:20-alpine

# Install FFmpeg and dependencies
RUN apk add --no-cache \
    ffmpeg \
    ffprobe \
    bash \
    curl \
    ca-certificates

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

# Set environment
ENV NODE_ENV=production \
    PORT=8080 \
    TEMP_DIR=/tmp/video-assembly

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app /tmp/video-assembly

USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "jobs/video-processor/server.js"]
