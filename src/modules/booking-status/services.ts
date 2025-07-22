import { eq, and, count, desc } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  bookingStatus, 
  bookingStatusHistory,
  bookings,
  users
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

type BookingStatus = typeof bookingStatus.$inferSelect;
type BookingStatusHistory = typeof bookingStatusHistory.$inferSelect;
type NewBookingStatus = typeof bookingStatus.$inferInsert;
type NewBookingStatusHistory = typeof bookingStatusHistory.$inferInsert;
type Booking = typeof bookings.$inferSelect;
type User = typeof users.$inferSelect;

export const bookingStatusService = {
  // Booking Status Management
  async getBookingStatuses(limit = 20, offset = 0): Promise<{ statuses: BookingStatus[], total: number }> {
    try {
      const [statusesList, totalCount] = await Promise.all([
        db.query.bookingStatus.findMany({
          limit,
          offset,
          orderBy: (bookingStatus, { asc }) => [asc(bookingStatus.name)],
        }),
        db.select({ count: count() }).from(bookingStatus),
      ]);

      return {
        statuses: statusesList,
        total: totalCount[0].count,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve booking statuses",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getBookingStatusById(id: number): Promise<BookingStatus | null> {
    try {
      const status = await db.query.bookingStatus.findFirst({
        where: eq(bookingStatus.id, id),
      });

      return status || null;
    } catch (error) {
      throw new AppError(
        "Failed to retrieve booking status",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async createBookingStatus(data: Omit<NewBookingStatus, "id" | "createdAt" | "updatedAt">): Promise<BookingStatus> {
    try {
      // Check if status name already exists
      const existingStatus = await db.query.bookingStatus.findFirst({
        where: eq(bookingStatus.name, data.name),
      });

      if (existingStatus) {
        throw new AppError(
          "Booking status name already exists",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      const [status] = await db
        .insert(bookingStatus)
        .values(data)
        .returning();

      return status;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create booking status",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateBookingStatus(id: number, data: Partial<Omit<NewBookingStatus, "id" | "createdAt" | "updatedAt">>): Promise<BookingStatus> {
    try {
      // Check if status exists
      const existing = await db.query.bookingStatus.findFirst({
        where: eq(bookingStatus.id, id),
      });

      if (!existing) {
        throw new AppError(
          "Booking status not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if name is being updated and if it already exists
      if (data.name && data.name !== existing.name) {
        const existingStatus = await db.query.bookingStatus.findFirst({
          where: eq(bookingStatus.name, data.name),
        });

        if (existingStatus) {
          throw new AppError(
            "Booking status name already exists",
            HttpStatusCodes.BAD_REQUEST,
          );
        }
      }

      const [updated] = await db
        .update(bookingStatus)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(bookingStatus.id, id))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to update booking status",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async deleteBookingStatus(id: number): Promise<void> {
    try {
      // Check if status exists
      const existing = await db.query.bookingStatus.findFirst({
        where: eq(bookingStatus.id, id),
      });

      if (!existing) {
        throw new AppError(
          "Booking status not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if status is used in any bookings
      const bookingsWithStatus = await db.query.bookings.findMany({
        where: eq(bookings.status, id),
        limit: 1,
      });

      if (bookingsWithStatus.length > 0) {
        throw new AppError(
          "Cannot delete booking status that is used in bookings",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      await db.delete(bookingStatus).where(eq(bookingStatus.id, id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to delete booking status",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Booking Status History Management
  async getBookingStatusHistory(
    bookingId?: string,
    limit = 20,
    offset = 0
  ): Promise<{ history: BookingStatusHistory[], total: number }> {
    try {
      const whereClause = bookingId ? eq(bookingStatusHistory.bookingId, bookingId) : undefined;

      const [historyList, totalCount] = await Promise.all([
        db.query.bookingStatusHistory.findMany({
          where: whereClause,
          limit,
          offset,
          orderBy: (bookingStatusHistory, { desc }) => [desc(bookingStatusHistory.changedAt)],
        }),
        db.select({ count: count() }).from(bookingStatusHistory).where(whereClause),
      ]);

      return {
        history: historyList,
        total: totalCount[0].count,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve booking status history",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async createBookingStatusHistory(
    bookingId: string,
    oldStatus: string,
    newStatus: string,
    changedBy?: string
  ): Promise<BookingStatusHistory> {
    try {
      // Check if booking exists
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });

      if (!booking) {
        throw new AppError(
          "Booking not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if changedBy user exists (if provided)
      if (changedBy) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, changedBy),
        });

        if (!user) {
          throw new AppError(
            "User not found",
            HttpStatusCodes.NOT_FOUND,
          );
        }
      }

      const [history] = await db
        .insert(bookingStatusHistory)
        .values({
          bookingId,
          oldStatus,
          NewStatus: newStatus,
          changedBy,
        })
        .returning();

      return history;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create booking status history",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateBookingStatusWithHistory(
    bookingId: string,
    newStatusId: number,
    changedBy?: string
  ): Promise<{ booking: Booking; history: BookingStatusHistory }> {
    try {
      // Check if booking exists
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });

      if (!booking) {
        throw new AppError(
          "Booking not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if new status exists
      const newStatus = await db.query.bookingStatus.findFirst({
        where: eq(bookingStatus.id, newStatusId),
      });

      if (!newStatus) {
        throw new AppError(
          "Booking status not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Get current status for history
      const currentStatus = await db.query.bookingStatus.findFirst({
        where: eq(bookingStatus.id, booking.status),
      });

      // Update booking status
      const [updatedBooking] = await db
        .update(bookings)
        .set({
          status: newStatusId,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      // Create status history entry
      const history = await this.createBookingStatusHistory(
        bookingId,
        currentStatus?.name || "unknown",
        newStatus.name,
        changedBy
      );

      return {
        booking: updatedBooking,
        history,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to update booking status with history",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getBookingStatusStatistics(): Promise<{
    statusCounts: Array<{ status: string; count: number }>;
    totalBookings: number;
    recentStatusChanges: Array<{
      bookingId: string;
      oldStatus: string;
      newStatus: string;
      changedAt: Date;
      changedBy?: string;
    }>;
  }> {
    try {
      // Get status counts
      const statusCounts = await db
        .select({
          statusId: bookings.status,
          count: count(),
        })
        .from(bookings)
        .groupBy(bookings.status);

      // Get status names for the counts
      const statusCountsWithNames = await Promise.all(
        statusCounts.map(async (sc) => {
          const status = await db.query.bookingStatus.findFirst({
            where: eq(bookingStatus.id, sc.statusId),
          });
          return {
            status: status?.name || "unknown",
            count: sc.count,
          };
        })
      );

      // Get total bookings
      const totalBookings = statusCountsWithNames.reduce(
        (sum, sc) => sum + sc.count,
        0
      );

      // Get recent status changes
      const recentChanges = await db.query.bookingStatusHistory.findMany({
        limit: 10,
        orderBy: (bookingStatusHistory, { desc }) => [desc(bookingStatusHistory.changedAt)],
      });

      return {
        statusCounts: statusCountsWithNames,
        totalBookings,
        recentStatusChanges: recentChanges.map((change) => ({
          bookingId: change.bookingId,
          oldStatus: change.oldStatus,
          newStatus: change.NewStatus,
          changedAt: change.changedAt!,
          changedBy: change.changedBy || undefined,
        })),
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve booking status statistics",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};