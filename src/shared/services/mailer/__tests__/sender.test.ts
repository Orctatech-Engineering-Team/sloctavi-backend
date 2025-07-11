import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NodemailerSender, ResendSender, createEmailSender } from "../sender";
import type { EmailJobPayload } from "../types";

// Mock nodemailer
const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

// Mock Resend
const mockResendSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
}));

// Mock environment variables
vi.mock("@/env", () => ({
  default: {
    SMTP_HOST: "smtp.test.com",
    SMTP_PORT: 587,
    SMTP_USER: "test@test.com",
    SMTP_PASSWORD: "password",
    SMTP_FROM: "noreply@test.com",
    MAIL_PROVIDER: "nodemailer",
    RESEND_API_KEY: "re_test_key",
  },
}));

// Mock logger
vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("NodemailerSender", () => {
  let sender: NodemailerSender;

  beforeEach(() => {
    vi.clearAllMocks();
    sender = new NodemailerSender();
  });

  it("should send email successfully", async () => {
    const payload: EmailJobPayload = {
      to: "recipient@test.com",
      subject: "Test Subject",
      html: "<h1>Test</h1>",
      text: "Test",
    };

    mockSendMail.mockResolvedValue({
      rejected: [],
      messageId: "test-id",
    });

    await sender.sendEmail(payload);

    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"Sloctavi" <noreply@test.com>',
      to: "recipient@test.com",
      subject: "Test Subject",
      text: "Test",
      html: "<h1>Test</h1>",
      cc: undefined,
      bcc: undefined,
    });
  });

  it("should handle email sending failure", async () => {
    const payload: EmailJobPayload = {
      to: "recipient@test.com",
      subject: "Test Subject",
      html: "<h1>Test</h1>",
    };

    mockSendMail.mockResolvedValue({
      rejected: ["recipient@test.com"],
    });

    await sender.sendEmail(payload);

    expect(mockSendMail).toHaveBeenCalled();
  });

  it("should handle array of recipients", async () => {
    const payload: EmailJobPayload = {
      to: ["recipient1@test.com", "recipient2@test.com"],
      subject: "Test Subject",
      html: "<h1>Test</h1>",
    };

    mockSendMail.mockResolvedValue({
      rejected: [],
      messageId: "test-id",
    });

    await sender.sendEmail(payload);

    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"Sloctavi" <noreply@test.com>',
      to: "recipient1@test.com, recipient2@test.com",
      subject: "Test Subject",
      text: "Your email client does not support HTML.",
      html: "<h1>Test</h1>",
      cc: undefined,
      bcc: undefined,
    });
  });
});

describe("ResendSender", () => {
  let sender: ResendSender;

  beforeEach(() => {
    vi.clearAllMocks();
    sender = new ResendSender();
  });

  it("should send email successfully with HTML content", async () => {
    const payload: EmailJobPayload = {
      to: "recipient@test.com",
      subject: "Test Subject",
      html: "<h1>Test HTML</h1>",
      text: "Test text",
    };

    mockResendSend.mockResolvedValue({
      data: { id: "email-id-123" },
      error: null,
    });

    await sender.sendEmail(payload);

    expect(mockResendSend).toHaveBeenCalledWith({
      from: "Sloctavi <noreply@test.com>",
      to: ["recipient@test.com"],
      subject: "Test Subject",
      html: "<h1>Test HTML</h1>",
    });
  });

  it("should send email with text content when no HTML", async () => {
    const payload: EmailJobPayload = {
      to: "recipient@test.com",
      subject: "Test Subject",
      text: "Test text content",
    };

    mockResendSend.mockResolvedValue({
      data: { id: "email-id-123" },
      error: null,
    });

    await sender.sendEmail(payload);

    expect(mockResendSend).toHaveBeenCalledWith({
      from: "Sloctavi <noreply@test.com>",
      to: ["recipient@test.com"],
      subject: "Test Subject",
      text: "Test text content",
    });
  });

  it("should handle array of recipients", async () => {
    const payload: EmailJobPayload = {
      to: ["recipient1@test.com", "recipient2@test.com"],
      subject: "Test Subject",
      html: "<h1>Test</h1>",
    };

    mockResendSend.mockResolvedValue({
      data: { id: "email-id-123" },
      error: null,
    });

    await sender.sendEmail(payload);

    expect(mockResendSend).toHaveBeenCalledWith({
      from: "Sloctavi <noreply@test.com>",
      to: ["recipient1@test.com", "recipient2@test.com"],
      subject: "Test Subject",
      html: "<h1>Test</h1>",
    });
  });

  it("should handle CC and BCC", async () => {
    const payload: EmailJobPayload = {
      to: "recipient@test.com",
      subject: "Test Subject",
      html: "<h1>Test</h1>",
      cc: ["cc@test.com"],
      bcc: ["bcc@test.com"],
    };

    mockResendSend.mockResolvedValue({
      data: { id: "email-id-123" },
      error: null,
    });

    await sender.sendEmail(payload);

    expect(mockResendSend).toHaveBeenCalledWith({
      from: "Sloctavi <noreply@test.com>",
      to: ["recipient@test.com"],
      subject: "Test Subject",
      html: "<h1>Test</h1>",
      cc: ["cc@test.com"],
      bcc: ["bcc@test.com"],
    });
  });

  it("should handle Resend API errors", async () => {
    const payload: EmailJobPayload = {
      to: "recipient@test.com",
      subject: "Test Subject",
      html: "<h1>Test</h1>",
    };

    mockResendSend.mockResolvedValue({
      data: null,
      error: { message: "Invalid API key" },
    });

    await expect(sender.sendEmail(payload)).rejects.toThrow("Resend error: Invalid API key");
  });
});

describe("createEmailSender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return NodemailerSender when MAIL_PROVIDER is nodemailer", async () => {
    const { createEmailSender } = await import("../sender");
    const sender = createEmailSender();
    expect(sender).toBeInstanceOf(NodemailerSender);
  });

  it("should return ResendSender when MAIL_PROVIDER is resend", async () => {
    // Temporarily mock env for this test
    vi.doMock("@/env", () => ({
      default: {
        MAIL_PROVIDER: "resend",
        RESEND_API_KEY: "re_test_key",
        SMTP_FROM: "noreply@test.com",
      },
    }));

    // Re-import to get fresh module with new env
    vi.resetModules();
    const { createEmailSender, ResendSender } = await import("../sender");
    const sender = createEmailSender();
    expect(sender).toBeInstanceOf(ResendSender);

    // Restore original mock
    vi.doUnmock("@/env");
    vi.doMock("@/env", () => ({
      default: {
        SMTP_HOST: "smtp.test.com",
        SMTP_PORT: 587,
        SMTP_USER: "test@test.com",
        SMTP_PASSWORD: "password",
        SMTP_FROM: "noreply@test.com",
        MAIL_PROVIDER: "nodemailer",
        RESEND_API_KEY: "re_test_key",
      },
    }));
  });

  it("should default to NodemailerSender when MAIL_PROVIDER is not set", async () => {
    const { createEmailSender } = await import("../sender");
    const sender = createEmailSender();
    expect(sender).toBeInstanceOf(NodemailerSender);
  });
});
