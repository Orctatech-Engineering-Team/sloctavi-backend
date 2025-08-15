// redis client for mailer
// import env from "@/env";
import env from "@/env";
import Redis from "ioredis";

const client = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Disable automatic retries
  retryStrategy: (times) => {
    // Custom retry strategy
    if (times > 5) {
      return null; // Stop retrying after 5 attempts
    }
    return Math.min(times * 1000, 30000); // Exponential backoff
  }
});

export default client;
