import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { logInfo, logError } from "@/utils/logger";

import { servicesService } from "./services";
import type { 
  GetServicesRoute, 
  CreateServiceRoute, 
  UpdateServiceRoute, 
  DeleteServiceRoute,
  GetProfessionsRoute 
} from "./routes";

export const getServices: AppRouteHandler<GetServicesRoute> = async (c) => {
  try {
    const { professionId, limit, offset } = c.req.valid("query");

    const result = await servicesService.getServices(professionId, limit, offset);

    logInfo("Services retrieved", {
      service: "ServicesHandler",
      method: "getServices",
      professionId,
      count: result.services.length,
      total: result.total,
    });

    return c.json(result, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to retrieve services", {
      service: "ServicesHandler",
      method: "getServices",
    });

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const createService: AppRouteHandler<CreateServiceRoute> = async (c) => {
  try {
    const data = c.req.valid("json");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // For now, allow any authenticated user to create services
    // In the future, you might want to restrict this to admins only
    const service = await servicesService.createService(data);

    logInfo("Service created", {
      service: "ServicesHandler",
      method: "createService",
      serviceId: service.id,
      userId,
    });

    return c.json(service, HttpStatusCodes.CREATED);
  } catch (error: any) {
    logError(error, "Failed to create service", {
      service: "ServicesHandler",
      method: "createService",
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

export const updateService: AppRouteHandler<UpdateServiceRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const service = await servicesService.updateService(id, data);

    logInfo("Service updated", {
      service: "ServicesHandler",
      method: "updateService",
      serviceId: id,
      userId,
    });

    return c.json(service, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to update service", {
      service: "ServicesHandler",
      method: "updateService",
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

export const deleteService: AppRouteHandler<DeleteServiceRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    await servicesService.deleteService(id);

    logInfo("Service deleted", {
      service: "ServicesHandler",
      method: "deleteService",
      serviceId: id,
      userId,
    });

    return c.json({ message: "Service deleted successfully" }, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to delete service", {
      service: "ServicesHandler",
      method: "deleteService",
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

export const getProfessions: AppRouteHandler<GetProfessionsRoute> = async (c) => {
  try {
    const professions = await servicesService.getProfessions();

    logInfo("Professions retrieved", {
      service: "ServicesHandler",
      method: "getProfessions",
      count: professions.length,
    });

    return c.json(professions, HttpStatusCodes.OK);
  } catch (error: any) {
    logError(error, "Failed to retrieve professions", {
      service: "ServicesHandler",
      method: "getProfessions",
    });

    return c.json(
      { message: "Internal server error" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};