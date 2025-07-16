import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { logInfo, logError } from "@/utils/logger";

import { availabilityService } from "./services";
import type { 
  SetAvailabilityRoute, 
  GetAvailabilityRoute, 
  UpdateAvailabilityRoute, 
  DeleteAvailabilityRoute 
} from "./routes";

export const setAvailability: AppRouteHandler<SetAvailabilityRoute> = async (c) => {
  try {
    const data = c.req.valid("json");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Get professional profile for this user
    const { eq } = await import("drizzle-orm");
    const db = (await import("@/db")).default;
    const { professionalProfiles } = await import("@/db/schema/schema");
    
    const professional = await db.query.professionalProfiles.findFirst({
      where: eq(professionalProfiles.userId, userId),
    });

    if (!professional) {
      return c.json(
        { message: "Professional profile not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const availability = await availabilityService.createAvailability(professional.id, data);

    logInfo("Availability created", {
      service: "AvailabilityHandler",
      method: "setAvailability",
      professionalId: professional.id,
      availabilityId: availability.id,
    });

    return c.json(availability, HttpStatusCodes.CREATED);
  } catch (error: any) {
    logError(error, "Failed to create availability", {
      service: "AvailabilityHandler",
      method: "setAvailability",
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

export const getAvailability: AppRouteHandler<GetAvailabilityRoute> = async (c) => {
  try {
    const { professionalId } = c.req.valid("query");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    let queryProfessionalId = professionalId;

    // If no professionalId provided, get current user's professional profile
    if (!queryProfessionalId) {
      const { eq } = await import("drizzle-orm");
      const db = (await import("@/db")).default;
      const { professionalProfiles } = await import("@/db/schema/schema");
      
      const professional = await db.query.professionalProfiles.findFirst({
        where: eq(professionalProfiles.userId, userId),
      });

      if (!professional) {
        return c.json(
          { message: "Professional profile not found" },
          HttpStatusCodes.NOT_FOUND
        );
      }

      queryProfessionalId = professional.id;
    }

    const availability = await availabilityService.getAvailability(queryProfessionalId);

    logInfo("Availability retrieved", {
      service: "AvailabilityHandler",
      method: "getAvailability",
      professionalId: queryProfessionalId,
      count: availability.length,
    });

    return c.json(availability, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to retrieve availability", {
      service: "AvailabilityHandler",
      method: "getAvailability",
    });

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const updateAvailability: AppRouteHandler<UpdateAvailabilityRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Get professional profile for this user
    const { eq } = await import("drizzle-orm");
    const db = (await import("@/db")).default;
    const { professionalProfiles } = await import("@/db/schema/schema");
    
    const professional = await db.query.professionalProfiles.findFirst({
      where: eq(professionalProfiles.userId, userId),
    });

    if (!professional) {
      return c.json(
        { message: "Professional profile not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const availability = await availabilityService.updateAvailability(id, professional.id, data);

    logInfo("Availability updated", {
      service: "AvailabilityHandler",
      method: "updateAvailability",
      professionalId: professional.id,
      availabilityId: id,
    });

    return c.json(availability, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to update availability", {
      service: "AvailabilityHandler",
      method: "updateAvailability",
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

export const deleteAvailability: AppRouteHandler<DeleteAvailabilityRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Get professional profile for this user
    const { eq } = await import("drizzle-orm");
    const db = (await import("@/db")).default;
    const { professionalProfiles } = await import("@/db/schema/schema");
    
    const professional = await db.query.professionalProfiles.findFirst({
      where: eq(professionalProfiles.userId, userId),
    });

    if (!professional) {
      return c.json(
        { message: "Professional profile not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    await availabilityService.deleteAvailability(id, professional.id);

    logInfo("Availability deleted", {
      service: "AvailabilityHandler",
      method: "deleteAvailability",
      professionalId: professional.id,
      availabilityId: id,
    });

    return c.json({ message: "Availability deleted successfully" }, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to delete availability", {
      service: "AvailabilityHandler",
      method: "deleteAvailability",
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