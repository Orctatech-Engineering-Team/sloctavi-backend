import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.getBookingStatuses, handlers.getBookingStatuses)
  .openapi(routes.getBookingStatusById, handlers.getBookingStatusById)
  .openapi(routes.createBookingStatus, handlers.createBookingStatus)
  .openapi(routes.updateBookingStatus, handlers.updateBookingStatus)
  .openapi(routes.deleteBookingStatus, handlers.deleteBookingStatus)
  .openapi(routes.getBookingStatusHistory, handlers.getBookingStatusHistory);

export default router;