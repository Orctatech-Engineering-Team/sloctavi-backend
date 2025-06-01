import { faker } from "@faker-js/faker";

import type { newAvailability, newService } from "./schema/schema";

import db from "./index";
import {
  availability,
  bookings,
  professionalProfiles,
  professions,
  reviews,
  services,
  users,
} from "./schema/schema";

await db.insert(professions).values([
  { name: "Barber" },
  { name: "Hairdresser" },
  { name: "Mechanic" },
  { name: "Electrician" },
  { name: "Painter" },
]).onConflictDoNothing();

const usersData = Array.from({ length: 10 }).map((_, i) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  password: "hashed_dummy_password", // In prod, hash it
  type: i < 5 ? "professional" : "customer",
}));

await db.insert(users).values(usersData).onConflictDoNothing();

const professionalProfilesData = usersData
  .filter(u => u.type === "professional")
  .map((user, i) => ({
    id: faker.string.uuid(),
    userId: user.id,
    name: faker.person.fullName(),
    location: faker.location.city(),
    rating: faker.number.int({ min: 3, max: 5 }),
    profileImage: faker.image.avatar(),
    professionId: (i % 5) + 1, // rotating profession
    businessName: faker.company.name(),
    yearsOfExperience: faker.number.int({ min: 1, max: 10 }),
    businessType: "individual",
  }));

await db.insert(professionalProfiles).values(professionalProfilesData).onConflictDoNothing();

const serviceNames = {
  Barber: ["Haircut", "Beard Trim"],
  Hairdresser: ["Braiding", "Dyeing"],
  Mechanic: ["Engine Repair", "Oil Change"],
  Electrician: ["Wiring", "Light Installation"],
  Painter: ["Interior Painting", "Exterior Painting"],
};

const serviceData: newService[] = [];

Object.entries(serviceNames).forEach(([_, services], i) => {
  services.forEach((service) => {
    serviceData.push({
      id: faker.number.int({ min: 1, max: 1000 }),
      name: service,
      professionId: i + 1,
      priceRange: "50-150",
      durationEstimate: 60,
    });
  });
});

await db.insert(services).values(serviceData).onConflictDoNothing();

// numbers from 0 to 6 representing days of the week
const days = [0, 1, 2, 3, 4, 5, 6];
const availabilityData: newAvailability[] = [];

professionalProfilesData.forEach((pro) => {
  days.forEach((day) => {
    availabilityData.push({
      professionalId: pro.id,
      day,
      fromTime: "09:00",
      toTime: "17:00",
    });
  });
});

await db.insert(availability).values(availabilityData).onConflictDoNothing();

const customerUsers = usersData.filter(u => u.type === "customer");

const bookingsData = customerUsers.flatMap((customer) => {
  return Array.from({ length: 2 }).map(() => {
    const pro = faker.helpers.arrayElement(professionalProfilesData);
    const service = faker.helpers.arrayElement(serviceData.filter(s => s.professionId === pro.professionId));

    return {
      id: faker.string.uuid(),
      customerId: customer.id,
      professionalId: pro.id,
      serviceId: service.id,
      date: faker.date.future().toISOString().split("T")[0],
      time: "10:00",
      duration: Number(service.durationEstimate),
      notes: faker.lorem.sentence(),
      availabilityId: faker.helpers.arrayElement(availabilityData.filter(s => s.professionalId === pro.id)).id, // This should match an actual availability ID in a real scenario
      status: faker.helpers.arrayElement([1, 2, 3]), // 1: Pending, 2: Confirmed, 3: Completed
    };
  });
});

await db.insert(bookings).values(bookingsData).onConflictDoNothing();

const reviewData = bookingsData.slice(0, 5).map(b => ({
  bookingId: b.id,
  rating: faker.number.int({ min: 3, max: 5 }),
  comment: faker.lorem.sentence(),
  customerId: b.customerId,
}));

await db.insert(reviews).values(reviewData).onConflictDoNothing();
console.log("Database seeded successfully!");
