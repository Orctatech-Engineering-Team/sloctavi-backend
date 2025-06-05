import type { BookingNotificationData } from "../notification/index";

// Import existing CSS and footer
export const customCSS = `
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
    margin: 0;
    padding: 20px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 30px 20px;
    text-align: center;
    color: white;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
  .content {
    padding: 30px 20px;
  }
  .booking-card {
    background-color: #f8f9fa;
    border-left: 4px solid #667eea;
    padding: 20px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .booking-detail {
    margin: 8px 0;
  }
  .booking-detail strong {
    color: #495057;
    display: inline-block;
    min-width: 100px;
  }
  .status {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .status.confirmed { background-color: #d4edda; color: #155724; }
  .status.pending { background-color: #fff3cd; color: #856404; }
  .status.completed { background-color: #d1ecf1; color: #0c5460; }
  .status.cancelled { background-color: #f8d7da; color: #721c24; }
  .cta-button {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: 600;
    margin: 20px 0;
    text-align: center;
  }
  .cta-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  .footer {
    background-color: #f8f9fa;
    padding: 20px;
    text-align: center;
    color: #6c757d;
    font-size: 14px;
  }
  .footer a {
    color: #667eea;
    text-decoration: none;
  }
  .footer a:hover {
    text-decoration: underline;
  }
  p {
    margin: 16px 0;
  }
  .highlight {
    background-color: #fff3cd;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .emoji {
    font-size: 18px;
    margin-right: 8px;
  }
</style>
`;

const defaultFooter = `
<div class="footer">
  <p>Best regards,<br>The Sloctavi Team</p>
  <p>&copy; ${new Date().getFullYear()} Sloctavi. All rights reserved.</p>
  <p><a href="https://sloctavi.com">Visit our website</a> | <a href="https://sloctavi.com/support">Support</a></p>
</div>
`;

// New Booking Request Template (for professionals)
export function newBookingRequestTemplate(professionalName: string, data: BookingNotificationData): string {
  return `
    ${customCSS}
    <div class="container">
      <div class="header">
        <h1><span class="emoji">📅</span>New Booking Request</h1>
      </div>
      <div class="content">
        <p>Hi ${professionalName},</p>
        <p>You have received a new booking request! A customer would like to book your services.</p>
        
        <div class="booking-card">
          <h3 style="margin-top: 0; color: #495057;">Booking Details</h3>
          <div class="booking-detail"><strong>Customer:</strong> ${data.customerName}</div>
          <div class="booking-detail"><strong>Service:</strong> ${data.serviceName}</div>
          <div class="booking-detail"><strong>Date:</strong> ${new Date(data.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div class="booking-detail"><strong>Time:</strong> ${data.time}</div>
          <div class="booking-detail"><strong>Status:</strong> <span class="status pending">Pending</span></div>
          ${data.notes ? `<div class="booking-detail"><strong>Notes:</strong> ${data.notes}</div>` : ""}
        </div>
        
        <p>Please review this booking request and respond as soon as possible. Your prompt response helps provide excellent customer service!</p>
        
        <div style="text-align: center;">
          <a href="https://sloctavi.com/dashboard/bookings/${data.bookingId}" class="cta-button">
            View Booking Request
          </a>
        </div>
        
        <p><small>You can accept or decline this booking request through your dashboard.</small></p>
      </div>
      ${defaultFooter}
    </div>
  `;
}

