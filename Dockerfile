FROM oven/bun:1-slim AS base
WORKDIR /app

# Install ALL dependencies (devDeps are needed by Vite during the build stage)
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the Vite SPA — output lands in dist/
FROM deps AS builder
COPY . .
RUN bun run build

# Production image — only runtime artifacts, no build tools
FROM base AS runner
ENV NODE_ENV=production

# Copy node_modules from the full-install stage so the server can run
COPY --from=deps /app/node_modules ./node_modules

# Static assets (user-uploaded images, favicon, etc.)
COPY --from=builder /app/public ./public

# Server source (Hono API, services, DB layer, middleware)
COPY --from=builder /app/src ./src

# Vite-built SPA — Hono serves this for all non-API routes in production
COPY --from=builder /app/dist ./dist

# Misc runtime files
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/CHANGELOG.md ./CHANGELOG.md

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
