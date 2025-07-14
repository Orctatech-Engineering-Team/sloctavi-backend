import { eq, and, gte, lte, between, count, sum, avg, desc } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { AppError } from "@/utils/error";

import db from "@/db";
import { professionalProfiles, bookings, reviews, availability, services } from "@/db/schema/schema";

import type {
  getDashboardOverviewRoute,
  getProfessionalAnalyticsRoute,
  getProfessionalCalendarRoute,
  getServicePerformanceRoute,
  getUpcomingBookingsRoute,
  getRevenueStatsRoute,
} from "./routes";


import * as professionalService from "./services";

// Helper function to get professional profile ID
const getProfessionalId = async (userId: string): Promise<string> => {
  const professional = await db.query.professionalProfiles.findFirst({
    where: eq(professionalProfiles.userId, userId),
  });

  if (!professional) {
    throw new AppError("Professional profile not found", HttpStatusCodes.FORBIDDEN);
  }

  return professional.id;
};

export const getDashboardOverview: AppRouteHandler<typeof getDashboardOverviewRoute> = async (c) => {
  try {
    const jwtPayload = c.get("jwtPayload");
    if (!jwtPayload?.userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const professionalId = await getProfessionalId(jwtPayload.userId);
    const filters = c.req.valid("query");

    const dashboardData = await professionalService.getDashboardMetrics(professionalId, filters);

    return c.json(dashboardData, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
        logger.error({ err: error }, "Failed to get dashboard overview");
    
        return c.json(
          { message: error instanceof Error ? error.message : "Internal server error" },
          HttpStatusCodes.INTERNAL_SERVER_ERROR
        );
  }
};

export const getAnalytics: AppRouteHandler<typeof getProfessionalAnalyticsRoute> = async (c) => {
  try {
    const jwtPayload = c.get("jwtPayload");
    if (!jwtPayload?.userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const professionalId = await getProfessionalId(jwtPayload.userId);
    const { period, startDate, endDate } = c.req.valid("query");

    const analyticsData = await professionalService.getAnalyticsData(professionalId, {
      period,
      startDate,
      endDate,
    });

    return c.json(analyticsData, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
        logger.error({ err: error }, "Failed to add professional service");
    
        return c.json(
          { message: error instanceof Error ? error.message : "Internal server error" },
          HttpStatusCodes.INTERNAL_SERVER_ERROR
        );
  }
};

export const getCalendar: AppRouteHandler<typeof getProfessionalCalendarRoute> = async (c) => {
  try {
    const jwtPayload = c.get("jwtPayload");
    if (!jwtPayload?.userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const professionalId = await getProfessionalId(jwtPayload.userId);
    const { month, year } = c.req.valid("query");

    const calendarData = await professionalService.getCalendarView(professionalId, month, year);

    return c.json(calendarData, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to get professional calendar");
    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getPerformance: AppRouteHandler<typeof getServicePerformanceRoute> = async (c) => {
  try {
    const jwtPayload = c.get("jwtPayload");
    if (!jwtPayload?.userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const professionalId = await getProfessionalId(jwtPayload.userId);
    const { serviceId } = c.req.valid("param");
    const { period } = c.req.valid("query"); // Remove metric as it doesn't exist in the schema

    // TODO: Implement getServicePerformance function
    const performanceData = {
      serviceId: Number(serviceId),
      serviceName: "Sample Service",
      metrics: {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: "0",
        averageRating: undefined,
        reviewCount: 0,
        averageDuration: 0,
        bookingFrequency: 0,
        customerRetention: 0,
      },
      trends: {
        bookingsTrend: [],
        revenueTrend: [],
        ratingTrend: [],
      },
    };

    return c.json(performanceData, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to get service performance");
    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getUpcomingBookings: AppRouteHandler<typeof getUpcomingBookingsRoute> = async (c) => {
  try {
    const jwtPayload = c.get("jwtPayload");
    if (!jwtPayload?.userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const professionalId = await getProfessionalId(jwtPayload.userId);
    const { limit, days } = c.req.valid("query");

    // Get upcoming bookings using the dashboard metrics for now
    const dashboardData = await professionalService.getDashboardMetrics(professionalId);
    
    return c.json(dashboardData.upcomingBookings, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to get upcoming bookings");
    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getRevenueStats: AppRouteHandler<typeof getRevenueStatsRoute> = async (c) => {
  try {
    const jwtPayload = c.get("jwtPayload");
    if (!jwtPayload?.userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const professionalId = await getProfessionalId(jwtPayload.userId);
    const filters = c.req.valid("query"); // Remove destructuring of non-existent properties

    const revenueStats = await professionalService.getRevenueStats(professionalId, filters);

    // Map our response to match the expected schema
    const response = {
      total: revenueStats.total,
      thisMonth: revenueStats.thisMonth,
      lastMonth: revenueStats.lastMonth,
      growth: revenueStats.growth,
      breakdown: revenueStats.breakdown.map(item => ({
        period: item.serviceName, // Use service name as period for now
        amount: item.revenue,
        bookings: item.bookingCount,
      })),
    };

    return c.json(response, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to get revenue stats");
    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
