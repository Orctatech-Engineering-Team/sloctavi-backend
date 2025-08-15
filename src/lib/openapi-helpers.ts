import type { z } from "zod";
import type { RouteConfig } from "@hono/zod-openapi";

// Helper types for better OpenAPI documentation
export interface OpenAPIRouteConfig extends Omit<RouteConfig, "responses"> {
  responses: {
    [key: string]: {
      description: string;
      content?: {
        "application/json": {
          schema: z.ZodSchema;
          example?: any;
        };
      };
      headers?: Record<string, {
        description: string;
        schema: z.ZodSchema;
      }>;
    };
  };
}

// Common response configurations
export const commonResponses = {
  400: {
    description: "Bad Request - Invalid input data",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error"
        }
      }
    }
  },
  401: {
    description: "Unauthorized - Invalid or missing authentication",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error"
        }
      }
    }
  },
  403: {
    description: "Forbidden - Insufficient permissions",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error"
        }
      }
    }
  },
  404: {
    description: "Not Found - Resource does not exist",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error"
        }
      }
    }
  },
  422: {
    description: "Validation Error - Invalid input format",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error"
        }
      }
    }
  },
  429: {
    description: "Too Many Requests - Rate limit exceeded",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error"
        }
      }
    }
  },
  500: {
    description: "Internal Server Error",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error"
        }
      }
    }
  }
};

// Helper function to create route configs with common responses
export const createRouteConfig = (
  config: Omit<OpenAPIRouteConfig, "responses"> & {
    responses: OpenAPIRouteConfig["responses"];
  }
): RouteConfig => {
  return {
    ...config,
    responses: {
      ...config.responses,
      ...commonResponses,
    },
  };
};

// Helper for authenticated routes
export const createAuthenticatedRoute = (
  config: Omit<OpenAPIRouteConfig, "responses" | "security"> & {
    responses: OpenAPIRouteConfig["responses"];
  }
): RouteConfig => {
  return createRouteConfig({
    ...config,
    security: [{ BearerAuth: [] }],
  });
};

// Helper for paginated responses
export const createPaginatedRoute = (
  config: Omit<OpenAPIRouteConfig, "responses"> & {
    responses: Omit<OpenAPIRouteConfig["responses"], "200"> & {
      200: {
        description: string;
        content: {
          "application/json": {
            schema: z.ZodSchema;
            example?: any;
          };
        };
      };
    };
  }
): RouteConfig => {
  return createRouteConfig({
    ...config,
    parameters: [
      ...(config.parameters || []),
      {
        name: "page",
        in: "query",
        description: "Page number for pagination",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
      },
      {
        name: "limit",
        in: "query",  
        description: "Number of items per page",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
      {
        name: "sort",
        in: "query",
        description: "Sort field and direction (e.g., 'createdAt:desc')",
        required: false,
        schema: {
          type: "string",
          pattern: "^[a-zA-Z_][a-zA-Z0-9_]*:(asc|desc)$",
        },
      },
    ],
  });
};

// OpenAPI metadata helpers
export const createOperationId = (method: string, path: string): string => {
  const cleanPath = path
    .replace(/^\/api\//, "")
    .replace(/\{([^}]+)\}/g, "By$1")
    .replace(/\//g, "_")
    .replace(/-/g, "_");
  
  return `${method.toLowerCase()}_${cleanPath}`;
};

export const createTag = (moduleName: string): string => {
  const tagMap: Record<string, string> = {
    auth: "Authentication",
    profile: "Users & Profiles",
    bookings: "Bookings", 
    services: "Services",
    availability: "Availability",
    reviews: "Reviews & Ratings",
    dashboard: "Dashboard",
    notifications: "Notifications",
    health: "System",
    roles: "Administration",
    categories: "Administration",
    tags: "Administration",
    "booking-status": "Administration",
    "audit-logs": "Administration",
  };

  return tagMap[moduleName] || moduleName;
};

// Example generators for better documentation
export const generateExamples = {
  user: {
    customer: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "customer@example.com",
      type: "customer",
      isVerified: true,
      createdAt: "2024-01-15T10:30:00Z",
      lastLogin: "2024-01-16T14:20:00Z"
    },
    professional: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      email: "professional@example.com", 
      type: "professional",
      isVerified: true,
      createdAt: "2024-01-10T08:15:00Z",
      lastLogin: "2024-01-16T09:45:00Z"
    }
  },
  booking: {
    id: "booking_123456789",
    customerId: "550e8400-e29b-41d4-a716-446655440000",
    professionalId: "550e8400-e29b-41d4-a716-446655440001", 
    serviceId: 1,
    date: "2024-02-15",
    time: "14:30:00",
    duration: 60,
    status: 2,
    notes: "Looking forward to the service",
    createdAt: "2024-01-16T10:00:00Z"
  },
  service: {
    id: 1,
    name: "Hair Cut & Style",
    professionId: 4,
    priceRange: "$50-$100",
    durationEstimate: 90,
    description: "Professional hair cutting and styling service",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z"
  },
  review: {
    id: "review_123456789",
    bookingId: "booking_123456789",
    customerId: "550e8400-e29b-41d4-a716-446655440000",
    rating: 5,
    comment: "Excellent service! Very professional and friendly.",
    createdAt: "2024-01-17T16:30:00Z",
    updatedAt: "2024-01-17T16:30:00Z"
  }
};