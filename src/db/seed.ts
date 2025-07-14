import db from "./index";
import {
  users,
  customerProfiles,
  professionalProfiles,
  professions,
  services,
  bookingStatus,
  categories,
  tags,
  availability,
} from "./schema/schema";

export async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Seed booking statuses first
    await db
      .insert(bookingStatus)
      .values([
        { id: 1, name: "pending", description: "Booking is pending confirmation" },
        { id: 2, name: "confirmed", description: "Booking has been confirmed" },
        { id: 3, name: "completed", description: "Booking has been completed" },
        { id: 4, name: "cancelled", description: "Booking has been cancelled" },
      ])
      .onConflictDoNothing();

    // Seed professions
    await db
      .insert(professions)
      .values([
        { id: 1, name: "Plumber", description: "Plumbing services" },
        { id: 2, name: "Electrician", description: "Electrical services" },
        { id: 3, name: "Carpenter", description: "Carpentry services" },
        { id: 4, name: "Cleaner", description: "Cleaning services" },
        { id: 5, name: "Consultant", description: "Business consulting" },
      ])
      .onConflictDoNothing();

    // Seed categories
    await db
      .insert(categories)
      .values([
        { id: 1, name: "Home Maintenance", description: "Home maintenance services" },
        { id: 2, name: "Business", description: "Business-related services" },
        { id: 3, name: "Personal", description: "Personal services" },
        { id: 4, name: "Emergency", description: "Emergency services" },
      ])
      .onConflictDoNothing();

    // Seed tags
    await db
      .insert(tags)
      .values([
        { id: 1, name: "24/7", description: "Available 24/7" },
        { id: 2, name: "Licensed", description: "Licensed professional" },
        { id: 3, name: "Insured", description: "Insured service" },
        { id: 4, name: "Experienced", description: "Years of experience" },
        { id: 5, name: "Emergency", description: "Emergency service available" },
      ])
      .onConflictDoNothing();

    // Seed services
    await db
      .insert(services)
      .values([
        {
          id: 1,
          name: "Pipe Repair",
          professionId: 1,
          priceRange: "$50-150",
          durationEstimate: 120,
          description: "Fix leaky or broken pipes",
        },
        {
          id: 2,
          name: "Electrical Wiring",
          professionId: 2,
          priceRange: "$100-300",
          durationEstimate: 180,
          description: "Install or repair electrical wiring",
        },
        {
          id: 3,
          name: "Business Consultation",
          professionId: 5,
          priceRange: "$100-200",
          durationEstimate: 60,
          description: "Strategic business consultation",
        },
        {
          id: 4,
          name: "Home Cleaning",
          professionId: 4,
          priceRange: "$50-100",
          durationEstimate: 120,
          description: "Complete home cleaning service",
        },
      ])
      .onConflictDoNothing();

    // Create test users
    const testUsers = await db
      .insert(users)
      .values([
        {
          id: "customer-user-1",
          email: "customer@example.com",
          password: "$2b$10$test.hash.for.customer", // hashed "password123"
          type: "customer",
          isVerified: true,
        },
        {
          id: "professional-user-1",
          email: "professional@example.com",
          password: "$2b$10$test.hash.for.professional", // hashed "password123"
          type: "professional",
          isVerified: true,
        },
        {
          id: "professional-user-2",
          email: "consultant@example.com",
          password: "$2b$10$test.hash.for.consultant", // hashed "password123"
          type: "professional",
          isVerified: true,
        },
      ])
      .onConflictDoNothing()
      .returning();

    // Create customer profile
    await db
      .insert(customerProfiles)
      .values([
        {
          id: "customer-profile-1",
          userId: "customer-user-1",
          firstName: "John",
          lastName: "Doe",
          phoneNumber: "+1234567890",
          otherNames: null,
        },
      ])
      .onConflictDoNothing();

    // Create professional profiles
    await db
      .insert(professionalProfiles)
      .values([
        {
          id: "professional-profile-1",
          userId: "professional-user-1",
          name: "Mike's Plumbing Services",
          location: "New York, NY",
          description: "Professional plumbing services with 10+ years experience",
          businessName: "Mike's Plumbing",
          yearsOfExperience: 10,
          businessType: "individual",
          status: "available",
          professionId: 1,
        },
        {
          id: "professional-profile-2",
          userId: "professional-user-2",
          name: "Sarah's Business Consulting",
          location: "Boston, MA",
          description: "Strategic business consulting and advisory services",
          businessName: "Strategic Solutions",
          yearsOfExperience: 8,
          businessType: "individual",
          status: "available",
          professionId: 5,
        },
      ])
      .onConflictDoNothing();

    // Add availability for professionals
    await db
      .insert(availability)
      .values([
        // Mike's availability (Monday-Friday, 9AM-5PM)
        { professionalId: "professional-profile-1", day: 1, fromTime: "09:00", toTime: "17:00" },
        { professionalId: "professional-profile-1", day: 2, fromTime: "09:00", toTime: "17:00" },
        { professionalId: "professional-profile-1", day: 3, fromTime: "09:00", toTime: "17:00" },
        { professionalId: "professional-profile-1", day: 4, fromTime: "09:00", toTime: "17:00" },
        { professionalId: "professional-profile-1", day: 5, fromTime: "09:00", toTime: "17:00" },
        
        // Sarah's availability (Monday-Friday, 10AM-6PM)
        { professionalId: "professional-profile-2", day: 1, fromTime: "10:00", toTime: "18:00" },
        { professionalId: "professional-profile-2", day: 2, fromTime: "10:00", toTime: "18:00" },
        { professionalId: "professional-profile-2", day: 3, fromTime: "10:00", toTime: "18:00" },
        { professionalId: "professional-profile-2", day: 4, fromTime: "10:00", toTime: "18:00" },
        { professionalId: "professional-profile-2", day: 5, fromTime: "10:00", toTime: "18:00" },
      ])
      .onConflictDoNothing();

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Allow running this script directly
if (import.meta.dirname === __dirname) {
  await seedDatabase();
  process.exit(0);
}
