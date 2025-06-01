// common email templates

export const customCSS = `
<style>
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
  }
  p {
    margin: 0.5em 0;
  }
  strong {
    color: #000;
  }
    a {
        color: #1a73e8;
        text-decoration: none;
    }
    a:hover {
        text-decoration: underline;
    } 
</style>
`;

const defaultFooter = `
<p>Best regards,</p>
<p>The Sloctavi Team</p>
<p>&copy; ${new Date().getFullYear()} Sloctavi. All rights reserved.</p>
<p><a href="https://Sloctavi.com">Visit our website</a></p>
`;
export function otpVerificationTemplate(otpCode: string, username: string): string {
  return `
    ${customCSS}
    <p>Hi ${username},</p>
    <p>Your verification code is <strong>${otpCode}</strong></p>
    <p>Please use this code to complete your registration.</p>
    <p>Thank you!</p>
    ${defaultFooter}
  `;
}

export function passwordResetTemplate(username: string, resetLink: string): string {
  return `
        ${customCSS}
        <p>Hi ${username},</p>
        <p>We received a request to reset your password.</p>
        <p>Please click the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        ${defaultFooter}
    `;
}

export function welcomeTemplate(username: string): string {
  return `
        ${customCSS}
        <p>Hi ${username},</p>
        <p>Welcome to Sloctavi! We're excited to have you on board.</p>
        <p>Feel free to explore our features and let us know if you have any questions.</p>
        ${defaultFooter}
    `;
}
