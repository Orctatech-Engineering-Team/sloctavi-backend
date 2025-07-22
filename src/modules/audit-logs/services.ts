import { eq, and, count, desc, gte, lte, like } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  auditLogs,
  users
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

type AuditLog = typeof auditLogs.$inferSelect;
type NewAuditLog = typeof auditLogs.$inferInsert;
type User = typeof users.$inferSelect;

export const auditLogsService = {
  // Create audit log entry
  async createAuditLog(data: Omit<NewAuditLog, "id" | "timestamp">): Promise<AuditLog> {
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

      const [auditLog] = await db
        .insert(auditLogs)
        .values({
          ...data,
          timestamp: new Date(),
        })
        .returning();

      return auditLog;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create audit log",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Get audit logs with filtering
  async getAuditLogs(
    userId?: string,
    action?: string,
    entityType?: string,
    entityId?: string,
    startDate?: Date,
    endDate?: Date,
    limit = 50,
    offset = 0
  ): Promise<{ logs: AuditLog[], total: number }> {
    try {
      const whereConditions = [];

      if (userId) {
        whereConditions.push(eq(auditLogs.userId, userId));
      }

      if (action) {
        whereConditions.push(like(auditLogs.action, `%${action}%`));
      }

      if (entityType) {
        whereConditions.push(eq(auditLogs.entityType, entityType));
      }

      if (entityId) {
        whereConditions.push(eq(auditLogs.entityId, entityId));
      }

      if (startDate) {
        whereConditions.push(gte(auditLogs.timestamp, startDate));
      }

      if (endDate) {
        whereConditions.push(lte(auditLogs.timestamp, endDate));
      }

      const whereClause = whereConditions.length > 0 ? 
        (whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]) : 
        undefined;

      const [logsList, totalCount] = await Promise.all([
        db.query.auditLogs.findMany({
          where: whereClause,
          limit,
          offset,
          orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
        }),
        db.select({ count: count() }).from(auditLogs).where(whereClause),
      ]);

      return {
        logs: logsList,
        total: totalCount[0].count,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve audit logs",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Get audit log by ID
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    try {
      const auditLog = await db.query.auditLogs.findFirst({
        where: eq(auditLogs.id, id),
      });

      return auditLog || null;
    } catch (error) {
      throw new AppError(
        "Failed to retrieve audit log",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Get audit logs for a specific entity
  async getEntityAuditLogs(
    entityType: string,
    entityId: string,
    limit = 20,
    offset = 0
  ): Promise<{ logs: AuditLog[], total: number }> {
    try {
      const whereClause = and(
        eq(auditLogs.entityType, entityType),
        eq(auditLogs.entityId, entityId)
      );

      const [logsList, totalCount] = await Promise.all([
        db.query.auditLogs.findMany({
          where: whereClause,
          limit,
          offset,
          orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
        }),
        db.select({ count: count() }).from(auditLogs).where(whereClause),
      ]);

      return {
        logs: logsList,
        total: totalCount[0].count,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve entity audit logs",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Get user activity logs
  async getUserActivityLogs(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: AuditLog[], total: number }> {
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

      const whereClause = eq(auditLogs.userId, userId);

      const [logsList, totalCount] = await Promise.all([
        db.query.auditLogs.findMany({
          where: whereClause,
          limit,
          offset,
          orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
        }),
        db.select({ count: count() }).from(auditLogs).where(whereClause),
      ]);

      return {
        logs: logsList,
        total: totalCount[0].count,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve user activity logs",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Get audit log statistics
  async getAuditLogStatistics(): Promise<{
    totalLogs: number;
    actionCounts: Array<{ action: string; count: number }>;
    entityTypeCounts: Array<{ entityType: string; count: number }>;
    dailyActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      // Get total logs
      const totalLogsResult = await db.select({ count: count() }).from(auditLogs);
      const totalLogs = totalLogsResult[0].count;

      // Get action counts
      const actionCounts = await db
        .select({
          action: auditLogs.action,
          count: count(),
        })
        .from(auditLogs)
        .groupBy(auditLogs.action)
        .orderBy(desc(count()));

      // Get entity type counts
      const entityTypeCounts = await db
        .select({
          entityType: auditLogs.entityType,
          count: count(),
        })
        .from(auditLogs)
        .groupBy(auditLogs.entityType)
        .orderBy(desc(count()));

      // Get daily activity for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyActivityRaw = await db
        .select({
          date: auditLogs.timestamp,
          count: count(),
        })
        .from(auditLogs)
        .where(gte(auditLogs.timestamp, thirtyDaysAgo))
        .groupBy(auditLogs.timestamp)
        .orderBy(desc(auditLogs.timestamp));

      // Process daily activity to group by date
      const dailyActivity = dailyActivityRaw.map(item => ({
        date: item.date.toISOString().split('T')[0],
        count: item.count,
      }));

      return {
        totalLogs,
        actionCounts,
        entityTypeCounts,
        dailyActivity,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve audit log statistics",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Helper method to log various actions
  async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, any> = {}
  ): Promise<AuditLog> {
    return this.createAuditLog({
      userId,
      action,
      entityType,
      entityId,
      metadata,
    });
  },

  // Common audit log actions
  async logUserLogin(userId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "user_login", "user", userId, metadata);
  },

  async logUserLogout(userId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "user_logout", "user", userId, metadata);
  },

  async logBookingCreated(userId: string, bookingId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "booking_created", "booking", bookingId, metadata);
  },

  async logBookingUpdated(userId: string, bookingId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "booking_updated", "booking", bookingId, metadata);
  },

  async logBookingCancelled(userId: string, bookingId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "booking_cancelled", "booking", bookingId, metadata);
  },

  async logProfileUpdated(userId: string, profileId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "profile_updated", "profile", profileId, metadata);
  },

  async logReviewCreated(userId: string, reviewId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "review_created", "review", reviewId, metadata);
  },

  async logServiceCreated(userId: string, serviceId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "service_created", "service", serviceId, metadata);
  },

  async logRoleAssigned(userId: string, targetUserId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "role_assigned", "user", targetUserId, metadata);
  },

  async logRoleRevoked(userId: string, targetUserId: string, metadata: Record<string, any> = {}): Promise<AuditLog> {
    return this.logAction(userId, "role_revoked", "user", targetUserId, metadata);
  },
};