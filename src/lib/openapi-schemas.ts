import { z } from "zod";

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as schema from "@/db/schema/schema";

// Common schemas for API responses
export const ApiResponseSchema = z.object({
  success: z.boolean().default(true).openapi({
    description: "Indicates if the request was successful",
    example: true
  }),
  message: z.string().optional().openapi({
    description: "Optional message providing additional information",
    example: "Operation completed successfully"
  }),
  timestamp: z.string().datetime().optional().openapi({
    description: "ISO 8601 timestamp of the response",
    example: "2024-01-15T10:30:00Z"
  }),
}).openapi({
  description: "Standard API response format"
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({
    description: "Page number (starts from 1)",
    example: 1,
    param: { name: "page", in: "query" }
  }),
  limit: z.coerce.number().int().min(1).max(100).default(20).openapi({
    description: "Number of items per page (1-100)",
    example: 20,
    param: { name: "limit", in: "query" }
  }),
  sort: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*:(asc|desc)$/).optional().openapi({
    description: "Sort field and direction (e.g., 'createdAt:desc')",
    example: "createdAt:desc",
    param: { name: "sort", in: "query" }
  }),
}).openapi({
  description: "Pagination and sorting parameters"
});

export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1).openapi({
    description: "Current page number",
    example: 1
  }),
  limit: z.number().int().min(1).max(100).openapi({
    description: "Items per page",
    example: 20
  }),
  total: z.number().int().min(0).openapi({
    description: "Total number of items",
    example: 150
  }),
  totalPages: z.number().int().min(0).openapi({
    description: "Total number of pages",
    example: 8
  }),
  hasNext: z.boolean().openapi({
    description: "Whether there are more pages",
    example: true
  }),
  hasPrev: z.boolean().openapi({
    description: "Whether there are previous pages",
    example: false
  }),
}).openapi({
  description: "Pagination metadata"
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  });

// Error schemas
export const ErrorSchema = z.object({
  error: z.string().openapi({
    description: "Error type or code",
    example: "VALIDATION_ERROR"
  }),
  message: z.string().openapi({
    description: "Human-readable error message",
    example: "Invalid input data"
  }),
  details: z.record(z.any()).optional().openapi({
    description: "Additional error details",
    example: { field: "email", reason: "Invalid format" }
  }),
  timestamp: z.string().datetime().optional().openapi({
    description: "Error occurrence timestamp",
    example: "2024-01-15T10:30:00Z"
  }),
  path: z.string().optional().openapi({
    description: "API endpoint where error occurred",
    example: "/api/auth/login"
  }),
}).openapi({
  description: "Standard error response format"
});

export const ValidationErrorSchema = ErrorSchema.extend({
  error: z.literal("VALIDATION_ERROR"),
  details: z.object({
    field: z.string(),
    reason: z.string(),
  }).optional(),
});

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format").openapi({
    description: "User's email address",
    example: "user@example.com"
  }),
  password: z.string().min(8, "Password must be at least 8 characters").openapi({
    description: "User's password (minimum 8 characters)",
    example: "password123"
  }),
}).openapi({
  description: "Login credentials",
  example: {
    email: "user@example.com",
    password: "password123"
  }
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format").openapi({
    description: "User's email address",
    example: "newuser@example.com"
  }),
  password: z.string().min(8, "Password must be at least 8 characters").openapi({
    description: "User's password (minimum 8 characters)",
    example: "securepassword123"
  }),
  type: z.enum(["customer", "professional"], {
    errorMap: () => ({ message: "Type must be either 'customer' or 'professional'" }),
  }).openapi({
    description: "Type of user account",
    example: "customer",
    enum: ["customer", "professional"]
  }),
}).openapi({
  description: "User registration data",
  example: {
    email: "newuser@example.com",
    password: "securepassword123",
    type: "customer"
  }
});

export const TokenResponseSchema = z.object({
  access_token: z.string().openapi({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }),
  refresh_token: z.string().openapi({
    description: "Refresh token for obtaining new access tokens",
    example: "refresh_abc123def456"
  }),
  token_type: z.literal("Bearer").openapi({
    description: "Token type (always Bearer)",
    example: "Bearer"
  }),
  expires_in: z.number().int().positive().openapi({
    description: "Token expiration time in seconds",
    example: 86400
  }),
}).openapi({
  description: "Authentication token response"
});

// Database model schemas
export const UserResponseSchema = createSelectSchema(schema.users).omit({
  password: true,
});

export const CustomerProfileSchema = createSelectSchema(schema.customerProfiles);
export const ProfessionalProfileSchema = createSelectSchema(schema.professionalProfiles);
export const ServiceSchema = createSelectSchema(schema.services);
export const BookingSchema = createSelectSchema(schema.bookings);
export const ReviewSchema = createSelectSchema(schema.reviews);
export const ProfessionSchema = createSelectSchema(schema.professions);
export const CategorySchema = createSelectSchema(schema.categories);
export const TagSchema = createSelectSchema(schema.tags);
export const AvailabilitySchema = createSelectSchema(schema.availability);
export const NotificationSchema = createSelectSchema(schema.notifications);

// Insert schemas
export const CreateCustomerProfileSchema = createInsertSchema(schema.customerProfiles).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateProfessionalProfileSchema = createInsertSchema(schema.professionalProfiles).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateServiceSchema = createInsertSchema(schema.services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateBookingSchema = createInsertSchema(schema.bookings).omit({
  id: true,
  createdAt: true,
});

export const CreateReviewSchema = createInsertSchema(schema.reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Search and filter schemas
export const ServiceSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  profession: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  available: z.coerce.boolean().optional(),
}).merge(PaginationQuerySchema);

export const BookingFilterSchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  professionalId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
}).merge(PaginationQuerySchema);

// WebSocket schemas
export const WebSocketMessageSchema = z.object({
  type: z.enum(["notification", "booking_update", "message"]),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
});

// Health check schema
export const HealthCheckSchema = z.object({
  status: z.enum(["healthy", "unhealthy"]),
  timestamp: z.string().datetime(),
  uptime: z.number().positive(),
  version: z.string(),
  environment: z.string(),
  database: z.object({
    status: z.enum(["connected", "disconnected"]),
    responseTime: z.number().optional(),
  }),
  redis: z.object({
    status: z.enum(["connected", "disconnected"]),
    responseTime: z.number().optional(),
  }).optional(),
});