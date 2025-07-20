import { eq, and, count, desc, gte, lte } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  notifications,
  users
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

type Notification = typeof notifications.$inferSelect;
type NewNotification = typeof notifications.$inferInsert;
type User = typeof users.$inferSelect;

export const notificationsService = {
  // Create notification
  async createNotification(data: Omit<NewNotification, "id" | "createdAt">): Promise<Notification> {
    try {
      // Verify user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
      });

      if (!user) {
        throw new AppError(
          "User not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const [notification] = await db
        .insert(notifications)
        .values({
          ...data,
          createdAt: new Date(),
        })
        .returning();

      return notification;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create notification",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Get user notifications
  async getUserNotifications(
    userId: string,
    unreadOnly = false,
    type?: string,
    limit = 50,
    offset = 0
  ): Promise<{ notifications: Notification[], total: number, unreadCount: number }> {
    try {
      // Verify user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new AppError(
          "User not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const whereConditions = [eq(notifications.userId, userId)];

      if (unreadOnly) {
        whereConditions.push(eq(notifications.isRead, false));
      }

      if (type) {
        whereConditions.push(eq(notifications.type, type));
      }

      const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

      const [notificationsList, totalCount, unreadCountResult] = await Promise.all([
        db.query.notifications.findMany({
          where: whereClause,
          limit,
          offset,
          orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
        }),
        db.select({ count: count() }).from(notifications).where(whereClause),
        db.select({ count: count() }).from(notifications).where(
          and(eq(notifications.userId, userId), eq(notifications.isRead, false))
        ),
      ]);

      return {
        notifications: notificationsList,
        total: totalCount[0].count,
        unreadCount: unreadCountResult[0].count,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve notifications",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification | null> {
    try {
      const notification = await db.query.notifications.findFirst({
        where: eq(notifications.id, id),
      });

      return notification || null;
    } catch (error) {
      throw new AppError(
        "Failed to retrieve notification",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Mark notification as read
  async markAsRead(id: string, userId: string): Promise<Notification> {
    try {
      // Check if notification exists and belongs to user
      const existing = await db.query.notifications.findFirst({
        where: and(eq(notifications.id, id), eq(notifications.userId, userId)),
      });

      if (!existing) {
        throw new AppError(
          "Notification not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const [updated] = await db
        .update(notifications)
        .set({
          isRead: true,
        })
        .where(eq(notifications.id, id))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to mark notification as read",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<number> {
    try {
      // Verify user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new AppError(
          "User not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const result = await db
        .update(notifications)
        .set({
          isRead: true,
        })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
        .returning();

      return result.length;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to mark all notifications as read",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Delete notification
  async deleteNotification(id: string, userId: string): Promise<void> {
    try {
      // Check if notification exists and belongs to user
      const existing = await db.query.notifications.findFirst({
        where: and(eq(notifications.id, id), eq(notifications.userId, userId)),
      });

      if (!existing) {
        throw new AppError(
          "Notification not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      await db.delete(notifications).where(eq(notifications.id, id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to delete notification",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Delete all notifications for a user
  async deleteAllNotifications(userId: string): Promise<number> {
    try {
      // Verify user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new AppError(
          "User not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const result = await db
        .delete(notifications)
        .where(eq(notifications.userId, userId))
        .returning();

      return result.length;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to delete all notifications",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(notifications).where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      );

      return result[0].count;
    } catch (error) {
      throw new AppError(
        "Failed to get unread count",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Notification helper methods for common scenarios
  async notifyBookingConfirmed(userId: string, bookingId: string, bookingDetails: any): Promise<Notification> {
    return this.createNotification({
      userId,
      type: "booking_update",
      content: `Your booking has been confirmed. Booking ID: ${bookingId}`,
      channel: "in_app",
    });
  },

  async notifyBookingCancelled(userId: string, bookingId: string, reason?: string): Promise<Notification> {
    const content = reason 
      ? `Your booking has been cancelled. Reason: ${reason}. Booking ID: ${bookingId}`
      : `Your booking has been cancelled. Booking ID: ${bookingId}`;

    return this.createNotification({
      userId,
      type: "booking_update",
      content,
      channel: "in_app",
    });
  },

  async notifyNewBooking(professionalUserId: string, bookingId: string, customerName: string): Promise<Notification> {
    return this.createNotification({
      userId: professionalUserId,
      type: "booking_update",
      content: `New booking request from ${customerName}. Booking ID: ${bookingId}`,
      channel: "in_app",
    });
  },

  async notifyBookingReminder(userId: string, bookingId: string, timeUntilBooking: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: "booking_reminder",
      content: `Reminder: You have a booking in ${timeUntilBooking}. Booking ID: ${bookingId}`,
      channel: "in_app",
    });
  },

  async notifyNewReview(professionalUserId: string, reviewId: string, customerName: string, rating: number): Promise<Notification> {
    return this.createNotification({
      userId: professionalUserId,
      type: "review",
      content: `New ${rating}-star review from ${customerName}`,
      channel: "in_app",
    });
  },

  async notifyProfileUpdate(userId: string, updateType: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: "profile_update",
      content: `Your ${updateType} has been updated successfully`,
      channel: "in_app",
    });
  },

  async notifyWelcome(userId: string, userType: string): Promise<Notification> {
    const content = userType === "professional" 
      ? "Welcome to our platform! Start by setting up your services and availability."
      : "Welcome to our platform! You can now browse and book services.";

    return this.createNotification({
      userId,
      type: "welcome",
      content,
      channel: "in_app",
    });
  },

  async notifyPasswordChanged(userId: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: "security",
      content: "Your password has been changed successfully",
      channel: "in_app",
    });
  },

  async notifyEmailVerified(userId: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: "verification",
      content: "Your email has been verified successfully",
      channel: "in_app",
    });
  },

  // Bulk notification methods
  async createBulkNotification(
    userIds: string[],
    type: string,
    content: string,
    channel: string = "in_app"
  ): Promise<Notification[]> {
    try {
      const notificationData = userIds.map(userId => ({
        userId,
        type,
        content,
        channel,
        isRead: false,
        createdAt: new Date(),
      }));

      const result = await db
        .insert(notifications)
        .values(notificationData)
        .returning();

      return result;
    } catch (error) {
      throw new AppError(
        "Failed to create bulk notifications",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Get notification statistics
  async getNotificationStatistics(): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    typeCounts: Array<{ type: string; count: number }>;
    channelCounts: Array<{ channel: string; count: number }>;
  }> {
    try {
      const [
        totalResult,
        unreadResult,
        typeCounts,
        channelCounts
      ] = await Promise.all([
        db.select({ count: count() }).from(notifications),
        db.select({ count: count() }).from(notifications).where(eq(notifications.isRead, false)),
        db.select({
          type: notifications.type,
          count: count(),
        }).from(notifications).groupBy(notifications.type),
        db.select({
          channel: notifications.channel,
          count: count(),
        }).from(notifications).groupBy(notifications.channel),
      ]);

      return {
        totalNotifications: totalResult[0].count,
        unreadNotifications: unreadResult[0].count,
        typeCounts,
        channelCounts,
      };
    } catch (error) {
      throw new AppError(
        "Failed to get notification statistics",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};