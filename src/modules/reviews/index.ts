import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.createReview, handlers.createReview)
  .openapi(routes.getReviews, handlers.getReviews)
  .openapi(routes.getProfessionalReviews, handlers.getProfessionalReviews)
  .openapi(routes.updateReview, handlers.updateReview)
  .openapi(routes.deleteReview, handlers.deleteReview);

export default router;