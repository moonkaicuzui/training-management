/**
 * Q-TRAIN Automated Email Service
 *
 * Reads SMTP config from Firestore config/smtp_settings (pushed by QOS).
 * Reads email settings from config/emailSettings per email type.
 * Provides helper utilities for all automated email Cloud Functions.
 */

import * as nodemailer from "nodemailer";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import {
  generateEmailHtml,
  getDefaultSubject,
  type TemplateType,
  type TemplateData,
  type SupportedLanguage,
} from "./emailTemplates";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface EmailTypeSettings {
  enabled: boolean;
  recipients?: string[];
  cc?: string[];
  bcc?: string[];
  language?: SupportedLanguage;
}

export interface AutoEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// SMTP Config from Firestore (QOS pushes this)
// ---------------------------------------------------------------------------

/**
 * Read SMTP settings from Firestore config/smtp_settings.
 * QOS pushes these settings via settingsSync - never hardcode.
 */
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const db = admin.firestore();
  try {
    const snap = await db.doc("config/smtp_settings").get();
    if (!snap.exists) {
      logger.warn("SMTP settings not found in config/smtp_settings. QOS may not have pushed yet.");
      return null;
    }
    const data = snap.data()!;
    if (!data.host || !data.user || !data.pass) {
      logger.warn("SMTP settings incomplete (missing host/user/pass).");
      return null;
    }
    return {
      host: data.host,
      port: data.port || 587,
      secure: data.secure ?? false,
      user: data.user,
      pass: data.pass,
    };
  } catch (err) {
    logger.error("Failed to read SMTP settings:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Email Settings from Firestore
// ---------------------------------------------------------------------------

/**
 * Read email settings for a specific email type from config/emailSettings.
 * Returns null if not found or disabled.
 */
export async function getEmailTypeSettings(
  emailType: string
): Promise<EmailTypeSettings | null> {
  const db = admin.firestore();
  try {
    const snap = await db.doc("config/emailSettings").get();
    if (!snap.exists) {
      logger.warn("Email settings not found in config/emailSettings.");
      return null;
    }
    const data = snap.data()!;
    const typeConfig = data[emailType];
    if (!typeConfig) {
      logger.info(`Email type '${emailType}' not configured in emailSettings.`);
      return null;
    }
    return {
      enabled: typeConfig.enabled ?? false,
      recipients: typeConfig.recipients || [],
      cc: typeConfig.cc || [],
      bcc: typeConfig.bcc || [],
      language: typeConfig.language || "ko",
    };
  } catch (err) {
    logger.error(`Failed to read email settings for type '${emailType}':`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Transporter Factory
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Send Email (using Firestore SMTP config)
// ---------------------------------------------------------------------------

export async function sendAutoEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  smtp: SmtpConfig;
}): Promise<AutoEmailResult> {
  const transporter = createTransporter(opts.smtp);
  const recipients = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to;

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Q-TRAIN System" <${opts.smtp.user}>`,
    to: recipients,
    subject: opts.subject,
    html: opts.html,
  };

  if (opts.cc) {
    mailOptions.cc = opts.cc;
  }
  if (opts.bcc) {
    mailOptions.bcc = opts.bcc;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Auto email sent to ${recipients}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to send auto email to ${recipients}: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// ---------------------------------------------------------------------------
// Send Templated Email (using Firestore SMTP config)
// ---------------------------------------------------------------------------

export async function sendAutoTemplatedEmail(opts: {
  to: string | string[];
  templateType: TemplateType;
  data: TemplateData;
  language?: SupportedLanguage;
  subject?: string;
  cc?: string | string[];
  bcc?: string | string[];
  smtp: SmtpConfig;
}): Promise<AutoEmailResult> {
  const language = opts.language ?? "ko";
  const html = generateEmailHtml(opts.templateType, opts.data, language);
  const subject = opts.subject ?? getDefaultSubject(opts.templateType, language);

  return sendAutoEmail({
    to: opts.to,
    subject,
    html,
    cc: opts.cc,
    bcc: opts.bcc,
    smtp: opts.smtp,
  });
}

// ---------------------------------------------------------------------------
// Email Log
// ---------------------------------------------------------------------------

export async function logEmailResult(opts: {
  emailType: string;
  recipients: string[];
  subject: string;
  result: AutoEmailResult;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = admin.firestore();
  try {
    await db.collection("email_logs").add({
      emailType: opts.emailType,
      recipients: opts.recipients,
      subject: opts.subject,
      success: opts.result.success,
      messageId: opts.result.messageId || null,
      error: opts.result.error || null,
      skipped: opts.result.skipped || false,
      reason: opts.result.reason || null,
      metadata: opts.metadata || {},
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logger.error("Failed to write email log:", err);
  }
}

// ---------------------------------------------------------------------------
// Pre-flight check: SMTP + email type enabled
// ---------------------------------------------------------------------------

export async function preflightCheck(emailType: string): Promise<{
  ok: boolean;
  smtp?: SmtpConfig;
  settings?: EmailTypeSettings;
  skipReason?: string;
}> {
  const smtp = await getSmtpConfig();
  if (!smtp) {
    return { ok: false, skipReason: "SMTP settings not configured" };
  }

  const settings = await getEmailTypeSettings(emailType);
  if (!settings) {
    return { ok: false, skipReason: `Email type '${emailType}' not configured` };
  }
  if (!settings.enabled) {
    return { ok: false, skipReason: `Email type '${emailType}' is disabled` };
  }

  return { ok: true, smtp, settings };
}
