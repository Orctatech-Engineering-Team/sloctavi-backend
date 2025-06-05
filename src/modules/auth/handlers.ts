import { getCookie, setCookie } from "hono/cookie";
import { jwtVerify, SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import env from "@/env";
// import { AppError } from "@/utils/error";

import type { CheckVerificationStatusRoute, LoginRoute, LogoutRoute, RefreshRoute, RegisterRoute, ResendOTPRoute, VerifyEmailRoute } from "./routes";

import OTPService from "./otp";
import Auth from "./services";

export const register: AppRouteHandler<RegisterRoute> = async (c) => {
  const userData = c.req.valid("json");

  const user = await Auth.register(userData.email, userData.password, userData.type);
  if (!user) {
    return c.json({
      message: "User registration failed",
    }, HttpStatusCodes.BAD_REQUEST);
  }

  // Determine user name for OTP email
  const userName = "Cherished User";

  // Send OTP for email verification
  try {
    await OTPService.generateAndSendOTP(user.id, user.email, userName);
  }
  catch (otpError) {
    // Log the error but don't fail registration
    const logger = c.get("logger");
    logger.error({ err: otpError }, "Failed to send verification email during registration");
  }

  return c.json({
    user,
    message: "Registration successful. Please check your email for verification code.",
    requiresVerification: true,
  }, HttpStatusCodes.CREATED);
};

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await Auth.login(email, password);

  if (!user) {
    return c.json({
      message: "Invalid credentials",
    }, HttpStatusCodes.UNAUTHORIZED);
  }

  const accessToken = await new SignJWT(
    { userId: user.id },
  )
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(env.JWT_SECRET),
    );

  const refreshToken = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await Auth.storeRefreshToken(user.id, refreshToken, expiresAt);

  // Set the refresh token in a secure, HTTP-only cookie
  // Note: Ensure that the client is served over HTTPS in production
  // to use secure cookies properly.
  // Set CORS headers
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  c.header("Access-Control-Allow-Headers", "*");
  // c.header("Access-Control-Allow-Origin", env.CLIENT_ORIGIN_URL);

  setCookie(c, "refreshToken", refreshToken, {
    expires: new Date(new Date().setDate(new Date().getDate() + 7)),
    secure: true,
    sameSite: "None",
    httpOnly: true,
  });

  return c.json({
    token: accessToken,
    user,
    message: "Login Successful",
  }, HttpStatusCodes.OK);
};

export const refresh: AppRouteHandler<RefreshRoute> = async (c) => {
  const token = getCookie(c, "refreshToken");

  if (!token) {
    return c.json({ message: "No refresh token" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const existing = await Auth.getRefreshToken(token);
  if (!existing || existing.expiresAt < new Date()) {
    return c.json({ message: "Refresh token expired or invalid" }, HttpStatusCodes.UNAUTHORIZED);
  }

  // Optional: rotate token
  const newToken = randomUUID();
  const newExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await Auth.rotateToken(existing.token, newToken, newExpires);

  const accessToken = await new SignJWT(
    { userId: existing.userId },
  )
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(env.JWT_SECRET));

  setCookie(c, "refreshToken", newToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    expires: newExpires,
  });

  return c.json({ token: accessToken, message: "Token refreshed" });
};

export const logout: AppRouteHandler<LogoutRoute> = async (c) => {
  const token = getCookie(c, "refreshToken");
  if (token) {
    await Auth.deleteRefreshToken(token);
  }
  else {
    return c.json({ message: "Not authenticated" }, HttpStatusCodes.UNAUTHORIZED);
  }

  setCookie(c, "refreshToken", "", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    expires: new Date(0),
  });

  return c.json({ message: "Logged out" });
};

export const verifyEmail: AppRouteHandler<VerifyEmailRoute> = async (c) => {
  try {
    const { userId, otpCode } = c.req.valid("json");

    const isValid = await OTPService.verifyOTP(userId, otpCode);

    if (!isValid) {
      return c.json({
        message: "Invalid or expired OTP code",
        verified: false,
      }, HttpStatusCodes.BAD_REQUEST);
    }

    return c.json({
      message: "Email verified successfully",
      verified: true,
    }, HttpStatusCodes.OK);
  }
  catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Email verification failed");

    // if (error instanceof AppError) {
    //   return c.json({
    //     message: error.message,
    //     verified: false,
    //   }, error.statusCode);
    // }

    return c.json({
      message: "Email verification failed",
      verified: false,
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const resendOTP: AppRouteHandler<ResendOTPRoute> = async (c) => {
  try {
    const { userId } = c.req.valid("json");

    await OTPService.resendOTP(userId);

    return c.json({
      message: "Verification code sent successfully",
    }, HttpStatusCodes.OK);
  }
  catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to resend OTP");

    // if (error instanceof AppError) {
    //   return c.json({ message: error.message }, error.statusCode);
    // }

    return c.json({
      message: "Failed to send verification code",
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const checkVerificationStatus: AppRouteHandler<CheckVerificationStatusRoute> = async (c) => {
  try {
    const userId = c.get("jwtPayload")?.userId;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const requiresVerification = await OTPService.requiresVerification(userId);

    return c.json({
      isVerified: !requiresVerification,
      requiresVerification,
    }, HttpStatusCodes.OK);
  }
  catch (error) {
    const logger = c.get("logger");
    logger.error({ err: error }, "Failed to check verification status");

    return c.json({
      message: "Failed to check verification status",
      isVerified: false,
      requiresVerification: true,
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};
