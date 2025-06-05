import { pinoLogger as honoLogger } from "hono-pino";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import pino, { destination } from "pino"; // For file logging
import pretty from "pino-pretty";

import env from "@/env";

const isProd = env.NODE_ENV === "production";

// Ensure logs directory exists
const logsDir = join(process.cwd(), "logs");
mkdirSync(logsDir, { recursive: true });

// File destination for logs
const logFilePath = join(logsDir, "app.log");
const fileDestination = destination(logFilePath);

// Configure streams for console and file
const streams: pino.StreamEntry[] = [
  { stream: fileDestination }, // Always log to file
  ...(isProd
    ? []
    : [{ stream: pretty({ colorize: true, translateTime: "SYS:standard" }) }]), // Console with pretty in non-prod
];

// Initialize logger
export const logger = pino(
  {
    level: env.LOG_LEVEL || "info",
    base: { env: env.NODE_ENV },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream(streams),
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
