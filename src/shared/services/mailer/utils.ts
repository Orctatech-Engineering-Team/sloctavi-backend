import type { EmailJobPayload } from "./types";

import {
  otpVerificationTemplate,
  passwordResetTemplate,
} from "./templates";

// Enhanced utility functions for booking-related emails
export function generateVerificationEmail(otpCode: string, username: string, email: string): EmailJobPayload {
  return {
    subject: "Verify your email for Sloctavi",
    html: otpVerificationTemplate(otpCode, username),
    text: `Your verification code is ${otpCode}`,
    to: email,
  };
}


// Keep the existing function for backward compatibility
export function generateVerificastionEmail(otpCode: string, username: string, email: string): EmailJobPayload {
  return generateVerificationEmail(otpCode, username, email);
}

export function generatePasswordResetEmail(username: string, resetToken: string, email: string): EmailJobPayload {
  const resetLink = `${process.env.FRONTEND_URL || 'https://sloctavi.com'}/auth/reset-password?token=${resetToken}`;
  
  return {
    subject: "Reset Your Sloctavi Password",
    html: passwordResetTemplate(username, resetLink),
    text: `Click the following link to reset your password: ${resetLink}. This link will expire in 1 hour.`,
    to: email,
  };
}
