// redis client for mailer
import env from "@/env";
import Redis from "ioredis";

const client = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export default client;
