import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { AppError } from "@/utils/error";

import { auditLogsService } from "./services";
import type { 
  GetAuditLogsRoute, 
  GetAuditLogByIdRoute,
  CreateAuditLogRoute,
  GetEntityAuditLogsRoute,
  GetUserActivityLogsRoute,
  GetAuditLogStatisticsRoute
} from "./routes";

export const getAuditLogs: AppRouteHandler<GetAuditLogsRoute> = async (c) => {
  const { 
    userId, 
    action, 
    entityType, 
    entityId, 
    startDate, 
    endDate, 
    limit, 
    offset 
  } = c.req.valid("query");
  
  const currentUserId = c.get("jwtPayload")?.userId;
  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  // Parse dates if provided
  const parsedStartDate = startDate ? new Date(startDate) : undefined;
  const parsedEndDate = endDate ? new Date(endDate) : undefined;

  const result = await auditLogsService.getAuditLogs(
    userId,
    action,
    entityType,
    entityId,
    parsedStartDate,
    parsedEndDate,
    limit,
    offset
  );

  return c.json(result, HttpStatusCodes.OK);
};

export const getAuditLogById: AppRouteHandler<GetAuditLogByIdRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const auditLog = await auditLogsService.getAuditLogById(id);
  
  if (!auditLog) {
    throw new AppError("Audit log not found", HttpStatusCodes.NOT_FOUND);
  }

  return c.json(auditLog, HttpStatusCodes.OK);
};

export const createAuditLog: AppRouteHandler<CreateAuditLogRoute> = async (c) => {
  const data = c.req.valid("json");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const auditLog = await auditLogsService.createAuditLog(data);
  return c.json(auditLog, HttpStatusCodes.CREATED);
};

export const getEntityAuditLogs: AppRouteHandler<GetEntityAuditLogsRoute> = async (c) => {
  const { entityType, entityId } = c.req.valid("param");
  const { limit, offset } = c.req.valid("query");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const result = await auditLogsService.getEntityAuditLogs(
    entityType,
    entityId,
    limit,
    offset
  );

  return c.json(result, HttpStatusCodes.OK);
};

export const getUserActivityLogs: AppRouteHandler<GetUserActivityLogsRoute> = async (c) => {
  const { userId } = c.req.valid("param");
  const { limit, offset } = c.req.valid("query");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const result = await auditLogsService.getUserActivityLogs(
    userId,
    limit,
    offset
  );

  return c.json(result, HttpStatusCodes.OK);
};

export const getAuditLogStatistics: AppRouteHandler<GetAuditLogStatisticsRoute> = async (c) => {
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const statistics = await auditLogsService.getAuditLogStatistics();
  return c.json(statistics, HttpStatusCodes.OK);
};