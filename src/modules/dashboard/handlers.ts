import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { logInfo, logError } from "@/utils/logger";

import { dashboardService } from "./services";
import type { 
  GetPopularProfessionalsRoute, 
  GetHotDealsRoute, 
  GetDashboardStatsRoute 
} from "./routes";

export const getPopularProfessionals: AppRouteHandler<GetPopularProfessionalsRoute> = async (c) => {
  try {
    const { limit } = c.req.valid("query");

    const professionals = await dashboardService.getPopularProfessionals(limit);

    logInfo("Popular professionals retrieved", {
      service: "DashboardHandler",
      method: "getPopularProfessionals",
      count: professionals.length,
    });

    return c.json(professionals, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to retrieve popular professionals", {
      service: "DashboardHandler",
      method: "getPopularProfessionals",
    });

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getHotDeals: AppRouteHandler<GetHotDealsRoute> = async (c) => {
  try {
    const { limit } = c.req.valid("query");

    const deals = await dashboardService.getHotDeals(limit);

    logInfo("Hot deals retrieved", {
      service: "DashboardHandler",
      method: "getHotDeals",
      count: deals.length,
    });

    return c.json(deals, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to retrieve hot deals", {
      service: "DashboardHandler",
      method: "getHotDeals",
    });

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getDashboardStats: AppRouteHandler<GetDashboardStatsRoute> = async (c) => {
  try {
    const stats = await dashboardService.getDashboardStats();

    logInfo("Dashboard statistics retrieved", {
      service: "DashboardHandler",
      method: "getDashboardStats",
      totalProfessionals: stats.totalProfessionals,
      totalCustomers: stats.totalCustomers,
      totalBookings: stats.totalBookings,
    });

    return c.json(stats, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to retrieve dashboard statistics", {
      service: "DashboardHandler",
      method: "getDashboardStats",
    });

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};