import { z } from "zod";

export const EmailPayloadSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
});
