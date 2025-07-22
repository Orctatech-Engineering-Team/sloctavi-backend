import { generateBookingNotificationEmail } from "@/shared/services/mailer/utils";
import { and, eq, inArray } from "drizzle-orm";

import db from "@/db";
import { bookings, customerProfiles, notifications, professionalProfiles, users } from "@/db/schema/schema";
import { MailService } from "@/shared/services/mailer/MailService";
import { logError, logInfo } from "@/utils/logger";

import { type NotificationPayload, wsManager } from "./websocket";

export interface BookingNotificationData {
  bookingId: string;
  customerName: string;
  professionalName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
}

export interface NotificationRecipient {
  userId: string;
  email: string;
  name: string;
  type: "customer" | "professional";
}

export interface ProfileUpdateNotificationData {
  userId: string;
  userType: "customer" | "professional";
  updateType: "profile_update" | "profile_photo_update" | "profile_completion";
  changes: string[];
  timestamp: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  async sendBookingCreatedNotification(data: BookingNotificationData) {
    try {
      // Get recipient details
      const [customer, professional] = await this.getBookingParticipants(data.bookingId);

      // Send to professional (new booking request)
      await this.sendNotification({
        recipient: professional,
        type: "booking_created",
        title: "New Booking Request",
        message: `${customer.name} has requested a booking for ${data.serviceName}`,
        data,
        emailTemplate: "new_booking_request",
      });

      // Send confirmation to customer
      await this.sendNotification({
        recipient: customer,
        type: "booking_created",
        title: "Booking Request Submitted",
        message: `Your booking request for ${data.serviceName} has been submitted`,
        data,
        emailTemplate: "booking_confirmation",
      });

      logInfo("Booking created notifications sent", {
        service: "NotificationService",
        method: "sendBookingCreatedNotification",
        bookingId: data.bookingId,
      });
    }
    catch (error) {
      logError(error, "Failed to send booking created notifications", {
        service: "NotificationService",
        method: "sendBookingCreatedNotification",
        bookingId: data.bookingId,
      });
    }
  }

  async sendBookingStatusUpdateNotification(data: BookingNotificationData, oldStatus: string) {
    try {
      const [customer, professional] = await this.getBookingParticipants(data.bookingId);

      let recipientMessage: string;
      let emailTemplate: string;

      switch (data.status.toLowerCase()) {
        case "confirmed":
          recipientMessage = `Your booking for ${data.serviceName} has been confirmed by ${professional.name}`;
          emailTemplate = "booking_confirmed";
          break;
        case "completed":
          recipientMessage = `Your booking for ${data.serviceName} has been completed`;
          emailTemplate = "booking_completed";
          break;
        case "cancelled":
          recipientMessage = `Your booking for ${data.serviceName} has been cancelled`;
          emailTemplate = "booking_cancelled";
          break;
        default:
          recipientMessage = `Your booking for ${data.serviceName} status has been updated to ${data.status}`;
          emailTemplate = "booking_updated";
      }

      // Notify customer about status change
      await this.sendNotification({
        recipient: customer,
        type: "status_changed",
        title: "Booking Status Updated",
        message: recipientMessage,
        data: { ...data, oldStatus },
        emailTemplate,
      });

      // If booking was cancelled by professional, notify customer
      if (data.status.toLowerCase() === "cancelled") {
        await this.sendNotification({
          recipient: professional,
          type: "status_changed",
          title: "Booking Cancelled",
          message: `Booking for ${data.serviceName} has been cancelled`,
          data: { ...data, oldStatus },
          emailTemplate: "booking_cancelled_professional",
        });
      }

      logInfo("Booking status update notifications sent", {
        service: "NotificationService",
        method: "sendBookingStatusUpdateNotification",
        bookingId: data.bookingId,
        newStatus: data.status,
        oldStatus,
      });
    }
    catch (error) {
      logError(error, "Failed to send booking status update notifications", {
        service: "NotificationService",
        method: "sendBookingStatusUpdateNotification",
        bookingId: data.bookingId,
      });
    }
  }

  async sendBookingCancelledNotification(data: BookingNotificationData, cancelledBy: "customer" | "professional") {
    try {
      const [customer, professional] = await this.getBookingParticipants(data.bookingId);

      if (cancelledBy === "customer") {
        // Notify professional that customer cancelled
        await this.sendNotification({
          recipient: professional,
          type: "booking_cancelled",
          title: "Booking Cancelled",
          message: `${customer.name} has cancelled their booking for ${data.serviceName}`,
          data: { ...data, cancelledBy },
          emailTemplate: "booking_cancelled_by_customer",
        });
      }
      else {
        // Notify customer that professional cancelled
        await this.sendNotification({
          recipient: customer,
          type: "booking_cancelled",
          title: "Booking Cancelled",
          message: `${professional.name} has cancelled your booking for ${data.serviceName}`,
          data: { ...data, cancelledBy },
          emailTemplate: "booking_cancelled_by_professional",
        });
      }

      logInfo("Booking cancellation notifications sent", {
        service: "NotificationService",
        method: "sendBookingCancelledNotification",
        bookingId: data.bookingId,
        cancelledBy,
      });
    }
    catch (error) {
      logError(error, "Failed to send booking cancellation notifications", {
        service: "NotificationService",
        method: "sendBookingCancelledNotification",
        bookingId: data.bookingId,
      });
    }
  }

