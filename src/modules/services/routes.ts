import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  ServiceWithDetailsSchema,
  ServicesListSchema,
  ServiceFiltersSchema,
  ProfessionalServiceSchema,
} from "./schema";

const tags = ["Services"];

// Get all services (public, with filters)
export const getServices = createRoute({
  path: "/services",
  method: "get",
  tags,
  request: {
    query: ServiceFiltersSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ServicesListSchema,
      "Services retrieved successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid query parameters"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to retrieve services"
    ),
  },
});

// Get service by ID (public)
export const getServiceById = createRoute({
  path: "/services/{id}",
  method: "get",
  tags,
  request: {
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ServiceWithDetailsSchema,
      "Service retrieved successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to retrieve service"
    ),
  },
});

// Create service (admin only)
export const createService = createRoute({
  path: "/services",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      CreateServiceSchema,
      "Service creation data"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      ServiceWithDetailsSchema,
      "Service created successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid service data"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Admin access required"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to create service"
    ),
  },
});

// Update service (admin only)
export const updateService = createRoute({
  path: "/services/{id}",
  method: "put",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
    body: jsonContentRequired(
      UpdateServiceSchema,
      "Service update data"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ServiceWithDetailsSchema,
      "Service updated successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid service data"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Admin access required"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to update service"
    ),
  },
});

// Delete service (admin only)
export const deleteService = createRoute({
  path: "/services/{id}",
  method: "delete",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Service deleted successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Admin access required"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to delete service"
    ),
  },
});

// Professional: Add service to their offerings
export const addProfessionalService = createRoute({
  path: "/services/{id}/professional",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
    body: jsonContentRequired(
      ProfessionalServiceSchema.omit({ serviceId: true }),
      "Professional service data"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        professionalService: z.object({
          serviceId: z.number(),
          price: z.string().optional(),
          duration: z.number().optional(),
        }),
      }),
      "Service added to professional offerings"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid data or service already added"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Professional access required"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to add service"
    ),
  },
});

// Professional: Update their service offering
export const updateProfessionalService = createRoute({
  path: "/services/{id}/professional",
  method: "put",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
    body: jsonContentRequired(
      ProfessionalServiceSchema.omit({ serviceId: true }).partial(),
      "Professional service update data"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        professionalService: z.object({
          serviceId: z.number(),
          price: z.string().optional(),
          duration: z.number().optional(),
        }),
      }),
      "Professional service updated successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid data"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service or professional offering not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Professional access required"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to update service"
    ),
  },
});

// Professional: Remove service from their offerings
export const removeProfessionalService = createRoute({
  path: "/services/{id}/professional",
  method: "delete",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Service removed from professional offerings"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service or professional offering not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Professional access required"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to remove service"
    ),
  },
});

// Professional: Get their services
export const getProfessionalServices = createRoute({
  path: "/services/professional",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        services: z.array(ServiceWithDetailsSchema.extend({
          professionalService: z.object({
            price: z.string().optional(),
            duration: z.number().optional(),
          }),
        })),
        total: z.number(),
        hasMore: z.boolean(),
      }),
      "Professional services retrieved successfully"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Professional access required"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to retrieve services"
    ),
  },
});

export type GetServicesRoute = typeof getServices;
export type GetServiceByIdRoute = typeof getServiceById;
export type CreateServiceRoute = typeof createService;
export type UpdateServiceRoute = typeof updateService;
export type DeleteServiceRoute = typeof deleteService;
export type AddProfessionalServiceRoute = typeof addProfessionalService;
export type UpdateProfessionalServiceRoute = typeof updateProfessionalService;
export type RemoveProfessionalServiceRoute = typeof removeProfessionalService;
export type GetProfessionalServicesRoute = typeof getProfessionalServices;
