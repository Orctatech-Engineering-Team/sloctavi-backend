import nodemailer from "nodemailer";

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
      to: payload.to,
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
