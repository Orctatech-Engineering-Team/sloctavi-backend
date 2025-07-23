/* eslint-disable no-console */
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { OpenAPIHono } from "@hono/zod-openapi";
import * as schema from "../db/schema/schema";

async function verifyDependencies() {
  console.log("🔍 Verifying dependency compatibility...");

  try {
    // Test Zod v4
    console.log("\n📦 Testing Zod v4...");
    const testSchema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1),
      email: z.string().email(),
    });
    
    const validData = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test User",
      email: "test@example.com",
    };
    
    const result = testSchema.parse(validData);
    console.log("✅ Zod v4 working correctly");
    console.log(`   Parsed data: ${JSON.stringify(result)}`);

    // Test drizzle-zod compatibility
    console.log("\n🗄️  Testing drizzle-zod compatibility...");
    const userInsertSchema = createInsertSchema(schema.users);
    console.log("✅ drizzle-zod working with Zod v4");
    console.log(`   Schema keys: ${Object.keys(userInsertSchema.shape).join(", ")}`);

    // Test OpenAPI Hono compatibility
    console.log("\n🌐 Testing OpenAPI Hono compatibility...");
    const app = new OpenAPIHono();
    
    app.openapi({
      method: "get",
      path: "/test",
      summary: "Test endpoint",
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: testSchema,
            },
          },
        },
      },
    }, (c) => {
      return c.json(validData);
    });

    console.log("✅ OpenAPI Hono working correctly");
    console.log(`   Routes registered: ${app.routes.length}`);

    // Test our OpenAPI schemas
    console.log("\n📋 Testing OpenAPI schemas...");
    const { 
      ApiResponseSchema, 
      PaginationQuerySchema, 
      LoginSchema 
    } = await import("../lib/openapi-schemas");
    
    const loginData = LoginSchema.parse({
      email: "test@example.com",
      password: "password123"
    });
    
    const paginationData = PaginationQuerySchema.parse({
      page: "1",
      limit: "20"
    });

    console.log("✅ OpenAPI schemas working correctly");
    console.log(`   Login schema: ${Object.keys(LoginSchema.shape).join(", ")}`);
    console.log(`   Pagination schema: ${Object.keys(PaginationQuerySchema.shape).join(", ")}`);

    console.log("\n🎉 All dependencies are compatible!");
    
  } catch (error) {
    console.error("❌ Dependency verification failed:", error);
    throw error;
  }
}

verifyDependencies()
  .then(() => {
    console.log("\n✅ Dependency verification completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Dependency verification failed:", error);
    process.exit(1);
  });