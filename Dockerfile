# Multi-stage build for ultra-lightweight Raspberry Pi container
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build frontend
COPY . .
RUN npm run build

# -------------------------------------------------------------
# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install tini for clean signal handling in Alpine
RUN apk add --no-cache tini

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built frontend assets and backend server files
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY data ./data

# Ensure data directory exists with write permissions
RUN mkdir -p /app/data

# Expose server port
EXPOSE 3000

# Healthcheck to verify scraper and server are up
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/system/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/index.js"]
