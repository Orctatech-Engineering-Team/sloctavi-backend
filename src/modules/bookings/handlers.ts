import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { customerProfiles, users } from "@/db/schema/schema";
import { AppError } from "@/utils/error";

import type {
  CancelBookingRoute,
  CreateBookingRoute,
  GetAvailableSlotsRoute,
  GetBookingRoute,
  GetUserBookingsRoute,
  UpdateBookingStatusRoute,
} from "./routes";

import bookingService from "./services";

export const createBooking: AppRouteHandler<CreateBookingRoute> = async (c) => {
  const bookingData = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  // Get customer profile ID
  const customerProfile = await db.query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, userId),
  });

  if (!customerProfile) {
    throw new AppError("Customer profile not found", HttpStatusCodes.BAD_REQUEST);
  }

  const booking = await bookingService.createBooking(customerProfile.id, bookingData);

  return c.json(booking, HttpStatusCodes.CREATED);
};

export const getBooking: AppRouteHandler<GetBookingRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const booking = await bookingService.getBookingById(id, userId);

  return c.json(booking, HttpStatusCodes.OK);
};

export const updateBookingStatus: AppRouteHandler<UpdateBookingStatusRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const { status, notes } = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const booking = await bookingService.updateBookingStatus(id, status, userId, notes);

  return c.json(booking, HttpStatusCodes.OK);
};

export const cancelBooking: AppRouteHandler<CancelBookingRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const { reason } = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const booking = await bookingService.cancelBooking(id, userId, reason);

  return c.json({
    message: "Booking cancelled successfully",
    booking,
  }, HttpStatusCodes.OK);
};

export const getAvailableSlots: AppRouteHandler<GetAvailableSlotsRoute> = async (c) => {
  const { professionalId } = c.req.valid("param");
  const { date, serviceId } = c.req.valid("query");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const availableSlots = await bookingService.getAvailableSlots(
    professionalId,
    date,
    serviceId,
  );

  return c.json({
    date,
    availableSlots,
  }, HttpStatusCodes.OK);
};

export const getUserBookings: AppRouteHandler<GetUserBookingsRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;
  const { status, limit, offset, role } = c.req.valid("query");

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  // Determine user role if not specified
  let userRole = role;
  if (!userRole) {
    // Get user type from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new AppError("User not found", HttpStatusCodes.NOT_FOUND);
    }

    userRole = user.type as "customer" | "professional";
  }

  const result = await bookingService.getUserBookings(userId, userRole, {
    status,
    limit,
    offset,
  });

  return c.json(result, HttpStatusCodes.OK);
};
