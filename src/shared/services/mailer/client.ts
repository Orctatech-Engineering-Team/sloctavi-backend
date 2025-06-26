// redis client for mailer
import {Redis} from "ioredis";

const client = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest:null
});

export default client;
