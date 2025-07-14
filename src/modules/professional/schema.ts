import { z } from "zod";

// Dashboard metrics schema
export const DashboardMetricsSchema = z.object({
  overview: z.object({
    totalBookings: z.number(),
    totalRevenue: z.string(),
    averageRating: z.number().optional(),
    totalReviews: z.number(),
    activeServices: z.number(),
    completionRate: z.number(), // percentage
  }),
  recentBookings: z.array(z.object({
    id: z.string(),
    customerName: z.string(),
    serviceName: z.string(),
    date: z.string(),
    time: z.string(),
    status: z.string(),
    duration: z.number(),
    notes: z.string().optional(),
  })),
  upcomingBookings: z.array(z.object({
    id: z.string(),
    customerName: z.string(),
    customerPhone: z.string(),
    serviceName: z.string(),
    date: z.string(),
    time: z.string(),
    duration: z.number(),
    notes: z.string().optional(),
  })),
  pendingBookings: z.array(z.object({
    id: z.string(),
    customerName: z.string(),
    customerPhone: z.string(),
    serviceName: z.string(),
    date: z.string(),
    time: z.string(),
    duration: z.number(),
    notes: z.string().optional(),
    createdAt: z.string(),
  })),
});

// Analytics filters
export const AnalyticsFiltersSchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]).default("month"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceId: z.number().int().positive().optional(),
});

// Analytics data schema
export const AnalyticsDataSchema = z.object({
  revenue: z.object({
    total: z.string(),
    byPeriod: z.array(z.object({
      period: z.string(), // date or period label
      amount: z.string(),
      bookings: z.number(),
    })),
    growth: z.number(), // percentage change from previous period
  }),
  bookings: z.object({
    total: z.number(),
    completed: z.number(),
    cancelled: z.number(),
    pending: z.number(),
    byStatus: z.array(z.object({
      status: z.string(),
      count: z.number(),
      percentage: z.number(),
    })),
    byService: z.array(z.object({
      serviceId: z.number(),
      serviceName: z.string(),
      count: z.number(),
      revenue: z.string(),
    })),
  }),
  performance: z.object({
    averageRating: z.number().optional(),
    totalReviews: z.number(),
    responseTime: z.number().optional(), // average time to respond to bookings in hours
    completionRate: z.number(), // percentage
    repeatCustomers: z.number(),
    topRatedServices: z.array(z.object({
      serviceId: z.number(),
      serviceName: z.string(),
      averageRating: z.number(),
      reviewCount: z.number(),
    })),
  }),
});

// Calendar view schema
export const CalendarViewSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  days: z.array(z.object({
    date: z.string(),
    dayOfWeek: z.number().int().min(0).max(6),
    bookings: z.array(z.object({
      id: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      customerName: z.string(),
      serviceName: z.string(),
      status: z.string(),
      duration: z.number(),
    })),
    availableSlots: z.number(),
    totalSlots: z.number(),
    isToday: z.boolean(),
  })),
});

// Service performance schema
export const ServicePerformanceSchema = z.object({
  serviceId: z.number(),
  serviceName: z.string(),
  metrics: z.object({
    totalBookings: z.number(),
    completedBookings: z.number(),
    cancelledBookings: z.number(),
    totalRevenue: z.string(),
    averageRating: z.number().optional(),
    reviewCount: z.number(),
    averageDuration: z.number(), // in minutes
    bookingFrequency: z.number(), // bookings per week
    customerRetention: z.number(), // percentage of repeat customers
  }),
  trends: z.object({
    bookingsTrend: z.array(z.object({
      period: z.string(),
      count: z.number(),
    })),
    revenueTrend: z.array(z.object({
      period: z.string(),
      amount: z.string(),
    })),
    ratingTrend: z.array(z.object({
      period: z.string(),
      rating: z.number(),
    })),
  }),
});

// Customer insights schema
export const CustomerInsightsSchema = z.object({
  totalCustomers: z.number(),
  newCustomers: z.number(),
  repeatCustomers: z.number(),
  topCustomers: z.array(z.object({
    customerId: z.string(),
    customerName: z.string(),
    totalBookings: z.number(),
    totalSpent: z.string(),
    lastBooking: z.string(),
    averageRating: z.number().optional(),
  })),
  customerFeedback: z.object({
    averageRating: z.number(),
    totalReviews: z.number(),
    ratingDistribution: z.array(z.object({
      rating: z.number(),
      count: z.number(),
      percentage: z.number(),
    })),
    recentReviews: z.array(z.object({
      id: z.string(),
      customerName: z.string(),
      rating: z.number(),
      comment: z.string().optional(),
      serviceName: z.string(),
      createdAt: z.string(),
    })),
  }),
});

export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
export type AnalyticsFilters = z.infer<typeof AnalyticsFiltersSchema>;
export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;
export type CalendarView = z.infer<typeof CalendarViewSchema>;
export type ServicePerformance = z.infer<typeof ServicePerformanceSchema>;
export type CustomerInsights = z.infer<typeof CustomerInsightsSchema>;
