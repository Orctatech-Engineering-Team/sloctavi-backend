import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import type { CreateCustomerProfile,GetCustomerProfileRoute,GetProfessionalProfileRoute,CreateProfessionalProfileRoute } from "./routes";

import profileService from "./service";

export const createCustomerProfile: AppRouteHandler<CreateCustomerProfile> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;
  if (!userId) {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }
  const contactData = {
    ...data,
    userId,
  };
  const contact = await profileService.createCustomerProfile(contactData);
  if (!contact) {
    return c.json({ message: "Failed to create customer profile" }, HttpStatusCodes.BAD_REQUEST);
  }

  return c.json(contact, HttpStatusCodes.CREATED);
};

export const getCustomerProfile: AppRouteHandler<GetCustomerProfileRoute> = async (c) => {
    console.log(c.get("jwtPayload"));
  const userId = c.get("jwtPayload")?.userId
  
  if (!userId) {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }
  const profile = await profileService.getCustomerProfile(userId);
  if (!profile) {
    return c.json({ message: "Customer profile not found" }, HttpStatusCodes.NOT_FOUND);
  }
  return c.json(profile, HttpStatusCodes.OK);
};

export const createProfessionalProfile: AppRouteHandler<CreateProfessionalProfileRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwt").jwtPayload?.userId;
  if (!userId) {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }
  const profileData = {
    ...data,
    userId,
  };
  const profile = await profileService.createProfessionalProfile(profileData);
  if (!profile) {
    return c.json({ message: "Failed to create professional profile" }, HttpStatusCodes.BAD_REQUEST);
  }

  return c.json(profile, HttpStatusCodes.CREATED);
};

export const getProfessionalProfile: AppRouteHandler<GetProfessionalProfileRoute> = async (c) => {
  const userId = c.get("jwt").jwtPayload?.userId;
  if (!userId) {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }
  const profile = await profileService.getProfessionalProfile(userId);
  if (!profile) {
    return c.json({ message: "Professional profile not found" }, HttpStatusCodes.NOT_FOUND);
  }
  return c.json(profile, HttpStatusCodes.OK);
};
