import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { selectServiceSchema, selectProfessionSchema, professionalServices } from "@/db/schema/schema";
import { createSelectSchema } from "drizzle-zod";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Services"];

const professionalServiceSchema = createSelectSchema(professionalServices);
const professionalServiceCreateSchema = z.object({
  serviceId: z.number().min(1, "Service ID is required"),
  price: z.string().optional(),
  duration: z.number().min(1).optional(),
});
const professionalServiceUpdateSchema = professionalServiceCreateSchema.partial();

export const getServices = createRoute({
  path: "/services",
  method: "get",
  tags,
  request: {
    query: z.object({
      professionId: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
      search: z.string().optional(),
      categoryIds: z.string().optional(), // comma-separated category IDs
      tagIds: z.string().optional(), // comma-separated tag IDs
      minPrice: z.string().transform(Number).optional(),
      maxPrice: z.string().transform(Number).optional(),
      minDuration: z.string().transform(Number).optional(),
      maxDuration: z.string().transform(Number).optional(),
      sortBy: z.enum(["name", "price", "duration", "created"]).optional().default("name"),
      sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
      location: z.string().optional(),
      isActive: z.string().transform(Boolean).optional().default("true"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        services: z.array(selectServiceSchema.extend({
          profession: selectProfessionSchema.optional(),
          categories: z.array(z.object({
            id: z.number(),
            name: z.string(),
          })).optional(),
          tags: z.array(z.object({
            id: z.number(),
            name: z.string(),
          })).optional(),
          professionalCount: z.number().optional(),
          avgPrice: z.string().optional(),
        })),
        total: z.number(),
        filters: z.object({
          appliedFilters: z.record(z.any()),
          availableCategories: z.array(z.object({
            id: z.number(),
            name: z.string(),
            count: z.number(),
          })).optional(),
          availableTags: z.array(z.object({
            id: z.number(),
            name: z.string(),
            count: z.number(),
          })).optional(),
          priceRange: z.object({
            min: z.number(),
            max: z.number(),
          }).optional(),
        }),
      }),
      "Services retrieved successfully with advanced filtering",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const createService = createRoute({
  path: "/services",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      z.object({
        name: z.string().min(1, "Service name is required"),
        professionId: z.number().min(1, "Profession ID is required"),
        priceRange: z.string().optional(),
        durationEstimate: z.number().min(1).optional(),
        description: z.string().optional(),
      }),
      "Service data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectServiceSchema,
      "Service created successfully",
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

export const updateService = createRoute({
  path: "/services/{id}",
  method: "put",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
    body: jsonContentRequired(
      z.object({
        name: z.string().min(1).optional(),
        priceRange: z.string().optional(),
        durationEstimate: z.number().min(1).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
      "Service update data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectServiceSchema,
      "Service updated successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
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

export const deleteService = createRoute({
  path: "/services/{id}",
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
      "Service deleted successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
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

export const getProfessions = createRoute({
  path: "/professions",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectProfessionSchema),
      "Professions retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

// Professional Services Management Routes
export const getProfessionalServices = createRoute({
  path: "/professional/services",
  method: "get",
  tags: ["Professional Services"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      professionalId: z.string().uuid().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(professionalServiceSchema),
      "Professional services retrieved successfully",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Professional profile not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const addProfessionalService = createRoute({
  path: "/professional/services",
  method: "post",
  tags: ["Professional Services"],
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      professionalServiceCreateSchema,
      "Professional service data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      professionalServiceSchema,
      "Professional service added successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Professional profile or service not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const updateProfessionalService = createRoute({
  path: "/professional/services/{serviceId}",
  method: "put",
  tags: ["Professional Services"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      serviceId: z.string().transform(Number),
    }),
    body: jsonContentRequired(
      professionalServiceUpdateSchema,
      "Professional service update data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      professionalServiceSchema,
      "Professional service updated successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Professional service not found",
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

export const removeProfessionalService = createRoute({
  path: "/professional/services/{serviceId}",
  method: "delete",
  tags: ["Professional Services"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      serviceId: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Professional service removed successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Professional service not found",
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

// Service Discovery Routes for Customers
export const discoverServices = createRoute({
  path: "/discover/services",
  method: "get",
  tags: ["Service Discovery"],
  request: {
    query: z.object({
      professionId: z.string().transform(Number).optional(),
      location: z.string().optional(),
      priceRange: z.string().optional(),
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        services: z.array(selectServiceSchema.extend({
          professionals: z.array(z.object({
            id: z.string().uuid(),
            name: z.string(),
            location: z.string().nullable(),
            rating: z.number().nullable(),
            price: z.string().nullable(),
            duration: z.number().nullable(),
          })),
        })),
        total: z.number(),
      }),
      "Services discovered successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getProfessionalsByService = createRoute({
  path: "/discover/services/{serviceId}/professionals",
  method: "get",
  tags: ["Service Discovery"],
  request: {
    params: z.object({
      serviceId: z.string().transform(Number),
    }),
    query: z.object({
      location: z.string().optional(),
      priceRange: z.string().optional(),
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        professionals: z.array(z.object({
          id: z.string().uuid(),
          name: z.string(),
          location: z.string().nullable(),
          rating: z.number().nullable(),
          price: z.string().nullable(),
          duration: z.number().nullable(),
          availability: z.array(z.object({
            day: z.number(),
            fromTime: z.string(),
            toTime: z.string(),
            capacity: z.number(),
          })),
        })),
        total: z.number(),
      }),
      "Professionals retrieved successfully",
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

export type GetServicesRoute = typeof getServices;
export type CreateServiceRoute = typeof createService;
export type UpdateServiceRoute = typeof updateService;
export type DeleteServiceRoute = typeof deleteService;
export type GetProfessionsRoute = typeof getProfessions;
export type GetProfessionalServicesRoute = typeof getProfessionalServices;
export type AddProfessionalServiceRoute = typeof addProfessionalService;
export type UpdateProfessionalServiceRoute = typeof updateProfessionalService;
export type RemoveProfessionalServiceRoute = typeof removeProfessionalService;
export type DiscoverServicesRoute = typeof discoverServices;
export type GetProfessionalsByServiceRoute = typeof getProfessionalsByService;