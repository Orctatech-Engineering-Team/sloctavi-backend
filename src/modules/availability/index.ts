import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.setAvailability, handlers.setAvailability)
  .openapi(routes.getAvailability, handlers.getAvailability)
  .openapi(routes.updateAvailability, handlers.updateAvailability)
  .openapi(routes.deleteAvailability, handlers.deleteAvailability);

export default router;