import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { count } from "drizzle-orm";
import * as schema from "./schema/schema";
import env from "../env";

const client = postgres(env.DATABASE_URL);
const db = drizzle(client, { schema });

async function verifySeedData() {
  console.log("🔍 Verifying seeded data...");
  
  try {
    const results = await Promise.all([
      db.select({ count: count() }).from(schema.roles),
      db.select({ count: count() }).from(schema.users),
      db.select({ count: count() }).from(schema.professions),
      db.select({ count: count() }).from(schema.customerProfiles),
      db.select({ count: count() }).from(schema.professionalProfiles),
      db.select({ count: count() }).from(schema.services),
      db.select({ count: count() }).from(schema.bookings),
      db.select({ count: count() }).from(schema.reviews),
    ]);

    console.log("📊 Database contents:");
    console.log(`  Roles: ${results[0][0].count}`);
    console.log(`  Users: ${results[1][0].count}`);
    console.log(`  Professions: ${results[2][0].count}`);
    console.log(`  Customer Profiles: ${results[3][0].count}`);
    console.log(`  Professional Profiles: ${results[4][0].count}`);
    console.log(`  Services: ${results[5][0].count}`);
    console.log(`  Bookings: ${results[6][0].count}`);
    console.log(`  Reviews: ${results[7][0].count}`);

    // Get some sample data
    const sampleUsers = await db.select({
      id: schema.users.id,
      email: schema.users.email,
      type: schema.users.type,
    }).from(schema.users).limit(3);

    console.log("\n👥 Sample users:");
    sampleUsers.forEach(user => {
      console.log(`  ${user.type}: ${user.email}`);
    });

    const sampleBookings = await db.select({
      id: schema.bookings.id,
      date: schema.bookings.date,
      time: schema.bookings.time,
      status: schema.bookings.status,
    }).from(schema.bookings).limit(3);

    console.log("\n📅 Sample bookings:");
    sampleBookings.forEach(booking => {
      console.log(`  ${booking.date} at ${booking.time} (Status: ${booking.status})`);
    });

    console.log("\n✅ Database verification completed successfully!");
    
  } catch (error) {
    console.error("❌ Error verifying data:", error);
    throw error;
  } finally {
    await client.end();
  }
}

verifySeedData()
  .then(() => {
    console.log("🎉 Verification process finished!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Verification failed:", error);
    process.exit(1);
  });