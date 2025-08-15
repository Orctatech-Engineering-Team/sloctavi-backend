import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { insertCustomerProfileSchema, insertProfessionalProfileSchema, selectCustomerProfileSchema, selectProfessionalProfileSchema, updateCustomerProfileSchema, updateProfessionalProfileSchema } from "@/db/schema/schema";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";
import { deleteRequestBody, profilePhotoUploadSchema, successResponseSchema, uploadErrorSchema } from "./schema";

// Create customer profile route
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
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
})

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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
})

// Update customer profile route
export const updateCustomerProfile = createRoute({
  path: "/profile/customer",
  method: "put",
  tags: ["Profile"],
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: jsonContentRequired(
      updateCustomerProfileSchema,
      "Customer profile data"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectCustomerProfileSchema,
      "Customer profile updated successfully",
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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
})

// Update professional profile route
export const updateProfessionalProfile = createRoute({
  path: "/profile/professional",
  method: "put",
  tags: ["Profile"],
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: jsonContentRequired(
      updateProfessionalProfileSchema,
      "Professional profile data"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectProfessionalProfileSchema,
      "Professional profile updated successfully",
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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
})

// Profile photo upload route
export const uploadProfilePhoto = createRoute({
  path: '/profile/photo',
  method: 'post',
  tags: ['Profile'],
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.instanceof(File).openapi({
              description: 'Profile photo file'
              }),
          })
        }
      }
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      profilePhotoUploadSchema,
      'Profile photo uploaded successfully'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      uploadErrorSchema,
      'Invalid request data'
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      'Unauthorized'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      'User profile not found'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      uploadErrorSchema,
      'Upload failed'
    ),
  },
});

// Delete profile photo route
export const deleteProfilePhoto = createRoute({
  path: '/profile/photo',
  method: 'delete',
  tags: ['Profile'],
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: jsonContentRequired(
      deleteRequestBody,
      'Profile photo deletion data'
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      successResponseSchema,
      'Photo deleted successfully'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      'Photo not found'
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      'Unauthorized'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      uploadErrorSchema,
      'Deletion failed'
    ),
  },
});



export type GetProfessionalProfileRoute = typeof getProfessionalProfile;

export type CreateCustomerProfile = typeof createCustomerProfile;

export type CreateProfessionalProfileRoute = typeof createProfessionalProfile;

export type UpdateCustomerProfileRoute = typeof updateCustomerProfile;

export type UpdateProfessionalProfileRoute = typeof updateProfessionalProfile;

export type GetCustomerProfileRoute = typeof getCustomerProfile;

export type UploadProfilePhotoRoute = typeof uploadProfilePhoto;

export type DeleteProfilePhotoRoute = typeof deleteProfilePhoto;
