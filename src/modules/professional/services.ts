import { eq, and, gte, lte, between, count, sum, avg, desc, asc, sql } from "drizzle-orm";
import db from "@/db";
import { 
  professionalProfiles, 
  bookings, 
  reviews, 
  availability, 
  services, 
  customerProfiles,
  professionalServices,
  bookingStatus 
} from "@/db/schema/schema";

// Get dashboard metrics for a professional
export async function getDashboardMetrics(professionalId: string, filters: any = {}) {
  try {
    // Get total bookings count
    const totalBookingsResult = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.professionalId, professionalId));

    // Get total revenue (sum of prices from professional services for completed bookings)
    const revenueResult = await db
      .select({ 
        total: sql`COALESCE(SUM(CAST(${professionalServices.price} AS DECIMAL)), 0)`
      })
      .from(bookings)
      .innerJoin(professionalServices, and(
        eq(professionalServices.professionalId, bookings.professionalId),
        eq(professionalServices.serviceId, bookings.serviceId)
      ))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "completed")
      ));

    // Get average rating and total reviews
    const reviewsResult = await db
      .select({ 
        avgRating: avg(reviews.rating),
        totalReviews: count()
      })
      .from(reviews)
      .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
      .where(eq(bookings.professionalId, professionalId));

    // Get active services count
    const activeServicesResult = await db
      .select({ count: count() })
      .from(professionalServices)
      .where(eq(professionalServices.professionalId, professionalId));

    // Get completion rate
    const completedBookingsResult = await db
      .select({ count: count() })
      .from(bookings)
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "completed")
      ));

    // Get recent bookings (last 10)
    const recentBookings = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        duration: bookings.duration,
        notes: bookings.notes,
        customerName: sql`CONCAT(${customerProfiles.firstName}, ' ', ${customerProfiles.lastName})`,
        serviceName: services.name,
        status: bookingStatus.name
      })
      .from(bookings)
      .innerJoin(customerProfiles, eq(customerProfiles.id, bookings.customerId))
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(eq(bookings.professionalId, professionalId))
      .orderBy(desc(bookings.createdAt))
      .limit(10);

    // Get upcoming bookings (future dates)
    const today = new Date().toISOString().split('T')[0];
    const upcomingBookings = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        duration: bookings.duration,
        notes: bookings.notes,
        customerName: sql`CONCAT(${customerProfiles.firstName}, ' ', ${customerProfiles.lastName})`,
        customerPhone: customerProfiles.phoneNumber,
        serviceName: services.name
      })
      .from(bookings)
      .innerJoin(customerProfiles, eq(customerProfiles.id, bookings.customerId))
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        gte(bookings.date, today),
        sql`${bookingStatus.name} IN ('pending', 'confirmed')`
      ))
      .orderBy(asc(bookings.date), asc(bookings.time))
      .limit(10);

    // Get pending bookings
    const pendingBookings = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        duration: bookings.duration,
        notes: bookings.notes,
        customerName: sql`CONCAT(${customerProfiles.firstName}, ' ', ${customerProfiles.lastName})`,
        customerPhone: customerProfiles.phoneNumber,
        serviceName: services.name,
        createdAt: bookings.createdAt
      })
      .from(bookings)
      .innerJoin(customerProfiles, eq(customerProfiles.id, bookings.customerId))
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "pending")
      ))
      .orderBy(desc(bookings.createdAt));

    const totalBookings = totalBookingsResult[0]?.count || 0;
    const totalRevenue = revenueResult[0]?.total || "0";
    const averageRating = reviewsResult[0]?.avgRating ? Number(reviewsResult[0].avgRating) : undefined;
    const totalReviews = reviewsResult[0]?.totalReviews || 0;
    const activeServices = activeServicesResult[0]?.count || 0;
    const completedBookings = completedBookingsResult[0]?.count || 0;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    return {
      overview: {
        totalBookings,
        totalRevenue: totalRevenue.toString(),
        averageRating,
        totalReviews,
        activeServices,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        customerName: String(booking.customerName || 'Unknown'),
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        duration: booking.duration,
        notes: booking.notes || undefined,
      })),
      upcomingBookings: upcomingBookings.map(booking => ({
        id: booking.id,
        customerName: String(booking.customerName || 'Unknown'),
        customerPhone: booking.customerPhone,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        notes: booking.notes || undefined,
      })),
      pendingBookings: pendingBookings.map(booking => ({
        id: booking.id,
        customerName: String(booking.customerName || 'Unknown'),
        customerPhone: booking.customerPhone,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        notes: booking.notes || undefined,
        createdAt: booking.createdAt?.toISOString() || new Date().toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting dashboard metrics:", error);
    throw error;
  }
}

// Get analytics data for a professional
export async function getAnalyticsData(professionalId: string, filters: any = {}) {
  try {
    const { startDate, endDate, period = "month" } = filters;
    
    // Base date filters
    const dateFilter = startDate && endDate ? 
      and(gte(bookings.createdAt, new Date(startDate)), lte(bookings.createdAt, new Date(endDate))) :
      undefined;

    // Get revenue data
    const revenueResult = await db
      .select({ 
        total: sql`COALESCE(SUM(CAST(${professionalServices.price} AS DECIMAL)), 0)`
      })
      .from(bookings)
      .innerJoin(professionalServices, and(
        eq(professionalServices.professionalId, bookings.professionalId),
        eq(professionalServices.serviceId, bookings.serviceId)
      ))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "completed"),
        dateFilter
      ));

    // Get bookings by status
    const bookingsByStatus = await db
      .select({ 
        status: bookingStatus.name,
        count: count()
      })
      .from(bookings)
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        dateFilter
      ))
      .groupBy(bookingStatus.name);

    // Get bookings by service
    const bookingsByService = await db
      .select({ 
        serviceName: services.name,
        count: count(),
        revenue: sql`COALESCE(SUM(CAST(${professionalServices.price} AS DECIMAL)), 0)`
      })
      .from(bookings)
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(professionalServices, and(
        eq(professionalServices.professionalId, bookings.professionalId),
        eq(professionalServices.serviceId, bookings.serviceId)
      ))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "completed"),
        dateFilter
      ))
      .groupBy(services.name);

    // Get performance metrics
    const performanceResult = await db
      .select({ 
        avgRating: avg(reviews.rating),
        totalReviews: count()
      })
      .from(reviews)
      .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
      .where(and(
        eq(bookings.professionalId, professionalId),
        dateFilter
      ));

    // Get completion rate
    const totalBookingsResult = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(
        eq(bookings.professionalId, professionalId),
        dateFilter
      ));

    const completedBookingsResult = await db
      .select({ count: count() })
      .from(bookings)
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "completed"),
        dateFilter
      ));

    // Get repeat customers
    const repeatCustomersResult = await db
      .select({ 
        customerId: bookings.customerId,
        bookingCount: count()
      })
      .from(bookings)
      .where(and(
        eq(bookings.professionalId, professionalId),
        dateFilter
      ))
      .groupBy(bookings.customerId)
      .having(sql`COUNT(*) > 1`);

    // Get top-rated services
    const topRatedServices = await db
      .select({ 
        serviceName: services.name,
        avgRating: avg(reviews.rating),
        reviewCount: count()
      })
      .from(reviews)
      .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .where(and(
        eq(bookings.professionalId, professionalId),
        dateFilter
      ))
      .groupBy(services.name)
      .having(sql`COUNT(*) >= 3`) // At least 3 reviews
      .orderBy(desc(avg(reviews.rating)))
      .limit(5);

    const totalRevenue = revenueResult[0]?.total || "0";
    const totalBookings = totalBookingsResult[0]?.count || 0;
    const completedBookings = completedBookingsResult[0]?.count || 0;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Process bookings by status
    const statusCounts = {
      total: totalBookings,
      completed: 0,
      cancelled: 0,
      pending: 0,
    };

    const statusPercentages: { status: string; count: number; percentage: number; }[] = [];
    
    bookingsByStatus.forEach(item => {
      if (item.status === "completed") statusCounts.completed = item.count;
      if (item.status === "cancelled") statusCounts.cancelled = item.count;
      if (item.status === "pending") statusCounts.pending = item.count;
      
      const percentage = totalBookings > 0 ? (item.count / totalBookings) * 100 : 0;
      statusPercentages.push({
        status: item.status,
        count: item.count,
        percentage: Math.round(percentage * 100) / 100,
      });
    });

    // Process bookings by service
    const serviceBookings = bookingsByService.map(item => ({
      serviceId: 0, // We don't have serviceId in the current query, need to add it
      serviceName: item.serviceName,
      count: item.count,
      revenue: (item.revenue || "0").toString(),
    }));

    // Process top-rated services
    const topServices = topRatedServices.map(item => ({
      serviceId: 0, // We don't have serviceId in the current query, need to add it
      serviceName: item.serviceName,
      averageRating: Number(item.avgRating) || 0,
      reviewCount: item.reviewCount,
    }));

    return {
      revenue: {
        total: totalRevenue.toString(),
        byPeriod: [], // TODO: Implement period-based breakdown
        growth: 0, // TODO: Calculate growth percentage
      },
      bookings: {
        ...statusCounts,
        byStatus: statusPercentages,
        byService: serviceBookings,
      },
      performance: {
        averageRating: performanceResult[0]?.avgRating ? Number(performanceResult[0].avgRating) : undefined,
        totalReviews: performanceResult[0]?.totalReviews || 0,
        responseTime: undefined, // TODO: Calculate from booking confirmation times
        completionRate: Math.round(completionRate * 100) / 100,
        repeatCustomers: repeatCustomersResult.length,
        topRatedServices: topServices,
      },
    };
  } catch (error) {
    console.error("Error getting analytics data:", error);
    throw error;
  }
}

