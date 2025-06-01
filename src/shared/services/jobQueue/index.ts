import type { Job } from "bullmq";

import { JobScheduler, Queue, Worker } from "bullmq";
import IORedis from "ioredis";

import type { EmailJobPayload } from "./types";

import { NodemailerSender } from "../email";

const connection = new IORedis({
  host: "localhost",
  port: 6379,
});

// Create job schedulers to handle retries, delays, etc.
const emailJobScheduler = new JobScheduler("emailQueue", { connection });

// Create queues
export const emailQueue = new Queue<EmailJobPayload>("emailQueue", { connection });

// Email worker to process email jobs
const emailWorker = new Worker<EmailJobPayload>(
  "emailQueue",
  async (job) => {
    const sender = new NodemailerSender();
    await sender.sendEmail(job.data);
  },
  { connection, limiter: {
    max: 100, // max 100 jobs
    duration: 1000 * 60, // per minute
  } },
);

export async function sendQueuedEmail(payload: EmailJobPayload) {
  await emailQueue.add("sendEmail", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}
