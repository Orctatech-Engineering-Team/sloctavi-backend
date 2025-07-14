import { z } from "zod";

// System overview schema
export const SystemOverviewSchema = z.object({
  users: z.object({
    total: z.number(),
    customers: z.number(),
    professionals: z.number(),
    verifiedUsers: z.number(),
    newUsersThisMonth: z.number(),
  }),
  bookings: z.object({
    total: z.number(),
    pending: z.number(),
    confirmed: z.number(),
    completed: z.number(),
    cancelled: z.number(),
    todayBookings: z.number(),
    thisMonthBookings: z.number(),
  }),
  services: z.object({
    total: z.number(),
    active: z.number(),
    inactive: z.number(),
    mostPopular: z.array(z.object({
      id: z.number(),
      name: z.string(),
      bookingCount: z.number(),
    })),
  }),
  revenue: z.object({
    thisMonth: z.string(),
    lastMonth: z.string(),
    growthRate: z.number(), // percentage
    topEarners: z.array(z.object({
      professionalId: z.string(),
      professionalName: z.string(),
      revenue: z.string(),
    })),
  }),
});

// User management schemas
export const UserListFiltersSchema = z.object({
  type: z.enum(["customer", "professional"]).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(), // search in name, email
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["createdAt", "lastLogin", "name", "email"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const UserDetailsSchema = z.object({
  id: z.string(),
  email: z.string(),
  type: z.enum(["customer", "professional"]),
  isVerified: z.boolean(),
  createdAt: z.string(),
  lastLogin: z.string().optional(),
  profile: z.union([
    z.object({
      type: z.literal("customer"),
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string(),
      profileImage: z.string().optional(),
    }),
    z.object({
      type: z.literal("professional"),
      id: z.string(),
      name: z.string().optional(),
      businessName: z.string().optional(),
      location: z.string().optional(),
      description: z.string().optional(),
      rating: z.number().optional(),
      status: z.string().optional(),
      profileImage: z.string().optional(),
      yearsOfExperience: z.number().optional(),
      businessType: z.string().optional(),
      professionId: z.number(),
      professionName: z.string(),
      isActive: z.boolean(),
    }),
  ]).optional(),
  stats: z.object({
    totalBookings: z.number(),
    completedBookings: z.number(),
    cancelledBookings: z.number(),
    totalRevenue: z.string().optional(), // for professionals
    averageRating: z.number().optional(),
    totalReviews: z.number(),
  }).optional(),
});

export const UserListSchema = z.object({
  users: z.array(UserDetailsSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

// Professional management
export const ProfessionalStatusUpdateSchema = z.object({
  status: z.enum(["available", "busy", "unavailable"]),
  isActive: z.boolean().optional(),
});

export const ProfessionalVerificationSchema = z.object({
  verified: z.boolean(),
  notes: z.string().optional(),
});

// Service management schemas  
export const ServiceManagementFiltersSchema = z.object({
  professionId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "professionId"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Profession management
export const CreateProfessionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const UpdateProfessionSchema = CreateProfessionSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const ProfessionStatsSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  stats: z.object({
    totalProfessionals: z.number(),
    activeProfessionals: z.number(),
    totalServices: z.number(),
    activeServices: z.number(),
    totalBookings: z.number(),
    averageRating: z.number().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Booking management
export const BookingManagementFiltersSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  professionalId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  serviceId: z.number().int().positive().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(), // search in customer/professional names
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["createdAt", "date", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Analytics schemas
export const PlatformAnalyticsSchema = z.object({
  overview: z.object({
    totalUsers: z.number(),
    totalBookings: z.number(),
    totalRevenue: z.string(),
    averageBookingValue: z.string(),
    userGrowthRate: z.number(), // percentage
    bookingGrowthRate: z.number(), // percentage
    revenueGrowthRate: z.number(), // percentage
  }),
  userMetrics: z.object({
    newUsersThisMonth: z.number(),
    activeUsersThisMonth: z.number(),
    userRetentionRate: z.number(), // percentage
    customerToProfessionalRatio: z.number(),
    averageUserSessionTime: z.number(), // minutes
  }),
  bookingMetrics: z.object({
    bookingsThisMonth: z.number(),
    averageBookingsPerProfessional: z.number(),
    mostPopularServices: z.array(z.object({
      serviceId: z.number(),
      serviceName: z.string(),
      bookingCount: z.number(),
      revenue: z.string(),
    })),
    bookingStatusDistribution: z.array(z.object({
      status: z.string(),
      count: z.number(),
      percentage: z.number(),
    })),
    peakBookingHours: z.array(z.object({
      hour: z.number(),
      count: z.number(),
    })),
  }),
  revenueMetrics: z.object({
    monthlyRevenue: z.array(z.object({
      month: z.string(),
      revenue: z.string(),
      bookings: z.number(),
    })),
    topEarningProfessions: z.array(z.object({
      professionId: z.number(),
      professionName: z.string(),
      revenue: z.string(),
      professionalCount: z.number(),
    })),
    averageRevenuePerBooking: z.string(),
    platformCommission: z.string(), // if applicable
  }),
});

export type SystemOverview = z.infer<typeof SystemOverviewSchema>;
export type UserListFilters = z.infer<typeof UserListFiltersSchema>;
export type UserDetails = z.infer<typeof UserDetailsSchema>;
export type UserList = z.infer<typeof UserListSchema>;
export type ProfessionalStatusUpdate = z.infer<typeof ProfessionalStatusUpdateSchema>;
export type ProfessionalVerification = z.infer<typeof ProfessionalVerificationSchema>;
export type ServiceManagementFilters = z.infer<typeof ServiceManagementFiltersSchema>;
export type CreateProfession = z.infer<typeof CreateProfessionSchema>;
export type UpdateProfession = z.infer<typeof UpdateProfessionSchema>;
export type ProfessionStats = z.infer<typeof ProfessionStatsSchema>;
export type BookingManagementFilters = z.infer<typeof BookingManagementFiltersSchema>;
export type PlatformAnalytics = z.infer<typeof PlatformAnalyticsSchema>;
