import { eq, and, ne, desc, asc } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { AppError } from "@/utils/error";
import db from "@/db";
import { availability, bookings } from "@/db/schema/schema";

import type {
  CreateAvailability,
  UpdateAvailability,
  AvailabilityFilters,
  AvailabilityList,
  WeeklyAvailability,
  TimeSlotConflict,
  BulkAvailabilityResult,
} from "./schema";

export const availabilityService = {
  // Get professional's availability with filters
  async getProfessionalAvailability(
    professionalId: string,
    filters: AvailabilityFilters
  ): Promise<AvailabilityList> {
    try {
      const whereConditions = [eq(availability.professionalId, professionalId)];

      // Apply filters
      if (filters.day !== undefined) {
        whereConditions.push(eq(availability.day, filters.day));
      }

      if (filters.professionalId) {
        whereConditions.push(eq(availability.professionalId, filters.professionalId));
      }

      // Get paginated results
      const availabilities = await db.query.availability.findMany({
        where: and(...whereConditions),
        orderBy: [asc(availability.day), asc(availability.fromTime)],
      });

      return {
        availabilities,
        total: availabilities.length,
      };
    } catch (error) {
      throw new AppError(
        "Failed to get professional availability",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Create new availability slot
  async createAvailability(data: CreateAvailability & { professionalId: string }) {
    try {
      const [newSlot] = await db
        .insert(availability)
        .values({
          professionalId: data.professionalId,
          day: data.day,
          fromTime: data.fromTime,
          toTime: data.toTime,
          capacity: data.capacity,
          detailed: data.detailed,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newSlot;
    } catch (error) {
      throw new AppError(
        "Failed to create availability slot",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Update availability slot
  async updateAvailability(id: number, data: UpdateAvailability) {
    try {
      const updateData: any = {};
      
      if (data.day !== undefined) updateData.day = data.day;
      if (data.fromTime !== undefined) updateData.fromTime = data.fromTime;
      if (data.toTime !== undefined) updateData.toTime = data.toTime;
      if (data.capacity !== undefined) updateData.capacity = data.capacity;
      if (data.detailed !== undefined) updateData.detailed = data.detailed;

      const [updatedSlot] = await db
        .update(availability)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(availability.id, id))
        .returning();

      if (!updatedSlot) {
        throw new AppError("Availability slot not found", HttpStatusCodes.NOT_FOUND);
      }

      return updatedSlot;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to update availability slot",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Delete availability slot
  async deleteAvailability(id: number): Promise<void> {
    try {
      const result = await db
        .delete(availability)
        .where(eq(availability.id, id))
        .returning();

      if (result.length === 0) {
        throw new AppError("Availability slot not found", HttpStatusCodes.NOT_FOUND);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to delete availability slot",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Check for time slot conflicts
  async checkTimeSlotConflicts(
    professionalId: string,
    fromTime: string,
    toTime: string,
    day: string,
    excludeId?: string
  ): Promise<TimeSlotConflict[]> {
    try {
      const whereConditions = [
        eq(availability.professionalId, professionalId),
        eq(availability.day, Number(day)),
      ];

      if (excludeId) {
        whereConditions.push(ne(availability.id, Number(excludeId)));
      }

      const conflictingSlots = await db.query.availability.findMany({
        where: and(...whereConditions),
      });

      // Check for time overlaps
      const conflicts: TimeSlotConflict[] = [];
      for (const slot of conflictingSlots) {
        const existingStart = slot.fromTime;
        const existingEnd = slot.toTime;
        
        // Check if there's any overlap
        if (
          (fromTime >= existingStart && fromTime < existingEnd) ||
          (toTime > existingStart && toTime <= existingEnd) ||
          (fromTime <= existingStart && toTime >= existingEnd)
        ) {
          conflicts.push({
            id: slot.id,
            day: slot.day,
            fromTime: slot.fromTime,
            toTime: slot.toTime,
            professionalId: slot.professionalId,
          });
        }
      }

      return conflicts;
    } catch (error) {
      throw new AppError(
        "Failed to check time conflicts",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Get weekly availability view
  async getWeeklyAvailability(
    professionalId: string,
    date?: string
  ): Promise<WeeklyAvailability> {
    try {
      // Get all availability for the professional
      const allSlots = await db.query.availability.findMany({
        where: eq(availability.professionalId, professionalId),
        orderBy: [asc(availability.day), asc(availability.fromTime)],
      });

      // Group by day of week
      const weeklySlots = {
        sunday: allSlots.filter(slot => slot.day === 0),
        monday: allSlots.filter(slot => slot.day === 1),
        tuesday: allSlots.filter(slot => slot.day === 2),
        wednesday: allSlots.filter(slot => slot.day === 3),
        thursday: allSlots.filter(slot => slot.day === 4),
        friday: allSlots.filter(slot => slot.day === 5),
        saturday: allSlots.filter(slot => slot.day === 6),
      };

      return weeklySlots;
    } catch (error) {
      throw new AppError(
        "Failed to get weekly availability",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Bulk create availability slots
  async bulkCreateAvailability(
    professionalId: string,
    slots: CreateAvailability[]
  ): Promise<BulkAvailabilityResult> {
    try {
      const created = [];
      const errors = [];

      // Process each slot
      for (const [index, slotData] of slots.entries()) {
        try {
          // Check for conflicts
          const slotConflicts = await this.checkTimeSlotConflicts(
            professionalId,
            slotData.fromTime,
            slotData.toTime,
            String(slotData.day)
          );

          if (slotConflicts.length > 0) {
            errors.push({
              index,
              error: `Time slot conflicts with existing availability: ${slotData.day} ${slotData.fromTime}-${slotData.toTime}`,
            });
            continue;
          }

          // Create the slot
          const newSlot = await this.createAvailability({
            professionalId,
            ...slotData,
          });

          created.push(newSlot);
        } catch (error) {
          errors.push({
            index,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        created: created.length,
        updated: 0,
        deleted: 0,
        errors,
      };
    } catch (error) {
      throw new AppError(
        "Failed to bulk create availability",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Get available slots for booking
  async getAvailableSlots(
    professionalId: string,
    date: string,
    duration?: number
  ) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      // Get availability slots for this day
      const slots = await db.query.availability.findMany({
        where: and(
          eq(availability.professionalId, professionalId),
          eq(availability.day, dayOfWeek)
        ),
        orderBy: [asc(availability.fromTime)],
      });

      if (!duration) {
        return slots;
      }

      // Filter slots that can accommodate the required duration
      return slots.filter(slot => {
        const start = new Date(`2000-01-01T${slot.fromTime}`);
        const end = new Date(`2000-01-01T${slot.toTime}`);
        const slotDuration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
        return slotDuration >= duration;
      });
    } catch (error) {
      throw new AppError(
        "Failed to get available slots",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },
};

export default availabilityService;
