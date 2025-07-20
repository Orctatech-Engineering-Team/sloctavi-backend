import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.getUserNotifications, handlers.getUserNotifications)
  .openapi(routes.getNotificationById, handlers.getNotificationById)
  .openapi(routes.createNotification, handlers.createNotification)
  .openapi(routes.markAsRead, handlers.markAsRead)
  .openapi(routes.markAllAsRead, handlers.markAllAsRead)
  .openapi(routes.deleteNotification, handlers.deleteNotification)
  .openapi(routes.deleteAllNotifications, handlers.deleteAllNotifications)
  .openapi(routes.getUnreadCount, handlers.getUnreadCount)
  .openapi(routes.createBulkNotification, handlers.createBulkNotification)
  .openapi(routes.getNotificationStatistics, handlers.getNotificationStatistics);

export default router;