import { jwt } from "hono/jwt";

import env from "@/env";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import auth from "@/modules/auth";
import bookings from "@/modules/bookings";
import profile from "@/modules/profile";
import index from "@/routes/index";
import { createWebSocketHandler } from "@/shared/services/notification/websocket";
import { createBullBoard } from "@bull-board/api";
import { HonoAdapter } from "@bull-board/hono";
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { emailQueue } from "@/shared/services/mailer/queue";
import { serveStatic } from "@hono/node-server/serve-static";
import {showRoutes} from "hono/dev"

const app = createApp();

configureOpenAPI(app);

// WebSocket endpoint for real-time notifications
app.get("/ws", createWebSocketHandler(app));

const serverAdapter = new HonoAdapter(serveStatic)

createBullBoard({
  serverAdapter,
  queues: [new BullMQAdapter(emailQueue)],
})

const basePath = "/ui"
serverAdapter.setBasePath(basePath)
app.route(basePath, serverAdapter.registerPlugin())

showRoutes(app)

const publicRoutes = [auth] as const;

const routes = [index, profile, bookings] as const;

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