// Booking Confirmation Template (for customers)
export function bookingConfirmationTemplate(customerName: string, data: BookingNotificationData): string {
  return `
    ${customCSS}
    <div class="container">
      <div class="header">
        <h1><span class="emoji">✅</span>Booking Request Submitted</h1>
      </div>
      <div class="content">
        <p>Hi ${customerName},</p>
        <p>Thank you for choosing Sloctavi! Your booking request has been successfully submitted and is now awaiting confirmation from the service provider.</p>
        
        <div class="booking-card">
          <h3 style="margin-top: 0; color: #495057;">Your Booking Details</h3>
          <div class="booking-detail"><strong>Professional:</strong> ${data.professionalName}</div>
          <div class="booking-detail"><strong>Service:</strong> ${data.serviceName}</div>
          <div class="booking-detail"><strong>Date:</strong> ${new Date(data.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div class="booking-detail"><strong>Time:</strong> ${data.time}</div>
          <div class="booking-detail"><strong>Status:</strong> <span class="status pending">Awaiting Confirmation</span></div>
          <div class="booking-detail"><strong>Booking ID:</strong> <span class="highlight">${data.bookingId}</span></div>
        </div>
        
        <p>We'll notify you as soon as ${data.professionalName} confirms your booking. This usually happens within 24 hours.</p>
        
        <div style="text-align: center;">
          <a href="https://sloctavi.com/bookings/${data.bookingId}" class="cta-button">
            Track Your Booking
          </a>
        </div>
        
        <p><small>If you need to make any changes or have questions, please contact us through your dashboard.</small></p>
      </div>
      ${defaultFooter}
    </div>
  `;
}

// Booking Status Update Template
export function bookingStatusUpdateTemplate(recipientName: string, data: BookingNotificationData, status: string): string {
  const statusEmoji = {
    confirmed: "🎉",
    completed: "✨",
    cancelled: "❌",
    pending: "⏳",
  }[status.toLowerCase()] || "📋";

  const statusMessage = {
    confirmed: "Great news! Your booking has been confirmed.",
    completed: "Your service has been completed successfully.",
    cancelled: "Your booking has been cancelled.",
    pending: "Your booking is pending confirmation.",
  }[status.toLowerCase()] || `Your booking status has been updated to ${status}.`;

  return `
    ${customCSS}
    <div class="container">
      <div class="header">
        <h1><span class="emoji">${statusEmoji}</span>Booking Update</h1>
      </div>
      <div class="content">
        <p>Hi ${recipientName},</p>
        <p>${statusMessage}</p>
        
        <div class="booking-card">
          <h3 style="margin-top: 0; color: #495057;">Booking Details</h3>
          <div class="booking-detail"><strong>Service:</strong> ${data.serviceName}</div>
          <div class="booking-detail"><strong>Professional:</strong> ${data.professionalName}</div>
          <div class="booking-detail"><strong>Date:</strong> ${new Date(data.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div class="booking-detail"><strong>Time:</strong> ${data.time}</div>
          <div class="booking-detail"><strong>Status:</strong> <span class="status ${status.toLowerCase()}">${status}</span></div>
        </div>
        
        ${status.toLowerCase() === "confirmed"
          ? `
          <p>Your booking is now confirmed! Please make sure to be available at the scheduled time.</p>
          <p><strong>What's next?</strong></p>
          <ul>
            <li>You'll receive a reminder notification 24 hours before your appointment</li>
            <li>Make sure to have any necessary preparations ready</li>
            <li>Contact ${data.professionalName} if you have any questions</li>
          </ul>
        `
          : ""}
        
        ${status.toLowerCase() === "completed"
          ? `
          <p>Thank you for using Sloctavi! We hope you had a great experience.</p>
          <p>We'd love to hear about your experience. Please consider leaving a review to help other customers and support our service providers.</p>
          <div style="text-align: center;">
            <a href="https://sloctavi.com/bookings/${data.bookingId}/review" class="cta-button">
              Leave a Review
            </a>
          </div>
        `
          : ""}
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://sloctavi.com/bookings/${data.bookingId}" class="cta-button">
            View Booking Details
          </a>
        </div>
      </div>
      ${defaultFooter}
    </div>
  `;
}

