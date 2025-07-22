import { eq, count, avg, desc, sql } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  professionalProfiles,
  customerProfiles,
  bookings,
  reviews,
  services,
  professions,
  users
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

export interface PopularProfessional {
  id: string;
  name: string | null;
  businessName: string | null;
  profileImage: string | null;
  location: string | null;
  averageRating: number;
  totalBookings: number;
  totalReviews: number;
  professionName: string;
}

export interface HotDeal {
  id: string;
  professionalId: string;
  professionalName: string | null;
  businessName: string | null;
  serviceName: string;
  originalPrice: string | null;
  discountedPrice: string | null;
  discountPercentage: number | null;
  description: string | null;
  validUntil: string | null;
}

export interface DashboardStats {
  totalProfessionals: number;
  totalCustomers: number;
  totalBookings: number;
  totalReviews: number;
  averageRating: number;
  recentBookings: number;
  topProfessions: Array<{
    id: number;
    name: string;
    count: number;
  }>;
}

export const dashboardService = {
  async getPopularProfessionals(limit = 10): Promise<PopularProfessional[]> {
    try {
      // Get professionals with their booking counts and average ratings
      const popularProfessionals = await db
        .select({
          id: professionalProfiles.id,
          name: professionalProfiles.name,
          businessName: professionalProfiles.businessName,
          profileImage: professionalProfiles.profileImage,
          location: professionalProfiles.location,
          professionName: professions.name,
          totalBookings: count(bookings.id),
          averageRating: avg(reviews.rating),
        })
        .from(professionalProfiles)
        .leftJoin(professions, eq(professionalProfiles.professionId, professions.id))
        .leftJoin(bookings, eq(professionalProfiles.id, bookings.professionalId))
        .leftJoin(reviews, eq(bookings.id, reviews.bookingId))
        .where(eq(professionalProfiles.isActive, true))
        .groupBy(
          professionalProfiles.id,
          professionalProfiles.name,
          professionalProfiles.businessName,
          professionalProfiles.profileImage,
          professionalProfiles.location,
          professions.name
        )
        .orderBy(desc(count(bookings.id)))
        .limit(limit);

      // Get review counts separately
      const professionalIds = popularProfessionals.map(p => p.id);
      const reviewCounts = await Promise.all(
        professionalIds.map(async (professionalId) => {
          const professionalBookings = await db
            .select({ id: bookings.id })
            .from(bookings)
            .where(eq(bookings.professionalId, professionalId));
          
          const bookingIds = professionalBookings.map(b => b.id);
          
          if (bookingIds.length === 0) {
            return { professionalId, count: 0 };
          }

          const { inArray } = await import("drizzle-orm");
          const reviewCount = await db
            .select({ count: count() })
            .from(reviews)
            .where(inArray(reviews.bookingId, bookingIds));

          return { 
            professionalId, 
            count: reviewCount[0].count 
          };
        })
      );

      return popularProfessionals.map(prof => {
        const reviewCount = reviewCounts.find(rc => rc.professionalId === prof.id);
        return {
          id: prof.id,
          name: prof.name,
          businessName: prof.businessName,
          profileImage: prof.profileImage,
          location: prof.location,
          averageRating: Number(prof.averageRating) || 0,
          totalBookings: prof.totalBookings,
          totalReviews: reviewCount?.count || 0,
          professionName: prof.professionName || "Unknown",
        };
      });
    } catch (error) {
      throw new AppError(
        "Failed to retrieve popular professionals",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getHotDeals(limit = 10): Promise<HotDeal[]> {
    try {
      // For now, return mock hot deals since we don't have a deals table
      // In a real application, you would have a separate deals/promotions table
      const professionals = await db
        .select({
          professionalId: professionalProfiles.id,
          professionalName: professionalProfiles.name,
          businessName: professionalProfiles.businessName,
          serviceName: services.name,
          servicePrice: services.priceRange,
          serviceDescription: services.description,
        })
        .from(professionalProfiles)
        .leftJoin(professions, eq(professionalProfiles.professionId, professions.id))
        .leftJoin(services, eq(professions.id, services.professionId))
        .where(eq(professionalProfiles.isActive, true))
        .limit(limit);

      return professionals
        .filter(p => p.serviceName && p.servicePrice)
        .map((prof, index) => ({
          id: `deal-${prof.professionalId}-${index}`,
          professionalId: prof.professionalId,
          professionalName: prof.professionalName,
          businessName: prof.businessName,
          serviceName: prof.serviceName || "Service",
          originalPrice: prof.servicePrice,
          discountedPrice: null, // Would be calculated based on actual deals
          discountPercentage: Math.floor(Math.random() * 30) + 10, // Mock discount
          description: prof.serviceDescription,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        }));
    } catch (error) {
      throw new AppError(
        "Failed to retrieve hot deals",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        totalProfessionalsResult,
        totalCustomersResult,
        totalBookingsResult,
        totalReviewsResult,
        averageRatingResult,
        recentBookingsResult,
        topProfessionsResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(professionalProfiles).where(eq(professionalProfiles.isActive, true)),
        db.select({ count: count() }).from(customerProfiles),
        db.select({ count: count() }).from(bookings),
        db.select({ count: count() }).from(reviews),
        db.select({ avg: avg(reviews.rating) }).from(reviews),
        db.select({ count: count() }).from(bookings).where(
          sql`${bookings.createdAt} >= NOW() - INTERVAL '7 days'`
        ),
        db.select({
          id: professions.id,
          name: professions.name,
          count: count(professionalProfiles.id),
        })
        .from(professions)
        .leftJoin(professionalProfiles, eq(professions.id, professionalProfiles.professionId))
        .where(eq(professions.isActive, true))
        .groupBy(professions.id, professions.name)
        .orderBy(desc(count(professionalProfiles.id)))
        .limit(5),
      ]);

      return {
        totalProfessionals: totalProfessionalsResult[0].count,
        totalCustomers: totalCustomersResult[0].count,
        totalBookings: totalBookingsResult[0].count,
        totalReviews: totalReviewsResult[0].count,
        averageRating: Number(averageRatingResult[0].avg) || 0,
        recentBookings: recentBookingsResult[0].count,
        topProfessions: topProfessionsResult.map(tp => ({
          id: tp.id,
          name: tp.name,
          count: tp.count,
        })),
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve dashboard statistics",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};