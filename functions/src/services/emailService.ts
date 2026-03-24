import * as nodemailer from "nodemailer";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";
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

// ---------------------------------------------------------------------------
// SMTP Config from Firestore (QOS pushes config/smtp_settings)
// ---------------------------------------------------------------------------

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

/**
 * Read SMTP settings from Firestore config/smtp_settings.
 * Falls back to mail.hsvina.com:465 defaults if config not found.
 */
async function getSmtpConfig(
  fallbackUser?: string,
  fallbackPass?: string
): Promise<SmtpConfig | null> {
  const db = admin.firestore();
  try {
    const snap = await db.doc("config/smtp_settings").get();
    if (snap.exists) {
      const data = snap.data()!;
      if (data.host && data.user && data.pass) {
        return {
          host: data.host,
          port: data.port || 465,
          secure: data.secure ?? true,
          user: data.user,
          pass: data.pass,
        };
      }
      logger.warn("SMTP settings incomplete (missing host/user/pass), trying fallback.");
    } else {
      logger.warn("SMTP settings not found in config/smtp_settings. QOS may not have pushed yet.");
    }
  } catch (err) {
    logger.error("Failed to read SMTP settings from Firestore:", err);
  }

  // Fallback: use provided credentials with mail.hsvina.com
  if (fallbackUser && fallbackPass) {
    return {
      host: "mail.hsvina.com",
      port: 465,
      secure: true,
      user: fallbackUser,
      pass: fallbackPass,
    };
  }

  return null;
}

function createTransporter(smtp: SmtpConfig): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
}

export async function sendEmail(
  options: SendEmailOptions,
  gmailUser?: string,
  gmailAppPassword?: string
): Promise<SendEmailResult> {
  const smtp = await getSmtpConfig(gmailUser, gmailAppPassword);
  if (!smtp) {
    const msg = "SMTP config unavailable: no Firestore config and no fallback credentials.";
    logger.error(msg);
    return { success: false, error: msg };
  }

  const transporter = createTransporter(smtp);

  const recipients = Array.isArray(options.to)
    ? options.to.join(", ")
    : options.to;

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Q-TRAIN System" <${smtp.user}>`,
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
 * Reads SMTP config from Firestore config/smtp_settings (pushed by QOS).
 * Falls back to mail.hsvina.com:465 with provided credentials if config not found.
 *
 * @param options - Templated email options (template type, data, language)
 * @param gmailUser - Optional fallback sender address
 * @param gmailAppPassword - Optional fallback password
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
  gmailUser?: string,
  gmailAppPassword?: string
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
