import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.getAvailability, handlers.getAvailability)
  .openapi(routes.createAvailability, handlers.createAvailability)
  .openapi(routes.updateAvailability, handlers.updateAvailability)
  .openapi(routes.deleteAvailability, handlers.deleteAvailability)
  .openapi(routes.getWeeklyAvailability, handlers.getWeeklyAvailability)
  .openapi(routes.bulkUpdateAvailability, handlers.bulkCreateAvailability);

export default router;
