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
// Removed unused `uploadRequestBody` schema as it is not referenced in the codebase.

export const deleteRequestBody = z.object({
  userId: z.string(),
  imagePath: z.string(),
});

// Response schemas
export const successResponseSchema = z.object({
  message: z.string(),
});