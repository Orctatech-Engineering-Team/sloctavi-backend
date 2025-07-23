import { z } from "zod";
import { extendZodWithOpenApi } from "@hono/zod-openapi";

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

// Manually defined schemas with proper OpenAPI metadata for better compatibility
export const UserResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique user identifier",
    example: "550e8400-e29b-41d4-a716-446655440000"
  }),
  email: z.string().email().openapi({
    description: "User's email address",
    example: "user@example.com"
  }),
  type: z.enum(["customer", "professional"]).openapi({
    description: "Type of user account",
    example: "customer"
  }),
  isVerified: z.boolean().nullable().openapi({
    description: "Whether the user's email is verified",
    example: true
  }),
  createdAt: z.string().datetime().nullable().openapi({
    description: "Account creation timestamp",
    example: "2024-01-15T10:30:00Z"
  }),
  lastLogin: z.string().datetime().nullable().openapi({
    description: "Last login timestamp",
    example: "2024-01-16T14:20:00Z"
  }),
}).openapi({
  description: "User account information"
});

export const ServiceSchema = z.object({
  id: z.number().int().openapi({
    description: "Service identifier",
    example: 1
  }),
  name: z.string().openapi({
    description: "Service name",
    example: "Hair Cut & Style"
  }),
  professionId: z.number().int().openapi({
    description: "Associated profession ID",
    example: 4
  }),
  priceRange: z.string().nullable().openapi({
    description: "Price range for the service",
    example: "$50-$100"
  }),
  durationEstimate: z.number().int().nullable().openapi({
    description: "Estimated duration in minutes",
    example: 90
  }),
  description: z.string().nullable().openapi({
    description: "Service description",
    example: "Professional hair cutting and styling service"
  }),
  isActive: z.boolean().nullable().openapi({
    description: "Whether the service is active",
    example: true
  }),
  createdAt: z.string().datetime().nullable().openapi({
    description: "Service creation timestamp",
    example: "2024-01-01T00:00:00Z"
  }),
  updatedAt: z.string().datetime().nullable().openapi({
    description: "Last update timestamp",
    example: "2024-01-15T12:00:00Z"
  }),
}).openapi({
  description: "Service information"
});

export const BookingSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Booking identifier",
    example: "booking_123456789"
  }),
  customerId: z.string().uuid().openapi({
    description: "Customer ID",
    example: "550e8400-e29b-41d4-a716-446655440000"
  }),
  professionalId: z.string().uuid().openapi({
    description: "Professional ID",
    example: "550e8400-e29b-41d4-a716-446655440001"
  }),
  serviceId: z.number().int().openapi({
    description: "Service ID",
    example: 1
  }),
  date: z.string().date().openapi({
    description: "Booking date (YYYY-MM-DD)",
    example: "2024-02-15"
  }),
  time: z.string().time().openapi({
    description: "Booking time (HH:MM:SS)",
    example: "14:30:00"
  }),
  duration: z.number().int().openapi({
    description: "Duration in minutes",
    example: 60
  }),
  status: z.number().int().openapi({
    description: "Booking status ID",
    example: 2
  }),
  notes: z.string().nullable().openapi({
    description: "Additional notes",
    example: "Looking forward to the service"
  }),
  createdAt: z.string().datetime().nullable().openapi({
    description: "Booking creation timestamp",
    example: "2024-01-16T10:00:00Z"
  }),
}).openapi({
  description: "Booking information"
});

export const ReviewSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Review identifier",
    example: "review_123456789"
  }),
  bookingId: z.string().uuid().openapi({
    description: "Associated booking ID",
    example: "booking_123456789"
  }),
  customerId: z.string().uuid().openapi({
    description: "Customer who wrote the review",
    example: "550e8400-e29b-41d4-a716-446655440000"
  }),
  rating: z.number().int().min(1).max(5).openapi({
    description: "Rating from 1 to 5 stars",
    example: 5
  }),
  comment: z.string().nullable().openapi({
    description: "Review comment",
    example: "Excellent service! Very professional and friendly."
  }),
  createdAt: z.string().datetime().nullable().openapi({
    description: "Review creation timestamp",
    example: "2024-01-17T16:30:00Z"
  }),
  updatedAt: z.string().datetime().nullable().openapi({
    description: "Last update timestamp",
    example: "2024-01-17T16:30:00Z"
  }),
}).openapi({
  description: "Customer review information"
});

