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

// Generate booking notification emails
export function generateBookingNotificationEmail(
  template: string,
  email: string,
  name: string,
  data: any
): EmailJobPayload {
  let subject = "";
  let html = "";
  let text = "";

  // Generate appropriate content based on template type
  switch (template) {
    case "new_booking_request":
      subject = "New Booking Request";
      html = `<h1>New Booking Request</h1><p>Hello ${name},</p><p>You have a new booking request for ${data.serviceName} on ${data.date} at ${data.time}.</p>`;
      text = `New booking request for ${data.serviceName} on ${data.date} at ${data.time}.`;
      break;
    case "booking_confirmation":
      subject = "Booking Confirmation";
      html = `<h1>Booking Confirmed</h1><p>Hello ${name},</p><p>Your booking for ${data.serviceName} on ${data.date} at ${data.time} has been confirmed.</p>`;
      text = `Your booking for ${data.serviceName} on ${data.date} at ${data.time} has been confirmed.`;
      break;
    case "booking_cancelled":
      subject = "Booking Cancelled";
      html = `<h1>Booking Cancelled</h1><p>Hello ${name},</p><p>Your booking for ${data.serviceName} on ${data.date} at ${data.time} has been cancelled.</p>`;
      text = `Your booking for ${data.serviceName} on ${data.date} at ${data.time} has been cancelled.`;
      break;
    default:
      subject = "Booking Notification";
      html = `<h1>Booking Update</h1><p>Hello ${name},</p><p>Your booking has been updated.</p>`;
      text = "Your booking has been updated.";
  }

  return {
    subject,
    html,
    text,
    to: email,
  };
}
