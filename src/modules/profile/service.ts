import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { type CustomerProfile,type ProfessionalProfile,type NewCustomerProfile,type NewProfessionalProfile, customerProfiles, professionalProfiles } from "@/db/schema/schema";

import db from "@/db";
import { AppError } from "@/utils/error";
import { createCustomerProfile,getCustomerProfile,getProfessionalProfile,createProfessionalProfile } from "./routes";

export const profileService = {
  async createCustomerProfile(data:NewCustomerProfile): Promise<CustomerProfile> {
    try {
      const customer = await db.insert(customerProfiles).values(data).returning();
      return customer[0];
    }
    catch (error) {
      throw new AppError(
        "Failed to create customer profile",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async createProfessionalProfile(data:NewProfessionalProfile): Promise<ProfessionalProfile> {
    try {
      const professionalProfile = await db.insert(professionalProfiles).values(data).returning();
      return professionalProfile[0];
    }
    catch (error) {
      throw new AppError(
        "Failed to create professional profile",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
    try {
      const profile = await db.query.customerProfiles.findFirst({
        where: eq(customerProfiles.userId, userId),
      });
      if (!profile) {
        return null; // Return null if no profile found
      }
      return profile;
    }
    catch (error) {
      throw new AppError(
        "Failed to retrieve customer profile",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async getProfessionalProfile(userId:string): Promise<ProfessionalProfile | null> {
    try {
      const profile = await db.query.professionalProfiles.findFirst({
        where: eq(professionalProfiles.userId, userId),
      });
      if (!profile) {
        return null; // Return null if no profile found
      }
      return profile;
    }
    catch (error) {
      throw new AppError(
        "Failed to retrieve professional profile",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
};
export default profileService;
