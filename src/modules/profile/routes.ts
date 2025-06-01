import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { insertCustomerProfileSchema, insertProfessionalProfileSchema, insertUserSchema,selectCustomerProfileSchema, selectProfessionalProfileSchema } from "@/db/schema/schema";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

// Create notification route
export const createCustomerProfile = createRoute({
  path: "/profile/customer",
  method: "post",
  tags: ["Profile"],
  security: [
      {
        bearerAuth: [],
      },
    ],
  request: {
    body: jsonContentRequired(insertCustomerProfileSchema, "Contact data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectCustomerProfileSchema,
      "Customer profile created successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      badRequestSchema,
      "Unauthorized",
    ),
  },
});

export type CreateCustomerProfile = typeof createCustomerProfile;
// Create professional profile route
export const createProfessionalProfile = createRoute({
  path: "/profile/professional",
  method: "post",
  tags: ["Profile"],
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: jsonContentRequired(insertProfessionalProfileSchema, "Profile data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectProfessionalProfileSchema,
      "Professional profile created successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
  },
});
export type CreateProfessionalProfileRoute = typeof createProfessionalProfile;

// Get all profiles route
export const getCustomerProfile = createRoute({
  path: "/profile/customer",
  method: "get",
  tags: ["Profile"],
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectCustomerProfileSchema,
      "Customer profile retrieved successfully",
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
      "Customer profile not found",
    ),
  },
})

export type GetCustomerProfileRoute = typeof getCustomerProfile;
export const getProfessionalProfile = createRoute({
  path: "/profile/professional",
  method: "get",
  tags: ["Profile"],
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectProfessionalProfileSchema,
      "Professional profile retrieved successfully",
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
      "Professional profile not found",
    ),
  },
})

export type GetProfessionalProfileRoute = typeof getProfessionalProfile;