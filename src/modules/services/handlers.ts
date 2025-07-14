import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import db from "@/db";
import { professionalProfiles, users } from "@/db/schema/schema";
import { AppError } from "@/utils/error";

import type {
  GetServicesRoute,
  GetServiceByIdRoute,
  CreateServiceRoute,
  UpdateServiceRoute,
  DeleteServiceRoute,
  AddProfessionalServiceRoute,
  UpdateProfessionalServiceRoute,
  RemoveProfessionalServiceRoute,
  GetProfessionalServicesRoute,
} from "./routes";
import servicesService from "./services";

// Helper function to check if user is admin
const isAdmin = async (userId: string): Promise<boolean> => {
  // TODO: Implement proper role checking with userRoles table
  // For now, assume any user can be admin - implement proper RBAC later
  return true;
};

// Helper function to get professional profile ID
const getProfessionalId = async (userId: string): Promise<string> => {
  const professional = await db.query.professionalProfiles.findFirst({
    where: eq(professionalProfiles.userId, userId),
  });

  if (!professional) {
    throw new AppError("Professional profile not found", HttpStatusCodes.FORBIDDEN);
  }

  return professional.id;
};

export const getServices: AppRouteHandler<GetServicesRoute> = async (c) => {
  try {
    const filters = c.req.valid("query");
    const result = await servicesService.getServices(filters);
    return c.json(result, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to get services");

    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getServiceById: AppRouteHandler<GetServiceByIdRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const service = await servicesService.getServiceById(id);
    return c.json(service, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to get service");

    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const createService: AppRouteHandler<CreateServiceRoute> = async (c) => {
  try {
    const userId = c.get("jwtPayload")?.userId;
    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return c.json({ message: "Admin access required" }, HttpStatusCodes.FORBIDDEN);
    }

    const data = c.req.valid("json");
    const service = await servicesService.createService(data);
    return c.json(service, HttpStatusCodes.CREATED);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to create service");

    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const updateService: AppRouteHandler<UpdateServiceRoute> = async (c) => {
  try {
    const userId = c.get("jwtPayload")?.userId;
    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return c.json({ message: "Admin access required" }, HttpStatusCodes.FORBIDDEN);
    }

    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const service = await servicesService.updateService(id, data);
    return c.json(service, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to update service");

    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const deleteService: AppRouteHandler<DeleteServiceRoute> = async (c) => {
  try {
    const userId = c.get("jwtPayload")?.userId;
    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return c.json({ message: "Admin access required" }, HttpStatusCodes.FORBIDDEN);
    }

    const { id } = c.req.valid("param");
    await servicesService.deleteService(id);
    return c.json({ message: "Service deleted successfully" }, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to delete service");

    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const addProfessionalService: AppRouteHandler<AddProfessionalServiceRoute> = async (c) => {
  try {
    const userId = c.get("jwtPayload")?.userId;
    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Check if user is professional
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || user.type !== "professional") {
      return c.json({ message: "Professional access required" }, HttpStatusCodes.FORBIDDEN);
    }

    const professionalId = await getProfessionalId(userId);
    const { id: serviceId } = c.req.valid("param");
    const data = c.req.valid("json");

    const professionalService = await servicesService.addProfessionalService(
      professionalId,
      serviceId,
      data
    );

    return c.json({
      message: "Service added to professional offerings",
      professionalService: {
        serviceId: professionalService.serviceId,
        price: professionalService.price || undefined,
        duration: professionalService.duration || undefined,
      },
    }, HttpStatusCodes.CREATED);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to add professional service");

    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const updateProfessionalService: AppRouteHandler<UpdateProfessionalServiceRoute> = async (c) => {
  try {
    const userId = c.get("jwtPayload")?.userId;
    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Check if user is professional
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || user.type !== "professional") {
      return c.json({ message: "Professional access required" }, HttpStatusCodes.FORBIDDEN);
    }

    const professionalId = await getProfessionalId(userId);
    const { id: serviceId } = c.req.valid("param");
    const data = c.req.valid("json");

    const professionalService = await servicesService.updateProfessionalService(
      professionalId,
      serviceId,
      data
    );

    return c.json({
      message: "Professional service updated successfully",
      professionalService: {
        serviceId: professionalService.serviceId,
        price: professionalService.price || undefined,
        duration: professionalService.duration || undefined,
      },
    }, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to update professional service");

    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const removeProfessionalService: AppRouteHandler<RemoveProfessionalServiceRoute> = async (c) => {
  try {
    const userId = c.get("jwtPayload")?.userId;
    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Check if user is professional
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || user.type !== "professional") {
      return c.json({ message: "Professional access required" }, HttpStatusCodes.FORBIDDEN);
    }

    const professionalId = await getProfessionalId(userId);
    const { id: serviceId } = c.req.valid("param");

    await servicesService.removeProfessionalService(professionalId, serviceId);

    return c.json({
      message: "Service removed from professional offerings"
    }, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to remove professional service");

    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getProfessionalServices: AppRouteHandler<GetProfessionalServicesRoute> = async (c) => {
  try {
    const userId = c.get("jwtPayload")?.userId;
    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Check if user is professional
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || user.type !== "professional") {
      return c.json({ message: "Professional access required" }, HttpStatusCodes.FORBIDDEN);
    }

    const professionalId = await getProfessionalId(userId);
    const { limit, offset } = c.req.valid("query");

    const result = await servicesService.getProfessionalServices(professionalId, limit, offset);

    return c.json(result, HttpStatusCodes.OK);
  } catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to get professional services");

    return c.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
