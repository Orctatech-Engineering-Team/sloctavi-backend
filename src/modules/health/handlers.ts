import { AppRouteHandler } from "@/lib/types";
import { HealthRoute } from "./routes";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { dbPing } from "@/shared/lib";
import { redisPing } from "@/shared/lib";
import { wsHealthCheck } from "@/shared/services/notification/websocket";

export const healthHandler: AppRouteHandler<HealthRoute> = async(c) => {
    const results: Record<string, string> = {}

    const uptime = process.uptime()
    const timestamp = new Date().toISOString()
  
    // DB Check
    try {
      await dbPing()
      results.database = 'ok'
    } catch (e) {
      // Log the error but don't fail the health check
      const logger = c.get("logger");
      logger.error({ err: e }, "Database health check failed");
      results.database = 'fail'
    }
  
    // Redis Check
    try {
      await redisPing()
      results.redis = 'ok'
    } catch (e) {
      // Log the error but don't fail the health check
      const logger = c.get("logger");
      logger.error({ err: e }, "Redis health check failed");
      results.redis = 'fail'
    }

    // WebSocket Check
    try {
      const wsHealth = await wsHealthCheck()
      results.websocket = wsHealth.healthy ? 'ok' : 'fail'
    } catch (e) {
      // Log the error but don't fail the health check
      const logger = c.get("logger");
      logger.error({ err: e }, "WebSocket health check failed");
      results.websocket = 'fail'
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
    },
    websocket:{
        status:results.websocket,
    }
   },HttpStatusCodes.OK)
}
