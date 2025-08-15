# OpenAPI Documentation Setup

This document describes the comprehensive OpenAPI 3.1 setup for the Sloctavi API, including Scalar and Swagger UI integration.

## Overview

The API documentation is built using:
- **OpenAPI 3.1.0** specification
- **Scalar API Reference** - Modern, interactive documentation
- **Swagger UI** - Traditional API explorer
- **Hono OpenAPI** - TypeScript-first OpenAPI integration

## Documentation Endpoints

| Endpoint | Description | Features |
|----------|-------------|----------|
| `/doc` | OpenAPI JSON specification | Raw OpenAPI spec for tools |
| `/reference` | Scalar API Reference | Modern UI, dark mode, search |
| `/swagger` | Swagger UI | Traditional interface, try-it-out |

## OpenAPI Configuration

### Core Information
- **Version**: OpenAPI 3.1.0
- **API Title**: Sloctavi API
- **Base Path**: `/api`
- **Authentication**: JWT Bearer tokens

### Key Features

#### 🔒 Security Configuration
- JWT Bearer authentication
- Comprehensive security scheme documentation
- Rate limiting headers
- CORS configuration
- Security headers (HSTS, XSS protection, etc.)

#### 📊 Response Standards
- Consistent error formatting
- Pagination support
- Standard HTTP status codes
- Detailed response examples

#### 🏷️ Organized Tags
- **Authentication**: User auth and tokens
- **Users & Profiles**: Customer/professional profiles
- **Bookings**: Service booking management
- **Services**: Service catalog and search
- **Availability**: Professional scheduling
- **Reviews & Ratings**: Customer feedback
- **Dashboard**: Analytics and reporting
- **Administration**: Admin-only endpoints
- **Notifications**: Real-time notifications
- **System**: Health checks and monitoring

## File Structure

```
src/lib/
├── configure-open-api.ts    # Main OpenAPI configuration
├── openapi-schemas.ts       # Zod schemas for API
├── openapi-helpers.ts       # Helper functions for routes
├── openapi-middleware.ts    # Custom middleware
└── types.ts                 # TypeScript types
```

## Usage Examples

### Adding Documentation to Routes

```typescript
import { createRouteConfig, createTag } from "@/lib/openapi-helpers";

const routeConfig = createRouteConfig({
  method: "post",
  path: "/api/bookings",
  tags: [createTag("bookings")],
  summary: "Create a new booking",
  description: "Creates a new service booking for the authenticated user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateBookingSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Booking created successfully",
      content: {
        "application/json": {
          schema: BookingSchema,
        },
      },
    },
  },
});
```

### Using Standard Schemas

```typescript
import { 
  PaginatedResponseSchema, 
  ErrorSchema,
  PaginationQuerySchema 
} from "@/lib/openapi-schemas";

// For paginated endpoints
const paginatedBookings = PaginatedResponseSchema(BookingSchema);

// For error responses
responses: {
  400: {
    description: "Bad Request",
    content: {
      "application/json": {
        schema: ErrorSchema,
      },
    },
  },
}
```

## Customization

### Scalar Configuration
The Scalar API Reference includes:
- **Kepler theme** with dark mode
- **Modern layout**
- **Search functionality** (Ctrl+K)
- **Custom CSS** for branding
- **Interactive examples**

### Swagger UI Configuration
The Swagger UI includes:
- **Try-it-out functionality**
- **Request/response logging**
- **Deep linking**
- **Persistent authorization**
- **Custom request/response interceptors**

## Best Practices

### 1. Consistent Documentation
- Use standard HTTP status codes
- Include detailed descriptions
- Provide realistic examples
- Document all required fields

### 2. Error Handling
- Use consistent error format
- Include error codes and messages
- Document all possible error scenarios
- Provide troubleshooting information

### 3. Authentication
- Document JWT token requirements
- Explain token expiration
- Provide token refresh instructions
- Include permission requirements

### 4. Pagination
- Use standard pagination parameters
- Document meta information
- Include navigation links
- Explain sorting options

## Middleware Features

The OpenAPI middleware adds:
- **Request tracking** with unique IDs
- **Response timing** information
- **API versioning** headers
- **Documentation links** in responses
- **Rate limiting** information
- **Security headers**
- **Error formatting**

## Testing

Use the test script to verify the setup:

```bash
# Start the development server
npm run dev

# In another terminal, test the endpoints
npx tsx src/scripts/test-openapi.ts
```

This will test:
- OpenAPI JSON endpoint
- Scalar API Reference
- Swagger UI
- Middleware headers
- API health endpoint

## External Documentation

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)
- [Scalar Documentation](https://github.com/scalar/scalar)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)
- [Hono OpenAPI](https://hono.dev/middleware/third-party/zod-openapi)

## Environment Variables

The following environment variables affect the documentation:

```env
NODE_ENV=development          # Affects security headers
JWT_SECRET=your-secret       # Required for auth documentation
PORT=9999                    # Server port for local development
```

## Troubleshooting

### Common Issues

1. **Missing schemas**: Ensure all Zod schemas are properly exported
2. **CORS errors**: Check CORS configuration in app.ts
3. **JWT errors**: Verify JWT_SECRET is set
4. **TypeScript errors**: Check type imports and exports

### Debug Mode

Enable debug logging for OpenAPI:

```typescript
// In configure-open-api.ts
console.log("OpenAPI spec:", JSON.stringify(spec, null, 2));
```

This comprehensive setup ensures your API documentation is professional, interactive, and compliant with modern OpenAPI standards.