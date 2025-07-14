import { Worker } from "bullmq";

import { logError, logInfo } from "@/utils/logger";

import type { EmailJobPayload } from "./types";

import { createEmailSender } from "./sender";

import client from "./client";

let worker: Worker | null = null;

export async function startWorker() {
  if (worker) {
    logInfo("Worker already running", { service: "MailWorker", method: "startWorker" });
    return;
  }

  worker = new Worker<EmailJobPayload>(
    "emailQueue",
    async (job) => {
      try {
        const mailer = createEmailSender();
        await mailer.sendEmail(job.data);
        logInfo(`Email sent to ${job.data.to}`, {
          service: "MailWorker",
          method: "sendEmail",
          subject: job.data.subject,
          jobId: job.id,
        });
      }
      catch (err) {
        logError(err, `Failed to send email to ${job.data.to}`, {
          service: "MailWorker",
          method: "sendEmail",
          jobId: job.id,
          to: job.data.to,
          subject: job.data.subject,
        });
        throw err; // allow retry
      }
    },
    { 
      connection: client,
      concurrency: 10, // Process 10 jobs concurrently
      autorun: true // Automatically start processing jobs
    },
  );

  worker.on("failed", (job, err) => {
    logError(err, `Job failed after retries`, {
      service: "MailWorker",
      method: "jobFailed",
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on("completed", (job) => {
    logInfo(`Job completed`, {
      service: "MailWorker",
      method: "jobCompleted",
      jobId: job.id,
    });
  });

  logInfo("Worker started", { service: "MailWorker", method: "startWorker" });
}

export async function stopWorker() {
  if (!worker) {
    logInfo("Worker not running", { service: "MailWorker", method: "stopWorker" });
    return;
  }

  try {
    await worker.close();
    worker = null;
    logInfo("Worker stopped", { service: "MailWorker", method: "stopWorker" });
  } catch (err) {
    logError(err, "Failed to stop worker", { service: "MailWorker", method: "stopWorker" });
  }
}

// Start worker when module is loaded
startWorker().catch(err => {
  logError(err, "Failed to start worker", { service: "MailWorker", method: "moduleLoad" });
});