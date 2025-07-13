import type { BookingNotificationData } from "../notification/index";
import type { EmailJobPayload } from "./types";

import {
  bookingCancelledTemplate,
  bookingCompletedTemplate,
  bookingConfirmationTemplate,
  bookingReminderTemplate,
  bookingStatusUpdateTemplate,
  newBookingRequestTemplate,
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

export function generateBookingNotificationEmail(
  template: string,
  email: string,
  name: string,
  data: BookingNotificationData,
): EmailJobPayload {
  const basePayload = {
    to: email,
  };

  switch (template) {
    case "new_booking_request":
      return {
        ...basePayload,
        subject: `New Booking Request - ${data.serviceName}`,
        html: newBookingRequestTemplate(name, data),
        text: `You have a new booking request from ${data.customerName} for ${data.serviceName} on ${data.date} at ${data.time}.`,
      };

    case "booking_confirmation":
      return {
        ...basePayload,
        subject: `Booking Request Submitted - ${data.serviceName}`,
        html: bookingConfirmationTemplate(name, data),
        text: `Your booking request for ${data.serviceName} on ${data.date} at ${data.time} has been submitted and is awaiting confirmation.`,
      };

    case "booking_confirmed":
      return {
        ...basePayload,
        subject: `Booking Confirmed - ${data.serviceName}`,
        html: bookingStatusUpdateTemplate(name, data, "confirmed"),
        text: `Great news! Your booking for ${data.serviceName} on ${data.date} at ${data.time} has been confirmed by ${data.professionalName}.`,
      };

    case "booking_cancelled":
      return {
        ...basePayload,
        subject: `Booking Cancelled - ${data.serviceName}`,
        html: bookingCancelledTemplate(name, data, "customer"),
        text: `Your booking for ${data.serviceName} on ${data.date} at ${data.time} has been cancelled.`,
      };

    case "booking_cancelled_by_customer":
      return {
        ...basePayload,
        subject: `Booking Cancelled by Customer - ${data.serviceName}`,
        html: bookingCancelledTemplate(name, data, "professional"),
        text: `${data.customerName} has cancelled their booking for ${data.serviceName} on ${data.date} at ${data.time}.`,
      };

    case "booking_cancelled_by_professional":
      return {
        ...basePayload,
        subject: `Booking Cancelled - ${data.serviceName}`,
        html: bookingCancelledTemplate(name, data, "customer"),
        text: `${data.professionalName} has cancelled your booking for ${data.serviceName} on ${data.date} at ${data.time}.`,
      };

    case "booking_completed":
      return {
        ...basePayload,
        subject: `Service Completed - ${data.serviceName}`,
        html: bookingCompletedTemplate(name, data),
        text: `Your booking for ${data.serviceName} with ${data.professionalName} has been completed. Thank you for using Sloctavi!`,
      };

    case "booking_reminder":
      return {
        ...basePayload,
        subject: `Booking Reminder - ${data.serviceName} Tomorrow`,
        html: bookingReminderTemplate(name, data, "customer"),
        text: `Reminder: You have a booking for ${data.serviceName} with ${data.professionalName} tomorrow at ${data.time}.`,
      };

    case "booking_reminder_professional":
      return {
        ...basePayload,
        subject: `Booking Reminder - ${data.serviceName} Tomorrow`,
        html: bookingReminderTemplate(name, data, "professional"),
        text: `Reminder: You have a booking with ${data.customerName} for ${data.serviceName} tomorrow at ${data.time}.`,
      };

    case "booking_updated":
    default:
      return {
        ...basePayload,
        subject: `Booking Updated - ${data.serviceName}`,
        html: bookingStatusUpdateTemplate(name, data, data.status),
        text: `Your booking for ${data.serviceName} on ${data.date} at ${data.time} has been updated. Status: ${data.status}.`,
      };
  }
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
