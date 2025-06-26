import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import env from "@/env";

import * as authSchema from "./schema/auth";
import * as schema from "./schema/schema";

const client = postgres(env.DATABASE_URL, {
  prepare: false,
});

const db = drizzle(client, {
  schema: {
    ...schema,
    ...authSchema,
  },
});

export default db;
