FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Build stage
FROM base AS prod

# Create and set working directory
RUN mkdir -p /app
WORKDIR /app

# Install dependencies
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build project
RUN pnpm run build

# Production stage
FROM base

# Create and set working directory
RUN mkdir -p /app
WORKDIR /app

# Install PM2
RUN pnpm add -g pm2

# Copy built files and dependencies
COPY --from=prod /app/dist ./dist
COPY --from=prod /app/node_modules ./node_modules
COPY --from=prod /app/package.json ./

# Copy PM2 ecosystem file
COPY pm2.config.js ./

# Expose port
EXPOSE 3000

# Start app using PM2
CMD ["pm2-runtime", "start", "pm2.config.js"]