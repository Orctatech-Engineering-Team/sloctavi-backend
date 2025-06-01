import type { z } from "zod";

import type { EmailPayloadSchema } from "./schema";

export type EmailPayload = z.infer<typeof EmailPayloadSchema>;

export interface EmailSender {
  sendEmail: (payload: EmailPayload) => Promise<void>;
}
