import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { jsonContent } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";

import {
  DashboardMetricsSchema,
  AnalyticsFiltersSchema,
  AnalyticsDataSchema,
  CalendarViewSchema,
  ServicePerformanceSchema,
  CustomerInsightsSchema,
} from "./schema";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Professional Dashboard"];

// Get professional dashboard overview
export const getDashboardOverviewRoute = createRoute({
  method: "get",
  path: "/dashboard",
  tags,
  security: [{ Bearer: [] }],
  request: {
    query: AnalyticsFiltersSchema.partial(),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      DashboardMetricsSchema,
      "Professional dashboard overview"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error"
    ),
  },
});

// Get professional analytics
export const getProfessionalAnalyticsRoute = createRoute({
  method: "get",
  path: "/analytics",
  tags,
  security: [{ Bearer: [] }],
  request: {
    query: AnalyticsFiltersSchema.partial(),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      AnalyticsDataSchema,
      "Professional analytics data"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error"
    ),
  },
});

// Get professional calendar view
export const getProfessionalCalendarRoute = createRoute({
  method: "get",
  path: "/calendar",
  tags,
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      month: z.string().transform(Number),
      year: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      CalendarViewSchema,
      "Professional calendar view"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error"
    ),
  },
});

// Get service performance metrics
export const getServicePerformanceRoute = createRoute({
  method: "get",
  path: "/performance/:serviceId",
  tags,
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      serviceId: z.string().transform(Number),
    }),
    query: AnalyticsFiltersSchema.partial(),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ServicePerformanceSchema,
      "Service performance metrics"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error"
    ),
  },
});

// Get customer insights
export const getCustomerInsightsRoute = createRoute({
  method: "get",
  path: "/customers",
  tags,
  security: [{ Bearer: [] }],
  request: {
    query: AnalyticsFiltersSchema.partial(),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      CustomerInsightsSchema,
      "Customer insights data"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error"
    ),
  },
});

// Get upcoming bookings
export const getUpcomingBookingsRoute = createRoute({
  method: "get",
  path: "/bookings/upcoming",
  tags,
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      limit: z.string().transform(Number).optional(),
      days: z.string().transform(Number).optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(z.object({
        id: z.string(),
        customerName: z.string(),
        customerPhone: z.string(),
        serviceName: z.string(),
        date: z.string(),
        time: z.string(),
        duration: z.number(),
        notes: z.string().optional(),
      })),
      "Upcoming bookings"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error"
    ),
  },
});

// Get revenue statistics
export const getRevenueStatsRoute = createRoute({
  method: "get",
  path: "/revenue",
  tags,
  security: [{ Bearer: [] }],
  request: {
    query: AnalyticsFiltersSchema.partial(),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        total: z.string(),
        thisMonth: z.string(),
        lastMonth: z.string(),
        growth: z.number(),
        breakdown: z.array(z.object({
          period: z.string(),
          amount: z.string(),
          bookings: z.number(),
        })),
      }),
      "Revenue statistics"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error"
    ),
  },
});
