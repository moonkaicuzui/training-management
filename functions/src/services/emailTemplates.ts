/**
 * Q-TRAIN Email Template Engine
 *
 * Generates responsive, professional HTML email templates with:
 * - Table-based layout for email client compatibility
 * - Left-aligned content (max-width 600px)
 * - Inline CSS (no external stylesheets)
 * - Multi-language support (ko, en, vi)
 * - Compatible with Gmail, Outlook, Apple Mail
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SupportedLanguage = "ko" | "en" | "vi";

export type TemplateType =
  | "trainingRegistration"
  | "trainingResult"
  | "trainingReminder"
  | "expiryWarning"
  | "certificateIssued"
  | "retrainingRequired"
  | "general";

/** Key-value pairs injected into each template. */
export interface TemplateData {
  /** Recipient display name */
  recipientName?: string;
  /** Training program name */
  programName?: string;
  /** Training program code */
  programCode?: string;
  /** Session date (formatted string) */
  sessionDate?: string;
  /** Session time */
  sessionTime?: string;
  /** Training location / venue */
  location?: string;
  /** Trainer name */
  trainerName?: string;
  /** Score (numeric or string) */
  score?: string | number;
  /** Grade (A / B / C / ...) */
  grade?: string;
  /** Result text (Pass / Fail / ...) */
  result?: string;
  /** Expiry date (formatted string) */
  expiryDate?: string;
  /** Days until expiry */
  daysUntilExpiry?: number;
  /** Certificate number */
  certificateNumber?: string;
  /** Certificate issued date */
  certificateDate?: string;
  /** Retraining deadline */
  retrainingDeadline?: string;
  /** Reason for retraining */
  retrainingReason?: string;
  /** Generic title (for general template) */
  title?: string;
  /** Generic body content (for general template, may contain HTML) */
  body?: string;
  /** Optional CTA button */
  ctaText?: string;
  /** Optional CTA link */
  ctaUrl?: string;
  /** Additional remarks / notes */
  remarks?: string;
}

// ---------------------------------------------------------------------------
// Color Tokens
// ---------------------------------------------------------------------------

const colors = {
  primary: "#1a56db",
  primaryDark: "#1e40af",
  background: "#f3f4f6",
  white: "#ffffff",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  infoBg: "#eff6ff",
  infoBorder: "#bfdbfe",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
};

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

interface TranslationSet {
  greeting: (name?: string) => string;
  footer: {
    company: string;
    system: string;
    autoNotice: string;
  };
  templates: Record<TemplateType, {
    subject: string;
    heading: string;
    body: (data: TemplateData) => string;
  }>;
  labels: {
    programName: string;
    programCode: string;
    date: string;
    time: string;
    location: string;
    trainer: string;
    score: string;
    grade: string;
    result: string;
    expiryDate: string;
    certificateNumber: string;
    certificateDate: string;
    deadline: string;
    reason: string;
    remarks: string;
    pass: string;
    fail: string;
  };
}

