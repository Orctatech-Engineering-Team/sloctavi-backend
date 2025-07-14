# Email Templates Usage Guide

This document explains how to use the email templates in the Sloctavi backend.

## Overview

We use HTML table-based email templates for better compatibility across email clients. The templates are processed using a template loader that replaces variables with actual values.

## Available Templates

### 1. Password Reset Template

The password reset template is a professional HTML email with table-based layout.

**Function**: `passwordResetTemplate(username: string, resetLink: string): string`

**Usage**:

```typescript
import { passwordResetTemplate } from '../shared/services/mailer/templates';

// Generate password reset email HTML
const emailHTML = passwordResetTemplate('John Doe', 'https://sloctavi.com/reset?token=abc123');

// Use with your email service
await sendEmail({
  to: 'user@example.com',
  subject: 'Reset Your Password',
  html: emailHTML
});
```

### 2. OTP Verification Template

A clean template for email verification with highlighted OTP code.

**Function**: `otpVerificationTemplate(otpCode: string, username: string): string`

**Usage**:

```typescript
import { otpVerificationTemplate } from '../shared/services/mailer/templates';

const emailHTML = otpVerificationTemplate('123456', 'John Doe');
```

### 3. Welcome Template

A friendly welcome email with call-to-action button.

**Function**: `welcomeTemplate(username: string): string`

**Usage**:

```typescript
import { welcomeTemplate } from '../shared/services/mailer/templates';

const emailHTML = welcomeTemplate('John Doe');
```

## Template Loader (Advanced Usage)

For more control over template processing, you can use the template loader directly:

```typescript
import { renderPasswordResetTemplate, processTemplate, PASSWORD_RESET_TEMPLATE } from '../shared/services/email/template-loader';

// Use the built-in password reset renderer
const html1 = renderPasswordResetTemplate(
  'John Doe',
  'https://sloctavi.com/reset?token=abc123',
  'https://sloctavi.com/custom-logo.png'  // Optional custom logo
);

// Or process any template with custom variables
const html2 = processTemplate(PASSWORD_RESET_TEMPLATE, {
  username: 'John Doe',
  resetUrl: 'https://sloctavi.com/reset?token=abc123',
  logoUrl: 'https://sloctavi.com/logo.png'
});
```

## Creating New Templates

1. Add your HTML template as a constant in `template-loader.ts`
2. Create a processing function if needed
3. Add a wrapper function in `templates.ts` for backward compatibility
4. Export the function from `templates.ts`

## Template Variables

Templates use the `{{variableName}}` format for variables. Available variables:

**Password Reset Template:**
- `{{username}}` - User's name
- `{{resetUrl}}` - Password reset URL
- `{{logoUrl}}` - Company logo URL

**OTP Verification Template:**
- `{{username}}` - User's name
- `{{otpCode}}` - The verification code
- `{{logoUrl}}` - Company logo URL

**Welcome Template:**
- `{{username}}` - User's name
- `{{dashboardUrl}}` - Dashboard URL
- `{{logoUrl}}` - Company logo URL

## Email Client Compatibility

Our templates use:
- HTML tables for layout (not div/CSS grid)
- Inline styles where necessary
- Media queries for responsive design
- MSO-specific properties for Outlook compatibility

## Testing

Run the template test to verify everything works:

```bash
npx ts-node src/shared/services/email/test-template.ts
```

## Best Practices

1. Always test templates in multiple email clients
2. Use tables for layout, not divs
3. Include both HTML and text versions
4. Keep inline styles minimal but use them when needed
5. Test on mobile devices
6. Validate all variables are replaced before sending
