import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { logInfo, logError } from "@/utils/logger";

import { reviewsService } from "./services";
import type { 
  CreateReviewRoute, 
  GetReviewsRoute, 
  GetProfessionalReviewsRoute,
  UpdateReviewRoute,
  DeleteReviewRoute 
} from "./routes";

export const createReview: AppRouteHandler<CreateReviewRoute> = async (c) => {
  try {
    const data = c.req.valid("json");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const review = await reviewsService.createReview(userId, data);

    logInfo("Review created", {
      service: "ReviewsHandler",
      method: "createReview",
      reviewId: review.id,
      bookingId: data.bookingId,
      userId,
    });

    return c.json(review, HttpStatusCodes.CREATED);
  } catch (error: any) {
    logError(error, "Failed to create review", {
      service: "ReviewsHandler",
      method: "createReview",
    });

    if (error.statusCode) {
      return c.json({ message: error.message }, error.statusCode);
    }

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getReviews: AppRouteHandler<GetReviewsRoute> = async (c) => {
  try {
    const { limit, offset } = c.req.valid("query");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const result = await reviewsService.getCustomerReviews(userId, limit, offset);

    logInfo("Customer reviews retrieved", {
      service: "ReviewsHandler",
      method: "getReviews",
      userId,
      count: result.reviews.length,
      total: result.total,
    });

    return c.json(result, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to retrieve reviews", {
      service: "ReviewsHandler",
      method: "getReviews",
    });

    if (error.statusCode) {
      return c.json({ message: error.message }, error.statusCode);
    }

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getProfessionalReviews: AppRouteHandler<GetProfessionalReviewsRoute> = async (c) => {
  try {
    const { professionalId } = c.req.valid("param");
    const { limit, offset } = c.req.valid("query");

    const result = await reviewsService.getProfessionalReviews(professionalId, limit, offset);

    logInfo("Professional reviews retrieved", {
      service: "ReviewsHandler",
      method: "getProfessionalReviews",
      professionalId,
      count: result.reviews.length,
      total: result.total,
      averageRating: result.averageRating,
    });

    return c.json(result, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to retrieve professional reviews", {
      service: "ReviewsHandler",
      method: "getProfessionalReviews",
    });

    if (error.statusCode) {
      return c.json({ message: error.message }, error.statusCode);
    }

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const updateReview: AppRouteHandler<UpdateReviewRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const review = await reviewsService.updateReview(id, userId, data);

    logInfo("Review updated", {
      service: "ReviewsHandler",
      method: "updateReview",
      reviewId: id,
      userId,
    });

    return c.json(review, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to update review", {
      service: "ReviewsHandler",
      method: "updateReview",
    });

    if (error.statusCode) {
      return c.json({ message: error.message }, error.statusCode);
    }

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const deleteReview: AppRouteHandler<DeleteReviewRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    await reviewsService.deleteReview(id, userId);

    logInfo("Review deleted", {
      service: "ReviewsHandler",
      method: "deleteReview",
      reviewId: id,
      userId,
    });

    return c.json({ message: "Review deleted successfully" }, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to delete review", {
      service: "ReviewsHandler",
      method: "deleteReview",
    });

    if (error.statusCode) {
      return c.json({ message: error.message }, error.statusCode);
    }

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};