const translations: Record<SupportedLanguage, TranslationSet> = {
  // ── Korean ──────────────────────────────────────────────────────────────
  ko: {
    greeting: (name) => name ? `${name}님, 안녕하세요.` : "안녕하세요.",
    footer: {
      company: "HWK Vietnam (화승비나)",
      system: "Q-TRAIN 교육 관리 시스템",
      autoNotice: "본 메일은 Q-TRAIN 시스템에서 자동 발송된 메일입니다.",
    },
    labels: {
      programName: "교육 프로그램",
      programCode: "프로그램 코드",
      date: "교육 일자",
      time: "교육 시간",
      location: "교육 장소",
      trainer: "강사",
      score: "점수",
      grade: "등급",
      result: "결과",
      expiryDate: "만료일",
      certificateNumber: "인증서 번호",
      certificateDate: "발급일",
      deadline: "기한",
      reason: "사유",
      remarks: "비고",
      pass: "합격",
      fail: "불합격",
    },
    templates: {
      trainingRegistration: {
        subject: "[Q-TRAIN] 교육 등록 확인",
        heading: "교육 등록이 완료되었습니다",
        body: () =>
          "아래 교육 프로그램에 등록이 완료되었습니다. 교육 일정을 확인하시고, 시간에 맞춰 참석해 주시기 바랍니다.",
      },
      trainingResult: {
        subject: "[Q-TRAIN] 교육 결과 통보",
        heading: "교육 결과를 안내드립니다",
        body: () =>
          "참여하신 교육의 평가 결과를 아래와 같이 안내드립니다.",
      },
      trainingReminder: {
        subject: "[Q-TRAIN] 교육 일정 알림",
        heading: "교육 일정 알림",
        body: (data) =>
          `예정된 교육이 ${data.daysUntilExpiry ? `${data.daysUntilExpiry}일 후` : "곧"} 시작됩니다. 아래 일정을 확인해 주시기 바랍니다.`,
      },
      expiryWarning: {
        subject: "[Q-TRAIN] 교육 만료 임박 경고",
        heading: "교육 유효기간 만료 임박",
        body: (data) =>
          `보유하신 교육 인증의 유효기간이 ${data.daysUntilExpiry ? `${data.daysUntilExpiry}일 후` : "곧"} 만료됩니다. 재교육 일정을 확인해 주시기 바랍니다.`,
      },
      certificateIssued: {
        subject: "[Q-TRAIN] 인증서 발급 알림",
        heading: "인증서가 발급되었습니다",
        body: () =>
          "교육 이수에 따른 인증서가 발급되었습니다. 아래 내용을 확인해 주시기 바랍니다.",
      },
      retrainingRequired: {
        subject: "[Q-TRAIN] 재교육 필요 알림",
        heading: "재교육이 필요합니다",
        body: () =>
          "아래 교육에 대한 재교육이 필요합니다. 지정된 기한 내에 재교육을 이수해 주시기 바랍니다.",
      },
      general: {
        subject: "[Q-TRAIN] 알림",
        heading: "알림",
        body: () => "",
      },
    },
  },

  // ── English ─────────────────────────────────────────────────────────────
  en: {
    greeting: (name) => name ? `Hello, ${name}.` : "Hello.",
    footer: {
      company: "HWK Vietnam",
      system: "Q-TRAIN Training Management System",
      autoNotice: "This email was automatically sent by the Q-TRAIN system.",
    },
    labels: {
      programName: "Training Program",
      programCode: "Program Code",
      date: "Date",
      time: "Time",
      location: "Location",
      trainer: "Trainer",
      score: "Score",
      grade: "Grade",
      result: "Result",
      expiryDate: "Expiry Date",
      certificateNumber: "Certificate No.",
      certificateDate: "Issue Date",
      deadline: "Deadline",
      reason: "Reason",
      remarks: "Remarks",
      pass: "Pass",
      fail: "Fail",
    },
    templates: {
      trainingRegistration: {
        subject: "[Q-TRAIN] Training Registration Confirmation",
        heading: "Training Registration Confirmed",
        body: () =>
          "Your registration for the following training program has been confirmed. Please review the schedule below and attend on time.",
      },
      trainingResult: {
        subject: "[Q-TRAIN] Training Result Notification",
        heading: "Training Result Notification",
        body: () =>
          "Please find below the evaluation results for your training session.",
      },
      trainingReminder: {
        subject: "[Q-TRAIN] Training Schedule Reminder",
        heading: "Training Schedule Reminder",
        body: (data) =>
          `Your scheduled training begins ${data.daysUntilExpiry ? `in ${data.daysUntilExpiry} day(s)` : "soon"}. Please review the details below.`,
      },
      expiryWarning: {
        subject: "[Q-TRAIN] Training Expiry Warning",
        heading: "Training Certification Expiring Soon",
        body: (data) =>
          `Your training certification expires ${data.daysUntilExpiry ? `in ${data.daysUntilExpiry} day(s)` : "soon"}. Please schedule retraining at your earliest convenience.`,
      },
      certificateIssued: {
        subject: "[Q-TRAIN] Certificate Issued",
        heading: "Certificate Issued",
        body: () =>
          "A certificate has been issued for your completed training. Please review the details below.",
      },
      retrainingRequired: {
        subject: "[Q-TRAIN] Retraining Required",
        heading: "Retraining Required",
        body: () =>
          "Retraining is required for the following program. Please complete the training by the specified deadline.",
      },
      general: {
        subject: "[Q-TRAIN] Notification",
        heading: "Notification",
        body: () => "",
      },
    },
  },

  // ── Vietnamese ──────────────────────────────────────────────────────────
  vi: {
    greeting: (name) => name ? `Xin chao, ${name}.` : "Xin chao.",
    footer: {
      company: "HWK Vietnam (Hwa Seung Vina)",
      system: "He thong Quan ly Dao tao Q-TRAIN",
      autoNotice: "Email nay duoc gui tu dong tu he thong Q-TRAIN.",
    },
    labels: {
      programName: "Chuong trinh dao tao",
      programCode: "Ma chuong trinh",
      date: "Ngay",
      time: "Thoi gian",
      location: "Dia diem",
      trainer: "Giang vien",
      score: "Diem",
      grade: "Xep loai",
      result: "Ket qua",
      expiryDate: "Ngay het han",
      certificateNumber: "So chung chi",
      certificateDate: "Ngay cap",
      deadline: "Han chot",
      reason: "Ly do",
      remarks: "Ghi chu",
      pass: "Dat",
      fail: "Khong dat",
    },
    templates: {
      trainingRegistration: {
        subject: "[Q-TRAIN] Xac nhan dang ky dao tao",
        heading: "Dang ky dao tao da duoc xac nhan",
        body: () =>
          "Ban da dang ky thanh cong chuong trinh dao tao duoi day. Vui long kiem tra lich trinh va tham du dung gio.",
      },
      trainingResult: {
        subject: "[Q-TRAIN] Thong bao ket qua dao tao",
        heading: "Thong bao ket qua dao tao",
        body: () =>
          "Duoi day la ket qua danh gia cua buoi dao tao ban da tham gia.",
      },
      trainingReminder: {
        subject: "[Q-TRAIN] Nhac lich dao tao",
        heading: "Nhac lich dao tao",
        body: (data) =>
          `Buoi dao tao cua ban se bat dau ${data.daysUntilExpiry ? `sau ${data.daysUntilExpiry} ngay` : "sap toi"}. Vui long xem chi tiet ben duoi.`,
      },
      expiryWarning: {
        subject: "[Q-TRAIN] Canh bao het han dao tao",
        heading: "Chung chi dao tao sap het han",
        body: (data) =>
          `Chung chi dao tao cua ban se het han ${data.daysUntilExpiry ? `sau ${data.daysUntilExpiry} ngay` : "sap toi"}. Vui long sap xep dao tao lai som nhat co the.`,
      },
      certificateIssued: {
        subject: "[Q-TRAIN] Thong bao cap chung chi",
        heading: "Chung chi da duoc cap",
        body: () =>
          "Chung chi da duoc cap cho khoa dao tao ban da hoan thanh. Vui long xem chi tiet ben duoi.",
      },
      retrainingRequired: {
        subject: "[Q-TRAIN] Yeu cau dao tao lai",
        heading: "Can dao tao lai",
        body: () =>
          "Ban can dao tao lai chuong trinh duoi day. Vui long hoan thanh truoc thoi han quy dinh.",
      },
      general: {
        subject: "[Q-TRAIN] Thong bao",
        heading: "Thong bao",
        body: () => "",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Helper: escape HTML
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------------------------
// Layout components (table-based for email client compatibility)
// ---------------------------------------------------------------------------

function baseLayout(content: string, footerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ko" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Q-TRAIN</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    /* Mobile */
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
      .content-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

  <!-- Outer wrapper table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.background};">
    <tr>
      <td style="padding: 24px 16px;">

        <!-- Email container: 600px max, LEFT-ALIGNED content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: ${colors.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${colors.primary}; padding: 24px 32px;" class="content-padding">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: left;">
                    <span style="font-size: 24px; font-weight: 700; color: ${colors.white}; letter-spacing: 1px;">Q-TRAIN</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;" class="content-padding">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0 32px 0 32px;" class="content-padding">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid ${colors.border}; padding-top: 24px; padding-bottom: 24px;">
                    ${footerHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Email container -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>`;
}

function renderHeading(text: string): string {
  return `<h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: ${colors.textPrimary}; line-height: 1.3; text-align: left;">${escapeHtml(text)}</h1>`;
}

function renderParagraph(text: string): string {
  return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${colors.textSecondary}; text-align: left;">${text}</p>`;
}

function renderGreeting(text: string): string {
  return `<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${colors.textPrimary}; text-align: left;">${escapeHtml(text)}</p>`;
}

/**
 * Renders a detail table with label-value pairs.
 * Values are left-aligned; labels are left-aligned with a muted color.
 */
function renderDetailTable(
  rows: Array<{ label: string; value: string; highlight?: "success" | "warning" | "danger" }>
): string {
  if (rows.length === 0) return "";

  const rowsHtml = rows
    .map((row) => {
      let valueStyle = `font-size: 15px; color: ${colors.textPrimary}; font-weight: 500; text-align: left; padding: 10px 12px;`;
      if (row.highlight === "success") {
        valueStyle += ` color: ${colors.success}; font-weight: 700;`;
      } else if (row.highlight === "warning") {
        valueStyle += ` color: ${colors.warning}; font-weight: 700;`;
      } else if (row.highlight === "danger") {
        valueStyle += ` color: ${colors.danger}; font-weight: 700;`;
      }

      return `<tr>
        <td style="font-size: 14px; color: ${colors.textMuted}; text-align: left; padding: 10px 12px; white-space: nowrap; vertical-align: top; width: 140px; border-bottom: 1px solid ${colors.border};">${escapeHtml(row.label)}</td>
        <td style="${valueStyle} border-bottom: 1px solid ${colors.border};">${escapeHtml(row.value)}</td>
      </tr>`;
    })
    .join("\n");

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0 24px 0; border: 1px solid ${colors.border}; border-radius: 6px; border-collapse: separate; overflow: hidden;">
  ${rowsHtml}
</table>`;
}

/**
 * Renders a colored alert box.
 */
function renderAlert(
  message: string,
  type: "info" | "success" | "warning" | "danger" = "info"
): string {
  const bgMap = {
    info: colors.infoBg,
    success: colors.successBg,
    warning: colors.warningBg,
    danger: colors.dangerBg,
  };
  const borderMap = {
    info: colors.infoBorder,
    success: colors.successBorder,
    warning: colors.warningBorder,
    danger: colors.dangerBorder,
  };
  const colorMap = {
    info: colors.primaryDark,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  };

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
  <tr>
    <td style="background-color: ${bgMap[type]}; border: 1px solid ${borderMap[type]}; border-radius: 6px; padding: 14px 16px;">
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${colorMap[type]}; text-align: left;">${message}</p>
    </td>
  </tr>
</table>`;
}

/**
 * Renders a CTA button (left-aligned).
 */
function renderButton(text: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
  <tr>
    <td style="border-radius: 6px; background-color: ${colors.primary};">
      <a href="${escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 15px; font-weight: 600; color: ${colors.white}; text-decoration: none; border-radius: 6px;">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>`;
}

function renderFooter(lang: SupportedLanguage): string {
  const t = translations[lang].footer;
  return `<p style="margin: 0 0 4px 0; font-size: 13px; color: ${colors.textMuted}; text-align: left; font-weight: 600;">${escapeHtml(t.company)}</p>
<p style="margin: 0 0 8px 0; font-size: 12px; color: ${colors.textMuted}; text-align: left;">${escapeHtml(t.system)}</p>
<p style="margin: 0; font-size: 11px; color: ${colors.textMuted}; text-align: left; font-style: italic;">${escapeHtml(t.autoNotice)}</p>`;
}

// ---------------------------------------------------------------------------
// Template-specific content builders
// ---------------------------------------------------------------------------

function buildTrainingRegistration(
  data: TemplateData,
  lang: SupportedLanguage
): string {
  const t = translations[lang];
  const tmpl = t.templates.trainingRegistration;
  const l = t.labels;

  const rows: Array<{ label: string; value: string }> = [];
  if (data.programName) rows.push({ label: l.programName, value: data.programName });
  if (data.programCode) rows.push({ label: l.programCode, value: data.programCode });
  if (data.sessionDate) rows.push({ label: l.date, value: data.sessionDate });
  if (data.sessionTime) rows.push({ label: l.time, value: data.sessionTime });
  if (data.location) rows.push({ label: l.location, value: data.location });
  if (data.trainerName) rows.push({ label: l.trainer, value: data.trainerName });

  let html = renderHeading(tmpl.heading);
  html += renderGreeting(t.greeting(data.recipientName));
  html += renderParagraph(tmpl.body(data));
  html += renderDetailTable(rows);
  if (data.remarks) {
    html += renderParagraph(escapeHtml(data.remarks));
  }
  if (data.ctaText && data.ctaUrl) {
    html += renderButton(data.ctaText, data.ctaUrl);
  }
  return html;
}

function buildTrainingResult(
  data: TemplateData,
  lang: SupportedLanguage
): string {
  const t = translations[lang];
  const tmpl = t.templates.trainingResult;
  const l = t.labels;

  const isPass =
    data.result?.toLowerCase() === "pass" ||
    data.result === l.pass ||
    data.result === "합격" ||
    data.result === "Dat";

  const rows: Array<{ label: string; value: string; highlight?: "success" | "warning" | "danger" }> = [];
  if (data.programName) rows.push({ label: l.programName, value: data.programName });
  if (data.sessionDate) rows.push({ label: l.date, value: data.sessionDate });
  if (data.score !== undefined && data.score !== null) {
    rows.push({ label: l.score, value: String(data.score) });
  }
  if (data.grade) rows.push({ label: l.grade, value: data.grade });
  if (data.result) {
    rows.push({
      label: l.result,
      value: data.result,
      highlight: isPass ? "success" : "danger",
    });
  }

  let html = renderHeading(tmpl.heading);
  html += renderGreeting(t.greeting(data.recipientName));
  html += renderParagraph(tmpl.body(data));
  html += renderDetailTable(rows);

  if (isPass) {
    const messages: Record<SupportedLanguage, string> = {
      ko: "축하합니다! 교육을 성공적으로 이수하셨습니다.",
      en: "Congratulations! You have successfully completed the training.",
      vi: "Xin chuc mung! Ban da hoan thanh khoa dao tao thanh cong.",
    };
    html += renderAlert(messages[lang], "success");
  } else if (data.result) {
    const messages: Record<SupportedLanguage, string> = {
      ko: "재교육이 필요할 수 있습니다. 담당자에게 문의해 주시기 바랍니다.",
      en: "Retraining may be required. Please contact your supervisor for further guidance.",
      vi: "Ban co the can dao tao lai. Vui long lien he nguoi phu trach de duoc huong dan them.",
    };
    html += renderAlert(messages[lang], "warning");
  }

  if (data.remarks) {
    html += renderParagraph(escapeHtml(data.remarks));
  }
  if (data.ctaText && data.ctaUrl) {
    html += renderButton(data.ctaText, data.ctaUrl);
  }
  return html;
}

function buildTrainingReminder(
  data: TemplateData,
  lang: SupportedLanguage
): string {
  const t = translations[lang];
  const tmpl = t.templates.trainingReminder;
  const l = t.labels;

  const rows: Array<{ label: string; value: string }> = [];
  if (data.programName) rows.push({ label: l.programName, value: data.programName });
  if (data.sessionDate) rows.push({ label: l.date, value: data.sessionDate });
  if (data.sessionTime) rows.push({ label: l.time, value: data.sessionTime });
  if (data.location) rows.push({ label: l.location, value: data.location });
  if (data.trainerName) rows.push({ label: l.trainer, value: data.trainerName });

  let html = renderHeading(tmpl.heading);
  html += renderGreeting(t.greeting(data.recipientName));
  html += renderParagraph(tmpl.body(data));
  html += renderDetailTable(rows);

  const reminders: Record<SupportedLanguage, string> = {
    ko: "시간에 맞춰 참석해 주시기 바랍니다. 부득이 불참 시 사전에 담당자에게 알려 주세요.",
    en: "Please attend on time. If you are unable to attend, please notify your supervisor in advance.",
    vi: "Vui long tham du dung gio. Neu ban khong the tham du, vui long thong bao truoc cho nguoi phu trach.",
  };
  html += renderAlert(reminders[lang], "info");

  if (data.ctaText && data.ctaUrl) {
    html += renderButton(data.ctaText, data.ctaUrl);
  }
  return html;
}

function buildExpiryWarning(
  data: TemplateData,
  lang: SupportedLanguage
): string {
  const t = translations[lang];
  const tmpl = t.templates.expiryWarning;
  const l = t.labels;

  const rows: Array<{ label: string; value: string; highlight?: "success" | "warning" | "danger" }> = [];
  if (data.programName) rows.push({ label: l.programName, value: data.programName });
  if (data.expiryDate) {
    rows.push({
      label: l.expiryDate,
      value: data.expiryDate,
      highlight: (data.daysUntilExpiry ?? 999) <= 7 ? "danger" : "warning",
    });
  }

  let html = renderHeading(tmpl.heading);
  html += renderGreeting(t.greeting(data.recipientName));
  html += renderParagraph(tmpl.body(data));
  html += renderDetailTable(rows);

  const urgency = (data.daysUntilExpiry ?? 999) <= 7 ? "danger" : "warning";
  const urgencyMessages: Record<SupportedLanguage, string> = {
    ko: urgency === "danger"
      ? "만료까지 7일 이내입니다. 즉시 재교육 일정을 확인해 주시기 바랍니다."
      : "만료 예정입니다. 재교육 일정을 미리 확인해 주시기 바랍니다.",
    en: urgency === "danger"
      ? "Less than 7 days until expiry. Please schedule retraining immediately."
      : "Expiring soon. Please plan your retraining in advance.",
    vi: urgency === "danger"
      ? "Con duoi 7 ngay truoc khi het han. Vui long sap xep dao tao lai ngay."
      : "Sap het han. Vui long len ke hoach dao tao lai truoc.",
  };
  html += renderAlert(urgencyMessages[lang], urgency);

  if (data.ctaText && data.ctaUrl) {
    html += renderButton(data.ctaText, data.ctaUrl);
  }
  return html;
}

function buildCertificateIssued(
  data: TemplateData,
  lang: SupportedLanguage
): string {
  const t = translations[lang];
  const tmpl = t.templates.certificateIssued;
  const l = t.labels;

  const rows: Array<{ label: string; value: string }> = [];
  if (data.programName) rows.push({ label: l.programName, value: data.programName });
  if (data.certificateNumber) rows.push({ label: l.certificateNumber, value: data.certificateNumber });
  if (data.certificateDate) rows.push({ label: l.certificateDate, value: data.certificateDate });
  if (data.expiryDate) rows.push({ label: l.expiryDate, value: data.expiryDate });

  let html = renderHeading(tmpl.heading);
  html += renderGreeting(t.greeting(data.recipientName));
  html += renderParagraph(tmpl.body(data));
  html += renderDetailTable(rows);

  const congrats: Record<SupportedLanguage, string> = {
    ko: "교육 이수를 축하드립니다.",
    en: "Congratulations on completing your training.",
    vi: "Xin chuc mung ban da hoan thanh khoa dao tao.",
  };
  html += renderAlert(congrats[lang], "success");

  if (data.ctaText && data.ctaUrl) {
    html += renderButton(data.ctaText, data.ctaUrl);
  }
  return html;
}

function buildRetrainingRequired(
  data: TemplateData,
  lang: SupportedLanguage
): string {
  const t = translations[lang];
  const tmpl = t.templates.retrainingRequired;
  const l = t.labels;

  const rows: Array<{ label: string; value: string; highlight?: "success" | "warning" | "danger" }> = [];
  if (data.programName) rows.push({ label: l.programName, value: data.programName });
  if (data.retrainingReason) rows.push({ label: l.reason, value: data.retrainingReason });
  if (data.retrainingDeadline) {
    rows.push({
      label: l.deadline,
      value: data.retrainingDeadline,
      highlight: "warning",
    });
  }

  let html = renderHeading(tmpl.heading);
  html += renderGreeting(t.greeting(data.recipientName));
  html += renderParagraph(tmpl.body(data));
  html += renderDetailTable(rows);

  const notices: Record<SupportedLanguage, string> = {
    ko: "기한 내에 재교육을 이수하지 않을 경우, 해당 업무 수행에 제한이 있을 수 있습니다.",
    en: "Failure to complete retraining by the deadline may result in work restrictions.",
    vi: "Neu khong hoan thanh dao tao lai truoc thoi han, ban co the bi han che trong cong viec.",
  };
  html += renderAlert(notices[lang], "warning");

  if (data.ctaText && data.ctaUrl) {
    html += renderButton(data.ctaText, data.ctaUrl);
  }
  return html;
}

function buildGeneral(
  data: TemplateData,
  lang: SupportedLanguage
): string {
  const t = translations[lang];
  const tmpl = t.templates.general;

  const heading = data.title || tmpl.heading;

  let html = renderHeading(heading);
  html += renderGreeting(t.greeting(data.recipientName));

  if (data.body) {
    // body may contain pre-formatted HTML
    html += `<div style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${colors.textSecondary}; text-align: left;">${data.body}</div>`;
  }

  if (data.remarks) {
    html += renderParagraph(escapeHtml(data.remarks));
  }
  if (data.ctaText && data.ctaUrl) {
    html += renderButton(data.ctaText, data.ctaUrl);
  }
  return html;
}

// ---------------------------------------------------------------------------
// Content builder dispatcher
// ---------------------------------------------------------------------------

const templateBuilders: Record<
  TemplateType,
  (data: TemplateData, lang: SupportedLanguage) => string
> = {
  trainingRegistration: buildTrainingRegistration,
  trainingResult: buildTrainingResult,
  trainingReminder: buildTrainingReminder,
  expiryWarning: buildExpiryWarning,
  certificateIssued: buildCertificateIssued,
  retrainingRequired: buildRetrainingRequired,
  general: buildGeneral,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a complete HTML email string for the given template type.
 *
 * @param templateType - The email template to render
 * @param data - Dynamic data to inject into the template
 * @param language - Target language (defaults to "ko")
 * @returns Full HTML string ready for sending
 *
 * @example
 * ```ts
 * const html = generateEmailHtml("trainingRegistration", {
 *   recipientName: "Nguyen Van A",
 *   programName: "Safety Training Level 1",
 *   sessionDate: "2026-03-01",
 *   sessionTime: "09:00 - 12:00",
 *   location: "Building A, Room 201",
 *   trainerName: "Kim Training",
 * }, "vi");
 * ```
 */
export function generateEmailHtml(
  templateType: TemplateType,
  data: TemplateData,
  language: SupportedLanguage = "ko"
): string {
  const builder = templateBuilders[templateType];
  if (!builder) {
    throw new Error(`Unknown email template type: ${templateType}`);
  }

  const content = builder(data, language);
  const footer = renderFooter(language);
  return baseLayout(content, footer);
}

/**
 * Returns the default subject line for a given template type and language.
 *
 * @param templateType - The email template type
 * @param language - Target language (defaults to "ko")
 * @returns Default subject line string
 */
export function getDefaultSubject(
  templateType: TemplateType,
  language: SupportedLanguage = "ko"
): string {
  const t = translations[language];
  if (!t) {
    return translations.ko.templates[templateType].subject;
  }
  return t.templates[templateType].subject;
}

/**
 * Returns the list of supported languages.
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return ["ko", "en", "vi"];
}

/**
 * Returns available template types.
 */
export function getTemplateTypes(): TemplateType[] {
  return [
    "trainingRegistration",
    "trainingResult",
    "trainingReminder",
    "expiryWarning",
    "certificateIssued",
    "retrainingRequired",
    "general",
  ];
}
