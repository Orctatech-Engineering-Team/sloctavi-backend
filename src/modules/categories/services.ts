import { eq, and, count } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  categories, 
  serviceCategories,
  services
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

type Category = typeof categories.$inferSelect;
type ServiceCategory = typeof serviceCategories.$inferSelect;
type NewCategory = typeof categories.$inferInsert;
type NewServiceCategory = typeof serviceCategories.$inferInsert;
type Service = typeof services.$inferSelect;

export const categoriesService = {
  // Category Management
  async getCategories(limit = 20, offset = 0): Promise<{ categories: Category[], total: number }> {
    try {
      const [categoriesList, totalCount] = await Promise.all([
        db.query.categories.findMany({
          where: eq(categories.isActive, true),
          limit,
          offset,
          orderBy: (categories, { asc }) => [asc(categories.name)],
        }),
        db.select({ count: count() }).from(categories).where(eq(categories.isActive, true)),
      ]);

      return {
        categories: categoriesList,
        total: totalCount[0].count,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve categories",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getCategoryById(id: number): Promise<Category | null> {
    try {
      const category = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), eq(categories.isActive, true)),
      });

      return category || null;
    } catch (error) {
      throw new AppError(
        "Failed to retrieve category",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async createCategory(data: Omit<NewCategory, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    try {
      // Check if category name already exists
      const existingCategory = await db.query.categories.findFirst({
        where: and(eq(categories.name, data.name), eq(categories.isActive, true)),
      });

      if (existingCategory) {
        throw new AppError(
          "Category name already exists",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      const [category] = await db
        .insert(categories)
        .values(data)
        .returning();

      return category;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create category",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateCategory(id: number, data: Partial<Omit<NewCategory, "id" | "createdAt" | "updatedAt">>): Promise<Category> {
    try {
      // Check if category exists
      const existing = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), eq(categories.isActive, true)),
      });

      if (!existing) {
        throw new AppError(
          "Category not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if name is being updated and if it already exists
      if (data.name && data.name !== existing.name) {
        const existingCategory = await db.query.categories.findFirst({
          where: and(eq(categories.name, data.name), eq(categories.isActive, true)),
        });

        if (existingCategory) {
          throw new AppError(
            "Category name already exists",
            HttpStatusCodes.BAD_REQUEST,
          );
        }
      }

      const [updated] = await db
        .update(categories)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to update category",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async deleteCategory(id: number): Promise<void> {
    try {
      // Check if category exists
      const existing = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), eq(categories.isActive, true)),
      });

      if (!existing) {
        throw new AppError(
          "Category not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if category is assigned to any services
      const assignedServices = await db.query.serviceCategories.findMany({
        where: eq(serviceCategories.categoryId, id),
      });

      if (assignedServices.length > 0) {
        throw new AppError(
          "Cannot delete category that is assigned to services",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      // Soft delete by setting isActive to false
      await db
        .update(categories)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to delete category",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // Service Category Management
  async getServiceCategories(serviceId?: number, categoryId?: number): Promise<ServiceCategory[]> {
    try {
      const whereConditions = [];
      
      if (serviceId) {
        whereConditions.push(eq(serviceCategories.serviceId, serviceId));
      }
      
      if (categoryId) {
        whereConditions.push(eq(serviceCategories.categoryId, categoryId));
      }

      const whereClause = whereConditions.length > 0 ? 
        (whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]) : 
        undefined;

      return await db.query.serviceCategories.findMany({
        where: whereClause,
        orderBy: (serviceCategories, { asc }) => [asc(serviceCategories.serviceId)],
      });
    } catch (error) {
      throw new AppError(
        "Failed to retrieve service categories",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async assignCategoryToService(
    serviceId: number,
    categoryId: number
  ): Promise<ServiceCategory> {
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

      // Check if category exists
      const category = await db.query.categories.findFirst({
        where: and(eq(categories.id, categoryId), eq(categories.isActive, true)),
      });

      if (!category) {
        throw new AppError(
          "Category not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if service category already exists
      const existingServiceCategory = await db.query.serviceCategories.findFirst({
        where: and(
          eq(serviceCategories.serviceId, serviceId),
          eq(serviceCategories.categoryId, categoryId)
        ),
      });

      if (existingServiceCategory) {
        throw new AppError(
          "Service already has this category",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      const [serviceCategory] = await db
        .insert(serviceCategories)
        .values({
          serviceId,
          categoryId,
        })
        .returning();

      return serviceCategory;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to assign category to service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async removeCategoryFromService(
    serviceId: number,
    categoryId: number
  ): Promise<void> {
    try {
      // Check if service category exists
      const existingServiceCategory = await db.query.serviceCategories.findFirst({
        where: and(
          eq(serviceCategories.serviceId, serviceId),
          eq(serviceCategories.categoryId, categoryId)
        ),
      });

      if (!existingServiceCategory) {
        throw new AppError(
          "Service category not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      await db.delete(serviceCategories).where(and(
        eq(serviceCategories.serviceId, serviceId),
        eq(serviceCategories.categoryId, categoryId)
      ));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to remove category from service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getServicesByCategory(categoryId: number): Promise<Service[]> {
    try {
      // Check if category exists
      const category = await db.query.categories.findFirst({
        where: and(eq(categories.id, categoryId), eq(categories.isActive, true)),
      });

      if (!category) {
        throw new AppError(
          "Category not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Get service IDs for this category
      const serviceCategoriesList = await db.query.serviceCategories.findMany({
        where: eq(serviceCategories.categoryId, categoryId),
        orderBy: (serviceCategories, { asc }) => [asc(serviceCategories.serviceId)],
      });

      if (serviceCategoriesList.length === 0) {
        return [];
      }

      // Get services by their IDs
      const serviceIds = serviceCategoriesList.map(sc => sc.serviceId);
      const servicesList = await db.query.services.findMany({
        where: and(
          eq(services.isActive, true),
          // Use IN operator for multiple IDs
        ),
        orderBy: (services, { asc }) => [asc(services.name)],
      });

      // Filter services that are in the serviceIds array
      return servicesList.filter(service => serviceIds.includes(service.id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve services by category",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getCategoriesByService(serviceId: number): Promise<Category[]> {
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

      // Get category IDs for this service
      const serviceCategoriesList = await db.query.serviceCategories.findMany({
        where: eq(serviceCategories.serviceId, serviceId),
        orderBy: (serviceCategories, { asc }) => [asc(serviceCategories.categoryId)],
      });

      if (serviceCategoriesList.length === 0) {
        return [];
      }

      // Get categories by their IDs
      const categoryIds = serviceCategoriesList.map(sc => sc.categoryId);
      const categoriesList = await db.query.categories.findMany({
        where: eq(categories.isActive, true),
        orderBy: (categories, { asc }) => [asc(categories.name)],
      });

      // Filter categories that are in the categoryIds array
      return categoriesList.filter(category => categoryIds.includes(category.id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve categories by service",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};