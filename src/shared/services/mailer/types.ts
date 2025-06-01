import type { z } from "zod";

import type { EmailPayloadSchema } from "./schema";

export type EmailJobPayload = z.infer<typeof EmailPayloadSchema>;

export interface EmailSender {
  sendEmail: (payload: EmailJobPayload) => Promise<void>;
}
