import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";
import {
  AvailabilitySchema,
  CreateAvailabilitySchema,
  UpdateAvailabilitySchema,
  BulkAvailabilitySchema,
  AvailabilityListSchema,
  WeeklyAvailabilitySchema,
  AvailabilityFiltersSchema,
  TimeSlotSchema,
  DailyAvailabilitySchema,
} from "./schema";

const tags = ["Availability"];

// Get professional's availability (professional only)
export const getAvailability = createRoute({
  path: "/availability",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    query: AvailabilityFiltersSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      AvailabilityListSchema,
      "Availability retrieved successfully"
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
      "Failed to retrieve availability"
    ),
  },
});

// Get weekly availability view (professional only)
export const getWeeklyAvailability = createRoute({
  path: "/availability/weekly",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      date: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      WeeklyAvailabilitySchema,
      "Weekly availability retrieved successfully"
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
      "Failed to retrieve weekly availability"
    ),
  },
});

// Create availability slot (professional only)
export const createAvailability = createRoute({
  path: "/availability",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      CreateAvailabilitySchema,
      "Availability creation data"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      AvailabilitySchema,
      "Availability created successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid availability data or time conflict"
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
      "Failed to create availability"
    ),
  },
});

// Update availability slot (professional only)
export const updateAvailability = createRoute({
  path: "/availability/{id}",
  method: "put",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
    body: jsonContentRequired(
      UpdateAvailabilitySchema,
      "Availability update data"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      AvailabilitySchema,
      "Availability updated successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid availability data or time conflict"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Availability slot not found"
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
      "Failed to update availability"
    ),
  },
});

// Delete availability slot (professional only)
export const deleteAvailability = createRoute({
  path: "/availability/{id}",
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
      "Availability deleted successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Availability slot not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Professional access required"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Cannot delete availability with existing bookings"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to delete availability"
    ),
  },
});

// Bulk update availability (professional only)
export const bulkUpdateAvailability = createRoute({
  path: "/availability/bulk",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      BulkAvailabilitySchema,
      "Bulk availability data"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        created: z.number(),
        updated: z.number(),
        deleted: z.number(),
      }),
      "Availability updated successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid availability data or time conflicts"
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
      "Failed to update availability"
    ),
  },
});

// Check time slot availability (public, requires professionalId)
export const checkTimeSlotAvailability = createRoute({
  path: "/availability/check/{professionalId}",
  method: "post",
  tags,
  request: {
    params: z.object({
      professionalId: z.string().uuid(),
    }),
    body: jsonContentRequired(
      TimeSlotSchema,
      "Time slot to check"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        available: z.boolean(),
        availabilityId: z.number().optional(),
        conflictReason: z.string().optional(),
      }),
      "Time slot availability checked"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Professional not found"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid time slot data"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to check availability"
    ),
  },
});

// Get daily availability with booking info (public)
export const getDailyAvailability = createRoute({
  path: "/availability/daily/{professionalId}",
  method: "get",
  tags,
  request: {
    params: z.object({
      professionalId: z.string().uuid(),
    }),
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
      serviceId: z.coerce.number().int().positive().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      DailyAvailabilitySchema,
      "Daily availability retrieved successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Professional not found"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid date format"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to retrieve daily availability"
    ),
  },
});

export type GetAvailabilityRoute = typeof getAvailability;
export type GetWeeklyAvailabilityRoute = typeof getWeeklyAvailability;
export type CreateAvailabilityRoute = typeof createAvailability;
export type UpdateAvailabilityRoute = typeof updateAvailability;
export type DeleteAvailabilityRoute = typeof deleteAvailability;
export type BulkUpdateAvailabilityRoute = typeof bulkUpdateAvailability;
export type CheckTimeSlotAvailabilityRoute = typeof checkTimeSlotAvailability;
export type GetDailyAvailabilityRoute = typeof getDailyAvailability;
