import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { insertUsersSchema, selectUsersSchema } from "@/db/schema/schema";
import { unauthorizedSchema } from "@/lib/constants";

const tags = ["Auth"];

export const register = createRoute({
  path: "/auth/register",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      insertUsersSchema,
      "User registration data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectUsersSchema,
      "The registered user",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Validation error",
    ),
  },
});

export const login = createRoute({
  path: "/auth/login",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      "Login credentials",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        token: z.string(),
        user: selectUsersSchema,
        message: z.string(),
      }),
      "Login successful",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Invalid credentials",
    ),
  },
});

export const refreshToken = createRoute({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  responses: {
    [HttpStatusCodes.ACCEPTED]: jsonContent(
      z.object({
        token: z.string(),
        message: z.string(),
      }),
      "New access token",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, "Invalid or expired refresh token"),
  },
});

export const logout = createRoute({
  method: "get",
  path: "/auth/logout",
  tags: ["Auth"],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Logout successful",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, "Not authenticated"),
  },
});

export type RefreshRoute = typeof refreshToken;
export type LogoutRoute = typeof logout;
export type RegisterRoute = typeof register;
export type LoginRoute = typeof login;
