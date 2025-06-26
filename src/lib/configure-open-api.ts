import { swaggerUI } from "@hono/swagger-ui";
import { apiReference } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "./types";

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgJsonPath = resolve(__dirname, '../../package.json');
const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));


export default function configureOpenAPI(app: AppOpenAPI) {
  // Serve OpenAPI JSON at /doc
  app.doc("/doc", c => ({
    openapi: "3.0.0",
    info: {
      title: "SMSX API",
      description: "RESTful API documentation for the SMSX backend — manage users, notifications, and platform services.",
      version: pkg.version,
      contact: {
        name: "SMSX Dev Team",
        email: "dev@smsx.dev",
        url: "https://smsx.dev",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "https://api.smsx.dev",
        description: "Production",
      },
      {
        url: new URL(c.req.url).origin,
        description: "Local Development",
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication routes" },
      { name: "Notifications", description: "Notification system endpoints" },
      { name: "Admin", description: "Restricted routes for admins" },
      { name: "Health", description: "Monitoring and diagnostics" },
    ],
  }));

  // Serve interactive Swagger UI at /reference
  app.get(
    "/reference",
    apiReference({
      theme: "kepler", // or 'default', 'interstellar'
      layout: "classic", // or 'modern'
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
      spec: {
        url: "/doc", // pulls from the OpenAPI JSON above
      },
    }),
  );
  app.get(
    "/swagger",
    swaggerUI({
      url: "/doc", // OpenAPI JSON endpoint
      title: "SMSX API Documentation",
      version: "5.22.0",
    }),
  );
  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Use a valid JWT token in the Authorization header as `Bearer <token>`.",
  });
}
