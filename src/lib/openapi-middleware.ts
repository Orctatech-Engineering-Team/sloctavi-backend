import type { Context, Next } from "hono";
import type { AppBindings } from "./types";

// Middleware to add OpenAPI metadata to responses
export const openApiMetadata = () => {
  return async (c: Context<AppBindings>, next: Next) => {
    // Add custom headers for API versioning and documentation
    c.header("X-API-Version", "1.0.0");
    c.header("X-Documentation", `${new URL(c.req.url).origin}/reference`);
    
    await next();
    
    // Add timing information for performance monitoring
    const timing = c.get("requestStartTime");
    if (timing) {
      const duration = Date.now() - timing;
      c.header("X-Response-Time", `${duration}ms`);
    }
  };
};

// Middleware to add request tracking
export const requestTracking = () => {
  return async (c: Context<AppBindings>, next: Next) => {
    c.set("requestStartTime" as any, Date.now());
    
    // Add request ID for tracing
    const requestId = c.req.header("X-Request-ID") || 
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    c.header("X-Request-ID", requestId);
    
    await next();
  };
};

// Middleware for rate limiting information
export const rateLimitHeaders = (limit: number, windowMs: number) => {
  return async (c: Context<AppBindings>, next: Next) => {
    // In a real implementation, you'd check against a rate limiter
    // For now, we'll just add the headers to document the limits
    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Window", (windowMs / 1000).toString());
    
    await next();
  };
};

// Middleware to ensure consistent error format
export const errorFormatter = () => {
  return async (c: Context<AppBindings>, next: Next) => {
    try {
      await next();
    } catch (error) {
      const errorResponse = {
        error: error instanceof Error ? error.name : "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString(),
        path: c.req.path,
        method: c.req.method,
        requestId: c.res.headers.get("X-Request-ID"),
      };

      // Log error for monitoring
      const logger = c.get("logger");
      if (logger) {
        logger.error({ error: errorResponse }, "Request failed");
      }

      return c.json(errorResponse, 500);
    }
  };
};

// Middleware to add CORS headers with proper OpenAPI documentation
export const corsWithDocumentation = () => {
  return async (c: Context<AppBindings>, next: Next) => {
    // Set CORS headers
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-API-Key");
    c.header("Access-Control-Expose-Headers", "X-Request-ID, X-Response-Time, X-API-Version");
    c.header("Access-Control-Max-Age", "86400");
    
    // Handle preflight requests
    if (c.req.method === "OPTIONS") {
      return c.text("", 204);
    }
    
    await next();
  };
};

// Middleware to validate API key for certain endpoints (if needed)
export const apiKeyValidation = (requiredForPaths: string[] = []) => {
  return async (c: Context<AppBindings>, next: Next) => {
    const path = c.req.path;
    const needsApiKey = requiredForPaths.some(requiredPath => 
      path.startsWith(requiredPath)
    );
    
    if (needsApiKey) {
      const apiKey = c.req.header("X-API-Key");
      if (!apiKey) {
        return c.json({
          error: "API_KEY_REQUIRED",
          message: "This endpoint requires an API key",
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }, 401);
      }
      
      // In a real implementation, validate the API key against your database
      // For now, we'll just check if it exists
    }
    
    await next();
  };
};

// Middleware to add security headers
export const securityHeaders = () => {
  return async (c: Context<AppBindings>, next: Next) => {
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Only add HSTS in production
    if (process.env.NODE_ENV === "production") {
      c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    
    await next();
  };
};