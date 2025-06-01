# Stage 1 - build
FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

# Install deps
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install

# Build project
RUN pnpm build

# Stage 2 - run
FROM node:20-alpine

WORKDIR /app

# Only copy built files and node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.env ./

# Start app
CMD ["node", "dist/src/index.js"]
