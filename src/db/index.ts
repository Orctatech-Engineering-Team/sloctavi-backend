import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import env from "@/env";

import * as authSchema from "./schema/auth";
import * as schema from "./schema/schema";

const client = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
});

const db = drizzle(client, {
  schema: {
    ...schema,
    ...authSchema,
  },
});

export default db;
