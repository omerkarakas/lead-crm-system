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

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application with standalone output
RUN npm run build

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
COPY --from=builder /app/public ./public
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
ARG PB_VERSION=0.21.5
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

USER pocketbase

EXPOSE 8090

# PocketBase will serve its admin UI on :8090
CMD ["pocketbase", "serve", "--http", "0.0.0.0:8090"]
