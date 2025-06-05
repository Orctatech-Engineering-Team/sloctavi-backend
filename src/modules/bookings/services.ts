import { and, asc, desc, eq, lte } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import {
  availability,
  type Booking,
  bookings,
  bookingStatus,
  bookingStatusHistory,
  customerProfiles,
  type NewBooking,
  professionalProfiles,
  services,
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";
import { timesOverlap } from "@/utils/timeUtils";

import type { BookingWithDetails } from "./schema";

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  availabilityId: number;
}

export const bookingService = {
  async createBooking(
    customerId: string,
    bookingData: Omit<NewBooking, "id" | "customerId" | "status" | "createdAt">,
  ): Promise<BookingWithDetails> {
    try {
      // Validate professional exists and is active
      const professional = await db.query.professionalProfiles.findFirst({
        where: and(
          eq(professionalProfiles.id, bookingData.professionalId),
          eq(professionalProfiles.isActive, true),
        ),
      });

      if (!professional) {
        throw new AppError("Professional not found or inactive", HttpStatusCodes.BAD_REQUEST);
      }

      // Validate service exists
      const service = await db.query.services.findFirst({
        where: and(
          eq(services.id, bookingData.serviceId),
          eq(services.isActive, true),
        ),
      });

      if (!service) {
        throw new AppError("Service not found or inactive", HttpStatusCodes.BAD_REQUEST);
      }

      // Check if time slot is available
      const isAvailable = await this.checkTimeSlotAvailability(
        bookingData.professionalId,
        bookingData.date,
        bookingData.time,
        bookingData.duration,
      );

      if (!isAvailable) {
        throw new AppError("Time slot is not available", HttpStatusCodes.BAD_REQUEST);
      }

      // Create booking with default pending status (1)
      const [newBooking] = await db.insert(bookings).values({
        ...bookingData,
        customerId,
        status: 1, // pending
      }).returning();

      // Log status history
      await db.insert(bookingStatusHistory).values({
        bookingId: newBooking.id,
        oldStatus: "new",
        NewStatus: "pending",
        changedBy: customerId,
      });

      // Return booking with details
      return await this.getBookingById(newBooking.id, customerId);
    }
    catch (error) {
      if (error instanceof AppError)
        throw error;
      throw new AppError(
        "Failed to create booking",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getBookingById(bookingId: string, userId: string): Promise<BookingWithDetails> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: {
          // Add relations if defined in schema
        },
      });

      if (!booking) {
        throw new AppError("Booking not found", HttpStatusCodes.NOT_FOUND);
      }

      // Get related data manually since relations might not be defined
      const [customer, professional, service, status] = await Promise.all([
        db.query.customerProfiles.findFirst({
          where: eq(customerProfiles.id, booking.customerId),
        }),
        db.query.professionalProfiles.findFirst({
          where: eq(professionalProfiles.id, booking.professionalId),
        }),
        db.query.services.findFirst({
          where: eq(services.id, booking.serviceId),
        }),
        db.query.bookingStatus.findFirst({
          where: eq(bookingStatus.id, booking.status),
        }),
      ]);

      if (!customer || !professional || !service || !status) {
        throw new AppError("Booking data incomplete", HttpStatusCodes.INTERNAL_SERVER_ERROR);
      }

      // Verify user has access to this booking
      if (booking.customerId !== userId && professional.userId !== userId) {
        throw new AppError("Access denied", HttpStatusCodes.FORBIDDEN);
      }

      return {
        ...booking,
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: customer.phoneNumber,
          profileImage: customer.profileImage,
        },
        professional: {
          name: professional.name || "",
          businessName: professional.businessName,
          location: professional.location,
          profileImage: professional.profileImage,
          rating: professional.rating,
        },
        service: {
          name: service.name,
          description: service.description,
          durationEstimate: service.durationEstimate,
        },
        bookingStatus: {
          name: status.name,
          description: status.description,
        },
      };
    }
    catch (error) {
      if (error instanceof AppError)
        throw error;
      throw new AppError(
        "Failed to retrieve booking",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getUserBookings(
    userId: string,
    role: "customer" | "professional",
    filters: {
      status?: string;
      limit: number;
      offset: number;
    },
  ): Promise<{ bookings: BookingWithDetails[]; total: number; hasMore: boolean }> {
    try {
      // First, get the profile ID based on role
      let profileId: string;

      if (role === "customer") {
        const customerProfile = await db.query.customerProfiles.findFirst({
          where: eq(customerProfiles.userId, userId),
        });
        if (!customerProfile) {
          throw new AppError("Customer profile not found", HttpStatusCodes.NOT_FOUND);
        }
        profileId = customerProfile.id;
      }
      else {
        const professionalProfile = await db.query.professionalProfiles.findFirst({
          where: eq(professionalProfiles.userId, userId),
        });
        if (!professionalProfile) {
          throw new AppError("Professional profile not found", HttpStatusCodes.NOT_FOUND);
        }
        profileId = professionalProfile.id;
      }

      // Build where conditions
      const whereConditions = [
        role === "customer"
          ? eq(bookings.customerId, profileId)
          : eq(bookings.professionalId, profileId),
      ];

      // Add status filter if provided
      if (filters.status) {
        const statusRecord = await db.query.bookingStatus.findFirst({
          where: eq(bookingStatus.name, filters.status),
        });
        if (statusRecord) {
          whereConditions.push(eq(bookings.status, statusRecord.id));
        }
      }

      // Get total count
      const totalBookings = await db.select().from(bookings).where(and(...whereConditions));
      const total = totalBookings.length;

      // Get paginated bookings
      const bookingRecords = await db.select().from(bookings).where(and(...whereConditions)).orderBy(desc(bookings.createdAt)).limit(filters.limit).offset(filters.offset);

      // Enhance with details
      const enhancedBookings: BookingWithDetails[] = [];

      for (const booking of bookingRecords) {
        const [customer, professional, service, status] = await Promise.all([
          db.query.customerProfiles.findFirst({
            where: eq(customerProfiles.id, booking.customerId),
          }),
          db.query.professionalProfiles.findFirst({
            where: eq(professionalProfiles.id, booking.professionalId),
          }),
          db.query.services.findFirst({
            where: eq(services.id, booking.serviceId),
          }),
          db.query.bookingStatus.findFirst({
            where: eq(bookingStatus.id, booking.status),
          }),
        ]);

        if (customer && professional && service && status) {
          enhancedBookings.push({
            ...booking,
            customer: role === "professional"
              ? {
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  phoneNumber: customer.phoneNumber,
                  profileImage: customer.profileImage,
                }
              : undefined,
            professional: role === "customer"
              ? {
                  name: professional.name || "",
                  businessName: professional.businessName,
                  location: professional.location,
                  profileImage: professional.profileImage,
                  rating: professional.rating,
                }
              : undefined,
            service: {
              name: service.name,
              durationEstimate: service.durationEstimate,
              description: service.description,
            },
            bookingStatus: {
              name: status.name,
              description: status.description,
            },
          });
        }
      }

      return {
        bookings: enhancedBookings,
        total,
        hasMore: (filters.offset + filters.limit) < total,
      };
    }
    catch (error) {
      if (error instanceof AppError)
        throw error;
      throw new AppError(
        "Failed to retrieve user bookings",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateBookingStatus(
    bookingId: string,
    newStatus: number,
    userId: string,
    notes?: string,
  ): Promise<BookingWithDetails> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });

      if (!booking) {
        throw new AppError("Booking not found", HttpStatusCodes.NOT_FOUND);
      }

      // Verify the user is the professional for this booking
      const professional = await db.query.professionalProfiles.findFirst({
        where: eq(professionalProfiles.id, booking.professionalId),
      });

      if (!professional || professional.userId !== userId) {
        throw new AppError("Access denied", HttpStatusCodes.FORBIDDEN);
      }

      // Get current status name
      const currentStatus = await db.query.bookingStatus.findFirst({
        where: eq(bookingStatus.id, booking.status),
      });

      const newStatusRecord = await db.query.bookingStatus.findFirst({
        where: eq(bookingStatus.id, newStatus),
      });

      if (!newStatusRecord) {
        throw new AppError("Invalid status", HttpStatusCodes.BAD_REQUEST);
      }

      // Validate status transition (optional business logic)
      const validTransitions = this.getValidStatusTransitions(booking.status);
      if (!validTransitions.includes(newStatus)) {
        throw new AppError("Invalid status transition", HttpStatusCodes.BAD_REQUEST);
      }

      // Update booking
      await db.update(bookings)
        .set({ status: newStatus, notes: notes || booking.notes })
        .where(eq(bookings.id, bookingId));

      // Log status history
      await db.insert(bookingStatusHistory).values({
        bookingId,
        oldStatus: currentStatus?.name || "unknown",
        NewStatus: newStatusRecord.name,
        changedBy: userId,
      });

      return await this.getBookingById(bookingId, userId);
    }
    catch (error) {
      if (error instanceof AppError)
        throw error;
      throw new AppError(
        "Failed to update booking status",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<Booking> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });

      if (!booking) {
        throw new AppError("Booking not found", HttpStatusCodes.NOT_FOUND);
      }

      // Verify the user is the customer for this booking
      const customer = await db.query.customerProfiles.findFirst({
        where: eq(customerProfiles.id, booking.customerId),
      });

      if (!customer || customer.userId !== userId) {
        throw new AppError("Access denied", HttpStatusCodes.FORBIDDEN);
      }

      // Check if booking can be cancelled (not completed)
      if (booking.status === 3) { // completed
        throw new AppError("Cannot cancel completed booking", HttpStatusCodes.BAD_REQUEST);
      }

      // Update to cancelled status (assuming 4 = cancelled)
      const [updatedBooking] = await db.update(bookings)
        .set({
          status: 4, // cancelled
          notes: reason ? `${booking.notes || ""}\nCancellation reason: ${reason}`.trim() : booking.notes,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      // Log status history
      await db.insert(bookingStatusHistory).values({
        bookingId,
        oldStatus: "active",
        NewStatus: "cancelled",
        changedBy: userId,
      });

      return updatedBooking;
    }
    catch (error) {
      if (error instanceof AppError)
        throw error;
      throw new AppError(
        "Failed to cancel booking",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getAvailableSlots(
    professionalId: string,
    date: string,
    serviceId?: number,
  ): Promise<AvailableSlot[]> {
    try {
      // Get professional's availability for the day
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

      console.log(serviceId, "serviceId");
      const availabilitySlots = await db.query.availability.findMany({
        where: and(
          eq(availability.professionalId, professionalId),
          eq(availability.day, dayOfWeek),
        ),
        orderBy: asc(availability.fromTime),
      });

      if (availabilitySlots.length === 0) {
        return [];
      }

      // Get existing bookings for that date
      const existingBookings = await db.query.bookings.findMany({
        where: and(
          eq(bookings.professionalId, professionalId),
          eq(bookings.date, date),
          // Only consider non-cancelled bookings
          lte(bookings.status, 3),
        ),
      });

      // Generate time slots and check availability
      const slots: AvailableSlot[] = [];
      const slotDuration = 60; // 1 hour slots by default

      for (const availSlot of availabilitySlots) {
        const startTime = this.parseTimeString(availSlot.fromTime);
        const endTime = this.parseTimeString(availSlot.toTime);

        // Generate hourly slots within this availability window
        let currentTime = startTime;

        while (currentTime < endTime) {
          const slotStart = this.formatTime(currentTime);
          const slotEnd = this.formatTime(currentTime + slotDuration);

          // Check if this slot conflicts with existing bookings
          const isConflict = existingBookings.some((booking) => {
            const bookingStart = this.parseTimeString(booking.time);
            const bookingEnd = bookingStart + booking.duration;

            return timesOverlap(
              new Date(`${date}T${slotStart}`),
              new Date(`${date}T${slotEnd}`),
              new Date(`${date}T${this.formatTime(bookingStart)}`),
              new Date(`${date}T${this.formatTime(bookingEnd)}`),
            );
          });

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: !isConflict,
            availabilityId: availSlot.id,
          });

          currentTime += slotDuration;
        }
      }

      return slots;
    }
    catch (error) {
      throw new AppError(
        "Failed to get available slots",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Helper methods
  async checkTimeSlotAvailability(
    professionalId: string,
    date: string,
    time: string,
    duration: number,
  ): Promise<boolean> {
    const slots = await this.getAvailableSlots(professionalId, date);
    const requestedStart = this.parseTimeString(time);
    const requestedEnd = requestedStart + duration;

    return slots.some((slot) => {
      const slotStart = this.parseTimeString(slot.startTime);
      const slotEnd = this.parseTimeString(slot.endTime);

      return slot.available
        && requestedStart >= slotStart
        && requestedEnd <= slotEnd;
    });
  },

  getValidStatusTransitions(currentStatus: number): number[] {
    const transitions: Record<number, number[]> = {
      1: [2, 4], // pending -> confirmed, cancelled
      2: [3, 4], // confirmed -> completed, cancelled
      3: [], // completed -> none
      4: [], // cancelled -> none
    };

    return transitions[currentStatus] || [];
  },

  parseTimeString(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes; // Convert to minutes since midnight
  },

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  },
};

export default bookingService;
