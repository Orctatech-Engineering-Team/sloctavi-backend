import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { setupWebSocketShutdown } from "./shared/services/notification/websocket";

const port = env.PORT;
// eslint-disable-next-line no-console
console.log(`Server is running on port http://localhost:${port}`);

// Setup graceful shutdown for WebSockets
setupWebSocketShutdown();

const server = serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});

export default server;
