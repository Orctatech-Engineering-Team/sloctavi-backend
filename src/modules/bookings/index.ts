import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter();

router
  .openapi(routes.createBooking, handlers.createBooking)
  .openapi(routes.getUserBookings, handlers.getUserBookings)
  .openapi(routes.getBooking, handlers.getBooking)
  .openapi(routes.updateBookingStatus, handlers.updateBookingStatus)
  .openapi(routes.cancelBooking, handlers.cancelBooking)
  .openapi(routes.getAvailableSlots, handlers.getAvailableSlots);

export default router;
