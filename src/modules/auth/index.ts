import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter();

router
  .openapi(routes.register, handlers.register)
  .openapi(routes.login, handlers.login)
  .openapi(routes.refreshToken, handlers.refresh)
  .openapi(routes.logout, handlers.logout)
  .openapi(routes.verifyEmail, handlers.verifyEmail)
  .openapi(routes.checkVerificationStatus, handlers.checkVerificationStatus)
  .openapi(routes.resendOTP, handlers.resendOTP)
  .openapi(routes.requestPasswordReset, handlers.requestPasswordReset)
  .openapi(routes.resetPassword, handlers.resetPassword);

export default router;