// Booking Cancelled Template
export function bookingCancelledTemplate(recipientName: string, data: BookingNotificationData, recipientType: "customer" | "professional"): string {
  const message = recipientType === "customer"
    ? `Your booking for ${data.serviceName} on ${new Date(data.date).toLocaleDateString()} has been cancelled.`
    : `${data.customerName} has cancelled their booking for ${data.serviceName} on ${new Date(data.date).toLocaleDateString()}.`;

  return `
    ${customCSS}
    <div class="container">
      <div class="header">
        <h1><span class="emoji">❌</span>Booking Cancelled</h1>
      </div>
      <div class="content">
        <p>Hi ${recipientName},</p>
        <p>${message}</p>
        
        <div class="booking-card">
          <h3 style="margin-top: 0; color: #495057;">Cancelled Booking Details</h3>
          <div class="booking-detail"><strong>${recipientType === "customer" ? "Professional" : "Customer"}:</strong> ${recipientType === "customer" ? data.professionalName : data.customerName}</div>
          <div class="booking-detail"><strong>Service:</strong> ${data.serviceName}</div>
          <div class="booking-detail"><strong>Date:</strong> ${new Date(data.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div class="booking-detail"><strong>Time:</strong> ${data.time}</div>
          <div class="booking-detail"><strong>Status:</strong> <span class="status cancelled">Cancelled</span></div>
          ${data.notes ? `<div class="booking-detail"><strong>Reason:</strong> ${data.notes}</div>` : ""}
        </div>
        
        ${recipientType === "customer"
          ? `
          <p>We apologize for any inconvenience. You can easily find and book another service provider on our platform.</p>
          <div style="text-align: center;">
            <a href="https://sloctavi.com/search" class="cta-button">
              Find Another Provider
            </a>
          </div>
        `
          : `
          <p>The time slot is now available for new bookings. You can update your availability through your dashboard if needed.</p>
          <div style="text-align: center;">
            <a href="https://sloctavi.com/dashboard/bookings" class="cta-button">
              View Your Bookings
            </a>
          </div>
        `}
        
        <p><small>If you have any questions or concerns, please don't hesitate to contact our support team.</small></p>
      </div>
      ${defaultFooter}
    </div>
  `;
}

// Booking Reminder Template
export function bookingReminderTemplate(recipientName: string, data: BookingNotificationData, recipientType: "customer" | "professional"): string {
  const message = recipientType === "customer"
    ? `This is a friendly reminder that you have a booking for ${data.serviceName} with ${data.professionalName} tomorrow.`
    : `This is a reminder that you have a booking with ${data.customerName} for ${data.serviceName} tomorrow.`;

  return `
    ${customCSS}
    <div class="container">
      <div class="header">
        <h1><span class="emoji">⏰</span>Booking Reminder</h1>
      </div>
      <div class="content">
        <p>Hi ${recipientName},</p>
        <p>${message}</p>
        
        <div class="booking-card">
          <h3 style="margin-top: 0; color: #495057;">Tomorrow's Appointment</h3>
          <div class="booking-detail"><strong>${recipientType === "customer" ? "Professional" : "Customer"}:</strong> ${recipientType === "customer" ? data.professionalName : data.customerName}</div>
          <div class="booking-detail"><strong>Service:</strong> ${data.serviceName}</div>
          <div class="booking-detail"><strong>Date:</strong> ${new Date(data.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div class="booking-detail"><strong>Time:</strong> ${data.time}</div>
          <div class="booking-detail"><strong>Status:</strong> <span class="status confirmed">Confirmed</span></div>
        </div>
        
        ${recipientType === "customer"
          ? `
          <p><strong>Preparation reminders:</strong></p>
          <ul>
            <li>Please arrive on time for your appointment</li>
            <li>Have any required materials or information ready</li>
            <li>Contact ${data.professionalName} if you need to make any changes</li>
          </ul>
        `
          : `
          <p><strong>Professional reminders:</strong></p>
          <ul>
            <li>Prepare any necessary tools or materials for the service</li>
            <li>Review any special instructions or customer notes</li>
            <li>Contact ${data.customerName} if you need to confirm any details</li>
          </ul>
        `}
        
        <div style="text-align: center;">
          <a href="https://sloctavi.com/bookings/${data.bookingId}" class="cta-button">
            View Booking Details
          </a>
        </div>
        
        <p><small>Need to make changes? Please contact ${recipientType === "customer" ? "your service provider" : "your customer"} or our support team as soon as possible.</small></p>
      </div>
      ${defaultFooter}
    </div>
  `;
}

