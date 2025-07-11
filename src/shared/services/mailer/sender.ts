import nodemailer from "nodemailer";
import { Resend } from "resend";

import env from "@/env";
import { logger } from "@/utils/logger";

import type { EmailJobPayload, EmailSender } from "./types";

export class NodemailerSender implements EmailSender {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: +env.SMTP_PORT!,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  async sendEmail(payload: EmailJobPayload) {
    const res = await this.transporter.sendMail({
      from: `"Sloctavi" <${env.SMTP_FROM}>`,
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      text: payload.text ?? "Your email client does not support HTML.",
      html: payload.html,
      cc: payload.cc,
      bcc: payload.bcc,
    });
    if (res.rejected.length > 0) {
      logger.error("Email sending failed", {
        to: payload.to,
        subject: payload.subject,
        error: res.rejected,
      });
    }
    else {
      logger.info("Email sent successfully", {
        to: payload.to,
        subject: payload.subject,
      });
    }
  }
}

export class ResendSender implements EmailSender {
  private resend: Resend;

  constructor() {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is required when using Resend as mail provider");
    }
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendEmail(payload: EmailJobPayload) {
    try {
      // Prepare the email options for Resend
      const emailOptions: any = {
        from: `Sloctavi <${env.SMTP_FROM}>`,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
      };

      // Add content - prefer HTML over text
      if (payload.html) {
        emailOptions.html = payload.html;
      } else if (payload.text) {
        emailOptions.text = payload.text;
      } else {
        emailOptions.text = "Your email client does not support HTML.";
      }

      // Add optional fields
      if (payload.cc) {
        emailOptions.cc = payload.cc;
      }
      if (payload.bcc) {
        emailOptions.bcc = payload.bcc;
      }

      const { data, error } = await this.resend.emails.send(emailOptions);

      if (error) {
        logger.error("Email sending failed with Resend", {
          to: payload.to,
          subject: payload.subject,
          error: error.message,
        });
        throw new Error(`Resend error: ${error.message}`);
      }

      logger.info("Email sent successfully with Resend", {
        to: payload.to,
        subject: payload.subject,
        emailId: data?.id,
      });
    }
    catch (error) {
      logger.error("Email sending failed with Resend", {
        to: payload.to,
        subject: payload.subject,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

/**
 * Factory function to create the appropriate email sender based on environment configuration
 */
export function createEmailSender(): EmailSender {
  const provider = env.MAIL_PROVIDER || "nodemailer";
  
  switch (provider) {
    case "resend":
      return new ResendSender();
    case "nodemailer":
    default:
      return new NodemailerSender();
  }
}
