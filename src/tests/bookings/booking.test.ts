import { eq } from "drizzle-orm";
import { fetch } from "undici";
import { beforeEach, describe, expect, it } from "vitest";

import db from "@/db";
import {
  availability,
  bookings,
  bookingStatus,
  customerProfiles,
  professionalProfiles,
  professions,
  services,
  users,
} from "@/db/schema/schema";

const BASE_URL = "http://localhost:9999";

describe("bookings API", () => {
  let customerToken: string;
  let professionalToken: string;
  let customerId: string;
  let professionalId: string;
  let serviceId: number;

  beforeEach(async () => {
    // Clean up
    await db.delete(bookings).execute();
    await db.delete(customerProfiles).execute();
    await db.delete(professionalProfiles).execute();
    await db.delete(users).where(eq(users.email, "customer@test.com")).execute();
    await db.delete(users).where(eq(users.email, "professional@test.com")).execute();

    // Seed booking statuses
    await db.insert(bookingStatus).values([
      { id: 1, name: "pending", description: "Awaiting confirmation" },
      { id: 2, name: "confirmed", description: "Confirmed by professional" },
      { id: 3, name: "completed", description: "Service completed" },
      { id: 4, name: "cancelled", description: "Booking cancelled" },
    ]).onConflictDoNothing();

    // Create profession
    const [profession] = await db.insert(professions).values({
      name: "Test Service Provider",
    }).returning();

    // Create service
    const [service] = await db.insert(services).values({
      name: "Test Service",
      professionId: profession.id,
      priceRange: "50-100",
      durationEstimate: 60,
    }).returning();
    serviceId = service.id;

    // Register customer
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "customer@test.com",
        password: "password123",
        type: "customer",
      }),
    });

    // Register professional
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "professional@test.com",
        password: "password123",
        type: "professional",
      }),
    });

    // Login customer
    const customerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "customer@test.com",
        password: "password123",
      }),
    });
    const customerData = await customerLogin.json();
    customerToken = customerData.token;
    customerId = customerData.user.id;

    // Login professional
    const professionalLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "professional@test.com",
        password: "password123",
      }),
    });
    const professionalData = await professionalLogin.json();
    professionalToken = professionalData.token;

    // Create customer profile
    const customerProfile = await fetch(`${BASE_URL}/api/profile/customer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
      }),
    });
    const customerProfileData = await customerProfile.json();

    // Create professional profile
    const professionalProfileRes = await fetch(`${BASE_URL}/api/profile/professional`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${professionalToken}`,
      },
      body: JSON.stringify({
        name: "Jane Smith",
        location: "New York",
        businessName: "Jane's Services",
        yearsOfExperience: 5,
        businessType: "individual",
        professionId: profession.id,
      }),
    });
    const professionalProfileData = await professionalProfileRes.json();
    professionalId = professionalProfileData.id;

    // Add availability for professional
    await db.insert(availability).values({
      professionalId,
      day: 1, // Monday
      fromTime: "09:00",
      toTime: "17:00",
    });
  });

  describe("pOST /api/bookings", () => {
    it("should create a new booking", async () => {
      const bookingData = {
        professionalId,
        serviceId,
        date: "2025-07-01", // A Monday
        time: "10:00",
        duration: 60,
        notes: "First appointment",
      };

      const res = await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customerToken}`,
        },
        body: JSON.stringify(bookingData),
      });

      expect(res.status).toBe(201);
      const booking = await res.json();

      expect(booking.professionalId).toBe(professionalId);
      expect(booking.serviceId).toBe(serviceId);
      expect(booking.date).toBe("2025-07-01");
      expect(booking.time).toBe("10:00");
      expect(booking.professional).toBeDefined();
      expect(booking.service).toBeDefined();
    });

    it("should fail to create booking for unavailable time slot", async () => {
      // First, create a booking
      await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          professionalId,
          serviceId,
          date: "2025-07-01",
          time: "10:00",
          duration: 60,
        }),
      });

      // Try to create another booking at the same time
      const res = await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          professionalId,
          serviceId,
          date: "2025-07-01",
          time: "10:00",
          duration: 60,
        }),
      });

      expect(res.status).toBe(400);
      const error = await res.json();
      expect(error.message).toContain("not available");
    });
  });

  describe("gET /api/bookings", () => {
    it("should get customer's bookings", async () => {
      // Create a booking first
      await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          professionalId,
          serviceId,
          date: "2025-07-01",
          time: "10:00",
          duration: 60,
        }),
      });

      const res = await fetch(`${BASE_URL}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.bookings).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(data.bookings[0].professional).toBeDefined();
      expect(data.bookings[0].service).toBeDefined();
    });
  });

  describe("gET /api/bookings/availability/{professionalId}", () => {
    it("should get available time slots", async () => {
      const res = await fetch(
        `${BASE_URL}/api/bookings/availability/${professionalId}?date=2025-07-01`,
        {
          headers: {
            Authorization: `Bearer ${customerToken}`,
          },
        },
      );

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.date).toBe("2025-07-01");
      expect(data.availableSlots).toBeInstanceOf(Array);
      expect(data.availableSlots.length).toBeGreaterThan(0);
      expect(data.availableSlots[0]).toHaveProperty("startTime");
      expect(data.availableSlots[0]).toHaveProperty("endTime");
      expect(data.availableSlots[0]).toHaveProperty("available");
    });
  });

  describe("pATCH /api/bookings/{id}/status", () => {
    it("should allow professional to update booking status", async () => {
      // Create booking
      const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          professionalId,
          serviceId,
          date: "2025-07-01",
          time: "10:00",
          duration: 60,
        }),
      });
      const booking = await bookingRes.json();

      // Update status as professional
      const updateRes = await fetch(`${BASE_URL}/api/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${professionalToken}`,
        },
        body: JSON.stringify({
          status: 2, // confirmed
        }),
      });

      expect(updateRes.status).toBe(200);
      const updated = await updateRes.json();
      expect(updated.bookingStatus.name).toBe("confirmed");
    });
  });
});
