import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { bookingStatus, bookingStatusHistory } from "@/db/schema/schema";
import { createSelectSchema } from "drizzle-zod";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Booking Status"];

const bookingStatusSchema = createSelectSchema(bookingStatus);
const bookingStatusHistorySchema = createSelectSchema(bookingStatusHistory);

const bookingStatusCreateSchema = z.object({
  name: z.string().min(1, "Status name is required").max(50, "Status name too long"),
  description: z.string().optional(),
});

const bookingStatusUpdateSchema = bookingStatusCreateSchema.partial();

const updateBookingStatusWithHistorySchema = z.object({
  newStatusId: z.number().min(1, "New status ID is required"),
});

export const getBookingStatuses = createRoute({
  path: "/booking-status",
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
        statuses: z.array(bookingStatusSchema),
        total: z.number(),
      }),
      "Booking statuses retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getBookingStatusById = createRoute({
  path: "/booking-status/{id}",
  method: "get",
  tags,
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      bookingStatusSchema,
      "Booking status retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Booking status not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const createBookingStatus = createRoute({
  path: "/booking-status",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(bookingStatusCreateSchema, "Booking status data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      bookingStatusSchema,
      "Booking status created successfully",
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

export const updateBookingStatus = createRoute({
  path: "/booking-status/{id}",
  method: "put",
  tags,
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
    body: jsonContentRequired(bookingStatusUpdateSchema, "Booking status update data"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      bookingStatusSchema,
      "Booking status updated successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Booking status not found",
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

export const deleteBookingStatus = createRoute({
  path: "/booking-status/{id}",
  method: "delete",
  tags,
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Booking status deleted successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Booking status not found",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Cannot delete booking status that is used in bookings",
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

export const getBookingStatusHistory = createRoute({
  path: "/booking-status/history",
  method: "get",
  tags,
  request: {
    query: z.object({
      bookingId: z.string().optional(),
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        history: z.array(bookingStatusHistorySchema),
        total: z.number(),
      }),
      "Booking status history retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export type GetBookingStatusesRoute = typeof getBookingStatuses;
export type GetBookingStatusByIdRoute = typeof getBookingStatusById;
export type CreateBookingStatusRoute = typeof createBookingStatus;
export type UpdateBookingStatusRoute = typeof updateBookingStatus;
export type DeleteBookingStatusRoute = typeof deleteBookingStatus;
export type GetBookingStatusHistoryRoute = typeof getBookingStatusHistory;