// Get calendar view for a professional
export async function getCalendarView(professionalId: string, month: number, year: number) {
  try {
    // Calculate the start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get all bookings for the month
    const monthBookings = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        duration: bookings.duration,
        customerName: sql`CONCAT(${customerProfiles.firstName}, ' ', ${customerProfiles.lastName})`,
        serviceName: services.name,
        status: bookingStatus.name
      })
      .from(bookings)
      .innerJoin(customerProfiles, eq(customerProfiles.id, bookings.customerId))
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        gte(bookings.date, startDateStr),
        lte(bookings.date, endDateStr)
      ))
      .orderBy(asc(bookings.date), asc(bookings.time));

    // Get availability for the month
    const monthAvailability = await db
      .select()
      .from(availability)
      .where(eq(availability.professionalId, professionalId));

    // Group bookings by date
    const bookingsByDate: Record<string, typeof monthBookings> = {};
    monthBookings.forEach(booking => {
      const dateKey = booking.date;
      if (!bookingsByDate[dateKey]) {
        bookingsByDate[dateKey] = [];
      }
      bookingsByDate[dateKey].push(booking);
    });

    // Generate calendar days
    const daysInMonth = endDate.getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const today = new Date();
      const isToday = currentDate.toDateString() === today.toDateString();
      
      // Find availability for this day of week
      const dayAvailability = monthAvailability.filter(avail => avail.day === dayOfWeek);
      
      // Get bookings for this date
      const dayBookings = bookingsByDate[dateStr] || [];
      
      // Calculate available slots (simple calculation)
      const totalSlots = dayAvailability.reduce((sum, avail) => sum + (avail.capacity || 1), 0);
      const usedSlots = dayBookings.length;
      const availableSlots = Math.max(0, totalSlots - usedSlots);
      
      // Format bookings for calendar view
      const formattedBookings = dayBookings.map(booking => {
        // Calculate end time based on duration
        const startTime = booking.time;
        const durationHours = Math.floor(booking.duration / 60);
        const durationMinutes = booking.duration % 60;
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const endHour = startHour + durationHours;
        const endMinute = startMinute + durationMinutes;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        return {
          id: booking.id,
          startTime: startTime,
          endTime: endTime,
          customerName: String(booking.customerName || 'Unknown'),
          serviceName: booking.serviceName,
          status: booking.status,
          duration: booking.duration,
        };
      });
      
      days.push({
        date: dateStr,
        dayOfWeek,
        bookings: formattedBookings,
        availableSlots,
        totalSlots,
        isToday,
      });
    }

    return {
      month,
      year,
      days,
    };
  } catch (error) {
    console.error("Error getting calendar view:", error);
    throw error;
  }
}

