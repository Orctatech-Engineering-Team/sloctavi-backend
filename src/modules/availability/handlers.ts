import * as HttpStatusCodes from "stoker/http-status-codes";
import { eq } from "drizzle-orm";

import type { AppRouteHandler } from "@/lib/types";
import { AppError } from "@/utils/error";
import db from "@/db";
import { professionalProfiles } from "@/db/schema/schema";

import { availabilityService } from "./services";
import type { 
  SetAvailabilityRoute, 
  GetAvailabilityRoute, 
  UpdateAvailabilityRoute, 
  DeleteAvailabilityRoute 
} from "./routes";

export const setAvailability: AppRouteHandler<SetAvailabilityRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  // Get professional profile for this user
  const professional = await db.query.professionalProfiles.findFirst({
    where: eq(professionalProfiles.userId, userId),
  });

  if (!professional) {
    throw new AppError("Professional profile not found", HttpStatusCodes.NOT_FOUND);
  }

  const availability = await availabilityService.createAvailability(professional.id, data);
  return c.json(availability, HttpStatusCodes.CREATED);
};

export const getAvailability: AppRouteHandler<GetAvailabilityRoute> = async (c) => {
  const { professionalId } = c.req.valid("query");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  let queryProfessionalId = professionalId;

  // If no professionalId provided, get current user's professional profile
  if (!queryProfessionalId) {
    const professional = await db.query.professionalProfiles.findFirst({
      where: eq(professionalProfiles.userId, userId),
    });

    if (!professional) {
      throw new AppError("Professional profile not found", HttpStatusCodes.NOT_FOUND);
    }

    queryProfessionalId = professional.id;
  }

  const availability = await availabilityService.getAvailability(queryProfessionalId);
  return c.json(availability, HttpStatusCodes.OK);
};

export const updateAvailability: AppRouteHandler<UpdateAvailabilityRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  // Get professional profile for this user
  const professional = await db.query.professionalProfiles.findFirst({
    where: eq(professionalProfiles.userId, userId),
  });

  if (!professional) {
    throw new AppError("Professional profile not found", HttpStatusCodes.NOT_FOUND);
  }

  const availability = await availabilityService.updateAvailability(id, professional.id, data);
  return c.json(availability, HttpStatusCodes.OK);
};

export const deleteAvailability: AppRouteHandler<DeleteAvailabilityRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  // Get professional profile for this user
  const professional = await db.query.professionalProfiles.findFirst({
    where: eq(professionalProfiles.userId, userId),
  });

  if (!professional) {
    throw new AppError("Professional profile not found", HttpStatusCodes.NOT_FOUND);
  }

  await availabilityService.deleteAvailability(id, professional.id);
  return c.json({ message: "Availability deleted successfully" }, HttpStatusCodes.OK);
};