// Booking Completed Template
export function bookingCompletedTemplate(customerName: string, data: BookingNotificationData): string {
  return `
    ${customCSS}
    <div class="container">
      <div class="header">
        <h1><span class="emoji">✨</span>Service Completed</h1>
      </div>
      <div class="content">
        <p>Hi ${customerName},</p>
        <p>Great news! Your booking for ${data.serviceName} with ${data.professionalName} has been completed successfully.</p>
        
        <div class="booking-card">
          <h3 style="margin-top: 0; color: #495057;">Completed Service</h3>
          <div class="booking-detail"><strong>Professional:</strong> ${data.professionalName}</div>
          <div class="booking-detail"><strong>Service:</strong> ${data.serviceName}</div>
          <div class="booking-detail"><strong>Date:</strong> ${new Date(data.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div class="booking-detail"><strong>Time:</strong> ${data.time}</div>
          <div class="booking-detail"><strong>Status:</strong> <span class="status completed">Completed</span></div>
        </div>
        
        <p>We hope you had an excellent experience! Your feedback is valuable to us and helps other customers make informed decisions.</p>
        
        <div style="text-align: center;">
          <a href="https://sloctavi.com/bookings/${data.bookingId}/review" class="cta-button">
            Leave a Review
          </a>
        </div>
        
        <p><strong>What's next?</strong></p>
        <ul>
          <li>Share your experience by leaving a review</li>
          <li>Book ${data.professionalName} again if you were satisfied</li>
          <li>Explore other services on our platform</li>
          <li>Refer friends and family to Sloctavi</li>
        </ul>
        
        <p>Thank you for choosing Sloctavi. We look forward to serving you again!</p>
      </div>
      ${defaultFooter}
    </div>
  `;
}

// Keep existing templates for backward compatibility
export function otpVerificationTemplate(otpCode: string, username: string): string {
  return `
    ${customCSS}
    <div class="container">
      <div class="header">
        <h1><span class="emoji">🔐</span>Email Verification</h1>
      </div>
      <div class="content">
        <p>Hi ${username},</p>
        <p>Your verification code is <strong style="font-size: 24px; color: #667eea;">${otpCode}</strong></p>
        <p>Please use this code to complete your registration.</p>
        <p>This code will expire in 10 minutes for security purposes.</p>
        <p>Thank you for joining Sloctavi!</p>
      </div>
      ${defaultFooter}
    </div>
  `;
}

export function passwordResetTemplate(username: string, resetLink: string): string {
  return `
    ${customCSS}
    <div class="container">
      <div class="header">
        <h1><span class="emoji">🔑</span>Password Reset</h1>
      </div>
      <div class="content">
        <p>Hi ${username},</p>
        <p>We received a request to reset your password for your Sloctavi account.</p>
        <div style="text-align: center;">
          <a href="${resetLink}" class="cta-button">Reset Your Password</a>
        </div>
        <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <p><small>This link will expire in 1 hour for security purposes.</small></p>
      </div>
      ${defaultFooter}
    </div>
  `;
}

export function welcomeTemplate(username: string): string {
  return `
    ${customCSS}
    <div class="container">
      <div class="header">
        <h1><span class="emoji">🎉</span>Welcome to Sloctavi!</h1>
      </div>
      <div class="content">
        <p>Hi ${username},</p>
        <p>Welcome to Sloctavi! We're excited to have you on board.</p>
        <p>Our platform connects you with skilled professionals for all your service needs. Whether you're looking to book a service or provide one, we're here to make the process smooth and reliable.</p>
        <div style="text-align: center;">
          <a href="https://sloctavi.com/dashboard" class="cta-button">Explore Your Dashboard</a>
        </div>
        <p>Feel free to explore our features and let us know if you have any questions. Our support team is always ready to help!</p>
      </div>
      ${defaultFooter}
    </div>
  `;
}
