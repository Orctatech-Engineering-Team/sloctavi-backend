# Email Service - Resend Integration

This document explains how to use the Resend API as an alternative to Nodemailer in the Sloctavi backend.

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email Provider Selection (nodemailer or resend)
MAIL_PROVIDER=resend

# Resend API Configuration (required when MAIL_PROVIDER=resend)
RESEND_API_KEY=your_resend_api_key_here

# Sender Email (required for both providers)
SMTP_FROM=noreply@yourdomain.com
```

### Getting a Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to your dashboard
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your environment variables

## Usage

The email service automatically uses the provider specified in `MAIL_PROVIDER`. No code changes are required in your application - just use the existing `MailService` class:

```typescript
import { MailService } from "@/shared/services/mailer/MailService";

// This will use either Nodemailer or Resend based on MAIL_PROVIDER
await MailService.send({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our service!</h1>",
  text: "Welcome to our service!",
});

// Array of recipients is also supported
await MailService.send({
  to: ["user1@example.com", "user2@example.com"],
  subject: "Bulk Email",
  html: "<p>This is a bulk email</p>",
  cc: ["manager@example.com"],
  bcc: ["admin@example.com"],
});
```

## Provider Comparison

| Feature | Nodemailer | Resend |
|---------|------------|---------|
| Setup Complexity | Medium (SMTP config) | Easy (API key only) |
| Deliverability | Depends on SMTP provider | High (built-in) |
| API | Email transport | RESTful API |
| Rate Limits | Depends on SMTP provider | 100 emails/sec |
| Analytics | Limited | Built-in dashboard |

## Switching Providers

To switch between providers, simply change the `MAIL_PROVIDER` environment variable:

```env
# Use Nodemailer
MAIL_PROVIDER=nodemailer

# Use Resend
MAIL_PROVIDER=resend
```

Restart your application after changing the provider.

## Benefits of Resend

- **Better Deliverability**: Resend has built-in reputation management
- **Simpler Setup**: Only requires an API key
- **Modern API**: RESTful API with comprehensive documentation
- **Analytics**: Built-in email analytics and tracking
- **Rate Limiting**: Built-in rate limiting and retry logic

## Testing

Run the email service tests:

```bash
pnpm test src/shared/services/mailer/__tests__/sender.test.ts
```

## Troubleshooting

### Common Issues

1. **"RESEND_API_KEY is required" Error**
   - Make sure you've set the `RESEND_API_KEY` environment variable
   - Verify the API key is valid

2. **Emails not being sent**
   - Check your Resend dashboard for API usage and errors
   - Verify the sender email is authorized in your Resend account

3. **Provider not switching**
   - Restart the application after changing `MAIL_PROVIDER`
   - Check that environment variables are loaded correctly

### Support

- Resend Documentation: [https://resend.com/docs](https://resend.com/docs)
- Resend Status: [https://status.resend.com](https://status.resend.com)
