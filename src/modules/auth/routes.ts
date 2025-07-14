import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { insertUsersSchema, selectUsersSchema } from "@/db/schema/schema";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Auth"];

export const register = createRoute({
  path: "/auth/register",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      insertUsersSchema.refine((data) => data.type === "customer" || data.type === "professional", {
        message: "Invalid user type",
        path: ["type"]
      }).refine((data) => z.string().email().safeParse(data.email).success, {
        message: "Email is required",
        path: ["email"]
      }).refine((data) => data.password.length >= 8, {
        message: "Password must be at least 8 characters long",
        path: ["password"]
      }).refine((data) => data.password.length > 0, {
        message: "Password is required",
        path: ["password"]
      }),
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
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Unprocessable entity",
    ),
  }
});

export const login = createRoute({
  path: "/auth/login",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        email: z.string().email().min(7, "Email is required"),
        password: z.string().min(8, "Password is required"),
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
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Bad request, check your input",
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
        token: z.string(), // token here is the new access token
        message: z.string(),
      }),
      "New access token",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, "Invalid or expired refresh token"),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request, check your input",
    ),
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
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Bad request, check your input",
    ),
  },
});

export const verifyEmail = createRoute({
  path: "/auth/verify-email",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
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
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Email already verified",
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
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string()
      }),
      "Error"
    )
  },
});

export const requestPasswordReset = createRoute({
  path: "/auth/password-reset/request",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        email: z.string().email(),
      }),
      "Email for password reset request",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Password reset email sent",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid email format",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Email not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      z.object({ message: z.string() }),
      "Rate limit exceeded",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to send password reset email",
    ),
  },
});

export const resetPassword = createRoute({
  path: "/auth/password-reset/confirm",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }),
      "Password reset confirmation data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Password reset successful",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid or expired reset token",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Reset token not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Failed to reset password",
    ),
  },
});

export type VerifyEmailRoute = typeof verifyEmail;
export type ResendOTPRoute = typeof resendOTP;
export type CheckVerificationStatusRoute = typeof checkVerificationStatus;
export type RequestPasswordResetRoute = typeof requestPasswordReset;
export type ResetPasswordRoute = typeof resetPassword;

export type RefreshRoute = typeof refreshToken;
export type LogoutRoute = typeof logout;
export type RegisterRoute = typeof register;
export type LoginRoute = typeof login;