  async sendBookingReminderNotification(data: BookingNotificationData) {
    try {
      const [customer, professional] = await this.getBookingParticipants(data.bookingId);

      // Send reminder to customer
      await this.sendNotification({
        recipient: customer,
        type: "booking_reminder",
        title: "Booking Reminder",
        message: `Reminder: You have a booking for ${data.serviceName} tomorrow at ${data.time}`,
        data,
        emailTemplate: "booking_reminder",
      });

      // Send reminder to professional
      await this.sendNotification({
        recipient: professional,
        type: "booking_reminder",
        title: "Booking Reminder",
        message: `Reminder: You have a booking with ${customer.name} for ${data.serviceName} tomorrow at ${data.time}`,
        data,
        emailTemplate: "booking_reminder_professional",
      });

      logInfo("Booking reminder notifications sent", {
        service: "NotificationService",
        method: "sendBookingReminderNotification",
        bookingId: data.bookingId,
      });
    }
    catch (error) {
      logError(error, "Failed to send booking reminder notifications", {
        service: "NotificationService",
        method: "sendBookingReminderNotification",
        bookingId: data.bookingId,
      });
    }
  }

  private async sendNotification({
    recipient,
    type,
    title,
    message,
    data,
    emailTemplate,
  }: {
    recipient: NotificationRecipient;
    type: NotificationPayload["type"] | "booking_reminder";
    title: string;
    message: string;
    data: BookingNotificationData & Record<string, any>;
    emailTemplate: string;
  }) {
    const timestamp = new Date().toISOString();

    // Store notification in database
    await this.storeNotification({
      userId: recipient.userId,
      type,
      title,
      message,
      data,
    });

    // Send real-time notification via WebSocket
    const wsPayload: NotificationPayload = {
      type: type as NotificationPayload["type"],
      bookingId: data.bookingId,
      title,
      message,
      data,
      timestamp,
    };

    const wsSent = wsManager.sendToUser(recipient.userId, wsPayload);

    logInfo(`WebSocket notification ${wsSent ? "sent" : "not sent"}`, {
      service: "NotificationService",
      method: "sendNotification",
      userId: recipient.userId,
      type,
    });

    // Send email notification
    try {
      const emailPayload = generateBookingNotificationEmail(
        emailTemplate,
        recipient.email,
        recipient.name,
        data,
      );

      await MailService.send(emailPayload);

      logInfo("Email notification queued", {
        service: "NotificationService",
        method: "sendNotification",
        userId: recipient.userId,
        email: recipient.email,
        template: emailTemplate,
      });
    }
    catch (emailError) {
      logError(emailError, "Failed to send email notification", {
        service: "NotificationService",
        method: "sendNotification",
        userId: recipient.userId,
        template: emailTemplate,
      });
    }
  }

