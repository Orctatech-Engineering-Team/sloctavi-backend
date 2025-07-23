import { swaggerUI } from "@hono/swagger-ui";
import { apiReference } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "./types";

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgJsonPath = resolve(__dirname, '../../package.json');
const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));


export default function configureOpenAPI(app: AppOpenAPI) {
  // Serve OpenAPI JSON at /doc
  app.doc("/doc", c => ({
    openapi: "3.1.0",
    info: {
      title: "Sloctavi API",
      summary: "Service Booking Platform API",
      description: `
# Sloctavi Service Booking Platform API

A comprehensive RESTful API for managing service bookings, professionals, customers, and platform operations.

## Features
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Customer and professional profiles with verification
- **Booking System**: Complete booking lifecycle management
- **Reviews & Ratings**: Customer feedback and professional ratings
- **Search & Discovery**: Advanced service and professional search
- **Analytics**: Comprehensive dashboard and audit logging
- **Real-time Notifications**: WebSocket-based notification system

## Getting Started
1. Register as a customer or professional
2. Verify your email with the OTP sent
3. Login to get your JWT token
4. Use the token in the Authorization header: \`Bearer <token>\`

## Rate Limits
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Support
For API support, contact: dev@sloctavi.com
      `,
      version: pkg.version,
      termsOfService: "https://sloctavi.com/terms-of-service",
      contact: {
        name: "Sloctavi Dev Team",
        email: "dev@sloctavi.com",
        url: "https://sloctavi.com/contact",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
        identifier: "MIT"
      },
    },
    servers: [
      {
        url: "https://sloctavi-backend.onrender.com/api",
        description: "Production Server",
        variables: {
          version: {
            default: "v1",
            description: "API version"
          }
        }
      },
      {
        url: `${new URL(c.req.url).origin}/api`,
        description: "Development Server",
      },
    ],
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      { 
        name: "Authentication", 
        description: "User authentication, registration, and token management",
        externalDocs: {
          description: "Authentication Guide",
          url: "https://docs.sloctavi.com/auth"
        }
      },
      { 
        name: "Users & Profiles", 
        description: "Customer and professional profile management" 
      },
      { 
        name: "Bookings", 
        description: "Service booking creation, management, and tracking" 
      },
      { 
        name: "Services", 
        description: "Service catalog, categories, and professional services" 
      },
      { 
        name: "Availability", 
        description: "Professional availability and scheduling management" 
      },
      { 
        name: "Reviews & Ratings", 
        description: "Customer reviews and professional ratings" 
      },
      { 
        name: "Dashboard", 
        description: "Analytics and reporting endpoints" 
      },
      { 
        name: "Administration", 
        description: "Admin-only endpoints for platform management" 
      },
      { 
        name: "Notifications", 
        description: "Real-time notification system and preferences" 
      },
      { 
        name: "System", 
        description: "Health checks, monitoring, and system status" 
      },
    ],
    paths: {},
    components: {
      schemas: {
        Error: {
          type: "object",
          required: ["error", "message"],
          properties: {
            error: {
              type: "string",
              description: "Error type or code"
            },
            message: {
              type: "string",
              description: "Human-readable error message"
            },
            details: {
              type: "object",
              description: "Additional error details",
              additionalProperties: true
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Error occurrence timestamp"
            },
            path: {
              type: "string",
              description: "API endpoint where error occurred"
            }
          },
          example: {
            error: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: {
              field: "email",
              reason: "Invalid email format"
            },
            timestamp: "2024-01-15T10:30:00Z",
            path: "/api/auth/register"
          }
        },
        PaginationMeta: {
          type: "object",
          required: ["page", "limit", "total", "totalPages"],
          properties: {
            page: {
              type: "integer",
              minimum: 1,
              description: "Current page number"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              description: "Number of items per page"
            },
            total: {
              type: "integer",
              minimum: 0,
              description: "Total number of items"
            },
            totalPages: {
              type: "integer",
              minimum: 0,
              description: "Total number of pages"
            },
            hasNext: {
              type: "boolean",
              description: "Whether there are more pages"
            },
            hasPrev: {
              type: "boolean",
              description: "Whether there are previous pages"
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: "Bad Request - Invalid input data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        },
        Unauthorized: {
          description: "Unauthorized - Invalid or missing authentication",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              },
              example: {
                error: "UNAUTHORIZED",
                message: "Invalid or expired token",
                timestamp: "2024-01-15T10:30:00Z",
                path: "/api/bookings"
              }
            }
          }
        },
        Forbidden: {
          description: "Forbidden - Insufficient permissions",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        },
        NotFound: {
          description: "Not Found - Resource does not exist",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        },
        ValidationError: {
          description: "Validation Error - Invalid input format",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        },
        TooManyRequests: {
          description: "Too Many Requests - Rate limit exceeded",
          headers: {
            "X-RateLimit-Limit": {
              description: "Request limit per time window",
              schema: {
                type: "integer"
              }
            },
            "X-RateLimit-Remaining": {
              description: "Remaining requests in current window",
              schema: {
                type: "integer"
              }
            },
            "X-RateLimit-Reset": {
              description: "Time when rate limit resets (Unix timestamp)",
              schema: {
                type: "integer"
              }
            }
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: "page",
          in: "query",
          description: "Page number for pagination",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: "limit",
          in: "query",
          description: "Number of items per page",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20
          }
        },
        SortParam: {
          name: "sort",
          in: "query",
          description: "Sort field and direction (e.g., 'createdAt:desc')",
          required: false,
          schema: {
            type: "string",
            pattern: "^[a-zA-Z_][a-zA-Z0-9_]*:(asc|desc)$"
          }
        }
      }
    },
    externalDocs: {
      description: "Full API Documentation",
      url: "https://docs.sloctavi.com"
    }
  }));

  // Serve interactive Scalar API Reference at /reference
  app.get(
    "/reference",
    apiReference({
      theme: "kepler",
      layout: "modern",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
      spec: {
        url: "/doc",
      },
      metaData: {
        title: "Sloctavi API Reference",
        description: "Interactive API documentation for the Sloctavi service booking platform",
        ogDescription: "Explore and test the Sloctavi API endpoints",
        ogTitle: "Sloctavi API Documentation",
        twitterCard: "summary_large_image"
      },
      searchHotKey: "k",
      showSidebar: true,
      hideModels: false,
      hideDownloadButton: false,
      hideDarkModeToggle: false,
    }),
  );
  // Serve traditional Swagger UI at /swagger
  app.get(
    "/swagger",
    swaggerUI({
      url: "/doc",
      title: "Sloctavi API Documentation",
      version: "3.1.0",
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      requestInterceptor: `
        (req) => {
          // Add API key or modify requests if needed
          console.log('Request:', req);
          return req;
        }
      `,
      responseInterceptor: `
        (res) => {
          console.log('Response:', res);
          return res;
        }
      `,
      onComplete: `
        () => {
          console.log('Swagger UI loaded successfully');
        }
      `,
      deepLinking: true,
      displayOperationId: false,
      defaultModelRendering: "example",
      docExpansion: "list",
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      persistAuthorization: true,
    }),
  );
  // Register security schemes
  app.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "",
  });

  // Register additional components for better API documentation
  app.openAPIRegistry.registerComponent("examples", "PaginatedResponse", {
    summary: "Paginated response example",
    value: {
      data: [
        { id: "1", name: "Example Item 1" },
        { id: "2", name: "Example Item 2" }
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: false
      }
    }
  });

  // Add webhook documentation if you have webhooks
  app.openAPIRegistry.registerComponent("callbacks", "BookingStatusUpdate", {
    "{$request.body#/webhookUrl}": {
      post: {
        summary: "Booking status change notification",
        description: "Called when a booking status changes",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  event: { type: "string", example: "booking.status_changed" },
                  bookingId: { type: "string" },
                  newStatus: { type: "string" },
                  timestamp: { type: "string", format: "date-time" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Webhook received successfully"
          }
        }
      }
    }
  });
}
