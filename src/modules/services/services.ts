import { eq, and, count } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  services, 
  professions,
  type Service,
  type NewService,
  type Profession 
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

export const servicesService = {
  async getServices(professionId?: number, limit = 20, offset = 0): Promise<{ services: Service[], total: number }> {
    try {
      const whereClause = professionId 
        ? and(eq(services.professionId, professionId), eq(services.isActive, true))
        : eq(services.isActive, true);

      const [servicesList, totalCount] = await Promise.all([
        db.query.services.findMany({
          where: whereClause,
          limit,
          offset,
          orderBy: (services, { asc }) => [asc(services.name)],
        }),
        db.select({ count: count() }).from(services).where(whereClause),
      ]);

      return {
        services: servicesList,
        total: totalCount[0].count,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve services",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async createService(data: NewService): Promise<Service> {
    try {
      // Check if profession exists
      const profession = await db.query.professions.findFirst({
        where: eq(professions.id, data.professionId),
      });

      if (!profession) {
        throw new AppError(
          "Profession not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const [service] = await db
        .insert(services)
        .values(data)
        .returning();

      return service;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateService(id: number, data: Partial<NewService>): Promise<Service> {
    try {
      // Check if service exists
      const existing = await db.query.services.findFirst({
        where: eq(services.id, id),
      });

      if (!existing) {
        throw new AppError(
          "Service not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const [updated] = await db
        .update(services)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(services.id, id))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to update service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async deleteService(id: number): Promise<void> {
    try {
      // Check if service exists
      const existing = await db.query.services.findFirst({
        where: eq(services.id, id),
      });

      if (!existing) {
        throw new AppError(
          "Service not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Soft delete by setting isActive to false
      await db
        .update(services)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(services.id, id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to delete service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getProfessions(): Promise<Profession[]> {
    try {
      return await db.query.professions.findMany({
        where: eq(professions.isActive, true),
        orderBy: (professions, { asc }) => [asc(professions.name)],
      });
    } catch (error) {
      throw new AppError(
        "Failed to retrieve professions",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getServiceById(id: number): Promise<Service | null> {
    try {
      const service = await db.query.services.findFirst({
        where: and(eq(services.id, id), eq(services.isActive, true)),
      });

      return service || null;
    } catch (error) {
      throw new AppError(
        "Failed to retrieve service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};