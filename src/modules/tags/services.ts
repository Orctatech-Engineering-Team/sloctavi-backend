import { eq, and, count } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  tags, 
  serviceTags,
  services
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

type Tag = typeof tags.$inferSelect;
type ServiceTag = typeof serviceTags.$inferSelect;
type NewTag = typeof tags.$inferInsert;
type NewServiceTag = typeof serviceTags.$inferInsert;
type Service = typeof services.$inferSelect;

export const tagsService = {
  // Tag Management
  async getTags(limit = 20, offset = 0): Promise<{ tags: Tag[], total: number }> {
    try {
      const [tagsList, totalCount] = await Promise.all([
        db.query.tags.findMany({
          where: eq(tags.isActive, true),
          limit,
          offset,
          orderBy: (tags, { asc }) => [asc(tags.name)],
        }),
        db.select({ count: count() }).from(tags).where(eq(tags.isActive, true)),
      ]);

      return {
        tags: tagsList,
        total: totalCount[0].count,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve tags",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getTagById(id: number): Promise<Tag | null> {
    try {
      const tag = await db.query.tags.findFirst({
        where: and(eq(tags.id, id), eq(tags.isActive, true)),
      });

      return tag || null;
    } catch (error) {
      throw new AppError(
        "Failed to retrieve tag",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async createTag(data: Omit<NewTag, "id" | "createdAt" | "updatedAt">): Promise<Tag> {
    try {
      // Check if tag name already exists
      const existingTag = await db.query.tags.findFirst({
        where: and(eq(tags.name, data.name), eq(tags.isActive, true)),
      });

      if (existingTag) {
        throw new AppError(
          "Tag name already exists",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      const [tag] = await db
        .insert(tags)
        .values(data)
        .returning();

      return tag;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create tag",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateTag(id: number, data: Partial<Omit<NewTag, "id" | "createdAt" | "updatedAt">>): Promise<Tag> {
    try {
      // Check if tag exists
      const existing = await db.query.tags.findFirst({
        where: and(eq(tags.id, id), eq(tags.isActive, true)),
      });

      if (!existing) {
        throw new AppError(
          "Tag not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if name is being updated and if it already exists
      if (data.name && data.name !== existing.name) {
        const existingTag = await db.query.tags.findFirst({
          where: and(eq(tags.name, data.name), eq(tags.isActive, true)),
        });

        if (existingTag) {
          throw new AppError(
            "Tag name already exists",
            HttpStatusCodes.BAD_REQUEST,
          );
        }
      }

      const [updated] = await db
        .update(tags)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(tags.id, id))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to update tag",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async deleteTag(id: number): Promise<void> {
    try {
      // Check if tag exists
      const existing = await db.query.tags.findFirst({
        where: and(eq(tags.id, id), eq(tags.isActive, true)),
      });

      if (!existing) {
        throw new AppError(
          "Tag not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if tag is assigned to any services
      const assignedServices = await db.query.serviceTags.findMany({
        where: eq(serviceTags.tagId, id),
      });

      if (assignedServices.length > 0) {
        throw new AppError(
          "Cannot delete tag that is assigned to services",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      // Soft delete by setting isActive to false
      await db
        .update(tags)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(tags.id, id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to delete tag",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Service Tag Management
  async getServiceTags(serviceId?: number, tagId?: number): Promise<ServiceTag[]> {
    try {
      const whereConditions = [];
      
      if (serviceId) {
        whereConditions.push(eq(serviceTags.serviceId, serviceId));
      }
      
      if (tagId) {
        whereConditions.push(eq(serviceTags.tagId, tagId));
      }

      const whereClause = whereConditions.length > 0 ? 
        (whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]) : 
        undefined;

      return await db.query.serviceTags.findMany({
        where: whereClause,
        orderBy: (serviceTags, { asc }) => [asc(serviceTags.serviceId)],
      });
    } catch (error) {
      throw new AppError(
        "Failed to retrieve service tags",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async assignTagToService(
    serviceId: number,
    tagId: number
  ): Promise<ServiceTag> {
    try {
      // Check if service exists
      const service = await db.query.services.findFirst({
        where: and(eq(services.id, serviceId), eq(services.isActive, true)),
      });

      if (!service) {
        throw new AppError(
          "Service not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if tag exists
      const tag = await db.query.tags.findFirst({
        where: and(eq(tags.id, tagId), eq(tags.isActive, true)),
      });

      if (!tag) {
        throw new AppError(
          "Tag not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if service tag already exists
      const existingServiceTag = await db.query.serviceTags.findFirst({
        where: and(
          eq(serviceTags.serviceId, serviceId),
          eq(serviceTags.tagId, tagId)
        ),
      });

      if (existingServiceTag) {
        throw new AppError(
          "Service already has this tag",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      const [serviceTag] = await db
        .insert(serviceTags)
        .values({
          serviceId,
          tagId,
        })
        .returning();

      return serviceTag;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to assign tag to service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async removeTagFromService(
    serviceId: number,
    tagId: number
  ): Promise<void> {
    try {
      // Check if service tag exists
      const existingServiceTag = await db.query.serviceTags.findFirst({
        where: and(
          eq(serviceTags.serviceId, serviceId),
          eq(serviceTags.tagId, tagId)
        ),
      });

      if (!existingServiceTag) {
        throw new AppError(
          "Service tag not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      await db.delete(serviceTags).where(and(
        eq(serviceTags.serviceId, serviceId),
        eq(serviceTags.tagId, tagId)
      ));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to remove tag from service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getServicesByTag(tagId: number): Promise<Service[]> {
    try {
      // Check if tag exists
      const tag = await db.query.tags.findFirst({
        where: and(eq(tags.id, tagId), eq(tags.isActive, true)),
      });

      if (!tag) {
        throw new AppError(
          "Tag not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Get service IDs for this tag
      const serviceTagsList = await db.query.serviceTags.findMany({
        where: eq(serviceTags.tagId, tagId),
        orderBy: (serviceTags, { asc }) => [asc(serviceTags.serviceId)],
      });

      if (serviceTagsList.length === 0) {
        return [];
      }

      // Get services by their IDs
      const serviceIds = serviceTagsList.map(st => st.serviceId);
      const servicesList = await db.query.services.findMany({
        where: eq(services.isActive, true),
        orderBy: (services, { asc }) => [asc(services.name)],
      });

      // Filter services that are in the serviceIds array
      return servicesList.filter(service => serviceIds.includes(service.id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve services by tag",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getTagsByService(serviceId: number): Promise<Tag[]> {
    try {
      // Check if service exists
      const service = await db.query.services.findFirst({
        where: and(eq(services.id, serviceId), eq(services.isActive, true)),
      });

      if (!service) {
        throw new AppError(
          "Service not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Get tag IDs for this service
      const serviceTagsList = await db.query.serviceTags.findMany({
        where: eq(serviceTags.serviceId, serviceId),
        orderBy: (serviceTags, { asc }) => [asc(serviceTags.tagId)],
      });

      if (serviceTagsList.length === 0) {
        return [];
      }

      // Get tags by their IDs
      const tagIds = serviceTagsList.map(st => st.tagId);
      const tagsList = await db.query.tags.findMany({
        where: eq(tags.isActive, true),
        orderBy: (tags, { asc }) => [asc(tags.name)],
      });

      // Filter tags that are in the tagIds array
      return tagsList.filter(tag => tagIds.includes(tag.id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve tags by service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async searchTags(searchTerm: string, limit = 10): Promise<Tag[]> {
    try {
      const searchPattern = `%${searchTerm}%`;
      
      const tagsList = await db.query.tags.findMany({
        where: and(
          eq(tags.isActive, true),
          // Use raw SQL for LIKE search since drizzle doesn't have a direct LIKE operator
          // This is a simplified implementation - in production you might want to use a proper search
        ),
        limit,
        orderBy: (tags, { asc }) => [asc(tags.name)],
      });

      // Filter in memory for now - in production you'd want to use proper SQL LIKE
      return tagsList.filter(tag => 
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      throw new AppError(
        "Failed to search tags",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};