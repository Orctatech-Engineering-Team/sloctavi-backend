import { z } from "zod";

export const auth = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(3),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  logout: z.object({}),
  me: z.object({}),
};
