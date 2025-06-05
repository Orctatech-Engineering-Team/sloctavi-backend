import type { z } from "zod";

import { selectBookingSchema, selectBookingStatusSchema, selectCustomerProfileSchema, selectProfessionalProfileSchema, selectServiceSchema } from "@/db/schema/schema";

// Zod schema for BookingWithDetails
export const BookingWithDetailsSchema = selectBookingSchema.extend({
  customer: selectCustomerProfileSchema
    .pick({ firstName: true, lastName: true, phoneNumber: true, profileImage: true })
    .optional(),
  professional: selectProfessionalProfileSchema
    .pick({ name: true, businessName: true, location: true, profileImage: true, rating: true })
    .optional(),
  service: selectServiceSchema
    .pick({ name: true, description: true, durationEstimate: true })
    .optional(),
  bookingStatus: selectBookingStatusSchema
    .pick({ name: true, description: true })
    .optional(),
});

// Type for BookingWithDetails derived from Zod schema
export type BookingWithDetails = z.infer<typeof BookingWithDetailsSchema>;
