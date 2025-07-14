import { and, eq, ilike, or, sql, desc, inArray } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import {
  services,
  professionalServices,
  serviceCategories,
  serviceTags,
  categories,
  tags,
  professions,
  professionalProfiles,
  type Service,
  type NewService,
  type ProfessionalService,
  type NewProfessionalService,
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";
import type {
  ServiceWithDetails,
  CreateService,
  UpdateService,
  ServiceFilters,
  ServicesList,
  ProfessionalServiceData,
} from "./schema";

export const servicesService = {
  // Get all services with filters (public)
  async getServices(filters: ServiceFilters): Promise<ServicesList> {
    try {
      const whereConditions = [];

      // Apply filters
      if (filters.professionId) {
        whereConditions.push(eq(services.professionId, filters.professionId));
      }

      if (filters.search) {
        whereConditions.push(
          or(
            ilike(services.name, `%${filters.search}%`),
            ilike(services.description, `%${filters.search}%`)
          )
        );
      }

      if (filters.isActive !== undefined) {
        whereConditions.push(eq(services.isActive, filters.isActive));
      }

      // Build category filter if provided
      let categoryServiceIds: number[] = [];
      if (filters.categoryId) {
        const categoryServices = await db
          .select({ serviceId: serviceCategories.serviceId })
          .from(serviceCategories)
          .where(eq(serviceCategories.categoryId, filters.categoryId));
        categoryServiceIds = categoryServices.map(cs => cs.serviceId);
        if (categoryServiceIds.length === 0) {
          // No services in this category
          return { services: [], total: 0, hasMore: false };
        }
        whereConditions.push(inArray(services.id, categoryServiceIds));
      }

      // Build tag filter if provided
      let tagServiceIds: number[] = [];
      if (filters.tagId) {
        const tagServices = await db
          .select({ serviceId: serviceTags.serviceId })
          .from(serviceTags)
          .where(eq(serviceTags.tagId, filters.tagId));
        tagServiceIds = tagServices.map(ts => ts.serviceId);
        if (tagServiceIds.length === 0) {
          // No services with this tag
          return { services: [], total: 0, hasMore: false };
        }
        whereConditions.push(inArray(services.id, tagServiceIds));
      }

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(services)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
      const total = totalResult[0].count;

      // Get paginated services
      const serviceRecords = await db
        .select()
        .from(services)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(services.createdAt))
        .limit(filters.limit)
        .offset(filters.offset);

      // Enhance with details
      const enhancedServices = await Promise.all(
        serviceRecords.map(service => this.enhanceServiceWithDetails(service))
      );

      return {
        services: enhancedServices,
        total,
        hasMore: (filters.offset + filters.limit) < total,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve services",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Get service by ID with details (public)
  async getServiceById(serviceId: number): Promise<ServiceWithDetails> {
    try {
      const service = await db.query.services.findFirst({
        where: eq(services.id, serviceId),
      });

      if (!service) {
        throw new AppError("Service not found", HttpStatusCodes.NOT_FOUND);
      }

      return await this.enhanceServiceWithDetails(service);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to retrieve service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Create service (admin only)
  async createService(data: CreateService): Promise<ServiceWithDetails> {
    try {
      // Validate profession exists
      const profession = await db.query.professions.findFirst({
        where: eq(professions.id, data.professionId),
      });

      if (!profession) {
        throw new AppError("Profession not found", HttpStatusCodes.BAD_REQUEST);
      }

      // Create service
      const [newService] = await db
        .insert(services)
        .values({
          name: data.name,
          professionId: data.professionId,
          priceRange: data.priceRange,
          durationEstimate: data.durationEstimate,
          description: data.description,
        })
        .returning();

      // Add categories if provided
      if (data.categoryIds && data.categoryIds.length > 0) {
        await db.insert(serviceCategories).values(
          data.categoryIds.map(categoryId => ({
            serviceId: newService.id,
            categoryId,
          }))
        );
      }

      // Add tags if provided
      if (data.tagIds && data.tagIds.length > 0) {
        await db.insert(serviceTags).values(
          data.tagIds.map(tagId => ({
            serviceId: newService.id,
            tagId,
          }))
        );
      }

      return await this.enhanceServiceWithDetails(newService);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to create service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Update service (admin only)
  async updateService(serviceId: number, data: UpdateService): Promise<ServiceWithDetails> {
    try {
      const existingService = await db.query.services.findFirst({
        where: eq(services.id, serviceId),
      });

      if (!existingService) {
        throw new AppError("Service not found", HttpStatusCodes.NOT_FOUND);
      }

      // Validate profession if being updated
      if (data.professionId) {
        const profession = await db.query.professions.findFirst({
          where: eq(professions.id, data.professionId),
        });

        if (!profession) {
          throw new AppError("Profession not found", HttpStatusCodes.BAD_REQUEST);
        }
      }

      // Update service
      const [updatedService] = await db
        .update(services)
        .set({
          ...(data.name && { name: data.name }),
          ...(data.professionId && { professionId: data.professionId }),
          ...(data.priceRange !== undefined && { priceRange: data.priceRange }),
          ...(data.durationEstimate !== undefined && { durationEstimate: data.durationEstimate }),
          ...(data.description !== undefined && { description: data.description }),
          updatedAt: new Date(),
        })
        .where(eq(services.id, serviceId))
        .returning();

      // Update categories if provided
      if (data.categoryIds !== undefined) {
        // Remove existing categories
        await db.delete(serviceCategories).where(eq(serviceCategories.serviceId, serviceId));
        
        // Add new categories
        if (data.categoryIds.length > 0) {
          await db.insert(serviceCategories).values(
            data.categoryIds.map(categoryId => ({
              serviceId,
              categoryId,
            }))
          );
        }
      }

      // Update tags if provided
      if (data.tagIds !== undefined) {
        // Remove existing tags
        await db.delete(serviceTags).where(eq(serviceTags.serviceId, serviceId));
        
        // Add new tags
        if (data.tagIds.length > 0) {
          await db.insert(serviceTags).values(
            data.tagIds.map(tagId => ({
              serviceId,
              tagId,
            }))
          );
        }
      }

      return await this.enhanceServiceWithDetails(updatedService);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to update service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Delete service (admin only)
  async deleteService(serviceId: number): Promise<void> {
    try {
      const existingService = await db.query.services.findFirst({
        where: eq(services.id, serviceId),
      });

      if (!existingService) {
        throw new AppError("Service not found", HttpStatusCodes.NOT_FOUND);
      }

      // Soft delete by setting isActive to false
      await db
        .update(services)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(services.id, serviceId));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to delete service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Professional: Add service to their offerings
  async addProfessionalService(
    professionalId: string,
    serviceId: number,
    data: Omit<ProfessionalServiceData, "serviceId">
  ): Promise<ProfessionalService> {
    try {
      // Validate service exists and is active
      const service = await db.query.services.findFirst({
        where: and(eq(services.id, serviceId), eq(services.isActive, true)),
      });

      if (!service) {
        throw new AppError("Service not found or inactive", HttpStatusCodes.NOT_FOUND);
      }

      // Check if professional already offers this service
      const existingOffering = await db.query.professionalServices.findFirst({
        where: and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, serviceId)
        ),
      });

      if (existingOffering) {
        throw new AppError("Service already added to professional offerings", HttpStatusCodes.BAD_REQUEST);
      }

      // Add service to professional offerings
      const [newOffering] = await db
        .insert(professionalServices)
        .values({
          professionalId,
          serviceId,
          price: data.price,
          duration: data.duration,
        })
        .returning();

      return newOffering;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to add service to professional offerings",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Professional: Update their service offering
  async updateProfessionalService(
    professionalId: string,
    serviceId: number,
    data: Partial<Omit<ProfessionalServiceData, "serviceId">>
  ): Promise<ProfessionalService> {
    try {
      const existingOffering = await db.query.professionalServices.findFirst({
        where: and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, serviceId)
        ),
      });

      if (!existingOffering) {
        throw new AppError("Professional service offering not found", HttpStatusCodes.NOT_FOUND);
      }

      const [updatedOffering] = await db
        .update(professionalServices)
        .set({
          ...(data.price !== undefined && { price: data.price }),
          ...(data.duration !== undefined && { duration: data.duration }),
        })
        .where(and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, serviceId)
        ))
        .returning();

      return updatedOffering;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to update professional service offering",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Professional: Remove service from their offerings
  async removeProfessionalService(professionalId: string, serviceId: number): Promise<void> {
    try {
      const existingOffering = await db.query.professionalServices.findFirst({
        where: and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, serviceId)
        ),
      });

      if (!existingOffering) {
        throw new AppError("Professional service offering not found", HttpStatusCodes.NOT_FOUND);
      }

      await db
        .delete(professionalServices)
        .where(and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, serviceId)
        ));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to remove service from professional offerings",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Professional: Get their services
  async getProfessionalServices(
    professionalId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    services: (ServiceWithDetails & { professionalService: { price?: string; duration?: number } })[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(professionalServices)
        .innerJoin(services, eq(professionalServices.serviceId, services.id))
        .where(and(
          eq(professionalServices.professionalId, professionalId),
          eq(services.isActive, true)
        ));
      const total = totalResult[0].count;

      // Get paginated professional services
      const professionalServiceRecords = await db
        .select({
          service: services,
          professionalService: professionalServices,
        })
        .from(professionalServices)
        .innerJoin(services, eq(professionalServices.serviceId, services.id))
        .where(and(
          eq(professionalServices.professionalId, professionalId),
          eq(services.isActive, true)
        ))
        .orderBy(desc(services.createdAt))
        .limit(limit)
        .offset(offset);

      // Enhance with details
      const enhancedServices = await Promise.all(
        professionalServiceRecords.map(async record => {
          const enhanced = await this.enhanceServiceWithDetails(record.service);
          return {
            ...enhanced,
            professionalService: {
              price: record.professionalService.price || undefined,
              duration: record.professionalService.duration || undefined,
            },
          };
        })
      );

      return {
        services: enhancedServices,
        total,
        hasMore: (offset + limit) < total,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve professional services",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },

  // Helper: Enhance service with related data
  async enhanceServiceWithDetails(service: Service): Promise<ServiceWithDetails> {
    try {
      // Get profession
      const profession = await db.query.professions.findFirst({
        where: eq(professions.id, service.professionId),
      });

      // Get categories
      const serviceCategoriesData = await db
        .select({ category: categories })
        .from(serviceCategories)
        .innerJoin(categories, eq(serviceCategories.categoryId, categories.id))
        .where(eq(serviceCategories.serviceId, service.id));

      // Get tags
      const serviceTagsData = await db
        .select({ tag: tags })
        .from(serviceTags)
        .innerJoin(tags, eq(serviceTags.tagId, tags.id))
        .where(eq(serviceTags.serviceId, service.id));

      return {
        ...service,
        profession,
        categories: serviceCategoriesData.map(sc => sc.category),
        tags: serviceTagsData.map(st => st.tag),
      };
    } catch (error) {
      throw new AppError(
        "Failed to enhance service with details",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  },
};

export default servicesService;
