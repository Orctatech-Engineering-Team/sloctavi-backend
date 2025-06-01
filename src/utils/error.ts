import type { Context } from "hono";
import type { HTTPException } from "hono/http-exception";

import * as HttpStatusCodes from "stoker/http-status-codes";

import env from "@/env";
import { da } from "@faker-js/faker";

type StatusCode = typeof HttpStatusCodes[keyof typeof HttpStatusCodes];

export class AppError extends Error {
  statusCode: StatusCode;
  status: string;
  cause?: unknown;

  constructor(
    message: string,
    statusCode: typeof HttpStatusCodes[keyof typeof HttpStatusCodes],
    options?: { cause?: unknown },
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.cause = options?.cause;
    Object.setPrototypeOf(this, AppError.prototype); // Fix for extending Error
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export function errorHandler(
  err: Error | AppError | HTTPException,
  c: Context,
): Response | Promise<Response> {
  const statusCode = "statusCode" in err
    ? (err as any).statusCode
    : "status" in err
      ? (err as any).status
      : HttpStatusCodes.INTERNAL_SERVER_ERROR;

  const message = err.message || "Internal Server Error";

  return c.json(
    {
      success: false,
      error: {
        message,
        stack: env.NODE_ENV === "development" && { stack: err.stack },
      },
    },
    { status: statusCode },
  );
}
