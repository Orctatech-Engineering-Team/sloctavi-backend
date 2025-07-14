import type { BookingNotificationData } from "../notification/index";
import { 
  renderPasswordResetTemplate, 
  renderOtpVerificationTemplate, 
  renderWelcomeTemplate 
} from "./template-loader";

// Keep existing templates for backward compatibility
export function otpVerificationTemplate(otpCode: string, username: string): string {
  // Use the new table-based template
  return renderOtpVerificationTemplate(username, otpCode);
}

export function passwordResetTemplate(username: string, resetLink: string): string {
  // Use the new template loader to generate the password reset email
  return renderPasswordResetTemplate(username, resetLink);
}

export function welcomeTemplate(username: string): string {
  // Use the new table-based template
  return renderWelcomeTemplate(username);
}
