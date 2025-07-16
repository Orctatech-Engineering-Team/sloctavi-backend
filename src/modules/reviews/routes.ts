import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { selectReviewSchema } from "@/db/schema/schema";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Reviews"];

export const createReview = createRoute({
  path: "/reviews",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      z.object({
        bookingId: z.string().uuid("Invalid booking ID"),
        rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
        comment: z.string().min(1, "Comment is required"),
      }),
      "Review data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectReviewSchema,
      "Review created successfully",
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
      "Booking not found",
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Review already exists for this booking",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getReviews = createRoute({
  path: "/reviews",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        reviews: z.array(selectReviewSchema),
        total: z.number(),
      }),
      "Reviews retrieved successfully",
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

export const getProfessionalReviews = createRoute({
  path: "/reviews/professional/{professionalId}",
  method: "get",
  tags,
  request: {
    params: z.object({
      professionalId: z.string().uuid("Invalid professional ID"),
    }),
    query: z.object({
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        reviews: z.array(selectReviewSchema),
        total: z.number(),
        averageRating: z.number(),
      }),
      "Professional reviews retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Professional not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const updateReview = createRoute({
  path: "/reviews/{id}",
  method: "put",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid("Invalid review ID"),
    }),
    body: jsonContentRequired(
      z.object({
        rating: z.number().min(1).max(5).optional(),
        comment: z.string().min(1).optional(),
      }),
      "Review update data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectReviewSchema,
      "Review updated successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Review not found",
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

export const deleteReview = createRoute({
  path: "/reviews/{id}",
  method: "delete",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid("Invalid review ID"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Review deleted successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Review not found",
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

export type CreateReviewRoute = typeof createReview;
export type GetReviewsRoute = typeof getReviews;
export type GetProfessionalReviewsRoute = typeof getProfessionalReviews;
export type UpdateReviewRoute = typeof updateReview;
export type DeleteReviewRoute = typeof deleteReview;