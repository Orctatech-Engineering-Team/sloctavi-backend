import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import type { CreateCustomerProfile, CreateProfessionalProfileRoute, GetCustomerProfileRoute, GetProfessionalProfileRoute, UploadProfilePhotoRoute, DeleteProfilePhotoRoute, UpdateCustomerProfileRoute, UpdateProfessionalProfileRoute } from "./routes";
import { ImageUploader, DEFAULT_PROFILE_OPTIONS, type ImageProcessingOptions } from '@/utils/imageUpload';
import { notificationService } from '@/shared/services/notification';
import env from '@/env';
import { AppError } from '@/utils/error';

const imageUploader = new ImageUploader(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  'profile-images'
);

import profileService from "./services";

export const createCustomerProfile: AppRouteHandler<CreateCustomerProfile> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId
  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }
  const contactData = {
    ...data,
    userId,
  };
  const contact = await profileService.createCustomerProfile(contactData);
  return c.json(contact, HttpStatusCodes.CREATED);
};

export const getCustomerProfile: AppRouteHandler<GetCustomerProfileRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;
  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }
  const profile = await profileService.getCustomerProfile(userId);
  if (!profile) {
    throw new AppError("Customer profile not found", HttpStatusCodes.NOT_FOUND);
  }
  return c.json(profile, HttpStatusCodes.OK);
};

export const createProfessionalProfile: AppRouteHandler<CreateProfessionalProfileRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const profileData = {
    ...data,
    userId,
  };
  const profile = await profileService.createProfessionalProfile(profileData);
  return c.json(profile, HttpStatusCodes.CREATED);
};

export const getProfessionalProfile: AppRouteHandler<GetProfessionalProfileRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId;
  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }
  const profile = await profileService.getProfessionalProfile(userId);
  if (!profile) {
    throw new AppError("Professional profile not found", HttpStatusCodes.NOT_FOUND);
  }
  return c.json(profile, HttpStatusCodes.OK);
};

export const updateCustomerProfile: AppRouteHandler<UpdateCustomerProfileRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;
  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }
  
  // Get current profile for comparison
  const currentProfile = await profileService.getCustomerProfile(userId);
  
  const profile = await profileService.updateCustomerProfile(userId, data);
  
  // Send notification for significant profile changes
  try {
    const significantChanges = [];
    
    if (currentProfile && data.phoneNumber && currentProfile.phoneNumber !== data.phoneNumber) {
      significantChanges.push('phone number');
    }
    
    if (currentProfile && (data.firstName || data.lastName) && 
        (currentProfile.firstName !== data.firstName || currentProfile.lastName !== data.lastName)) {
      significantChanges.push('name');
    }
    
    if (significantChanges.length > 0) {
      await notificationService.sendProfileUpdateNotification({
        userId,
        userType: 'customer',
        updateType: 'profile_update',
        changes: significantChanges,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (notificationError) {
    // Log but don't fail the request
    console.error('Failed to send profile update notification:', notificationError);
  }
  
  return c.json(profile, HttpStatusCodes.OK);
};

export const updateProfessionalProfile: AppRouteHandler<UpdateProfessionalProfileRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;
  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }
  
  // Get current profile for comparison
  const currentProfile = await profileService.getProfessionalProfile(userId);
  
  const profile = await profileService.updateProfessionalProfile(userId, data);
  
  // Send notification for significant profile changes
  try {
    const significantChanges = [];
    
    if (currentProfile && data.name && currentProfile.name !== data.name) {
      significantChanges.push('business name');
    }
    
    if (currentProfile && data.location && currentProfile.location !== data.location) {
      significantChanges.push('location');
    }
    
    if (currentProfile && data.description && currentProfile.description !== data.description) {
      significantChanges.push('description');
    }
    
    if (currentProfile && data.yearsOfExperience && currentProfile.yearsOfExperience !== data.yearsOfExperience) {
      significantChanges.push('experience');
    }
    
    if (currentProfile && data.status && currentProfile.status !== data.status) {
      significantChanges.push('availability status');
    }
    
    if (significantChanges.length > 0) {
      await notificationService.sendProfileUpdateNotification({
        userId,
        userType: 'professional',
        updateType: 'profile_update',
        changes: significantChanges,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (notificationError) {
    // Log but don't fail the request
    console.error('Failed to send profile update notification:', notificationError);
  }
  
  return c.json(profile, HttpStatusCodes.OK);
};

export const uploadProfilePhoto: AppRouteHandler<UploadProfilePhotoRoute> = async (c) => {
  const data = c.req.valid("form");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("User not authenticated", HttpStatusCodes.UNAUTHORIZED);
  }

  const file = data.file;
  
  // Enhanced image processing options for profile photos
  const processingOptions: ImageProcessingOptions = {
    ...DEFAULT_PROFILE_OPTIONS,
    width: 400,
    height: 400,
    quality: 90,
    format: 'webp',
    fit: 'cover',
    generateThumbnail: true,
    thumbnailSize: 150,
  };

  const result = await imageUploader.upload(
    file,
    {
      userId,
      uploadType: 'profile_photo',
      uploadedAt: new Date().toISOString(),
    },
    processingOptions
  );

  if (!result) {
    throw new AppError("Failed to upload image", HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Update profile photo in database with both optimized and thumbnail URLs
  await profileService.updateProfilePhoto(userId, result.url, result.thumbnailUrl);

  // Send notification for profile photo update
  try {
    // Determine user type from profile
    const [customerProfile, professionalProfile] = await Promise.all([
      profileService.getCustomerProfile(userId),
      profileService.getProfessionalProfile(userId)
    ]);
    
    const userType = customerProfile ? 'customer' : 'professional';
    
    await notificationService.sendProfileUpdateNotification({
      userId,
      userType,
      updateType: 'profile_photo_update',
      changes: ['profile photo'],
      timestamp: new Date().toISOString(),
      metadata: {
        compressionRatio: result.metadata.compressionRatio,
        optimizedSize: result.metadata.optimizedSize,
        thumbnailGenerated: !!result.thumbnailUrl,
      },
    });
  } catch (notificationError) {
    // Log but don't fail the request
    console.error('Failed to send profile photo update notification:', notificationError);
  }

  const uploadResult = {
    url: result.url,
    thumbnailUrl: result.thumbnailUrl,
    processedVersions: result.processedVersions,
    metadata: {
      userId,
      uploadedAt: result.metadata.uploadedAt,
      optimizedSize: result.metadata.optimizedSize,
      compressionRatio: result.metadata.compressionRatio,
      processed: true,
    }
  };

  return c.json(uploadResult, HttpStatusCodes.CREATED);
};

export const deleteProfilePhoto: AppRouteHandler<DeleteProfilePhotoRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("User not authenticated", HttpStatusCodes.UNAUTHORIZED);
  }

  if (userId !== data.userId) {
    throw new AppError("Cannot delete photo for another user", HttpStatusCodes.UNAUTHORIZED);
  }

  // Delete the file from storage
  await imageUploader.delete(data.imagePath);

  // Update user profile to remove the photo URL
  await profileService.removeProfilePhoto(userId);

  return c.json({ message: "Photo deleted successfully" }, HttpStatusCodes.OK);
};
