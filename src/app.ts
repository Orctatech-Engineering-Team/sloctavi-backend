import { jwt } from "hono/jwt";

import env from "@/env";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import auth from "@/modules/auth";
import health from "@/modules/health";
import bookings from "@/modules/bookings";
import profile from "@/modules/profile";
import services from "@/modules/services";
import availability from "@/modules/availability";
import professional from "@/modules/professional";
import index from "@/routes/index";
import { createWebSocketHandler } from "@/shared/services/notification/websocket";
// import { createBullBoard } from "@bull-board/api";
// import { HonoAdapter } from "@bull-board/hono";
// import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
// import { emailQueue } from "@/shared/services/mailer/queue";
// import { serveStatic } from "@hono/node-server/serve-static";
import {showRoutes} from "hono/dev"
import {cors} from "hono/cors";

const app = createApp();
// Enable CORS for all origins (safe for local testing, not for prod)
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))


configureOpenAPI(app);

// WebSocket endpoint for real-time notifications
app.get("/ws", createWebSocketHandler(app));

// const serverAdapter = new HonoAdapter(serveStatic)

// createBullBoard({
//   serverAdapter,
//   queues: [new BullMQAdapter(emailQueue)],
// })

// const basePath = "/ui"
// serverAdapter.setBasePath(basePath)
// app.route(basePath, serverAdapter.registerPlugin())



const publicRoutes = [auth, health, services] as const;

const routes = [index, profile, bookings, availability, professional] as const;

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

showRoutes(app)

export type AppType = (typeof routes)[number];

export default app;
