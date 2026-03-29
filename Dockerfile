# =============================================================================
# Moka CRM - Multi-Stage Docker Build
# Next.js 14.2 (Standalone) + PocketBase
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Build arguments for PocketBase URL
ARG NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
ENV NEXT_PUBLIC_POCKETBASE_URL=${NEXT_PUBLIC_POCKETBASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application with standalone output
# Cache buster: timestamp ile her seferinde yeniden build edilir
ARG BUILD_TIMESTAMP=0
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"
RUN npm run build

# Debug: Check .next directory structure
RUN echo "=== Checking .next directory ===" && \
    ls -la /app/.next/ && \
    echo "=== Checking if standalone exists ===" && \
    ls -la /app/.next/standalone 2>/dev/null || echo "standalone directory NOT found"

# Verify standalone output was created
RUN test -d /app/.next/standalone || (echo "ERROR: standalone not found!" && ls -la /app/.next/ && exit 1)

# -----------------------------------------------------------------------------
# Stage 3: Next.js Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS nextjs
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Next.js standalone output includes everything needed
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# Stage 4: PocketBase Production Runtime
# -----------------------------------------------------------------------------
FROM alpine:3.19 AS pocketbase

# Install PocketBase
ARG PB_VERSION=0.23.8
RUN apk add --no-cache ca-certificates wget

RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip \
    && mv pocketbase /usr/local/bin/

# Create directory for PocketBase data
RUN mkdir -p /pb_data && mkdir -p /pb_public

# Create non-root user for PocketBase
RUN addgroup -S -g 1000 pocketbase && \
    adduser -S -u 1000 -G pocketbase pocketbase

WORKDIR /pb_data

RUN chown -R pocketbase:pocketbase /pb_data

# NOTE: Running as root to avoid permission issues with Docker volumes
# In production, consider using a proper volume driver or user namespace
# USER pocketbase

EXPOSE 8090

# PocketBase will serve its admin UI on :8090
CMD ["pocketbase", "serve", "--http", "0.0.0.0:8090", "--dir", "/pb_data"]
