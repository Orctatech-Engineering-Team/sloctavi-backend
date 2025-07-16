import { eq, and } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  availability, 
  professionalProfiles,
  type Availability,
  type NewAvailability 
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

export const availabilityService = {
  async createAvailability(professionalId: string, data: Omit<NewAvailability, "professionalId">): Promise<Availability> {
    try {
      // Check if professional exists
      const professional = await db.query.professionalProfiles.findFirst({
        where: eq(professionalProfiles.id, professionalId),
      });

      if (!professional) {
        throw new AppError(
          "Professional profile not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check for overlapping availability
      const existing = await db.query.availability.findFirst({
        where: and(
          eq(availability.professionalId, professionalId),
          eq(availability.day, data.day),
        ),
      });

      if (existing) {
        throw new AppError(
          "Availability already exists for this day",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      const [newAvailability] = await db
        .insert(availability)
        .values({
          ...data,
          professionalId,
        })
        .returning();

      return newAvailability;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create availability",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getAvailability(professionalId?: string): Promise<Availability[]> {
    try {
      if (professionalId) {
        return await db.query.availability.findMany({
          where: eq(availability.professionalId, professionalId),
          orderBy: (availability, { asc }) => [asc(availability.day), asc(availability.fromTime)],
        });
      }

      return await db.query.availability.findMany({
        orderBy: (availability, { asc }) => [asc(availability.day), asc(availability.fromTime)],
      });
    } catch (error) {
      throw new AppError(
        "Failed to retrieve availability",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getProfessionalAvailability(professionalId: string): Promise<Availability[]> {
    try {
      return await db.query.availability.findMany({
        where: eq(availability.professionalId, professionalId),
        orderBy: (availability, { asc }) => [asc(availability.day), asc(availability.fromTime)],
      });
    } catch (error) {
      throw new AppError(
        "Failed to retrieve professional availability",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateAvailability(
    id: number,
    professionalId: string,
    data: Partial<Omit<NewAvailability, "professionalId">>
  ): Promise<Availability> {
    try {
      // Check if availability exists and belongs to professional
      const existing = await db.query.availability.findFirst({
        where: and(
          eq(availability.id, id),
          eq(availability.professionalId, professionalId),
        ),
      });

      if (!existing) {
        throw new AppError(
          "Availability not found or unauthorized",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const [updated] = await db
        .update(availability)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(availability.id, id))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to update availability",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async deleteAvailability(id: number, professionalId: string): Promise<void> {
    try {
      // Check if availability exists and belongs to professional
      const existing = await db.query.availability.findFirst({
        where: and(
          eq(availability.id, id),
          eq(availability.professionalId, professionalId),
        ),
      });

      if (!existing) {
        throw new AppError(
          "Availability not found or unauthorized",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      await db.delete(availability).where(eq(availability.id, id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to delete availability",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};