import { z } from 'zod';

// Schema for profile photo upload
export const profilePhotoUploadSchema = z.object({
  url: z.string(),
  metadata: z.object({
    userId: z.string(),
    uploadedAt: z.string().datetime(),
  }),
});

// Error schema for upload failures
export const uploadErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

// Request body schemas
export const uploadRequestBody = z.object({
  file: z.instanceof(File),
  userId: z.string(),
});

export const deleteRequestBody = z.object({
  userId: z.string(),
  imagePath: z.string(),
});

// Response schemas
export const successResponseSchema = z.object({
  message: z.string(),
});