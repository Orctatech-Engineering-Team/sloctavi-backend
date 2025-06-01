import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter();

router
  .openapi(routes.createCustomerProfile, handlers.createCustomerProfile)
  .openapi(routes.getCustomerProfile, handlers.getCustomerProfile)
  .openapi(routes.createProfessionalProfile, handlers.createProfessionalProfile)
  .openapi(routes.getProfessionalProfile, handlers.getProfessionalProfile);

export default router;
