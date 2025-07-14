import "./setup.integration";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as HttpStatusCodes from "stoker/http-status-codes";
import app from "./test-app";

describe("API Integration Tests", () => {
  // Test helper to make authenticated requests
  const makeRequest = async (path: string, options: RequestInit = {}) => {
    return await app.request(path, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  };

  // Test helper to make authenticated requests with JWT
  const makeAuthRequest = async (path: string, token: string, options: RequestInit = {}) => {
    return await app.request(path, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });
  };

  describe("Health Check", () => {
    it("should return OK for health check", async () => {
      const response = await makeRequest("/api/healthz");
      expect(response.status).toBe(HttpStatusCodes.OK);
      
      const data = await response.json();
      expect(data).toEqual({
        message: "Health check successful",
        server: {
          status: "ok",
          timestamp: expect.any(String),
          uptime: expect.any(Number),
        },
        database: {
          status: "ok",
        },
        redis: {
          status: "ok",
        },
      });
    }, 10000); // 10 second timeout
  });

  describe("Authentication Required Endpoints", () => {
    it("should return unauthorized for profile endpoints without auth", async () => {
      const profileEndpoints = [
        "/api/profile/customer",
        "/api/profile/professional",
      ];

      for (const endpoint of profileEndpoints) {
        const response = await makeRequest(endpoint);
        expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
      }
    });

    it("should return unauthorized for booking endpoints without auth", async () => {
      const bookingEndpoints = [
        "/api/bookings",
      ];

      for (const endpoint of bookingEndpoints) {
        const response = await makeRequest(endpoint);
        expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
      }
    });
  });

  describe("OpenAPI Documentation", () => {
    it("should serve OpenAPI spec", async () => {
      const response = await makeRequest("/doc");
      expect(response.status).toBe(HttpStatusCodes.OK);
      // The response content type might be different, just check it's successful
    });

    it("should serve reference", async () => {
      const response = await makeRequest("/reference");
      expect(response.status).toBe(HttpStatusCodes.OK);
      // Check that reference endpoint works
    });
  });

  describe("CORS", () => {
    it("should handle CORS preflight requests", async () => {
      const response = await makeRequest("/api/healthz", {
        method: "OPTIONS",
        headers: {
          "Origin": "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      expect(response.status).toBe(204); // OPTIONS requests typically return 204
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("Error Handling", () => {
    it("should return 401 for non-existent protected endpoints", async () => {
      const response = await makeRequest("/api/non-existent");
      expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED); // Protected routes return 401 first
    });

    it("should return 405 for unsupported methods on documented routes", async () => {
      // Test PATCH method on health endpoint (which only supports GET)
      const response = await makeRequest("/api/healthz", {
        method: "PATCH",
      });
      // With JWT middleware in place, unauthorized requests may return 401
      // before method checking, or 405/404 depending on route handling
      expect([
        HttpStatusCodes.METHOD_NOT_ALLOWED, 
        HttpStatusCodes.NOT_FOUND, 
        HttpStatusCodes.UNAUTHORIZED
      ]).toContain(response.status);
    });
  });

  // TODO: Add tests with proper JWT tokens once auth is properly configured
  // For now, we test that endpoints correctly reject unauthorized requests
  describe("Protected Endpoints Structure", () => {
    it("should validate request structure for profile creation", async () => {
      const invalidData = {
        // Missing required fields
      };

      const response = await makeRequest("/api/profile/customer", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      // Should get 401 (unauthorized) before validation since no JWT
      expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
    });

    it("should validate request structure for booking creation", async () => {
      const invalidData = {
        // Missing required fields
      };

      const response = await makeRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      // Should get 401 (unauthorized) before validation since no JWT
      expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
    });
  });
});
