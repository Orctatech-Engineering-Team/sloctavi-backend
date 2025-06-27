import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import type { CreateCustomerProfile, CreateProfessionalProfileRoute, GetCustomerProfileRoute, GetProfessionalProfileRoute, UploadProfilePhotoRoute, DeleteProfilePhotoRoute, UpdateCustomerProfileRoute, UpdateProfessionalProfileRoute } from "./routes";
import { ImageUploader } from '@/utils/imageUpload';
import env from '@/env';

const imageUploader = new ImageUploader(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  'profile-images'
);

import profileService from "./services";

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
  const userId = c.get("jwtPayload")?.userId;

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

export const updateCustomerProfile: AppRouteHandler<UpdateCustomerProfileRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;
  if (!userId) {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }
  const profileData = {
    ...data,
    userId,
  };
  const profile = await profileService.updateCustomerProfile(userId, profileData);
  if (!profile) {
    return c.json({ message: "Failed to update customer profile" }, HttpStatusCodes.BAD_REQUEST);
  }

  return c.json(profile, HttpStatusCodes.OK);
};

export const updateProfessionalProfile: AppRouteHandler<UpdateProfessionalProfileRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;
  if (!userId) {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }
  const profileData = {
    ...data,
    userId,
  };
  const profile = await profileService.updateProfessionalProfile(userId, profileData);
  if (!profile) {
    return c.json({ message: "Failed to update professional profile" }, HttpStatusCodes.BAD_REQUEST);
  }

  return c.json(profile, HttpStatusCodes.OK);
};

export const uploadProfilePhoto: AppRouteHandler<UploadProfilePhotoRoute> = async (c) => {
  const data = c.req.valid("form");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    return c.json({ error: "Unauthorized", message: "User not authenticated" }, HttpStatusCodes.UNAUTHORIZED);
  }

  // Check if profile exists before allowing upload
  const profile = await profileService.getCustomerProfile(userId) || await profileService.getProfessionalProfile(userId);
  if (!profile) {
    return c.json({ error: "NotFound", message: "User profile not found" }, HttpStatusCodes.NOT_FOUND);
  }

  try {
    const file = data.file;
    const result = await imageUploader.upload(
      file,
      {
        userId,
        uploadedAt: new Date().toISOString(),
      }
    );

    if (!result) {
      return c.json({ error: "UploadFailed", message: "Failed to upload image" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }

    const uploadResult = {
      url: result.url,
      metadata: {
        userId,
        uploadedAt: result.metadata.uploadedAt
      }
    };

    return c.json(uploadResult, HttpStatusCodes.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.name, message: error.message }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
    return c.json({ error: "Unknown", message: "Upload failed" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const deleteProfilePhoto: AppRouteHandler<DeleteProfilePhotoRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    return c.json({ error: "Unauthorized", message: "User not authenticated" }, HttpStatusCodes.UNAUTHORIZED);
  }

  if (userId !== data.userId) {
    return c.json({ error: "Unauthorized", message: "Cannot delete photo for another user" }, HttpStatusCodes.UNAUTHORIZED);
  }

  try {
    // Delete the file from storage
    await imageUploader.delete(data.imagePath);

    // Update user profile to remove the photo URL
    await profileService.removeProfilePhoto(userId);

    return c.json({ message: "Photo deleted successfully" }, HttpStatusCodes.OK);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return c.json({ error: "Not Found", message: "Photo not found" }, HttpStatusCodes.NOT_FOUND);
      }
      return c.json({ error: error.name, message: error.message }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
    return c.json({ error: "Unknown", message: "Deletion failed" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};
