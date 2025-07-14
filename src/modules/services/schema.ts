import { z } from "zod";
import { selectServiceSchema, selectProfessionSchema, selectCategorySchema, selectTagSchema } from "@/db/schema/schema";

// Service with enhanced details
export const ServiceWithDetailsSchema = selectServiceSchema.extend({
  profession: selectProfessionSchema.optional(),
  categories: z.array(selectCategorySchema).optional(),
  tags: z.array(selectTagSchema).optional(),
  professionalService: z.object({
    price: z.string().optional(),
    duration: z.number().optional(),
  }).optional(),
});

export const CreateServiceSchema = z.object({
  name: z.string().min(1).max(150),
  professionId: z.number().int().positive(),
  priceRange: z.string().max(50).optional(),
  durationEstimate: z.number().int().positive().optional(),
  description: z.string().optional(),
  categoryIds: z.array(z.number().int().positive()).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export const ProfessionalServiceSchema = z.object({
  serviceId: z.number().int().positive(),
  price: z.string().optional(),
  duration: z.number().int().positive().optional(),
});

export const ServicesListSchema = z.object({
  services: z.array(ServiceWithDetailsSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export const ServiceFiltersSchema = z.object({
  professionId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type ServiceWithDetails = z.infer<typeof ServiceWithDetailsSchema>;
export type CreateService = z.infer<typeof CreateServiceSchema>;
export type UpdateService = z.infer<typeof UpdateServiceSchema>;
export type ProfessionalServiceData = z.infer<typeof ProfessionalServiceSchema>;
export type ServicesList = z.infer<typeof ServicesListSchema>;
export type ServiceFilters = z.infer<typeof ServiceFiltersSchema>;
