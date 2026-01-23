# STAGE 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies needed for build (python/make for gyp if needed)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
# Install ALL dependencies (including dev) to build
RUN npm ci

COPY . .
# Build TypeScript
RUN npm run build

# STAGE 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production env
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
# Copy other necessary files (migrations, static assets if any)
COPY --from=builder /app/migrations ./migrations

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/ping || exit 1

# Start
CMD ["node", "dist/server.js"]
