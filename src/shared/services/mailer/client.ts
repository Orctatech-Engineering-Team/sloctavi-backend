// redis client for mailer
// import env from "@/env";
import Redis from "ioredis";

const client = new Redis({
  maxRetriesPerRequest: null,
});

export default client;
