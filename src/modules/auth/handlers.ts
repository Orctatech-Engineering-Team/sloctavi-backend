import { getCookie, setCookie } from "hono/cookie";
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import env from "@/env";
import { AppError } from "@/utils/error";

import type { CheckVerificationStatusRoute, LoginRoute, LogoutRoute, RefreshRoute, RegisterRoute, ResendOTPRoute, VerifyEmailRoute, RequestPasswordResetRoute, ResetPasswordRoute } from "./routes";

import OTPService from "./otp";
import Auth from "./services";

export const register: AppRouteHandler<RegisterRoute> = async (c) => {
  const userData = c.req.valid("json");

  const user = await Auth.register(userData.email, userData.password, userData.type);
  if (!user) {
    throw new AppError("User registration failed", HttpStatusCodes.BAD_REQUEST);
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
    throw new AppError("Invalid credentials", HttpStatusCodes.UNAUTHORIZED);
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
    token: accessToken as string,
    user,
    message: "Login Successful",
  }, HttpStatusCodes.OK);
};

export const refresh: AppRouteHandler<RefreshRoute> = async (c) => {
  const token = getCookie(c, "refreshToken");

  if (!token) {
    throw new AppError("No refresh token", HttpStatusCodes.UNAUTHORIZED);
  }

  const existing = await Auth.getRefreshToken(token);
  if (!existing || existing.expiresAt < new Date()) {
    throw new AppError("Refresh token expired or invalid", HttpStatusCodes.UNAUTHORIZED);
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

  return c.json({ token: accessToken as string, message: "Token refreshed" });
};

export const logout: AppRouteHandler<LogoutRoute> = async (c) => {
  const token = getCookie(c, "refreshToken");
  if (token) {
    await Auth.deleteRefreshToken(token);
  }
  else {
    throw new AppError("Not authenticated", HttpStatusCodes.UNAUTHORIZED);
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
  const { otpCode, userId } = c.req.valid("json");

  const isValid = await OTPService.verifyOTP(userId, otpCode);

  if (!isValid) {
    throw new AppError("Invalid or expired OTP code", HttpStatusCodes.BAD_REQUEST);
  }

  return c.json({
    message: "Email verified successfully",
    verified: true,
  }, HttpStatusCodes.OK);
};

export const resendOTP: AppRouteHandler<ResendOTPRoute> = async (c) => {
  const { userId } = c.req.valid("json");

  await OTPService.resendOTP(userId);

  return c.json({
    message: "Verification code sent successfully",
  }, HttpStatusCodes.OK);
};

export const checkVerificationStatus: AppRouteHandler<CheckVerificationStatusRoute> = async (c) => {
  const userId = c.get("jwtPayload")?.userId as string;
  if (!userId) {
    throw new AppError("User not authenticated", HttpStatusCodes.UNAUTHORIZED);
  }

  const user = await Auth.getUser(userId);
  if (!user) {
    throw new AppError("User not found", HttpStatusCodes.NOT_FOUND);
  }

  const requiresVerification = !user.isVerified;

  return c.json({
    isVerified: !requiresVerification,
    requiresVerification,
  }, HttpStatusCodes.OK);
};

export const requestPasswordReset: AppRouteHandler<RequestPasswordResetRoute> = async (c) => {
  const { email } = c.req.valid("json");
  const logger = c.get("logger");

  const result = await Auth.createPasswordResetToken(email);
  
  if (!result) {
    // Don't reveal if email exists or not for security
    return c.json({
      message: "If an account with that email exists, you will receive password reset instructions.",
    }, HttpStatusCodes.OK);
  }

  const { passwordReset, user } = result;

  // Send password reset email
  try {
    const { generatePasswordResetEmail } = await import("@/shared/services/mailer/utils");
    const { ResendSender } = await import("@/shared/services/mailer/sender");
    
    // Use first name if available, otherwise fall back to "User"
    const userName = user.email.split("@")[0] || "User";
    
    // Pass the raw reset token to the email generator
    const emailPayload = generatePasswordResetEmail(userName, passwordReset.token, user.email);
    
    const resend = new ResendSender();
    await resend.sendEmail(emailPayload);

    logger.info(`Password reset email sent`, {
      service: "Auth",
      method: "requestPasswordReset",
      userId: user.id,
      email: user.email,
    });
  } catch (emailError) {
    logger.error({ err: emailError }, "Failed to send password reset email");
    // Even if email fails, don't expose this to user for security
  }

  return c.json({
    message: "If an account with that email exists, you will receive password reset instructions.",
  }, HttpStatusCodes.OK);
};

export const resetPassword: AppRouteHandler<ResetPasswordRoute> = async (c) => {
  const { token, newPassword } = c.req.valid("json");
  const logger = c.get("logger");

  const user = await Auth.resetPassword(token, newPassword);

  if (!user) {
    throw new AppError("Invalid or expired reset token", HttpStatusCodes.BAD_REQUEST);
  }

  logger.info(`Password reset successful`, {
    service: "Auth", 
    method: "resetPassword",
    userId: user.id,
  });

  return c.json({
    message: "Password has been reset successfully",
  }, HttpStatusCodes.OK);
};
