/* eslint-disable no-console */

async function testOpenAPIEndpoints() {
  console.log("🧪 Testing OpenAPI endpoints...");

  const baseUrl = "http://localhost:3000";
  
  try {
    // Test OpenAPI JSON endpoint
    console.log("\n📄 Testing OpenAPI JSON endpoint (/doc)...");
    const docResponse = await fetch(`${baseUrl}/doc`);
    
    if (docResponse.ok) {
      const openApiSpec = await docResponse.json();
      console.log("✅ OpenAPI JSON endpoint working");
      console.log(`   OpenAPI Version: ${openApiSpec.openapi}`);
      console.log(`   API Title: ${openApiSpec.info.title}`);
      console.log(`   API Version: ${openApiSpec.info.version}`);
      console.log(`   Tags: ${openApiSpec.tags?.map((tag: any) => tag.name).join(", ")}`);
      console.log(`   Servers: ${openApiSpec.servers?.length || 0}`);
      console.log(`   Security Schemes: ${Object.keys(openApiSpec.components?.securitySchemes || {}).join(", ")}`);
    } else {
      console.log("❌ OpenAPI JSON endpoint failed:", docResponse.status);
    }

    // Test Scalar API Reference
    console.log("\n📚 Testing Scalar API Reference (/reference)...");
    const referenceResponse = await fetch(`${baseUrl}/reference`);
    
    if (referenceResponse.ok) {
      console.log("✅ Scalar API Reference working");
      console.log(`   Content-Type: ${referenceResponse.headers.get("content-type")}`);
    } else {
      console.log("❌ Scalar API Reference failed:", referenceResponse.status);
    }

    // Test Swagger UI
    console.log("\n📖 Testing Swagger UI (/swagger)...");
    const swaggerResponse = await fetch(`${baseUrl}/swagger`);
    
    if (swaggerResponse.ok) {
      console.log("✅ Swagger UI working");
      console.log(`   Content-Type: ${swaggerResponse.headers.get("content-type")}`);
    } else {
      console.log("❌ Swagger UI failed:", swaggerResponse.status);
    }

    // Test API health endpoint
    console.log("\n🏥 Testing API health endpoint...");
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log("✅ API health endpoint working");
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Version: ${healthData.version}`);
    } else {
      console.log("❌ API health endpoint failed:", healthResponse.status);
    }

    // Test middleware headers
    console.log("\n🔧 Testing middleware headers...");
    const testResponse = await fetch(`${baseUrl}/api/health`);
    
    console.log("Headers added by middleware:");
    console.log(`   X-API-Version: ${testResponse.headers.get("X-API-Version")}`);
    console.log(`   X-Documentation: ${testResponse.headers.get("X-Documentation")}`);
    console.log(`   X-Request-ID: ${testResponse.headers.get("X-Request-ID")}`);
    console.log(`   X-Response-Time: ${testResponse.headers.get("X-Response-Time")}`);
    console.log(`   X-Content-Type-Options: ${testResponse.headers.get("X-Content-Type-Options")}`);
    console.log(`   X-Frame-Options: ${testResponse.headers.get("X-Frame-Options")}`);

  } catch (error) {
    console.error("❌ Error testing OpenAPI endpoints:", error);
  }
}

// For Node.js environment, we'll just run the tests assuming server is running
testOpenAPIEndpoints()
  .then(() => {
    console.log("\n🎉 OpenAPI testing completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Testing failed:", error);
    process.exit(1);
  });