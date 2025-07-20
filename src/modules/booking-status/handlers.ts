import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { AppError } from "@/utils/error";

import { bookingStatusService } from "./services";
import type { 
  GetBookingStatusesRoute, 
  GetBookingStatusByIdRoute,
  CreateBookingStatusRoute, 
  UpdateBookingStatusRoute, 
  DeleteBookingStatusRoute,
  GetBookingStatusHistoryRoute
} from "./routes";

export const getBookingStatuses: AppRouteHandler<GetBookingStatusesRoute> = async (c) => {
  const { limit, offset } = c.req.valid("query");
  const result = await bookingStatusService.getBookingStatuses(limit, offset);
  return c.json(result, HttpStatusCodes.OK);
};

export const getBookingStatusById: AppRouteHandler<GetBookingStatusByIdRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const status = await bookingStatusService.getBookingStatusById(id);
  
  if (!status) {
    throw new AppError("Booking status not found", HttpStatusCodes.NOT_FOUND);
  }
  
  return c.json(status, HttpStatusCodes.OK);
};

export const createBookingStatus: AppRouteHandler<CreateBookingStatusRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const status = await bookingStatusService.createBookingStatus(data);
  return c.json(status, HttpStatusCodes.CREATED);
};

export const updateBookingStatus: AppRouteHandler<UpdateBookingStatusRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const status = await bookingStatusService.updateBookingStatus(id, data);
  return c.json(status, HttpStatusCodes.OK);
};

export const deleteBookingStatus: AppRouteHandler<DeleteBookingStatusRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  await bookingStatusService.deleteBookingStatus(id);
  return c.json({ message: "Booking status deleted successfully" }, HttpStatusCodes.OK);
};

export const getBookingStatusHistory: AppRouteHandler<GetBookingStatusHistoryRoute> = async (c) => {
  const { bookingId, limit, offset } = c.req.valid("query");
  const result = await bookingStatusService.getBookingStatusHistory(bookingId, limit, offset);
  return c.json(result, HttpStatusCodes.OK);
};