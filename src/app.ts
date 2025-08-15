import { jwt } from "hono/jwt";
import { createNodeWebSocket } from "@hono/node-ws";

import env from "@/env";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import auth from "@/modules/auth";
import health from "@/modules/health";
import bookings from "@/modules/bookings";
import profile from "@/modules/profile";
import availability from "@/modules/availability";
import services from "@/modules/services";
import reviews from "@/modules/reviews";
import dashboard from "@/modules/dashboard";
import roles from "@/modules/roles";
import categories from "@/modules/categories";
import tags from "@/modules/tags";
import bookingStatus from "@/modules/booking-status";
import auditLogs from "@/modules/audit-logs";
import notifications from "@/modules/notifications";
import index from "@/routes/index";
import { createWebSocketHandler } from "@/shared/services/notification/websocket";
// import { createBullBoard } from "@bull-board/api";
// import { HonoAdapter } from "@bull-board/hono";
// import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
// import { emailQueue } from "@/shared/services/mailer/queue";
// import { serveStatic } from "@hono/node-server/serve-static";
import {showRoutes} from "hono/dev"
import {cors} from "hono/cors";
import { openApiMetadata, requestTracking, rateLimitHeaders, errorFormatter, securityHeaders} from "@/lib/openapi-middleware";

const app = createApp();

// Add OpenAPI and security middleware

app.use('*', securityHeaders());

app.use('*', requestTracking());
app.use('*', openApiMetadata());
app.use('*', rateLimitHeaders(100, 60000)); // 100 requests per minute
app.use('*', errorFormatter());

// Enable CORS for all origins (safe for local testing, not for prod)
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
  exposeHeaders: ['X-Request-ID', 'X-Response-Time', 'X-API-Version'],
}))

// Set up WebSocket support
const { upgradeWebSocket } = createNodeWebSocket({ app });

configureOpenAPI(app);

// WebSocket endpoint for real-time notifications
app.get("/ws", createWebSocketHandler(upgradeWebSocket));

// const serverAdapter = new HonoAdapter(serveStatic)

// createBullBoard({
//   serverAdapter,
//   queues: [new BullMQAdapter(emailQueue)],
// })

// const basePath = "/ui"
// serverAdapter.setBasePath(basePath)
// app.route(basePath, serverAdapter.registerPlugin())



const publicRoutes = [auth, health] as const;

const routes = [index, profile, bookings, availability, services, reviews, dashboard, roles, categories, tags, bookingStatus, auditLogs, notifications] as const;

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
