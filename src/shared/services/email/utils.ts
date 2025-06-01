import type { EmailPayload } from "./types";

import { otpVerificationTemplate } from "./templates";
// shared utility functions
export function generateVerificastionEmail(otpCode: string, username: string, email: string): EmailPayload {
  return {
    subject: "Verify your email for Sloctavi",
    html: otpVerificationTemplate(otpCode, "User"),
    text: `Your verification code is ${otpCode}`,
    to: email,
  };
}
