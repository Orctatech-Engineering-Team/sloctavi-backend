import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { AppError } from "@/utils/error";

import { notificationsService } from "./services";
import type { 
  GetUserNotificationsRoute,
  GetNotificationByIdRoute,
  CreateNotificationRoute,
  MarkAsReadRoute,
  MarkAllAsReadRoute,
  DeleteNotificationRoute,
  DeleteAllNotificationsRoute,
  GetUnreadCountRoute,
  CreateBulkNotificationRoute,
  GetNotificationStatisticsRoute
} from "./routes";

export const getUserNotifications: AppRouteHandler<GetUserNotificationsRoute> = async (c) => {
  const { unreadOnly, type, limit, offset } = c.req.valid("query");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const result = await notificationsService.getUserNotifications(
    userId,
    unreadOnly,
    type,
    limit,
    offset
  );

  return c.json(result, HttpStatusCodes.OK);
};

export const getNotificationById: AppRouteHandler<GetNotificationByIdRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const notification = await notificationsService.getNotificationById(id);
  
  if (!notification) {
    throw new AppError("Notification not found", HttpStatusCodes.NOT_FOUND);
  }

  // Check if notification belongs to the user
  if (notification.userId !== userId) {
    throw new AppError("Forbidden", HttpStatusCodes.FORBIDDEN);
  }

  return c.json(notification, HttpStatusCodes.OK);
};

export const createNotification: AppRouteHandler<CreateNotificationRoute> = async (c) => {
  const data = c.req.valid("json");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const notification = await notificationsService.createNotification(data);
  return c.json(notification, HttpStatusCodes.CREATED);
};

export const markAsRead: AppRouteHandler<MarkAsReadRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const notification = await notificationsService.markAsRead(id, userId);
  return c.json(notification, HttpStatusCodes.OK);
};

export const markAllAsRead: AppRouteHandler<MarkAllAsReadRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const updatedCount = await notificationsService.markAllAsRead(userId);
  return c.json({ message: `Marked ${updatedCount} notifications as read` }, HttpStatusCodes.OK);
};

export const deleteNotification: AppRouteHandler<DeleteNotificationRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  await notificationsService.deleteNotification(id, userId);
  return c.json({ message: "Notification deleted successfully" }, HttpStatusCodes.OK);
};

export const deleteAllNotifications: AppRouteHandler<DeleteAllNotificationsRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const deletedCount = await notificationsService.deleteAllNotifications(userId);
  return c.json({ message: `Deleted ${deletedCount} notifications` }, HttpStatusCodes.OK);
};

export const getUnreadCount: AppRouteHandler<GetUnreadCountRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const unreadCount = await notificationsService.getUnreadCount(userId);
  return c.json({ unreadCount }, HttpStatusCodes.OK);
};

export const createBulkNotification: AppRouteHandler<CreateBulkNotificationRoute> = async (c) => {
  const data = c.req.valid("json");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const notifications = await notificationsService.createBulkNotification(
    data.userIds,
    data.type,
    data.content,
    data.channel
  );

  return c.json({ 
    message: `Created ${notifications.length} notifications`,
    notifications 
  }, HttpStatusCodes.CREATED);
};

export const getNotificationStatistics: AppRouteHandler<GetNotificationStatisticsRoute> = async (c) => {
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const statistics = await notificationsService.getNotificationStatistics();
  return c.json(statistics, HttpStatusCodes.OK);
};