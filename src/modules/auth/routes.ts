import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { insertUsersSchema, selectUsersSchema } from "@/db/schema/schema";
import { badRequestSchema, unauthorizedSchema } from "@/lib/constants";

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
      z.object({
        user: selectUsersSchema,
        message: z.string(),
        requiresVerification: z.boolean(),
      }),
      "User registered successfully",
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

export const verifyEmail = createRoute({
  path: "/auth/verify-email",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        userId: z.string().uuid(),
        otpCode: z.string().length(4, "OTP must be 4 digits"),
      }),
      "Email verification data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        verified: z.boolean(),
      }),
      "Email verified successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid or expired OTP",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "User not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Email verification failed",
    ),
  },
});

export const resendOTP = createRoute({
  path: "/auth/resend-otp",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        userId: z.string().uuid(),
      }),
      "User ID for OTP resend",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "OTP sent successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Email already verified or invalid request",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      z.object({ message: z.string() }),
      "Rate limit exceeded",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "User not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to resend OTP",
    ),
  },
});

export const checkVerificationStatus = createRoute({
  method: "get",
  path: "/auth/verification-status",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        isVerified: z.boolean(),
        requiresVerification: z.boolean(),
      }),
      "Verification status",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, "Authentication required"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to check verification status",
    ),
  },
});

export type VerifyEmailRoute = typeof verifyEmail;
export type ResendOTPRoute = typeof resendOTP;
export type CheckVerificationStatusRoute = typeof checkVerificationStatus;

export type RefreshRoute = typeof refreshToken;
export type LogoutRoute = typeof logout;
export type RegisterRoute = typeof register;
export type LoginRoute = typeof login;
