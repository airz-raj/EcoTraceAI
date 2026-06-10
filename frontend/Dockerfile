# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and config
COPY . .

# Vite reads .env.production automatically during build
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Install a tiny static file server
RUN npm install -g serve@14

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT env var (default 8080)
ENV PORT=8080

EXPOSE 8080

# Serve the SPA with fallback to index.html for client-side routing
CMD serve dist -l tcp://0.0.0.0:$PORT -s
