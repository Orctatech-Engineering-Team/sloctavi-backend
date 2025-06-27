// src/services/db.ts
import db from '@/db'
import { sql } from "drizzle-orm";
import client from '@/shared/services/mailer/client';

export async function dbPing(): Promise<void> {
  try {
    // Simple SELECT 1 query using Drizzle
    await db.execute(sql`SELECT 1`) // or: await db.run(sql`SELECT 1`)
  } catch (error) {
    throw new Error('Database unreachable')
  }
}


export async function redisPing(): Promise<void> {
  const pong = await client.ping()
  if (pong !== 'PONG') {
    throw new Error('Redis not responding properly')
  }
}

