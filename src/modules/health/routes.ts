import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { healthSchema } from "./schema";
import { unauthorizedSchema } from "@/lib/constants";

const tags = ["Health"]

export const health = createRoute({
    path:"/healthz",
    method:"get",
    tags,
    responses:{
        [HttpStatusCodes.OK]:jsonContent(
            healthSchema,
            "Health check successful"
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]:jsonContent(
            z.object({
                message:z.string()
            }),
            "Health check failed"
        ),
        [HttpStatusCodes.UNAUTHORIZED]:jsonContent(
            unauthorizedSchema,
            "Authentication required"
        ),
    },
    security:[{bearerAuth:[]}]
})

export type HealthRoute = typeof health