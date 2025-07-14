import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { defaultHook } from "stoker/openapi";
import configureOpenAPI from "@/lib/configure-open-api";
import auth from "@/modules/auth";
import health from "@/modules/health";
import bookings from "@/modules/bookings";
import profile from "@/modules/profile";
import index from "@/routes/index";
import type { AppBindings } from "@/lib/types";

const app = new OpenAPIHono<AppBindings>({
  strict: false,
  defaultHook,
});

// Configure CORS and OpenAPI
app.use("*", cors());
configureOpenAPI(app);

// Register public routes (no auth required)
const publicRoutes = [auth, health] as const;
for (const route of publicRoutes) {
  app.route("/api", route);
}

// JWT middleware for protected routes
app.use(
  "/api/*",
  jwt({
    secret: "test-jwt-secret-key-very-long-and-secure",
  }),
);

// Register protected routes
const routes = [index, profile, bookings] as const;
for (const route of routes) {
  app.route("/api", route);
}

export default app;
