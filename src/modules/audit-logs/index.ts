import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.getAuditLogs, handlers.getAuditLogs)
  .openapi(routes.getAuditLogById, handlers.getAuditLogById)
  .openapi(routes.createAuditLog, handlers.createAuditLog)
  .openapi(routes.getEntityAuditLogs, handlers.getEntityAuditLogs)
  .openapi(routes.getUserActivityLogs, handlers.getUserActivityLogs)
  .openapi(routes.getAuditLogStatistics, handlers.getAuditLogStatistics);

export default router; 
