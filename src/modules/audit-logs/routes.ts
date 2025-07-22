import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { auditLogs } from "@/db/schema/schema";
import { createSelectSchema } from "drizzle-zod";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Audit Logs"];

const auditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

const auditLogCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  action: z.string().min(1, "Action is required").max(100, "Action too long"),
  entityType: z.string().min(1, "Entity type is required").max(100, "Entity type too long"),
  entityId: z.string().uuid("Invalid entity ID format"),
  metadata: z.record(z.any()).optional(),
});

export const getAuditLogs = createRoute({
  path: "/audit-logs",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
      action: z.string().optional(),
      entityType: z.string().optional(),
      entityId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      limit: z.string().transform(Number).optional().default("50"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        logs: z.array(auditLogSchema),
        total: z.number(),
      }),
      "Audit logs retrieved successfully",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getAuditLogById = createRoute({
  path: "/audit-logs/{id}",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      auditLogSchema,
      "Audit log retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Audit log not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const createAuditLog = createRoute({
  path: "/audit-logs",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      auditLogCreateSchema,
      "Audit log data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      auditLogSchema,
      "Audit log created successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getEntityAuditLogs = createRoute({
  path: "/audit-logs/entity/{entityType}/{entityId}",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      entityType: z.string().min(1, "Entity type is required"),
      entityId: z.string().uuid("Invalid entity ID format"),
    }),
    query: z.object({
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        logs: z.array(auditLogSchema),
        total: z.number(),
      }),
      "Entity audit logs retrieved successfully",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getUserActivityLogs = createRoute({
  path: "/audit-logs/user/{userId}",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userId: z.string().uuid("Invalid user ID format"),
    }),
    query: z.object({
      limit: z.string().transform(Number).optional().default("50"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        logs: z.array(auditLogSchema),
        total: z.number(),
      }),
      "User activity logs retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getAuditLogStatistics = createRoute({
  path: "/audit-logs/statistics",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        totalLogs: z.number(),
        actionCounts: z.array(z.object({
          action: z.string(),
          count: z.number(),
        })),
        entityTypeCounts: z.array(z.object({
          entityType: z.string(),
          count: z.number(),
        })),
        dailyActivity: z.array(z.object({
          date: z.string(),
          count: z.number(),
        })),
      }),
      "Audit log statistics retrieved successfully",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export type GetAuditLogsRoute = typeof getAuditLogs;
export type GetAuditLogByIdRoute = typeof getAuditLogById;
export type CreateAuditLogRoute = typeof createAuditLog;
export type GetEntityAuditLogsRoute = typeof getEntityAuditLogs;
export type GetUserActivityLogsRoute = typeof getUserActivityLogs;
export type GetAuditLogStatisticsRoute = typeof getAuditLogStatistics;