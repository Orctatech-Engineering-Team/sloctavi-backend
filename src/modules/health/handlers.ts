import { AppRouteHandler } from "@/lib/types";
import { HealthRoute } from "./routes";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { dbPing } from "@/shared/lib";
import { redisPing } from "@/shared/lib";

export const healthHandler: AppRouteHandler<HealthRoute> = async(c) => {
    const results: Record<string, string> = {}

    const uptime = process.uptime()
    const timestamp = new Date().toISOString()
  
    // DB Check
    try {
      await dbPing()
      results.database = 'ok'
    } catch (e) {
      results.database = 'fail'
    }
  
    // Redis Check
    try {
      await redisPing()
      results.redis = 'ok'
    } catch (e) {
      results.redis = 'fail'
    }
  
    const allHealthy = Object.values(results).every((v) => v === 'ok')
   return c.json({
    message:"Health check successful",
    database:{
        status:results.database,
    },
    server:{
        status:allHealthy ? "ok" : "fail",
        uptime,
        timestamp,
    },
    redis:{
        status:results.redis,
    }
   },HttpStatusCodes.OK)
}
