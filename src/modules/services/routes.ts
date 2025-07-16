import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { selectServiceSchema, selectProfessionSchema } from "@/db/schema/schema";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Services"];

export const getServices = createRoute({
  path: "/services",
  method: "get",
  tags,
  request: {
    query: z.object({
      professionId: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        services: z.array(selectServiceSchema),
        total: z.number(),
      }),
      "Services retrieved successfully",
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

export type GetServicesRoute = typeof getServices;
export type CreateServiceRoute = typeof createService;
export type UpdateServiceRoute = typeof updateService;
export type DeleteServiceRoute = typeof deleteService;
export type GetProfessionsRoute = typeof getProfessions;