import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.getPopularProfessionals, handlers.getPopularProfessionals)
  .openapi(routes.getHotDeals, handlers.getHotDeals)
  .openapi(routes.getDashboardStats, handlers.getDashboardStats);

export default router;