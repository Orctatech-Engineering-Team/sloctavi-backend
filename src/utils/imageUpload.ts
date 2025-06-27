import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';


// Define error types
export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export class StorageError extends ImageUploadError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ValidationError extends ImageUploadError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Define metadata schema
const metadataSchema = z.object({
  name: z.string(),
  contentType: z.string(),
  size: z.number(),
  customMetadata: z.any().optional(),
});

// Type for the upload result
export interface UploadResult {
  url: string;
  metadata: Record<string, any>;
}

// Type for error handler
export type ErrorHandler = (error: ImageUploadError) => void;

export class ImageUploader {
  private supabase: any;
  private bucket: string;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    bucket: string = 'images'
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.bucket = bucket;
  }

  /**
   * Uploads an image to Supabase Storage
   * @param file The image file to upload
   * @param metadata Additional metadata for the file
   * @param errorHandler Optional error handler callback
   * @returns Promise with upload result or throws error
   */
  async upload(
    file: File,
    metadata: Record<string, any>,
    errorHandler?: ErrorHandler
  ): Promise<UploadResult | undefined> {
    try {
      // Validate metadata
      const validatedMetadata = metadataSchema.parse({
        name: file.name,
        contentType: file.type,
        size: file.size,
        ...metadata,
      });

      // Generate unique filename
      const fileName = `${Date.now()}-${validatedMetadata.name}`;

      // Upload file
      const { error: uploadError, data: uploadData } = await this.supabase.storage
        .from(this.bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          metadata: validatedMetadata,
        });

      if (uploadError) {
        throw new StorageError(uploadError.message);
      }

      // Get public URL
      const { data: publicUrlData } = await this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(fileName);

      if (!publicUrlData.publicUrl) {
        throw new StorageError('Failed to get public URL');
      }

      return {
        url: publicUrlData.publicUrl,
        metadata: validatedMetadata,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid metadata: ' + error.message);
      }

      if (error instanceof ImageUploadError) {
        if (errorHandler) {
          errorHandler(error);
          return;
        }
        throw error;
      }

      throw new StorageError('Unknown error occurred');
    }
  }

  /**
   * Delete an image from storage
   * @param path Path of the file to delete
   * @param errorHandler Optional error handler callback
   */
  async delete(
    path: string,
    errorHandler?: ErrorHandler
  ): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([path]);

      if (error) {
        throw new StorageError(error.message);
      }
    } catch (error) {
      if (error instanceof ImageUploadError) {
        if (errorHandler) {
          errorHandler(error);
          return;
        }
        throw error;
      }
      throw new StorageError('Unknown error occurred');
    }
  }
}
