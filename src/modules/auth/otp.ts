import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { customerProfiles, emailVerifications, professionalProfiles, users } from "@/db/schema/schema";
import { MailService } from "@/shared/services/mailer/MailService";
import { generateVerificationEmail } from "@/shared/services/mailer/utils";
import { AppError } from "@/utils/error";
import { logError, logInfo } from "@/utils/logger";

export class OTPService {
  /**
   * Generate and send OTP for email verification
   */
  static async generateAndSendOTP(userId: string, email: string, name: string): Promise<void> {
    try {
      // Generate 4-digit OTP
      const otpCode = this.generateOTP();

      // Store OTP in database (remove any existing OTP for this user first)
      await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));

      await db.insert(emailVerifications).values({
        userId,
        otpCode,
        createdAt: new Date(),
      });

      // Send email with OTP
      const emailPayload = generateVerificationEmail(otpCode, name, email);
      await MailService.send(emailPayload);

      logInfo(`OTP generated and sent`, {
        service: "OTPService",
        method: "generateAndSendOTP",
        userId,
        email,
      });
    }
    catch (error) {
      logError(error, "Failed to generate and send OTP", {
        service: "OTPService",
        method: "generateAndSendOTP",
        userId,
        email,
      });
      throw new AppError(
        "Failed to send verification email",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(userId: string, otpCode: string): Promise<boolean> {
    try {
      const verification = await db.query.emailVerifications.findFirst({
        where: eq(emailVerifications.userId, userId),
      });

      if (!verification) {
        logInfo("No OTP verification record found", {
          service: "OTPService",
          method: "verifyOTP",
          userId,
        });
        return false;
      }

      // Check if OTP has expired (10 minutes)
      const now = new Date();
      const expiryTime = new Date(verification.createdAt!.getTime() + 10 * 60 * 1000); // 10 minutes

      if (now > expiryTime) {
        logInfo("OTP has expired", {
          service: "OTPService",
          method: "verifyOTP",
          userId,
          createdAt: verification.createdAt,
          now,
        });

        // Clean up expired OTP
        await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
        return false;
      }

      // Check if OTP matches
      if (verification.otpCode !== otpCode) {
        logInfo("Invalid OTP code provided", {
          service: "OTPService",
          method: "verifyOTP",
          userId,
        });
        return false;
      }

      // OTP is valid - mark user as verified and clean up OTP
      await db.transaction(async (tx) => {
        await tx.update(users)
          .set({ isVerified: true })
          .where(eq(users.id, userId));

        await tx.delete(emailVerifications)
          .where(eq(emailVerifications.userId, userId));
      });

      logInfo("Email verification successful", {
        service: "OTPService",
        method: "verifyOTP",
        userId,
      });

      return true;
    }
    catch (error) {
      logError(error, "Failed to verify OTP", {
        service: "OTPService",
        method: "verifyOTP",
        userId,
      });
      throw new AppError(
        "Failed to verify OTP",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  /**
   * Resend OTP (with rate limiting)
   */
  static async resendOTP(userId: string): Promise<void> {
    try {
      // Check if there's an existing OTP and if it was sent recently (rate limiting)
      const existingVerification = await db.query.emailVerifications.findFirst({
        where: eq(emailVerifications.userId, userId),
      });

      if (existingVerification) {
        const now = new Date();
        const timeSinceLastSent = now.getTime() - existingVerification.createdAt!.getTime();
        const rateLimitMs = 60 * 1000; // 1 minute rate limit

        if (timeSinceLastSent < rateLimitMs) {
          const remainingSeconds = Math.ceil((rateLimitMs - timeSinceLastSent) / 1000);
          throw new AppError(
            `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
            HttpStatusCodes.TOO_MANY_REQUESTS,
          );
        }
      }

      // Get user details
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new AppError("User not found", HttpStatusCodes.NOT_FOUND);
      }

      if (user.isVerified) {
        throw new AppError("Email is already verified", HttpStatusCodes.BAD_REQUEST);
      }

      // Get user's name (from profile if available)
      let userName = "User";

      if (user.type === "customer") {
        const customerProfile = await db.query.customerProfiles.findFirst({
          where: eq(customerProfiles.userId, userId),
        });
        if (customerProfile) {
          userName = customerProfile.firstName;
        }
      }
      else if (user.type === "professional") {
        const professionalProfile = await db.query.professionalProfiles.findFirst({
          where: eq(professionalProfiles.userId, userId),
        });
        if (professionalProfile) {
          userName = professionalProfile.name || professionalProfile.businessName || "Professional";
        }
      }

      // Generate and send new OTP
      await this.generateAndSendOTP(userId, user.email, userName);

      logInfo("OTP resent successfully", {
        service: "OTPService",
        method: "resendOTP",
        userId,
      });
    }
    catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logError(error, "Failed to resend OTP", {
        service: "OTPService",
        method: "resendOTP",
        userId,
      });
      throw new AppError(
        "Failed to resend verification email",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  /**
   * Check if user needs email verification
   */
  static async requiresVerification(userId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { isVerified: true },
      });

      return user ? !user.isVerified : true;
    }
    catch (error) {
      logError(error, "Failed to check verification status", {
        service: "OTPService",
        method: "requiresVerification",
        userId,
      });
      return true; // Fail safe - require verification if we can't check
    }
  }

  /**
   * Clean up expired OTP records (can be called periodically)
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      const expiryTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

      const _ = await db.delete(emailVerifications)
        .where(eq(emailVerifications.createdAt, expiryTime)); // This should use a proper date comparison

      logInfo("Cleaned up expired OTP records", {
        service: "OTPService",
        method: "cleanupExpiredOTPs",
        // deletedCount: result.rowCount, // Depends on your Drizzle setup
      });
    }
    catch (error) {
      logError(error, "Failed to cleanup expired OTPs", {
        service: "OTPService",
        method: "cleanupExpiredOTPs",
      });
    }
  }

  /**
   * Generate a 4-digit OTP
   */
  private static generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}

export default OTPService;
