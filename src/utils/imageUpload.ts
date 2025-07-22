import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import sharp from 'sharp';


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

// Define allowed image types and sizes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 1024; // 1KB

// Image processing configurations
export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

// Default processing options for different image types
export const DEFAULT_PROFILE_OPTIONS: ImageProcessingOptions = {
  width: 800,
  height: 800,
  quality: 85,
  format: 'webp',
  fit: 'cover',
  generateThumbnail: true,
  thumbnailSize: 150,
};

// Define metadata schema
const metadataSchema = z.object({
  name: z.string(),
  contentType: z.string().refine(
    (type) => ALLOWED_MIME_TYPES.includes(type as any),
    { message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }
  ),
  size: z.number()
    .min(MIN_FILE_SIZE, 'File too small')
    .max(MAX_FILE_SIZE, 'File too large (max 10MB)'),
  customMetadata: z.any().optional(),
  uploadedAt: z.string().optional(),
  processedVersions: z.array(z.string()).optional(),
});

// Type for the upload result
export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  metadata: Record<string, any>;
  processedVersions?: {
    original: string;
    optimized: string;
    thumbnail?: string;
  };
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
   * Process image with Sharp
   * @param buffer Image buffer
   * @param options Processing options
   * @returns Processed image buffer
   */
  private async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions
  ): Promise<Buffer> {
    let transformer = sharp(buffer);

    // Resize if dimensions specified
    if (options.width || options.height) {
      transformer = transformer.resize(options.width, options.height, {
        fit: options.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Convert format and set quality
    switch (options.format) {
      case 'jpeg':
        transformer = transformer.jpeg({ quality: options.quality || 85 });
        break;
      case 'png':
        transformer = transformer.png({ quality: options.quality || 85 });
        break;
      case 'webp':
        transformer = transformer.webp({ quality: options.quality || 85 });
        break;
    }

    return transformer.toBuffer();
  }

  /**
   * Generate thumbnail for image
   * @param buffer Original image buffer
   * @param size Thumbnail size (square)
   * @returns Thumbnail buffer
   */
  private async generateThumbnail(buffer: Buffer, size: number = 150): Promise<Buffer> {
    return sharp(buffer)
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
  }

  /**
   * Uploads an image to Supabase Storage with optimization
   * @param file The image file to upload
   * @param metadata Additional metadata for the file
   * @param processingOptions Image processing options
   * @param errorHandler Optional error handler callback
   * @returns Promise with upload result or throws error
   */
  async upload(
    file: File,
    metadata: Record<string, any> = {},
    processingOptions: ImageProcessingOptions = DEFAULT_PROFILE_OPTIONS,
    errorHandler?: ErrorHandler
  ): Promise<UploadResult | undefined> {
    try {
      // Validate metadata
      const validatedMetadata = metadataSchema.parse({
        name: file.name,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        ...metadata,
      });

      // Convert file to buffer for processing
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      // Generate unique base filename (without extension)
      const timestamp = Date.now();
      const baseName = validatedMetadata.name.replace(/\.[^/.]+$/, '');
      const baseFileName = `${timestamp}-${baseName}`;

      // Process the main image
      const processedBuffer = await this.processImage(fileBuffer, processingOptions);
      const optimizedFileName = `${baseFileName}-optimized.${processingOptions.format || 'webp'}`;

      // Upload optimized image
      const { error: uploadError } = await this.supabase.storage
        .from(this.bucket)
        .upload(optimizedFileName, processedBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${processingOptions.format || 'webp'}`,
          metadata: {
            ...validatedMetadata,
            processed: true,
            originalSize: file.size,
            optimizedSize: processedBuffer.length,
          },
        });

      if (uploadError) {
        throw new StorageError(uploadError.message);
      }

      // Generate and upload thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (processingOptions.generateThumbnail) {
        const thumbnailBuffer = await this.generateThumbnail(
          fileBuffer,
          processingOptions.thumbnailSize
        );
        const thumbnailFileName = `${baseFileName}-thumb.webp`;

        const { error: thumbError } = await this.supabase.storage
          .from(this.bucket)
          .upload(thumbnailFileName, thumbnailBuffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/webp',
            metadata: {
              ...validatedMetadata,
              isThumbnail: true,
              thumbnailSize: processingOptions.thumbnailSize,
            },
          });

        if (!thumbError) {
          const { data: thumbUrlData } = await this.supabase.storage
            .from(this.bucket)
            .getPublicUrl(thumbnailFileName);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      }

      // Get public URLs
      const { data: publicUrlData } = await this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(optimizedFileName);

      if (!publicUrlData.publicUrl) {
        throw new StorageError('Failed to get public URL');
      }

      // Upload original file for backup (optional)
      const originalFileName = `${baseFileName}-original.${file.name.split('.').pop()}`;
      await this.supabase.storage
        .from(this.bucket)
        .upload(originalFileName, fileBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
          metadata: {
            ...validatedMetadata,
            isOriginal: true,
          },
        });

      const { data: originalUrlData } = await this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(originalFileName);

      return {
        url: publicUrlData.publicUrl,
        thumbnailUrl,
        metadata: {
          ...validatedMetadata,
          processed: true,
          optimizedSize: processedBuffer.length,
          compressionRatio: ((file.size - processedBuffer.length) / file.size * 100).toFixed(2) + '%',
        },
        processedVersions: {
          original: originalUrlData.publicUrl,
          optimized: publicUrlData.publicUrl,
          thumbnail: thumbnailUrl,
        },
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