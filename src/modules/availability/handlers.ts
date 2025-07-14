import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { professionalProfiles } from "@/db/schema/schema";

import availabilityService from "./services";
import type {
  GetAvailabilityRoute,
  GetWeeklyAvailabilityRoute,
  CreateAvailabilityRoute,
  UpdateAvailabilityRoute,
  DeleteAvailabilityRoute,
  BulkUpdateAvailabilityRoute,
} from "./routes";

// Helper function to get professional profile ID
const getProfessionalId = async (userId: string): Promise<string> => {
  const professional = await db.query.professionalProfiles.findFirst({
    where: eq(professionalProfiles.userId, userId),
  });

  if (!professional) {
    throw new Error("Professional profile not found");
  }

  return professional.id;
};

export const getAvailability: AppRouteHandler<GetAvailabilityRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;
  
  if (!userId) {
    return c.json({ message: "Authentication required" }, HttpStatusCodes.UNAUTHORIZED);
  }

  try {
    const professionalId = await getProfessionalId(userId);
    const filters = c.req.valid("query");
    
    const result = await availabilityService.getProfessionalAvailability(
      professionalId,
      filters
    );

    return c.json(result, HttpStatusCodes.OK);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
    return c.json({ message: "Internal server error" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const createAvailability: AppRouteHandler<CreateAvailabilityRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;
  
  if (!userId) {
    return c.json({ message: "Authentication required" }, HttpStatusCodes.UNAUTHORIZED);
  }

  try {
    const professionalId = await getProfessionalId(userId);
    const data = c.req.valid("json");

    // Check for time conflicts
    const conflicts = await availabilityService.checkTimeSlotConflicts(
      professionalId,
      data.fromTime,
      data.toTime,
      String(data.day)
    );

    if (conflicts.length > 0) {
      return c.json(
        { 
          message: "Time slot conflicts with existing availability",
          conflicts 
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    const newAvailability = await availabilityService.createAvailability({
      professionalId,
      ...data,
    });

    return c.json(newAvailability, HttpStatusCodes.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
    return c.json({ message: "Internal server error" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const updateAvailability: AppRouteHandler<UpdateAvailabilityRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;
  
  if (!userId) {
    return c.json({ message: "Authentication required" }, HttpStatusCodes.UNAUTHORIZED);
  }

  try {
    const professionalId = await getProfessionalId(userId);
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    // Get existing availability slot by querying with professionalId and id
    const slots = await availabilityService.getProfessionalAvailability(professionalId, {});
    const existingSlot = slots.availabilities.find(slot => slot.id === Number(id));
    
    if (!existingSlot) {
      return c.json({ message: "Availability slot not found" }, HttpStatusCodes.NOT_FOUND);
    }

    // Verify ownership
    if (existingSlot.professionalId !== professionalId) {
      return c.json({ message: "Access denied" }, HttpStatusCodes.FORBIDDEN);
    }

    // Check for time conflicts if time is being updated
    if (data.fromTime || data.toTime || data.day !== undefined) {
      const fromTime = data.fromTime || existingSlot.fromTime;
      const toTime = data.toTime || existingSlot.toTime;
      const day = data.day !== undefined ? data.day : existingSlot.day;

      const conflicts = await availabilityService.checkTimeSlotConflicts(
        professionalId,
        fromTime,
        toTime,
        String(day),
        String(id) // Exclude current slot from conflict check
      );

      if (conflicts.length > 0) {
        return c.json(
          { 
            message: "Time slot conflicts with existing availability",
            conflicts 
          },
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    const updatedSlot = await availabilityService.updateAvailability(Number(id), data);

    return c.json(updatedSlot, HttpStatusCodes.OK);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
    return c.json({ message: "Internal server error" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const deleteAvailability: AppRouteHandler<DeleteAvailabilityRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;
  
  if (!userId) {
    return c.json({ message: "Authentication required" }, HttpStatusCodes.UNAUTHORIZED);
  }

  try {
    const professionalId = await getProfessionalId(userId);
    const { id } = c.req.valid("param");

    // Get existing availability to verify ownership
    const slots = await availabilityService.getProfessionalAvailability(professionalId, {});
    const existingSlot = slots.availabilities.find(slot => slot.id === Number(id));
    
    if (!existingSlot) {
      return c.json({ message: "Availability slot not found" }, HttpStatusCodes.NOT_FOUND);
    }

    if (existingSlot.professionalId !== professionalId) {
      return c.json({ message: "Access denied" }, HttpStatusCodes.FORBIDDEN);
    }

    await availabilityService.deleteAvailability(Number(id));

    return c.json({ message: "Availability slot deleted successfully" }, HttpStatusCodes.OK);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
    return c.json({ message: "Internal server error" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const getWeeklyAvailability: AppRouteHandler<GetWeeklyAvailabilityRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;
  
  if (!userId) {
    return c.json({ message: "Authentication required" }, HttpStatusCodes.UNAUTHORIZED);
  }

  try {
    const professionalId = await getProfessionalId(userId);
    const { date } = c.req.valid("query");

    const weeklyAvailability = await availabilityService.getWeeklyAvailability(
      professionalId,
      date
    );

    return c.json(weeklyAvailability, HttpStatusCodes.OK);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
    return c.json({ message: "Internal server error" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const bulkCreateAvailability: AppRouteHandler<BulkUpdateAvailabilityRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;
  
  if (!userId) {
    return c.json({ message: "Authentication required" }, HttpStatusCodes.UNAUTHORIZED);
  }

  try {
    const professionalId = await getProfessionalId(userId);
    const { availabilities } = c.req.valid("json");

    const result = await availabilityService.bulkCreateAvailability(professionalId, availabilities);

    return c.json({ 
      message: "Availability updated successfully",
      ...result 
    }, HttpStatusCodes.OK);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
    return c.json({ message: "Internal server error" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};
