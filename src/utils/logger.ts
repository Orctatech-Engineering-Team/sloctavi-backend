import { pinoLogger as honoLogger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";

import env from "@/env";

const isProd = env.NODE_ENV === "production";

export const logger = pino(
  {
    level: env.LOG_LEVEL || "info",
    base: { env: env.NODE_ENV },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  isProd ? undefined : pretty(),
);

// Middleware-friendly version for Hono
export function pinoLogger() {
  return honoLogger({ pino: logger });
}

interface LogMeta {
  service?: string;
  method?: string;
  [key: string]: unknown;
}

export function logError(error: unknown, message: string, meta?: LogMeta) {
  logger.error({ err: error, ...meta }, message);
}

export function logInfo(message: string, meta?: LogMeta) {
  logger.info({ ...meta }, message);
}

export function logWarn(message: string, meta?: LogMeta) {
  logger.warn({ ...meta }, message);
}
