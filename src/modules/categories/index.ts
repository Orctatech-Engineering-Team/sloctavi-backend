import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.getCategories, handlers.getCategories)
  .openapi(routes.getCategoryById, handlers.getCategoryById)
  .openapi(routes.createCategory, handlers.createCategory)
  .openapi(routes.updateCategory, handlers.updateCategory)
  .openapi(routes.deleteCategory, handlers.deleteCategory)
  .openapi(routes.getServiceCategories, handlers.getServiceCategories)
  .openapi(routes.assignCategoryToService, handlers.assignCategoryToService)
  .openapi(routes.removeCategoryFromService, handlers.removeCategoryFromService)
  .openapi(routes.getServicesByCategory, handlers.getServicesByCategory)
  .openapi(routes.getCategoriesByService, handlers.getCategoriesByService);

export default router;