import * as nodemailer from "nodemailer";
import {logger} from "firebase-functions";
import {
  generateEmailHtml,
  getDefaultSubject,
  type TemplateType,
  type TemplateData,
  type SupportedLanguage,
} from "./emailTemplates";

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  encoding?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface SendTemplatedEmailOptions {
  to: string | string[];
  templateType: TemplateType;
  data: TemplateData;
  language?: SupportedLanguage;
  /** Override the default subject line */
  subject?: string;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function createGmailTransporter(
  gmailUser: string,
  gmailAppPassword: string
): nodemailer.Transporter {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
}

export async function sendEmail(
  options: SendEmailOptions,
  gmailUser: string,
  gmailAppPassword: string
): Promise<SendEmailResult> {
  const transporter = createGmailTransporter(gmailUser, gmailAppPassword);

  const recipients = Array.isArray(options.to)
    ? options.to.join(", ")
    : options.to;

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Q-TRAIN System" <${gmailUser}>`,
    to: recipients,
    subject: options.subject,
    html: options.html,
  };

  if (options.text) {
    mailOptions.text = options.text;
  }
  if (options.attachments) {
    mailOptions.attachments = options.attachments;
  }
  if (options.cc) {
    mailOptions.cc = options.cc;
  }
  if (options.bcc) {
    mailOptions.bcc = options.bcc;
  }
  if (options.replyTo) {
    mailOptions.replyTo = options.replyTo;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${recipients}, messageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to send email to ${recipients}: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sends an email using a pre-built Q-TRAIN template.
 *
 * Generates responsive HTML from the template engine and delegates
 * to `sendEmail` for actual delivery.
 *
 * @param options - Templated email options (template type, data, language)
 * @param gmailUser - Gmail sender address
 * @param gmailAppPassword - Gmail app-specific password
 * @returns Result with success status and optional messageId
 *
 * @example
 * ```ts
 * await sendTemplatedEmail(
 *   {
 *     to: "trainee@example.com",
 *     templateType: "trainingRegistration",
 *     data: {
 *       recipientName: "Nguyen Van A",
 *       programName: "Safety Training Level 1",
 *       sessionDate: "2026-03-01",
 *       location: "Building A, Room 201",
 *     },
 *     language: "vi",
 *   },
 *   gmailUser,
 *   gmailAppPassword,
 * );
 * ```
 */
export async function sendTemplatedEmail(
  options: SendTemplatedEmailOptions,
  gmailUser: string,
  gmailAppPassword: string
): Promise<SendEmailResult> {
  const language = options.language ?? "ko";

  const html = generateEmailHtml(
    options.templateType,
    options.data,
    language
  );

  const subject =
    options.subject ?? getDefaultSubject(options.templateType, language);

  logger.info(
    `Sending templated email: type=${options.templateType}, lang=${language}, to=${
      Array.isArray(options.to) ? options.to.join(", ") : options.to
    }`
  );

  return sendEmail(
    {
      to: options.to,
      subject,
      html,
      attachments: options.attachments,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
    },
    gmailUser,
    gmailAppPassword
  );
}
