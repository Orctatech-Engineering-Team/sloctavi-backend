import * as HttpStatusCodes from "stoker/http-status-codes";
import { eq } from "drizzle-orm";

import type { AppRouteHandler } from "@/lib/types";
import { AppError } from "@/utils/error";
import db from "@/db";
import { professionalProfiles } from "@/db/schema/schema";

import { servicesService } from "./services";
import type { 
  GetServicesRoute, 
  CreateServiceRoute, 
  UpdateServiceRoute, 
  DeleteServiceRoute,
  GetProfessionsRoute,
  GetProfessionalServicesRoute,
  AddProfessionalServiceRoute,
  UpdateProfessionalServiceRoute,
  RemoveProfessionalServiceRoute,
  DiscoverServicesRoute,
  GetProfessionalsByServiceRoute
} from "./routes";

export const getServices: AppRouteHandler<GetServicesRoute> = async (c) => {
  const query = c.req.valid("query");
  
  // Parse comma-separated arrays
  const categoryIds = query.categoryIds 
    ? query.categoryIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    : undefined;
    
  const tagIds = query.tagIds 
    ? query.tagIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    : undefined;

  const filters = {
    professionId: query.professionId,
    search: query.search,
    categoryIds,
    tagIds,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    minDuration: query.minDuration,
    maxDuration: query.maxDuration,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    location: query.location,
    isActive: query.isActive,
    limit: query.limit,
    offset: query.offset,
  };

  const result = await servicesService.getServices(filters);
  return c.json(result, HttpStatusCodes.OK);
};

export const createService: AppRouteHandler<CreateServiceRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  // For now, allow any authenticated user to create services
  // In the future, you might want to restrict this to admins only
  const service = await servicesService.createService(data);
  return c.json(service, HttpStatusCodes.CREATED);
};

export const updateService: AppRouteHandler<UpdateServiceRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const service = await servicesService.updateService(id, data);
  return c.json(service, HttpStatusCodes.OK);
};

export const deleteService: AppRouteHandler<DeleteServiceRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  await servicesService.deleteService(id);
  return c.json({ message: "Service deleted successfully" }, HttpStatusCodes.OK);
};

export const getProfessions: AppRouteHandler<GetProfessionsRoute> = async (c) => {
  const professions = await servicesService.getProfessions();
  return c.json(professions, HttpStatusCodes.OK);
};

// Professional Services Management Handlers
export const getProfessionalServices: AppRouteHandler<GetProfessionalServicesRoute> = async (c) => {
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

  const professionalServices = await servicesService.getProfessionalServices(queryProfessionalId);
  return c.json(professionalServices, HttpStatusCodes.OK);
};

export const addProfessionalService: AppRouteHandler<AddProfessionalServiceRoute> = async (c) => {
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

  const professionalService = await servicesService.addProfessionalService(professional.id, data);
  return c.json(professionalService, HttpStatusCodes.CREATED);
};

export const updateProfessionalService: AppRouteHandler<UpdateProfessionalServiceRoute> = async (c) => {
  const { serviceId } = c.req.valid("param");
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

  const professionalService = await servicesService.updateProfessionalService(professional.id, serviceId, data);
  return c.json(professionalService, HttpStatusCodes.OK);
};

export const removeProfessionalService: AppRouteHandler<RemoveProfessionalServiceRoute> = async (c) => {
  const { serviceId } = c.req.valid("param");
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

  await servicesService.removeProfessionalService(professional.id, serviceId);
  return c.json({ message: "Professional service removed successfully" }, HttpStatusCodes.OK);
};

// Service Discovery Handlers
export const discoverServices: AppRouteHandler<DiscoverServicesRoute> = async (c) => {
  const { professionId, location, priceRange, limit, offset } = c.req.valid("query");
  const result = await servicesService.discoverServices(professionId, location, priceRange, limit, offset);
  return c.json(result, HttpStatusCodes.OK);
};

export const getProfessionalsByService: AppRouteHandler<GetProfessionalsByServiceRoute> = async (c) => {
  const { serviceId } = c.req.valid("param");
  const { location, priceRange, limit, offset } = c.req.valid("query");
  const result = await servicesService.getProfessionalsByService(serviceId, location, priceRange, limit, offset);
  return c.json(result, HttpStatusCodes.OK);
};