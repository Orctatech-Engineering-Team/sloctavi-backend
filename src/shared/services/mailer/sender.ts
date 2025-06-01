import nodemailer from "nodemailer";

import env from "@/env";

import type { EmailJobPayload, EmailSender } from "./types";

export class NodemailerSender implements EmailSender {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: +env.SMTP_PORT!,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  async sendEmail(payload: EmailJobPayload) {
    await this.transporter.sendMail({
      from: `"Sloctavi" <${env.SMTP_FROM}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text ?? "Your email client does not support HTML.",
      html: payload.html,
      cc: payload.cc,
      bcc: payload.bcc,
    });
  }
}
