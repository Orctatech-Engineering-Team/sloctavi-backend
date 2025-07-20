import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { categories, serviceCategories } from "@/db/schema/schema";
import { createSelectSchema } from "drizzle-zod";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Categories"];

const categorySchema = createSelectSchema(categories);
const serviceCategorySchema = createSelectSchema(serviceCategories);

const categoryCreateSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name too long"),
  description: z.string().optional(),
});

const categoryUpdateSchema = categoryCreateSchema.partial();

const assignCategorySchema = z.object({
  serviceId: z.number().min(1, "Service ID is required"),
  categoryId: z.number().min(1, "Category ID is required"),
});

const removeCategorySchema = z.object({
  serviceId: z.number().min(1, "Service ID is required"),
  categoryId: z.number().min(1, "Category ID is required"),
});

export const getCategories = createRoute({
  path: "/categories",
  method: "get",
  tags,
  request: {
    query: z.object({
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        categories: z.array(categorySchema),
        total: z.number(),
      }),
      "Categories retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getCategoryById = createRoute({
  path: "/categories/{id}",
  method: "get",
  tags,
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      categorySchema,
      "Category retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Category not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const createCategory = createRoute({
  path: "/categories",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      categoryCreateSchema,
      "Category data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      categorySchema,
      "Category created successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const updateCategory = createRoute({
  path: "/categories/{id}",
  method: "put",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
    body: jsonContentRequired(
      categoryUpdateSchema,
      "Category update data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      categorySchema,
      "Category updated successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Category not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const deleteCategory = createRoute({
  path: "/categories/{id}",
  method: "delete",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Category deleted successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Cannot delete category that is assigned to services",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Category not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

// Service Category Management Routes
export const getServiceCategories = createRoute({
  path: "/service-categories",
  method: "get",
  tags: ["Service Categories"],
  request: {
    query: z.object({
      serviceId: z.string().transform(Number).optional(),
      categoryId: z.string().transform(Number).optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(serviceCategorySchema),
      "Service categories retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const assignCategoryToService = createRoute({
  path: "/service-categories/assign",
  method: "post",
  tags: ["Service Categories"],
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      assignCategorySchema,
      "Category assignment data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      serviceCategorySchema,
      "Category assigned successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data or service already has this category",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service or category not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const removeCategoryFromService = createRoute({
  path: "/service-categories/remove",
  method: "post",
  tags: ["Service Categories"],
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      removeCategorySchema,
      "Category removal data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Category removed successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service category not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getServicesByCategory = createRoute({
  path: "/categories/{categoryId}/services",
  method: "get",
  tags: ["Service Categories"],
  request: {
    params: z.object({
      categoryId: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().nullable(),
        professionId: z.number(),
        priceRange: z.string().nullable(),
        durationEstimate: z.number().nullable(),
        isActive: z.boolean().nullable(),
        createdAt: z.string().datetime().nullable(),
        updatedAt: z.string().datetime().nullable(),
      })),
      "Services retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Category not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getCategoriesByService = createRoute({
  path: "/services/{serviceId}/categories",
  method: "get",
  tags: ["Service Categories"],
  request: {
    params: z.object({
      serviceId: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(categorySchema),
      "Categories retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export type GetCategoriesRoute = typeof getCategories;
export type GetCategoryByIdRoute = typeof getCategoryById;
export type CreateCategoryRoute = typeof createCategory;
export type UpdateCategoryRoute = typeof updateCategory;
export type DeleteCategoryRoute = typeof deleteCategory;
export type GetServiceCategoriesRoute = typeof getServiceCategories;
export type AssignCategoryToServiceRoute = typeof assignCategoryToService;
export type RemoveCategoryFromServiceRoute = typeof removeCategoryFromService;
export type GetServicesByCategoryRoute = typeof getServicesByCategory;
export type GetCategoriesByServiceRoute = typeof getCategoriesByService;