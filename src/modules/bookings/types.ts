import type { Booking } from "@/db/schema/schema";

export interface BookingWithDetails extends Booking {
  customer?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    profileImage?: string;
  };
  professional?: {
    name: string;
    businessName?: string;
    location?: string;
    profileImage?: string;
    rating?: number;
  };
  service: {
    name: string;
    description?: string;
    durationEstimate?: number;
  };
  bookingStatus: {
    name: string;
    description?: string;
  };
}
