# Sloctavi Backend – Internal Team Docs

Welcome to the backend of the Sloctavi platform. This service powers the API and internal logic of our application. It is built for **maintainability**, **scalability**, and **developer productivity** using modern TypeScript practices, `Hono`, and a minimal ecosystem of proven libraries.

## Tech Stack Overview

| Tech          | Purpose                          |
| ------------- | -------------------------------- |
| `Hono`        | Web framework                    |
| `TypeScript`  | Strong typing and DX             |
| `PostgreSQL`  | Relational data store (via `pg`) |
| `Redis`       | Queue broker, caching            |
| `BullMQ`      | Job queues and workers           |
| `Drizzle ORM` | SQL-first ORM + Zod types        |
| `Pino`        | Structured logging               |
| `Docker`      | Containerization                 |

## Getting Started

### 1. Prerequisites

- Node.js `>=20`
- pnpm
- Docker + Docker Compose
- `.env` file (ask a lead if missing)

### 2. Setup

```bash
pnpm install
cp .env.example .env
```

Update credentials in `.env` as needed for:

- Postgres (host, db, user, password)
- Redis URL
- JWT Secret
- Mail settings

### 3. Local Dev

```bash
pnpm dev
```

Uses `tsx` for hot-reloading and proper module resolution.

## Dockerized Dev (Optional)

For full container setup:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Make sure `.env` is properly configured.

To reset:

```bash
docker compose down -v
```

## Codebase Structure

```bash
src/
├── index.ts         # Hono app entry
├── env.ts           # Env loader with dotenv
├── routes/          # All route files
│   └── healthz.ts   # App health endpoint
├── db/              # Drizzle schema and config
├── jobs/            # BullMQ jobs/queues
├── lib/             # Mailer, Redis, Logger, etc.
├── middleware/      # Hono middlewares
```

## Dev Commands

| Command          | Description            |
| ---------------- | ---------------------- |
| `pnpm dev`       | Start with hot reload  |
| `pnpm build`     | Build project          |
| `pnpm start`     | Run built output       |
| `pnpm typecheck` | Run TypeScript check   |
| `pnpm lint`      | Run ESLint             |
| `pnpm test`      | Run tests (Vitest)     |
| `pnpm migrate`   | Run Drizzle migrations |

## Logging & Debugging

- Logs are via `Pino`, pretty-printed in dev
- All log utilities are in `lib/logger.ts`
- Use `logInfo`, `logWarn`, `logError` for structured logs

## Healthcheck

| Endpoint   | Purpose                     |
| ---------- | --------------------------- |
| `/healthz` | App heartbeat               |
| `/ready`   | Readiness for orchestration |

## Job Queue

We use BullMQ with Redis. Jobs live in `jobs/` and are auto-wired by a queue manager (TBD if not done). Monitor jobs via:

```bash
pnpm dev # logs will show queue events
```

## Drizzle ORM

Migrations are managed with:

```bash
pnpm migrate
```

Schemas are in `db/schema.ts`.

Use Zod inference where possible for end-to-end type safety.

## Emailing

Mailer logic lives in `lib/mailer.ts`. We use `nodemailer` or `mailgun` . You must configure:

- SMTP_HOST
- SMTP_USER
- SMTP_PASS

Emails are converted to plain text using `html-to-text`.

## Internal Conventions

- Follow the file structure: `routes/`, `lib/`, `db/`, `jobs/`
- Logging: Use `lib/logger.ts` helpers, not raw `console`
- Use `zod` for all runtime validation
- Write simple, composable middlewares
- Use types even in tests

## Common Debug Issues

| Issue                      | Fix                                               |
| -------------------------- | ------------------------------------------------- |
| `.env` not loaded          | Check `env.ts` and `.env` file structure          |
| Redis not connecting       | Ensure `REDIS_URL` is correct and container is up |
| Drizzle schema not syncing | Run `pnpm migrate`                                |
| Type errors after install  | Run `pnpm typecheck` or ensure deps are installed |

## Access & Secrets

Secrets like JWT secret, SMTP creds, and DB passwords are in `.env`. Never commit this file.

Ask a lead for access or reference the secret vault.

## 👨🏿Maintainers

- **Backend Lead**: Bernard Adjanor
- **Tech Leads**: CTO
- **Contact**: GitHub issues

## Roadmap

- [ ] Implement core features ie auth, profile, booking
- [ ] Add test coverage for queues
- [ ] Add monitoring and alerts (Grafana/Prometheus or equivalent)
- [ ] CI setup (GitHub Actions)
- [ ] Swagger/OpenAPI endpoints and docs

## Onboarding Checklist

- [ ] Clone repo and run `pnpm install`
- [ ] Setup `.env`
- [ ] Run `pnpm dev`
- [ ] Test Postgres + Redis connectivity
- [ ] Ask for job/task from team lead

> Welcome aboard 🎉
