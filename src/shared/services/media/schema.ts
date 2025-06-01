import { z } from "zod";

export const UploadFileSchema = z.object({
  file: z.instanceof(File),
  metadata: z.object({
    userId: z.string().uuid(),
    context: z.enum(["profile_image", "service_image"]),
  }),
});
export const UploadMetadataSchema = z.object({
  userId: z.string().uuid(),
  context: z.enum(["profile_image", "service_image"]),
});