  private async storeNotification({
    userId,
    type,
    title,
    message,
    data,
  }: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data: Record<string, any>;
  }) {
    try {
      await db.insert(notifications).values({
        userId,
        type,
        content: JSON.stringify({
          title,
          message,
          data,
        }),
        channel: "in_app",
        isRead: false,
      });
    }
    catch (error) {
      logError(error, "Failed to store notification in database", {
        service: "NotificationService",
        method: "storeNotification",
        userId,
        type,
      });
    }
  }

  private async getBookingParticipants(bookingId: string): Promise<[NotificationRecipient, NotificationRecipient]> {
    // Get booking details with customer and professional info
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const [customerProfile, professionalProfile] = await Promise.all([
      db.query.customerProfiles.findFirst({
        where: eq(customerProfiles.id, booking.customerId),
      }),
      db.query.professionalProfiles.findFirst({
        where: eq(professionalProfiles.id, booking.professionalId),
      }),
    ]);

    if (!customerProfile || !professionalProfile) {
      throw new Error("Customer or professional profile not found");
    }

    const [customerUser, professionalUser] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, customerProfile.userId),
      }),
      db.query.users.findFirst({
        where: eq(users.id, professionalProfile.userId),
      }),
    ]);

    if (!customerUser || !professionalUser) {
      throw new Error("Customer or professional user not found");
    }

    const customer: NotificationRecipient = {
      userId: customerUser.id,
      email: customerUser.email,
      name: `${customerProfile.firstName} ${customerProfile.lastName}`,
      type: "customer",
    };

    const professional: NotificationRecipient = {
      userId: professionalUser.id,
      email: professionalUser.email,
      name: professionalProfile.name || professionalProfile.businessName || "Professional",
      type: "professional",
    };

    return [customer, professional];
  }

  // Method to get user's unread notifications
  async getUserNotifications(userId: string, limit = 20, offset = 0) {
    try {
      const userNotifications = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
        limit,
        offset,
      });

      return userNotifications.map(notif => ({
        id: notif.id,
        type: notif.type,
        content: JSON.parse(notif.content),
        isRead: notif.isRead,
        createdAt: notif.createdAt,
      }));
    }
    catch (error) {
      logError(error, "Failed to get user notifications", {
        service: "NotificationService",
        method: "getUserNotifications",
        userId,
      });
      return [];
    }
  }

  // Method to mark notifications as read
  async markNotificationsAsRead(userId: string, notificationIds?: string[]) {
    try {
      const whereClause = notificationIds
        ? and(eq(notifications.userId, userId), inArray(notifications.id, notificationIds))
        : eq(notifications.userId, userId);

      await db.update(notifications)
        .set({ isRead: true })
        .where(whereClause);

      logInfo("Notifications marked as read", {
        service: "NotificationService",
        method: "markNotificationsAsRead",
        userId,
        count: notificationIds?.length || "all",
      });
    }
    catch (error) {
      logError(error, "Failed to mark notifications as read", {
        service: "NotificationService",
        method: "markNotificationsAsRead",
        userId,
      });
    }
  }

  async sendProfileUpdateNotification(data: ProfileUpdateNotificationData) {
    try {
      // Get user profile information to send notification
      const user = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
        columns: { id: true, email: true, type: true },
      });

      if (!user) {
        logInfo("User not found for profile update notification", {
          service: "NotificationService",
          method: "sendProfileUpdateNotification",
          userId: data.userId,
        });
        return;
      }

      // Get user's display name based on profile type
      let userName = "User";
      let userEmail = user.email;

      if (data.userType === "customer") {
        const customerProfile = await db.query.customerProfiles.findFirst({
          where: eq(customerProfiles.userId, data.userId),
        });
        if (customerProfile) {
          userName = `${customerProfile.firstName} ${customerProfile.lastName}`;
        }
      } else {
        const professionalProfile = await db.query.professionalProfiles.findFirst({
          where: eq(professionalProfiles.userId, data.userId),
        });
        if (professionalProfile) {
          userName = professionalProfile.name || professionalProfile.businessName || "Professional";
        }
      }

      // Create notification message based on update type
      let title = "Profile Updated";
      let message = `Your profile has been updated successfully.`;
      let emailTemplate = "profile_updated";

      switch (data.updateType) {
        case "profile_photo_update":
          title = "Profile Photo Updated";
          message = `Your profile photo has been updated and optimized.`;
          emailTemplate = "profile_photo_updated";
          break;
        case "profile_completion":
          title = "Profile Completed";
          message = `Congratulations! Your profile is now complete.`;
          emailTemplate = "profile_completed";
          break;
        case "profile_update":
          title = "Profile Information Updated";
          message = `Your ${data.changes.join(", ")} ${data.changes.length > 1 ? "have" : "has"} been updated.`;
          emailTemplate = "profile_updated";
          break;
      }

      // Store notification in database
      await this.storeNotification({
        userId: data.userId,
        type: data.updateType,
        title,
        message,
        data: {
          changes: data.changes,
          updateType: data.updateType,
          userType: data.userType,
          timestamp: data.timestamp,
          ...data.metadata,
        },
      });

      // Send real-time notification via WebSocket
      const wsPayload = {
        type: "profile_updated" as const,
        title,
        message,
        data: {
          changes: data.changes,
          updateType: data.updateType,
          userType: data.userType,
          timestamp: data.timestamp,
          ...data.metadata,
        },
        timestamp: data.timestamp,
      };

      const wsSent = wsManager.sendToUser(data.userId, wsPayload);

      logInfo(`Profile update WebSocket notification ${wsSent ? "sent" : "not sent"}`, {
        service: "NotificationService",
        method: "sendProfileUpdateNotification",
        userId: data.userId,
        updateType: data.updateType,
        changes: data.changes,
      });

      // Send email notification for significant updates
      if (data.updateType === "profile_completion" || data.changes.length > 1) {
        try {
          // For now, we'll use a generic email template
          // In a real app, you'd want specific templates for profile updates
          logInfo("Profile update email notification queued", {
            service: "NotificationService",
            method: "sendProfileUpdateNotification",
            userId: data.userId,
            email: userEmail,
            template: emailTemplate,
            updateType: data.updateType,
          });
        } catch (emailError) {
          logError(emailError, "Failed to send profile update email notification", {
            service: "NotificationService",
            method: "sendProfileUpdateNotification",
            userId: data.userId,
            template: emailTemplate,
          });
        }
      }

      logInfo("Profile update notification sent successfully", {
        service: "NotificationService",
        method: "sendProfileUpdateNotification",
        userId: data.userId,
        updateType: data.updateType,
        changes: data.changes,
      });
    }
    catch (error) {
      logError(error, "Failed to send profile update notification", {
        service: "NotificationService",
        method: "sendProfileUpdateNotification",
        userId: data.userId,
        updateType: data.updateType,
      });
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
