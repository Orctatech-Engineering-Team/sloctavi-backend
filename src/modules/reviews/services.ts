import { eq, and, count, avg } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  reviews, 
  bookings,
  customerProfiles,
  professionalProfiles,
  type Review,
  type NewReview 
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

export const reviewsService = {
  async createReview(userId: string, data: { bookingId: string; rating: number; comment: string }): Promise<Review> {
    try {
      // Get customer profile
      const customer = await db.query.customerProfiles.findFirst({
        where: eq(customerProfiles.userId, userId),
      });

      if (!customer) {
        throw new AppError(
          "Customer profile not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if booking exists and belongs to customer
      const booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, data.bookingId),
          eq(bookings.customerId, customer.id),
        ),
      });

      if (!booking) {
        throw new AppError(
          "Booking not found or unauthorized",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if review already exists
      const existingReview = await db.query.reviews.findFirst({
        where: eq(reviews.bookingId, data.bookingId),
      });

      if (existingReview) {
        throw new AppError(
          "Review already exists for this booking",
          HttpStatusCodes.CONFLICT,
        );
      }

      const reviewData: NewReview = {
        bookingId: data.bookingId,
        customerId: customer.id,
        rating: data.rating,
        comment: data.comment,
      };

      const [review] = await db
        .insert(reviews)
        .values(reviewData)
        .returning();

      return review;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create review",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getCustomerReviews(userId: string, limit = 20, offset = 0): Promise<{ reviews: Review[], total: number }> {
    try {
      // Get customer profile
      const customer = await db.query.customerProfiles.findFirst({
        where: eq(customerProfiles.userId, userId),
      });

      if (!customer) {
        throw new AppError(
          "Customer profile not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const [reviewsList, totalCount] = await Promise.all([
        db.query.reviews.findMany({
          where: eq(reviews.customerId, customer.id),
          limit,
          offset,
          orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
        }),
        db.select({ count: count() }).from(reviews).where(eq(reviews.customerId, customer.id)),
      ]);

      return {
        reviews: reviewsList,
        total: totalCount[0].count,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve customer reviews",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getProfessionalReviews(professionalId: string, limit = 20, offset = 0): Promise<{ 
    reviews: Review[], 
    total: number, 
    averageRating: number 
  }> {
    try {
      // Verify professional exists
      const professional = await db.query.professionalProfiles.findFirst({
        where: eq(professionalProfiles.id, professionalId),
      });

      if (!professional) {
        throw new AppError(
          "Professional not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Get reviews for this professional's bookings
      const professionalBookings = await db.query.bookings.findMany({
        where: eq(bookings.professionalId, professionalId),
        columns: { id: true },
      });

      const bookingIds = professionalBookings.map(b => b.id);

      if (bookingIds.length === 0) {
        return {
          reviews: [],
          total: 0,
          averageRating: 0,
        };
      }

      const { inArray } = await import("drizzle-orm");

      const [reviewsList, totalCount, avgRating] = await Promise.all([
        db.query.reviews.findMany({
          where: inArray(reviews.bookingId, bookingIds),
          limit,
          offset,
          orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
        }),
        db.select({ count: count() }).from(reviews).where(inArray(reviews.bookingId, bookingIds)),
        db.select({ avg: avg(reviews.rating) }).from(reviews).where(inArray(reviews.bookingId, bookingIds)),
      ]);

      return {
        reviews: reviewsList,
        total: totalCount[0].count,
        averageRating: Number(avgRating[0].avg) || 0,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve professional reviews",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateReview(reviewId: string, userId: string, data: { rating?: number; comment?: string }): Promise<Review> {
    try {
      // Get customer profile
      const customer = await db.query.customerProfiles.findFirst({
        where: eq(customerProfiles.userId, userId),
      });

      if (!customer) {
        throw new AppError(
          "Customer profile not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if review exists and belongs to customer
      const existingReview = await db.query.reviews.findFirst({
        where: and(
          eq(reviews.id, reviewId),
          eq(reviews.customerId, customer.id),
        ),
      });

      if (!existingReview) {
        throw new AppError(
          "Review not found or unauthorized",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const [updated] = await db
        .update(reviews)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, reviewId))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to update review",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      // Get customer profile
      const customer = await db.query.customerProfiles.findFirst({
        where: eq(customerProfiles.userId, userId),
      });

      if (!customer) {
        throw new AppError(
          "Customer profile not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if review exists and belongs to customer
      const existingReview = await db.query.reviews.findFirst({
        where: and(
          eq(reviews.id, reviewId),
          eq(reviews.customerId, customer.id),
        ),
      });

      if (!existingReview) {
        throw new AppError(
          "Review not found or unauthorized",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      await db.delete(reviews).where(eq(reviews.id, reviewId));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to delete review",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};