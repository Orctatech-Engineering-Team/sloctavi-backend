import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { notifications } from "@/db/schema/schema";
import { createSelectSchema } from "drizzle-zod";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Notifications"];

const notificationSchema = createSelectSchema(notifications);

const notificationCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  type: z.string().min(1, "Type is required").max(50, "Type too long"),
  content: z.string().min(1, "Content is required"),
  channel: z.string().min(1, "Channel is required").max(20, "Channel too long"),
});

const bulkNotificationCreateSchema = z.object({
  userIds: z.array(z.string().uuid("Invalid user ID format")).min(1, "At least one user ID is required"),
  type: z.string().min(1, "Type is required").max(50, "Type too long"),
  content: z.string().min(1, "Content is required"),
  channel: z.string().min(1, "Channel is required").max(20, "Channel too long").default("in_app"),
});

export const getUserNotifications = createRoute({
  path: "/notifications",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      unreadOnly: z.string().transform(val => val === "true").optional().default("false"),
      type: z.string().optional(),
      limit: z.string().transform(Number).optional().default("50"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        notifications: z.array(notificationSchema),
        total: z.number(),
        unreadCount: z.number(),
      }),
      "Notifications retrieved successfully",
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

export const getNotificationById = createRoute({
  path: "/notifications/{id}",
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
      notificationSchema,
      "Notification retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Notification not found",
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      badRequestSchema,
      "Forbidden",
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

export const createNotification = createRoute({
  path: "/notifications",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      notificationCreateSchema,
      "Notification data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      notificationSchema,
      "Notification created successfully",
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

export const markAsRead = createRoute({
  path: "/notifications/{id}/read",
  method: "patch",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      notificationSchema,
      "Notification marked as read",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Notification not found",
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

export const markAllAsRead = createRoute({
  path: "/notifications/read-all",
  method: "patch",
  tags,
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "All notifications marked as read",
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

export const deleteNotification = createRoute({
  path: "/notifications/{id}",
  method: "delete",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Notification deleted successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Notification not found",
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

export const deleteAllNotifications = createRoute({
  path: "/notifications/delete-all",
  method: "delete",
  tags,
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "All notifications deleted successfully",
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

export const getUnreadCount = createRoute({
  path: "/notifications/unread-count",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ unreadCount: z.number() }),
      "Unread count retrieved successfully",
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

export const createBulkNotification = createRoute({
  path: "/notifications/bulk",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      bulkNotificationCreateSchema,
      "Bulk notification data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        notifications: z.array(notificationSchema),
      }),
      "Bulk notifications created successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
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

export const getNotificationStatistics = createRoute({
  path: "/notifications/statistics",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        totalNotifications: z.number(),
        unreadNotifications: z.number(),
        typeCounts: z.array(z.object({
          type: z.string(),
          count: z.number(),
        })),
        channelCounts: z.array(z.object({
          channel: z.string(),
          count: z.number(),
        })),
      }),
      "Notification statistics retrieved successfully",
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

export type GetUserNotificationsRoute = typeof getUserNotifications;
export type GetNotificationByIdRoute = typeof getNotificationById;
export type CreateNotificationRoute = typeof createNotification;
export type MarkAsReadRoute = typeof markAsRead;
export type MarkAllAsReadRoute = typeof markAllAsRead;
export type DeleteNotificationRoute = typeof deleteNotification;
export type DeleteAllNotificationsRoute = typeof deleteAllNotifications;
export type GetUnreadCountRoute = typeof getUnreadCount;
export type CreateBulkNotificationRoute = typeof createBulkNotification;
export type GetNotificationStatisticsRoute = typeof getNotificationStatistics;