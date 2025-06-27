import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { type CustomerProfile, customerProfiles, type NewCustomerProfile, type NewProfessionalProfile, type ProfessionalProfile, professionalProfiles } from "@/db/schema/schema";
import { AppError } from "@/utils/error";

export const profileService = {
  async createCustomerProfile(data: NewCustomerProfile): Promise<CustomerProfile> {
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
  async createProfessionalProfile(data: NewProfessionalProfile): Promise<ProfessionalProfile> {
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
        "Failed to fetch customer profile",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async getProfessionalProfile(userId: string): Promise<ProfessionalProfile | null> {
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
        "Failed to fetch professional profile",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async updateCustomerProfile(userId: string, data: NewCustomerProfile): Promise<CustomerProfile> {
    try {
      const customer = await db.update(customerProfiles).set(data).where(eq(customerProfiles.userId, userId)).returning();
      return customer[0];
    }
    catch (error) {
      throw new AppError(
        "Failed to update customer profile",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async updateProfessionalProfile(userId: string, data: NewProfessionalProfile): Promise<ProfessionalProfile> {
    try {
      const professionalProfile = await db.update(professionalProfiles).set(data).where(eq(professionalProfiles.userId, userId)).returning();
      return professionalProfile[0];
    }
    catch (error) {
      throw new AppError(
        "Failed to update professional profile",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async updateProfessionalProfilePhoto(userId: string, photoUrl: string) {
    try {
      await db.update(professionalProfiles)
        .set({ profileImage: photoUrl })
        .where(eq(professionalProfiles.userId, userId));
    } catch (error) {
      throw new AppError(
        "Failed to update professional profile photo",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async updateCustomerProfilePhoto(userId: string, photoUrl: string) {
    try {
      await db.update(customerProfiles)
        .set({ profileImage: photoUrl })
        .where(eq(customerProfiles.userId, userId));
    } catch (error) {
      throw new AppError(
        "Failed to update customer profile photo",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async updateProfilePhoto(userId: string, photoUrl: string) {
    try {
      await db.update(customerProfiles)
        .set({ profileImage: photoUrl })
        .where(eq(customerProfiles.userId, userId));
      
      await db.update(professionalProfiles)
        .set({ profileImage: photoUrl })
        .where(eq(professionalProfiles.userId, userId));
    } catch (error) {
      throw new AppError(
        "Failed to update profile photo",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  },
  async removeProfilePhoto(userId: string) {
    try {
      await db.update(customerProfiles)
        .set({ profileImage: null })
        .where(eq(customerProfiles.userId, userId));
      
      await db.update(professionalProfiles)
        .set({ profileImage: null })
        .where(eq(professionalProfiles.userId, userId));
    } catch (error) {
      throw new AppError(
        "Failed to remove profile photo",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }
};
export default profileService;
