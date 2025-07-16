import type { EmailJobPayload } from "./types";

import {
  otpVerificationTemplate,
  passwordResetTemplate,
} from "./templates";

// Utility functions for OTP verification and password reset emails
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

export function generateBookingNotificationEmail(
  template: string,
  email: string,
  name: string,
  data: any
): EmailJobPayload {
  // Basic email template generation for booking notifications
  let subject: string;
  let content: string;

  switch (template) {
    case "new_booking_request":
      subject = "New Booking Request - Sloctavi";
      content = `Hello ${name}, you have received a new booking request for ${data.serviceName} on ${data.date} at ${data.time}.`;
      break;
    case "booking_confirmation":
      subject = "Booking Request Submitted - Sloctavi";
      content = `Hello ${name}, your booking request for ${data.serviceName} on ${data.date} at ${data.time} has been submitted.`;
      break;
    case "booking_confirmed":
      subject = "Booking Confirmed - Sloctavi";
      content = `Hello ${name}, your booking for ${data.serviceName} on ${data.date} at ${data.time} has been confirmed.`;
      break;
    case "booking_cancelled":
      subject = "Booking Cancelled - Sloctavi";
      content = `Hello ${name}, your booking for ${data.serviceName} on ${data.date} at ${data.time} has been cancelled.`;
      break;
    case "booking_completed":
      subject = "Booking Completed - Sloctavi";
      content = `Hello ${name}, your booking for ${data.serviceName} has been completed.`;
      break;
    case "booking_reminder":
      subject = "Booking Reminder - Sloctavi";
      content = `Hello ${name}, this is a reminder that you have a booking for ${data.serviceName} tomorrow at ${data.time}.`;
      break;
    default:
      subject = "Booking Update - Sloctavi";
      content = `Hello ${name}, there has been an update to your booking.`;
  }

  return {
    subject,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; margin: 0;">Sloctavi</h1>
        <p style="color: #7f8c8d; margin: 5px 0 0 0;">Professional Services Platform</p>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; color: #2c3e50; line-height: 1.6;">${content}</p>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center;">
        <p style="color: #95a5a6; font-size: 12px; margin: 0;">© 2024 Sloctavi. All rights reserved.</p>
      </div>
    </div>`,
    text: content,
    to: email,
  };
}
