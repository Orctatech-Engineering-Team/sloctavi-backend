import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

import { selectProfessionalProfileSchema } from "@/db/schema/schema";
import { badRequestSchema } from "@/lib/constants";

const tags = ["Dashboard"];

const popularProfessionalSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  businessName: z.string().nullable(),
  profileImage: z.string().nullable(),
  location: z.string().nullable(),
  averageRating: z.number(),
  totalBookings: z.number(),
  totalReviews: z.number(),
  professionName: z.string(),
});

const hotDealSchema = z.object({
  id: z.string(),
  professionalId: z.string(),
  professionalName: z.string().nullable(),
  businessName: z.string().nullable(),
  serviceName: z.string(),
  originalPrice: z.string().nullable(),
  discountedPrice: z.string().nullable(),
  discountPercentage: z.number().nullable(),
  description: z.string().nullable(),
  validUntil: z.string().nullable(),
});

const dashboardStatsSchema = z.object({
  totalProfessionals: z.number(),
  totalCustomers: z.number(),
  totalBookings: z.number(),
  totalReviews: z.number(),
  averageRating: z.number(),
  recentBookings: z.number(),
  topProfessions: z.array(z.object({
    id: z.number(),
    name: z.string(),
    count: z.number(),
  })),
});

export const getPopularProfessionals = createRoute({
  path: "/dashboard/popular",
  method: "get",
  tags,
  request: {
    query: z.object({
      limit: z.string().transform(Number).optional().default("10"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(popularProfessionalSchema),
      "Popular professionals retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getHotDeals = createRoute({
  path: "/dashboard/hot-deals",
  method: "get",
  tags,
  request: {
    query: z.object({
      limit: z.string().transform(Number).optional().default("10"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(hotDealSchema),
      "Hot deals retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getDashboardStats = createRoute({
  path: "/dashboard/stats",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      dashboardStatsSchema,
      "Dashboard statistics retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export type GetPopularProfessionalsRoute = typeof getPopularProfessionals;
export type GetHotDealsRoute = typeof getHotDeals;
export type GetDashboardStatsRoute = typeof getDashboardStats;