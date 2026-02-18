/**
 * Send Q-TRAIN System Guide Email
 * Attaches both English and Korean PowerPoint guides
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const GMAIL_USER = 'kaicuzuikaicuzuikaicuzui@gmail.com';
const GMAIL_APP_PASSWORD = 'itbfaoahvzdgwddz';

const RECIPIENTS = ['ksmoon@hsvina.com', 'hwk_qa@hsvina.com'];

const EN_GUIDE = path.join(__dirname, 'Q-TRAIN_Complete_Guide_EN.pptx');
const KO_GUIDE = path.join(__dirname, 'Q-TRAIN_System_Guide.pptx');

// Verify files exist
[EN_GUIDE, KO_GUIDE].forEach(f => {
  if (!fs.existsSync(f)) {
    console.error(`File not found: ${f}`);
    process.exit(1);
  }
});

const htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; color:#1f2937; background-color:#ffffff;">

<!-- Header -->
<div style="background-color:#1e40af; padding:24px 32px;">
  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Q-TRAIN System Guide</h1>
  <p style="margin:6px 0 0 0; color:#93c5fd; font-size:14px;">HWK Vietnam QIP Training Management System</p>
</div>

<!-- Body -->
<div style="padding:32px;">

  <p style="font-size:15px; line-height:1.7; margin:0 0 20px 0;">Dear Team,</p>

  <p style="font-size:15px; line-height:1.7; margin:0 0 20px 0;">
    We are pleased to share the <strong>Q-TRAIN System User Guide</strong> — a comprehensive, scenario-based presentation
    designed to help you understand how to use the Q-TRAIN system effectively in your daily work.
  </p>

  <p style="font-size:15px; line-height:1.7; margin:0 0 16px 0;">
    The guide covers <strong>8 key functional categories</strong> of the system:
  </p>

  <table style="width:100%; border-collapse:collapse; margin:0 0 24px 0;">
    <tr>
      <td style="padding:10px 16px; border:1px solid #e5e7eb; background:#eff6ff; font-weight:600; width:40px; text-align:center;">1</td>
      <td style="padding:10px 16px; border:1px solid #e5e7eb;"><strong>Training Program Management</strong> — Create programs, schedule sessions, record results</td>
    </tr>
    <tr>
      <td style="padding:10px 16px; border:1px solid #e5e7eb; background:#eff6ff; font-weight:600; text-align:center;">2</td>
      <td style="padding:10px 16px; border:1px solid #e5e7eb;"><strong>Certificates & Compliance</strong> — Auto-issue certificates, track expiry, manage renewals</td>
    </tr>
    <tr>
      <td style="padding:10px 16px; border:1px solid #e5e7eb; background:#eff6ff; font-weight:600; text-align:center;">3</td>
      <td style="padding:10px 16px; border:1px solid #e5e7eb;"><strong>New Employee Onboarding (TQC)</strong> — Manage new hire training and qualification tracking</td>
    </tr>
    <tr>
      <td style="padding:10px 16px; border:1px solid #e5e7eb; background:#eff6ff; font-weight:600; text-align:center;">4</td>
      <td style="padding:10px 16px; border:1px solid #e5e7eb;"><strong>Quality Management (CAPA)</strong> — Handle quality issues with structured corrective actions</td>
    </tr>
    <tr>
      <td style="padding:10px 16px; border:1px solid #e5e7eb; background:#eff6ff; font-weight:600; text-align:center;">5</td>
      <td style="padding:10px 16px; border:1px solid #e5e7eb;"><strong>Project Management</strong> — Tasks, Kanban, Gantt charts, automations, and team messaging</td>
    </tr>
    <tr>
      <td style="padding:10px 16px; border:1px solid #e5e7eb; background:#eff6ff; font-weight:600; text-align:center;">6</td>
      <td style="padding:10px 16px; border:1px solid #e5e7eb;"><strong>Employee Development</strong> — Competency mapping and skill gap analysis</td>
    </tr>
    <tr>
      <td style="padding:10px 16px; border:1px solid #e5e7eb; background:#eff6ff; font-weight:600; text-align:center;">7</td>
      <td style="padding:10px 16px; border:1px solid #e5e7eb;"><strong>Knowledge Base & Training Plans</strong> — Training materials library and annual planning</td>
    </tr>
    <tr>
      <td style="padding:10px 16px; border:1px solid #e5e7eb; background:#eff6ff; font-weight:600; text-align:center;">8</td>
      <td style="padding:10px 16px; border:1px solid #e5e7eb;"><strong>Analytics & Dashboards</strong> — Real-time KPIs, reports, and data-driven insights</td>
    </tr>
  </table>

  <p style="font-size:15px; line-height:1.7; margin:0 0 16px 0;">
    Each category is explained through <strong>real-world scenarios</strong> featuring fictional characters in a factory setting,
    making it easy to understand how the system applies to actual workflows.
  </p>

  <!-- Attachments Info -->
  <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:20px; margin:0 0 24px 0;">
    <h3 style="margin:0 0 12px 0; color:#166534; font-size:16px;">Attached Files</h3>
    <table style="width:100%; border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0; vertical-align:top; width:24px;">📎</td>
        <td style="padding:8px 0;">
          <strong>Q-TRAIN_Complete_Guide_EN.pptx</strong> (English)<br>
          <span style="color:#6b7280; font-size:13px;">18 slides — Full system guide with 8 categories and scenario-based explanations</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0; vertical-align:top;">📎</td>
        <td style="padding:8px 0;">
          <strong>Q-TRAIN_System_Guide.pptx</strong> (Korean / 한국어)<br>
          <span style="color:#6b7280; font-size:13px;">15 slides — Training-focused guide with simulation story</span>
        </td>
      </tr>
    </table>
  </div>

  <!-- How to Use -->
  <div style="background:#eff6ff; border:1px solid #93c5fd; border-radius:8px; padding:20px; margin:0 0 24px 0;">
    <h3 style="margin:0 0 12px 0; color:#1e40af; font-size:16px;">How to Use These Guides</h3>
    <ul style="margin:0; padding:0 0 0 20px; font-size:14px; line-height:1.8;">
      <li><strong>For training sessions</strong> — Use as presentation material to introduce Q-TRAIN to teams</li>
      <li><strong>For self-study</strong> — Review each category to understand the features relevant to your role</li>
      <li><strong>For reference</strong> — Keep as a quick reference for system navigation and workflows</li>
      <li><strong>For onboarding</strong> — Share with new team members as part of their orientation</li>
    </ul>
  </div>

  <p style="font-size:15px; line-height:1.7; margin:0 0 20px 0;">
    The Q-TRAIN system is accessible at: <a href="https://q-train-web.web.app/" style="color:#1e40af; font-weight:600;">https://q-train-web.web.app/</a>
  </p>

  <p style="font-size:15px; line-height:1.7; margin:0 0 8px 0;">
    If you have any questions or feedback about the system or these guides, please don't hesitate to reach out.
  </p>

  <p style="font-size:15px; line-height:1.7; margin:24px 0 0 0;">
    Best regards,<br>
    <strong>Q-TRAIN System Team</strong><br>
    <span style="color:#6b7280; font-size:13px;">HWK Vietnam — Quality Improvement Program</span>
  </p>

</div>

<!-- Footer -->
<div style="background-color:#f3f4f6; padding:16px 32px; border-top:1px solid #e5e7eb;">
  <p style="margin:0; font-size:12px; color:#9ca3af; text-align:left;">
    This email was sent by the Q-TRAIN System. For support, contact the QA department.
  </p>
</div>

</body>
</html>`;

async function main() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  const mailOptions = {
    from: `"Q-TRAIN System" <${GMAIL_USER}>`,
    to: RECIPIENTS.join(', '),
    subject: 'Q-TRAIN System User Guide — English & Korean Presentations Attached',
    html: htmlBody,
    attachments: [
      {
        filename: 'Q-TRAIN_Complete_Guide_EN.pptx',
        path: EN_GUIDE,
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      },
      {
        filename: 'Q-TRAIN_System_Guide_KO.pptx',
        path: KO_GUIDE,
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      },
    ],
  };

  console.log('Sending Q-TRAIN Guide email...');
  console.log(`To: ${RECIPIENTS.join(', ')}`);
  console.log(`Attachments: 2 files`);

  const info = await transporter.sendMail(mailOptions);
  console.log(`\nSent successfully!`);
  console.log(`Message ID: ${info.messageId}`);
}

main().catch(err => {
  console.error('Failed to send:', err.message);
  process.exit(1);
});
