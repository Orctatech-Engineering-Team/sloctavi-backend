import { eq, and, count, like, ilike, inArray, gte, lte, or, sql, desc, asc } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  services, 
  professions,
  professionalServices,
  professionalProfiles,
  availability,
  categories,
  tags,
  serviceCategories,
  serviceTags,
  type Service,
  type NewService,
  type Profession,
  type ProfessionalService,
  type NewProfessionalService,
  type ProfessionalProfile,
  type Availability
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

export interface ServiceSearchFilters {
  professionId?: number;
  search?: string;
  categoryIds?: number[];
  tagIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'name' | 'price' | 'duration' | 'created';
  sortOrder?: 'asc' | 'desc';
  location?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface EnhancedService extends Service {
  profession?: Profession;
  categories?: Array<{ id: number; name: string }>;
  tags?: Array<{ id: number; name: string }>;
  professionalCount?: number;
  avgPrice?: string;
}

export interface ServiceSearchResult {
  services: EnhancedService[];
  total: number;
  filters: {
    appliedFilters: Record<string, any>;
    availableCategories?: Array<{ id: number; name: string; count: number }>;
    availableTags?: Array<{ id: number; name: string; count: number }>;
    priceRange?: { min: number; max: number };
  };
}

export const servicesService = {
  async getServices(filters: ServiceSearchFilters = {}): Promise<ServiceSearchResult> {
    try {
      const {
        professionId,
        search,
        categoryIds,
        tagIds,
        minPrice,
        maxPrice,
        minDuration,
        maxDuration,
        sortBy = 'name',
        sortOrder = 'asc',
        location,
        isActive = true,
        limit = 20,
        offset = 0,
      } = filters;

      // Build where conditions
      const conditions = [eq(services.isActive, isActive)];

      if (professionId) {
        conditions.push(eq(services.professionId, professionId));
      }

      if (search) {
        const searchCondition = or(
          ilike(services.name, `%${search}%`),
          ilike(services.description, `%${search}%`)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      if (minDuration) {
        conditions.push(gte(services.durationEstimate, minDuration));
      }

      if (maxDuration) {
        conditions.push(lte(services.durationEstimate, maxDuration));
      }

      // Add category and tag filtering to conditions
      if (categoryIds && categoryIds.length > 0) {
        conditions.push(sql`${services.id} IN (
          SELECT ${serviceCategories.serviceId} 
          FROM ${serviceCategories} 
          WHERE ${inArray(serviceCategories.categoryId, categoryIds)}
        )`);
      }

      if (tagIds && tagIds.length > 0) {
        conditions.push(sql`${services.id} IN (
          SELECT ${serviceTags.serviceId} 
          FROM ${serviceTags} 
          WHERE ${inArray(serviceTags.tagId, tagIds)}
        )`);
      }

      // Apply sorting
      const orderDirection = sortOrder === 'desc' ? desc : asc;
      let orderColumn;
      
      switch (sortBy) {
        case 'name':
          orderColumn = services.name;
          break;
        case 'duration':
          orderColumn = services.durationEstimate;
          break;
        case 'created':
          orderColumn = services.createdAt;
          break;
        default:
          orderColumn = services.name;
      }

      // Build the main query
      const query = db
        .select({
          service: services,
          profession: professions,
        })
        .from(services)
        .leftJoin(professions, eq(services.professionId, professions.id))
        .where(and(...conditions))
        .orderBy(orderDirection(orderColumn));

      // Apply pagination
      const [serviceResults, totalCountResult] = await Promise.all([
        query.limit(limit).offset(offset),
        db.select({ count: count() }).from(services).where(and(...conditions)),
      ]);

      // Enhance services with categories and tags
      const enhancedServices: EnhancedService[] = [];
      
      for (const result of serviceResults) {
        const service = result.service;
        
        // Get categories for this service
        const serviceCategoriesData = await db
          .select({
            id: categories.id,
            name: categories.name,
          })
          .from(categories)
          .innerJoin(serviceCategories, eq(categories.id, serviceCategories.categoryId))
          .where(eq(serviceCategories.serviceId, service.id));

        // Get tags for this service
        const serviceTagsData = await db
          .select({
            id: tags.id,
            name: tags.name,
          })
          .from(tags)
          .innerJoin(serviceTags, eq(tags.id, serviceTags.tagId))
          .where(eq(serviceTags.serviceId, service.id));

        // Get professional count and average price for this service
        const professionalStats = await db
          .select({
            count: count(),
            avgPrice: sql<string>`AVG(CAST(${professionalServices.price} AS DECIMAL))`,
          })
          .from(professionalServices)
          .where(eq(professionalServices.serviceId, service.id))
          .groupBy(professionalServices.serviceId);

        enhancedServices.push({
          ...service,
          profession: result.profession || undefined,
          categories: serviceCategoriesData,
          tags: serviceTagsData,
          professionalCount: professionalStats[0]?.count || 0,
          avgPrice: professionalStats[0]?.avgPrice || undefined,
        });
      }

      // Get filter metadata
      const [availableCategories, availableTags, priceRange] = await Promise.all([
        // Available categories
        db
          .select({
            id: categories.id,
            name: categories.name,
            count: count(),
          })
          .from(categories)
          .innerJoin(serviceCategories, eq(categories.id, serviceCategories.categoryId))
          .innerJoin(services, eq(serviceCategories.serviceId, services.id))
          .where(eq(services.isActive, true))
          .groupBy(categories.id, categories.name),

        // Available tags
        db
          .select({
            id: tags.id,
            name: tags.name,
            count: count(),
          })
          .from(tags)
          .innerJoin(serviceTags, eq(tags.id, serviceTags.tagId))
          .innerJoin(services, eq(serviceTags.serviceId, services.id))
          .where(eq(services.isActive, true))
          .groupBy(tags.id, tags.name),

        // Price range
        db
          .select({
            min: sql<number>`MIN(CAST(${professionalServices.price} AS DECIMAL))`,
            max: sql<number>`MAX(CAST(${professionalServices.price} AS DECIMAL))`,
          })
          .from(professionalServices)
          .innerJoin(services, eq(professionalServices.serviceId, services.id))
          .where(eq(services.isActive, true)),
      ]);

      return {
        services: enhancedServices,
        total: totalCountResult[0].count,
        filters: {
          appliedFilters: {
            professionId,
            search,
            categoryIds,
            tagIds,
            minPrice,
            maxPrice,
            minDuration,
            maxDuration,
            sortBy,
            sortOrder,
            location,
            isActive,
          },
          availableCategories,
          availableTags,
          priceRange: priceRange[0] || undefined,
        },
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

  // Professional Services Management
  async getProfessionalServices(professionalId?: string): Promise<ProfessionalService[]> {
    try {
      const whereClause = professionalId 
        ? eq(professionalServices.professionalId, professionalId)
        : undefined;

      return await db.query.professionalServices.findMany({
        where: whereClause,
      });
    } catch (error) {
      throw new AppError(
        "Failed to retrieve professional services",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async addProfessionalService(
    professionalId: string,
    data: Omit<NewProfessionalService, "professionalId">
  ): Promise<ProfessionalService> {
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

      // Check if service exists
      const service = await db.query.services.findFirst({
        where: eq(services.id, data.serviceId),
      });

      if (!service) {
        throw new AppError(
          "Service not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if professional service already exists
      const existing = await db.query.professionalServices.findFirst({
        where: and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, data.serviceId),
        ),
      });

      if (existing) {
        throw new AppError(
          "Professional service already exists",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      const [professionalService] = await db
        .insert(professionalServices)
        .values({
          ...data,
          professionalId,
        })
        .returning();

      return professionalService;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to add professional service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateProfessionalService(
    professionalId: string,
    serviceId: number,
    data: Partial<Omit<NewProfessionalService, "professionalId" | "serviceId">>
  ): Promise<ProfessionalService> {
    try {
      // Check if professional service exists
      const existing = await db.query.professionalServices.findFirst({
        where: and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, serviceId),
        ),
      });

      if (!existing) {
        throw new AppError(
          "Professional service not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const [updated] = await db
        .update(professionalServices)
        .set(data)
        .where(and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, serviceId),
        ))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to update professional service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async removeProfessionalService(professionalId: string, serviceId: number): Promise<void> {
    try {
      // Check if professional service exists
      const existing = await db.query.professionalServices.findFirst({
        where: and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, serviceId),
        ),
      });

      if (!existing) {
        throw new AppError(
          "Professional service not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      await db.delete(professionalServices).where(and(
        eq(professionalServices.professionalId, professionalId),
        eq(professionalServices.serviceId, serviceId),
      ));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to remove professional service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Service Discovery for Customers
  async discoverServices(
    professionId?: number,
    location?: string,
    priceRange?: string,
    limit = 20,
    offset = 0
  ): Promise<{ services: any[], total: number }> {
    try {
      const whereConditions = [eq(services.isActive, true)];
      
      if (professionId) {
        whereConditions.push(eq(services.professionId, professionId));
      }

      const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

      const [servicesList, totalCount] = await Promise.all([
        db.query.services.findMany({
          where: whereClause,
          limit,
          offset,
          orderBy: (services, { asc }) => [asc(services.name)],
        }),
        db.select({ count: count() }).from(services).where(whereClause),
      ]);

      // Get professionals for each service
      const servicesWithProfessionals = await Promise.all(
        servicesList.map(async (service) => {
          const professionalServicesList = await db.query.professionalServices.findMany({
            where: eq(professionalServices.serviceId, service.id),
          });

          const professionals = await Promise.all(
            professionalServicesList.map(async (ps) => {
              const professional = await db.query.professionalProfiles.findFirst({
                where: and(eq(professionalProfiles.id, ps.professionalId), eq(professionalProfiles.isActive, true)),
              });
              
              if (!professional) return null;
              
              return {
                id: professional.id,
                name: professional.name || "",
                location: professional.location,
                rating: professional.rating,
                price: ps.price,
                duration: ps.duration,
              };
            })
          );

          return {
            ...service,
            professionals: professionals.filter(p => p !== null),
          };
        })
      );

      return {
        services: servicesWithProfessionals,
        total: totalCount[0].count,
      };
    } catch (error) {
      throw new AppError(
        "Failed to discover services",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getProfessionalsByService(
    serviceId: number,
    location?: string,
    priceRange?: string,
    limit = 20,
    offset = 0
  ): Promise<{ professionals: any[], total: number }> {
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

      const professionalServicesList = await db.query.professionalServices.findMany({
        where: eq(professionalServices.serviceId, serviceId),
        limit,
        offset,
      });

      const professionalsWithAvailability = await Promise.all(
        professionalServicesList.map(async (ps) => {
          const professional = await db.query.professionalProfiles.findFirst({
            where: and(eq(professionalProfiles.id, ps.professionalId), eq(professionalProfiles.isActive, true)),
          });
          
          if (!professional) return null;
          
          const professionalAvailability = await db.query.availability.findMany({
            where: eq(availability.professionalId, professional.id),
            orderBy: (availability, { asc }) => [asc(availability.day), asc(availability.fromTime)],
          });

          return {
            id: professional.id,
            name: professional.name || "",
            location: professional.location,
            rating: professional.rating,
            price: ps.price,
            duration: ps.duration,
            availability: professionalAvailability,
          };
        })
      );

      const totalCount = await db.select({ count: count() })
        .from(professionalServices)
        .where(eq(professionalServices.serviceId, serviceId));

      return {
        professionals: professionalsWithAvailability.filter(p => p !== null),
        total: totalCount[0].count,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve professionals for service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};