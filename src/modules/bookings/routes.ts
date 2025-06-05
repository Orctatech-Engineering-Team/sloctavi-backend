import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { custom } from "zod";

import { insertBookingSchema, selectBookingSchema } from "@/db/schema/schema";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

import { BookingWithDetailsSchema } from "./schema";

const tags = ["Bookings"];

// Create a booking
export const createBooking = createRoute({
  path: "/bookings",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      insertBookingSchema.omit({
        customerId: true, // Will be set from JWT
        status: true, // Will be set to default (pending)
      }),
      "Booking creation data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      BookingWithDetailsSchema,
      "Booking created successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid booking data or time slot unavailable",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to create booking",
    ),
  },
});

// Get user's bookings (customer or professional)
export const getUserBookings = createRoute({
  path: "/bookings",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
      role: z.enum(["customer", "professional"]).optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        bookings: z.array(
          BookingWithDetailsSchema,
        ),
        total: z.number(),
        hasMore: z.boolean(),
      }),
      "User bookings retrieved successfully",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid query parameters",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "No bookings found for the user",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to retrieve bookings",
    ),
  },
});

// Get specific booking details
export const getBooking = createRoute({
  path: "/bookings/{id}",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      BookingWithDetailsSchema,
      "Booking details retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Booking not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to retrieve booking details",
    ),
  },
});

// Update booking status (for professionals)
export const updateBookingStatus = createRoute({
  path: "/bookings/{id}/status",
  method: "patch",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: jsonContentRequired(
      z.object({
        status: z.number().int().min(1).max(4), // 1: pending, 2: confirmed, 3: completed, 4: cancelled
        notes: z.string().optional(),
      }),
      "Status update data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      BookingWithDetailsSchema,
      "Booking status updated successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid status or unauthorized status change",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Booking not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to update booking status",
    ),
  },
});

// Cancel booking (for customers)
export const cancelBooking = createRoute({
  path: "/bookings/{id}/cancel",
  method: "patch",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: jsonContentRequired(
      z.object({
        reason: z.string().optional(),
      }),
      "Cancellation reason",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        booking: selectBookingSchema,
      }),
      "Booking cancelled successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Cannot cancel booking (already completed or too late)",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Booking not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to cancel booking",
    ),
  },
});

// Get available time slots for a professional
export const getAvailableSlots = createRoute({
  path: "/bookings/availability/{professionalId}",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      professionalId: z.string().uuid(),
    }),
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
      serviceId: z.coerce.number().int().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        date: z.string(),
        availableSlots: z.array(
          z.object({
            startTime: z.string(),
            endTime: z.string(),
            available: z.boolean(),
            availabilityId: z.number(),
          }),
        ),
      }),
      "Available time slots",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Professional not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Authentication required",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid date format or service ID",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to retrieve available slots",
    ),
  },
});

export type CreateBookingRoute = typeof createBooking;
export type GetUserBookingsRoute = typeof getUserBookings;
export type GetBookingRoute = typeof getBooking;
export type UpdateBookingStatusRoute = typeof updateBookingStatus;
export type CancelBookingRoute = typeof cancelBooking;
export type GetAvailableSlotsRoute = typeof getAvailableSlots;
