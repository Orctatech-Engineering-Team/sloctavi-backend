import {z} from "zod";

// health schema
// include message, info about db, about server etc
export const healthSchema = z.object({
    message: z.string(),
    database: z.object({
        status: z.string(),
    }),
    server: z.object({
        status: z.string(),
        uptime: z.number(),
    }),
    redis: z.object({
        status: z.string(),
    }),
})

export type HealthSchema = z.infer<typeof healthSchema>
