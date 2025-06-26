import { Queue } from "bullmq";
import type { EmailJobPayload } from "./types";
import client from "./client";


export const emailQueue = new Queue<EmailJobPayload>("emailQueue", {
  connection: client,
});
