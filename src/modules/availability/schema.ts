import { z } from "zod";
import { selectAvailabilitySchema } from "@/db/schema/schema";

export const AvailabilitySchema = selectAvailabilitySchema;

export const CreateAvailabilitySchema = z.object({
  day: z.number().int().min(0).max(6), // 0=Sunday, 1=Monday, ..., 6=Saturday
  fromTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  toTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  capacity: z.number().int().min(1).default(1),
  detailed: z.boolean().default(false),
});

export const UpdateAvailabilitySchema = CreateAvailabilitySchema.partial();

export const BulkAvailabilitySchema = z.object({
  availabilities: z.array(CreateAvailabilitySchema),
  replaceAll: z.boolean().default(false), // If true, replace all existing availability
});

export const AvailabilityListSchema = z.object({
  availabilities: z.array(AvailabilitySchema),
  total: z.number(),
});

export const WeeklyAvailabilitySchema = z.object({
  sunday: z.array(AvailabilitySchema),
  monday: z.array(AvailabilitySchema),
  tuesday: z.array(AvailabilitySchema),
  wednesday: z.array(AvailabilitySchema),
  thursday: z.array(AvailabilitySchema),
  friday: z.array(AvailabilitySchema),
  saturday: z.array(AvailabilitySchema),
});

export const AvailabilityFiltersSchema = z.object({
  day: z.number().int().min(0).max(6).optional(),
  professionalId: z.string().uuid().optional(), // For admin use
});

// Time slot schema for checking availability
export const TimeSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  duration: z.number().int().min(15).max(480), // 15 minutes to 8 hours
});

export const AvailableSlotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  available: z.boolean(),
  availabilityId: z.number(),
  capacity: z.number().optional(),
  bookedCount: z.number().optional(),
});

export const DailyAvailabilitySchema = z.object({
  date: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  availableSlots: z.array(AvailableSlotSchema),
  totalSlots: z.number(),
  availableCount: z.number(),
});

export type CreateAvailability = z.infer<typeof CreateAvailabilitySchema>;
export type UpdateAvailability = z.infer<typeof UpdateAvailabilitySchema>;
export type BulkAvailability = z.infer<typeof BulkAvailabilitySchema>;
export type AvailabilityList = z.infer<typeof AvailabilityListSchema>;
export type WeeklyAvailability = z.infer<typeof WeeklyAvailabilitySchema>;
export type AvailabilityFilters = z.infer<typeof AvailabilityFiltersSchema>;
export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type AvailableSlot = z.infer<typeof AvailableSlotSchema>;
export type DailyAvailability = z.infer<typeof DailyAvailabilitySchema>;

// For time conflict checking
export interface TimeSlotConflict {
  id: number;
  day: number;
  fromTime: string;
  toTime: string;
  professionalId: string;
}

// For bulk operations
export interface BulkAvailabilityResult {
  created: number;
  updated: number;
  deleted: number;
  errors: Array<{ index: number; error: string }>;
}
