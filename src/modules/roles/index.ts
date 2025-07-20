import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.getRoles, handlers.getRoles)
  .openapi(routes.getRoleById, handlers.getRoleById)
  .openapi(routes.createRole, handlers.createRole)
  .openapi(routes.updateRole, handlers.updateRole)
  .openapi(routes.deleteRole, handlers.deleteRole)
  .openapi(routes.getUserRoles, handlers.getUserRoles)
  .openapi(routes.assignRoleToUser, handlers.assignRoleToUser)
  .openapi(routes.revokeRoleFromUser, handlers.revokeRoleFromUser)
  .openapi(routes.getUsersByRole, handlers.getUsersByRole)
  .openapi(routes.getRolesByUser, handlers.getRolesByUser);

export default router;