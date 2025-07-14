import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.getDashboardOverviewRoute, handlers.getDashboardOverview)
  .openapi(routes.getProfessionalAnalyticsRoute, handlers.getAnalytics)
  .openapi(routes.getProfessionalCalendarRoute, handlers.getCalendar)
  .openapi(routes.getServicePerformanceRoute, handlers.getPerformance)
  .openapi(routes.getUpcomingBookingsRoute, handlers.getUpcomingBookings)
  .openapi(routes.getRevenueStatsRoute, handlers.getRevenueStats);

export default router;
