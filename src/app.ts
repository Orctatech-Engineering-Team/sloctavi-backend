import { jwt } from "hono/jwt";

import env from "@/env";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import auth from "@/modules/auth/index";
import profile from "@/modules/profile/index";
import index from "@/routes/index";

const app = createApp();

configureOpenAPI(app);

const publicRoutes = [auth] as const;

const routes = [index, profile] as const;

for (const route of publicRoutes) {
  app.route("/api", route);
}

app.use(
  "/api/*",
  jwt({
    secret: env.JWT_SECRET,
  }),
);

for (const route of routes) {
  app.route("/api", route);
}
export type AppType = (typeof routes)[number];

export default app;
