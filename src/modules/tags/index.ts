import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.getTags, handlers.getTags)
  .openapi(routes.getTagById, handlers.getTagById)
  .openapi(routes.createTag, handlers.createTag)
  .openapi(routes.updateTag, handlers.updateTag)
  .openapi(routes.deleteTag, handlers.deleteTag)
  .openapi(routes.searchTags, handlers.searchTags)
  .openapi(routes.getServiceTags, handlers.getServiceTags)
  .openapi(routes.assignTagToService, handlers.assignTagToService)
  .openapi(routes.removeTagFromService, handlers.removeTagFromService)
  .openapi(routes.getServicesByTag, handlers.getServicesByTag)
  .openapi(routes.getTagsByService, handlers.getTagsByService);

export default router;