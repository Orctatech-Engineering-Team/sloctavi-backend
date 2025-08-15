/* eslint-disable no-console */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { faker } from "@faker-js/faker";
import * as schema from "./schema/schema";
import env from "../env";

const client = postgres(env.DATABASE_URL);
const db = drizzle(client, { schema });

async function clearDatabase() {
  
  const tables = [
    'audit_logs',
    'notifications', 
    'reviews',
    'booking_status_history',
    'bookings',
    'availability',
    'professional_services',
    'service_tags',
    'service_categories',
    'services',
    'professional_profiles',
    'customer_profiles',
    'user_roles',
    'email_verifications',
    'password_resets',
    'users',
    'categories',
    'tags',
    'professions',
    'booking_status',
    'roles'
  ];

  for (const table of tables) {
      await db.execute(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);    
  }
}

async function seedData() {

  // Seed roles
  const roles = await db.insert(schema.roles).values([
    { name: "admin", description: "System administrator with full access" },
    { name: "customer", description: "Regular customer user" },
    { name: "professional", description: "Service professional" },
    { name: "moderator", description: "Content moderator" },
    { name: "support", description: "Customer support agent" },
  ]).returning();
  console.log(`✅ Seeded ${roles.length} roles`);

  // Seed booking statuses
  const bookingStatuses = await db.insert(schema.bookingStatus).values([
    { name: "pending", description: "Booking is pending confirmation" },
    { name: "confirmed", description: "Booking has been confirmed" },
    { name: "in_progress", description: "Service is currently in progress" },
    { name: "completed", description: "Service has been completed" },
    { name: "cancelled", description: "Booking was cancelled" },
    { name: "rescheduled", description: "Booking has been rescheduled" },
  ]).returning();
  console.log(`✅ Seeded ${bookingStatuses.length} booking statuses`);

  // Seed professions
  const professions = await db.insert(schema.professions).values([
    { name: "Plumber", description: "Plumbing and water system services" },
    { name: "Electrician", description: "Electrical installation and repair" },
    { name: "Carpenter", description: "Woodworking and construction services" },
    { name: "Hair Stylist", description: "Hair cutting and styling services" },
    { name: "Massage Therapist", description: "Therapeutic massage services" },
    { name: "Personal Trainer", description: "Fitness and personal training" },
    { name: "Tutor", description: "Educational and tutoring services" },
    { name: "Cleaner", description: "Cleaning and maintenance services" },
    { name: "Photographer", description: "Photography services" },
    { name: "Chef", description: "Cooking and catering services" },
  ]).returning();
  console.log(`✅ Seeded ${professions.length} professions`);

  // Seed categories
  const categories = await db.insert(schema.categories).values([
    { name: "Home & Garden", description: "Home improvement and gardening services" },
    { name: "Health & Wellness", description: "Health and wellness services" },
    { name: "Education", description: "Educational and tutoring services" },
    { name: "Beauty & Personal Care", description: "Beauty and personal care services" },
    { name: "Technology", description: "Technology and IT services" },
    { name: "Automotive", description: "Automotive services" },
    { name: "Events & Entertainment", description: "Event planning and entertainment" },
    { name: "Business Services", description: "Professional business services" },
  ]).returning();
  console.log(`✅ Seeded ${categories.length} categories`);

  // Seed tags
  const tags = await db.insert(schema.tags).values([
    { name: "Emergency", description: "Emergency services available" },
    { name: "Weekend Available", description: "Available on weekends" },
    { name: "Licensed", description: "Licensed professional" },
    { name: "Insured", description: "Fully insured services" },
    { name: "Eco-Friendly", description: "Environmentally friendly approach" },
    { name: "24/7", description: "Available 24 hours a day" },
    { name: "Mobile Service", description: "Comes to your location" },
    { name: "Free Consultation", description: "Free initial consultation" },
  ]).returning();
  console.log(`✅ Seeded ${tags.length} tags`);

  // Seed users
  const users = [];
  for (let i = 0; i < 30; i++) {
    const user = {
      email: faker.internet.email(),
      password: faker.internet.password(),
      type: Math.random() > 0.3 ? "customer" as const : "professional" as const,
      isVerified: Math.random() > 0.2,
    };
    users.push(user);
  }
  
  const insertedUsers = await db.insert(schema.users).values(users).returning();
  console.log(`✅ Seeded ${insertedUsers.length} users`);

  // Seed customer profiles
  const customers = insertedUsers.filter(u => u.type === "customer");
  const customerProfiles = [];
  for (const customer of customers.slice(0, 20)) {
    customerProfiles.push({
      userId: customer.id,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      otherNames: Math.random() > 0.7 ? faker.person.middleName() : null,
      phoneNumber: faker.phone.number().slice(0, 20),
      profileImage: Math.random() > 0.5 ? faker.image.avatar() : null,
    });
  }
  
  const insertedCustomers = await db.insert(schema.customerProfiles).values(customerProfiles).returning();
  console.log(`✅ Seeded ${insertedCustomers.length} customer profiles`);

  // Seed professional profiles
  const professionals = insertedUsers.filter(u => u.type === "professional");
  const professionalProfiles = [];
  for (const professional of professionals.slice(0, 10)) {
    professionalProfiles.push({
      userId: professional.id,
      name: faker.person.fullName(),
      location: faker.location.city(),
      description: faker.lorem.sentences(3),
      rating: faker.number.int({ min: 1, max: 5 }),
      status: faker.helpers.arrayElement(["available", "busy", "offline"]),
      profileImage: faker.image.avatar(),
      businessName: faker.company.name(),
      yearsOfExperience: faker.number.int({ min: 1, max: 20 }),
      businessType: faker.helpers.arrayElement(["individual", "agency"]),
      professionId: faker.helpers.arrayElement(professions).id,
    });
  }
  
  const insertedProfessionals = await db.insert(schema.professionalProfiles).values(professionalProfiles).returning();
  console.log(`✅ Seeded ${insertedProfessionals.length} professional profiles`);

  // Seed services
  const serviceNames = [
    "Pipe Repair", "Drain Cleaning", "Water Heater Installation",
    "Electrical Wiring", "Light Installation", "Circuit Breaker Repair",
    "Kitchen Renovation", "Furniture Assembly", "Deck Building",
    "Hair Cut & Style", "Hair Coloring", "Wedding Hair",
    "Deep Tissue Massage", "Swedish Massage", "Sports Massage",
    "Personal Training Session", "Group Fitness Class", "Nutrition Consultation",
    "Math Tutoring", "English Tutoring", "Piano Lessons",
    "House Cleaning", "Office Cleaning", "Window Cleaning",
    "Portrait Photography", "Event Photography", "Product Photography",
  ];

  const services = [];
  for (let i = 0; i < serviceNames.length; i++) {
    services.push({
      name: serviceNames[i],
      professionId: faker.helpers.arrayElement(professions).id,
      priceRange: faker.helpers.arrayElement(["$25-$50", "$50-$100", "$100-$200", "$200-$500", "$500+"]),
      durationEstimate: faker.number.int({ min: 30, max: 480 }),
      description: faker.lorem.sentences(2),
    });
  }
  
  const insertedServices = await db.insert(schema.services).values(services).returning();
  console.log(`✅ Seeded ${insertedServices.length} services`);

  // Seed availability
  const availability = [];
  for (const professional of insertedProfessionals) {
    for (let day = 1; day <= 5; day++) { // Monday to Friday
      availability.push({
        professionalId: professional.id,
        day,
        fromTime: "09:00:00",
        toTime: "17:00:00",
        capacity: faker.number.int({ min: 1, max: 3 }),
      });
    }
  }
  
  const insertedAvailability = await db.insert(schema.availability).values(availability).returning();
  console.log(`✅ Seeded ${insertedAvailability.length} availability slots`);

  // Seed bookings
  const bookings = [];
  for (let i = 0; i < 20; i++) {
    bookings.push({
      customerId: faker.helpers.arrayElement(insertedCustomers).id,
      professionalId: faker.helpers.arrayElement(insertedProfessionals).id,
      serviceId: faker.helpers.arrayElement(insertedServices).id,
      date: faker.date.between({ from: "2024-01-01", to: "2024-12-31" }).toISOString().split('T')[0],
      time: faker.helpers.arrayElement(["09:00:00", "10:00:00", "11:00:00", "14:00:00", "15:00:00", "16:00:00"]),
      duration: faker.number.int({ min: 60, max: 240 }),
      status: faker.helpers.arrayElement(bookingStatuses).id,
      notes: faker.lorem.sentence(),
    });
  }
  
  const insertedBookings = await db.insert(schema.bookings).values(bookings).returning();
  console.log(`✅ Seeded ${insertedBookings.length} bookings`);

  // Seed reviews
  const reviews = [];
  for (const booking of insertedBookings.slice(0, 15)) {
    const customer = insertedCustomers.find(c => c.id === booking.customerId);
    if (customer) {
      reviews.push({
        bookingId: booking.id,
        customerId: customer.id,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.sentences(2),
      });
    }
  }
  
  const insertedReviews = await db.insert(schema.reviews).values(reviews).returning();
  console.log(`✅ Seeded ${insertedReviews.length} reviews`);

  console.log("🎉 Manual seeding completed successfully!");
}

async function main() {
  console.log("🌱 Starting manual database seeding...");
  
  try {
    await clearDatabase();
    await seedData();
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

main()
  .then(() => {
    console.log("🎉 Seeding process finished!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });