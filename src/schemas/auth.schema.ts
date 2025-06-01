import { z } from "zod";

export const authSchema = {
  register: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().trim(),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
  }),
} as const;

// Type inference for the schemas
export type RegisterSchema = typeof authSchema.register;
export type LoginSchema = typeof authSchema.login;
