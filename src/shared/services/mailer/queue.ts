import { Queue } from "bullmq";
import IORedis from "ioredis";

import type { EmailJobPayload } from "./types";

export const connection = new IORedis({
  host: "localhost",
  port: 6379,
});

export const emailQueue = new Queue<EmailJobPayload>("emailQueue", {
  connection,
});
