import { Worker } from "bullmq";

import { logError, logInfo } from "@/utils/logger";

import type { EmailJobPayload } from "./types";

import { connection } from "./queue";
import { NodemailerSender } from "./sender";

const worker = new Worker<EmailJobPayload>(
  "emailQueue",
  async (job) => {
    try {
      const mailer = new NodemailerSender();
      await mailer.sendEmail(job.data);
      logInfo(`✅ Email sent to ${job.data.to}`, {
        service: "MailWorker",
        method: "sendEmail",
        subject: job.data.subject,
        jobId: job.id,
      });
    }
    catch (err) {
      logError(err, `❌ Failed to send email to ${job.data.to}`, {
        service: "MailWorker",
        method: "sendEmail",
        jobId: job.id,
        to: job.data.to,
        subject: job.data.subject,
      });
      throw err; // allow retry
    }
  },
  { connection },
);

worker.on("failed", (job, err) => {
  logError(err, `❌ Job failed after retries`, {
    service: "MailWorker",
    method: "jobFailed",
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
  });
});

worker.on("completed", (job) => {
  logInfo(`🎉 Job completed`, {
    service: "MailWorker",
    method: "jobCompleted",
    jobId: job.id,
  });
});