// Get upcoming bookings for a professional
export async function getUpcomingBookings(professionalId: string, limit: number = 10, days: number = 30) {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const upcomingBookings = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        duration: bookings.duration,
        notes: bookings.notes,
        customer: {
          id: customerProfiles.id,
          firstName: customerProfiles.firstName,
          lastName: customerProfiles.lastName,
          phoneNumber: customerProfiles.phoneNumber,
          profileImage: customerProfiles.profileImage,
        },
        service: {
          id: services.id,
          name: services.name,
          description: services.description,
          durationEstimate: services.durationEstimate,
        },
        status: {
          id: bookingStatus.id,
          name: bookingStatus.name,
          description: bookingStatus.description,
        },
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .innerJoin(customerProfiles, eq(customerProfiles.id, bookings.customerId))
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        gte(bookings.date, todayStr),
        lte(bookings.date, futureDateStr),
        sql`${bookingStatus.name} IN ('pending', 'confirmed')`
      ))
      .orderBy(asc(bookings.date), asc(bookings.time))
      .limit(limit);

    return upcomingBookings;
  } catch (error) {
    console.error("Error getting upcoming bookings:", error);
    throw error;
  }
}

// Get revenue statistics for a professional
export async function getRevenueStats(professionalId: string, filters: any = {}) {
  try {
    const { startDate, endDate } = filters;
    
    // Calculate this month and last month dates if not provided
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get total revenue (all time or filtered)
    const totalRevenueQuery = db
      .select({ 
        total: sql`COALESCE(SUM(CAST(${professionalServices.price} AS DECIMAL)), 0)`
      })
      .from(bookings)
      .innerJoin(professionalServices, and(
        eq(professionalServices.professionalId, bookings.professionalId),
        eq(professionalServices.serviceId, bookings.serviceId)
      ))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "completed"),
        startDate && endDate ? 
          and(gte(bookings.createdAt, new Date(startDate)), lte(bookings.createdAt, new Date(endDate))) :
          undefined
      ));

    // Get this month revenue
    const thisMonthRevenueQuery = db
      .select({ 
        total: sql`COALESCE(SUM(CAST(${professionalServices.price} AS DECIMAL)), 0)`
      })
      .from(bookings)
      .innerJoin(professionalServices, and(
        eq(professionalServices.professionalId, bookings.professionalId),
        eq(professionalServices.serviceId, bookings.serviceId)
      ))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "completed"),
        gte(bookings.createdAt, thisMonthStart)
      ));

    // Get last month revenue
    const lastMonthRevenueQuery = db
      .select({ 
        total: sql`COALESCE(SUM(CAST(${professionalServices.price} AS DECIMAL)), 0)`
      })
      .from(bookings)
      .innerJoin(professionalServices, and(
        eq(professionalServices.professionalId, bookings.professionalId),
        eq(professionalServices.serviceId, bookings.serviceId)
      ))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "completed"),
        gte(bookings.createdAt, lastMonthStart),
        lte(bookings.createdAt, lastMonthEnd)
      ));

    // Get revenue breakdown by service
    const revenueBreakdownQuery = db
      .select({ 
        serviceName: services.name,
        revenue: sql`COALESCE(SUM(CAST(${professionalServices.price} AS DECIMAL)), 0)`,
        bookingCount: count()
      })
      .from(bookings)
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(professionalServices, and(
        eq(professionalServices.professionalId, bookings.professionalId),
        eq(professionalServices.serviceId, bookings.serviceId)
      ))
      .innerJoin(bookingStatus, eq(bookingStatus.id, bookings.status))
      .where(and(
        eq(bookings.professionalId, professionalId),
        eq(bookingStatus.name, "completed"),
        startDate && endDate ? 
          and(gte(bookings.createdAt, new Date(startDate)), lte(bookings.createdAt, new Date(endDate))) :
          undefined
      ))
      .groupBy(services.name)
      .orderBy(desc(sql`SUM(CAST(${professionalServices.price} AS DECIMAL))`));

    // Execute all queries in parallel
    const [totalResult, thisMonthResult, lastMonthResult, breakdownResult] = await Promise.all([
      totalRevenueQuery,
      thisMonthRevenueQuery,
      lastMonthRevenueQuery,
      revenueBreakdownQuery,
    ]);

    const totalRevenue = totalResult[0]?.total || "0";
    const thisMonthRevenue = thisMonthResult[0]?.total || "0";
    const lastMonthRevenue = lastMonthResult[0]?.total || "0";

    // Calculate growth percentage
    const thisMonth = Number(thisMonthRevenue);
    const lastMonth = Number(lastMonthRevenue);
    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return {
      total: totalRevenue.toString(),
      thisMonth: thisMonthRevenue.toString(),
      lastMonth: lastMonthRevenue.toString(),
      growth: Math.round(growth * 100) / 100,
      breakdown: breakdownResult.map(item => ({
        serviceName: item.serviceName,
        revenue: (item.revenue || "0").toString(),
        bookingCount: item.bookingCount,
      })),
    };
  } catch (error) {
    console.error("Error getting revenue stats:", error);
    throw error;
  }
}