export const CustomerProfileSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Customer profile identifier",
    example: "550e8400-e29b-41d4-a716-446655440000"
  }),
  userId: z.string().uuid().openapi({
    description: "Associated user ID",
    example: "550e8400-e29b-41d4-a716-446655440000"
  }),
  firstName: z.string().openapi({
    description: "Customer's first name",
    example: "John"
  }),
  lastName: z.string().openapi({
    description: "Customer's last name",
    example: "Doe"
  }),
  otherNames: z.string().nullable().openapi({
    description: "Customer's middle/other names",
    example: "Michael"
  }),
  phoneNumber: z.string().openapi({
    description: "Customer's phone number",
    example: "+1-555-123-4567"
  }),
  profileImage: z.string().nullable().openapi({
    description: "URL to customer's profile image",
    example: "https://example.com/profiles/john.jpg"
  }),
  createdAt: z.string().datetime().nullable().openapi({
    description: "Profile creation timestamp",
    example: "2024-01-15T10:30:00Z"
  }),
  updatedAt: z.string().datetime().nullable().openapi({
    description: "Last update timestamp",
    example: "2024-01-16T14:20:00Z"
  }),
}).openapi({
  description: "Customer profile information"
});

export const ProfessionalProfileSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Professional profile identifier",
    example: "550e8400-e29b-41d4-a716-446655440001"
  }),
  userId: z.string().uuid().openapi({
    description: "Associated user ID",
    example: "550e8400-e29b-41d4-a716-446655440001"
  }),
  name: z.string().nullable().openapi({
    description: "Professional's display name",
    example: "Jane Smith Hair Studio"
  }),
  location: z.string().nullable().openapi({
    description: "Professional's location/address",
    example: "Downtown, City Center"
  }),
  description: z.string().nullable().openapi({
    description: "Professional's bio/description",
    example: "Experienced hair stylist with 10+ years in the industry"
  }),
  rating: z.number().int().nullable().openapi({
    description: "Average rating (1-5 stars)",
    example: 4
  }),
  status: z.string().nullable().openapi({
    description: "Current availability status",
    example: "available"
  }),
  profileImage: z.string().nullable().openapi({
    description: "URL to professional's profile image",
    example: "https://example.com/profiles/jane.jpg"
  }),
  businessName: z.string().nullable().openapi({
    description: "Business name",
    example: "Jane's Hair Studio"
  }),
  yearsOfExperience: z.number().int().nullable().openapi({
    description: "Years of professional experience",
    example: 10
  }),
  businessType: z.string().nullable().openapi({
    description: "Type of business",
    example: "individual"
  }),
  professionId: z.number().int().openapi({
    description: "Associated profession ID",
    example: 4
  }),
  createdAt: z.string().datetime().nullable().openapi({
    description: "Profile creation timestamp",
    example: "2024-01-10T08:15:00Z"
  }),
  updatedAt: z.string().datetime().nullable().openapi({
    description: "Last update timestamp",
    example: "2024-01-16T09:45:00Z"
  }),
}).openapi({
  description: "Professional profile information"
});

export const ProfessionSchema = z.object({
  id: z.number().int().openapi({
    description: "Profession identifier",
    example: 4
  }),
  name: z.string().openapi({
    description: "Profession name",
    example: "Hair Stylist"
  }),
  description: z.string().nullable().openapi({
    description: "Profession description",
    example: "Professional hair cutting and styling services"
  }),
  isActive: z.boolean().nullable().openapi({
    description: "Whether the profession is active",
    example: true
  }),
  createdAt: z.string().datetime().nullable().openapi({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00Z"
  }),
  updatedAt: z.string().datetime().nullable().openapi({
    description: "Last update timestamp", 
    example: "2024-01-15T12:00:00Z"
  }),
}).openapi({
  description: "Profession information"
});