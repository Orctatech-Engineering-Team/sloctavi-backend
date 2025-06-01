import { logError, logInfo } from "@/utils/logger";

import type { EmailJobPayload } from "./types";

import { emailQueue } from "./queue";

export class MailService {
  static async send(payload: EmailJobPayload) {
    try {
      await emailQueue.add("sendEmail", payload, {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      });
      logInfo(`📬 Queued email to ${payload.to}`, {
        subject: payload.subject,
        service: "MailService",
        method: "send",
      });
    }
    catch (err) {
      logError(err, "❌ Failed to queue email", {
        service: "MailService",
        method: "send",
        to: payload.to,
        subject: payload.subject,
      });
    }
  }
}
