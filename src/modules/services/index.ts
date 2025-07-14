import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter();

router
  .openapi(routes.getServices, handlers.getServices)
  .openapi(routes.getServiceById, handlers.getServiceById)
  .openapi(routes.createService, handlers.createService)
  .openapi(routes.updateService, handlers.updateService)
  .openapi(routes.deleteService, handlers.deleteService)
  .openapi(routes.addProfessionalService, handlers.addProfessionalService)
  .openapi(routes.updateProfessionalService, handlers.updateProfessionalService)
  .openapi(routes.removeProfessionalService, handlers.removeProfessionalService)
  .openapi(routes.getProfessionalServices, handlers.getProfessionalServices);

export default router;
