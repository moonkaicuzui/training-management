/**
 * Send Q-TRAIN Master Data Registration Request Email (v2)
 * - Employees removed (already in system)
 * - Left-aligned, full-width layout
 * - Note to ignore previous email
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const GMAIL_USER = 'kaicuzuikaicuzuikaicuzui@gmail.com';
const GMAIL_APP_PASSWORD = 'itbfaoahvzdgwddz';

const RECIPIENTS = ['ksmoon@hsvina.com', 'hwk_qa@hsvina.com'];

const TEMPLATE_PATH = path.join(__dirname, 'Q-TRAIN_Master_Data_Template.xlsx');

// ─── Email HTML (left-aligned, full-width) ───────────────────────────────────

const htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; color:#1f2937; background-color:#ffffff;">

<!-- Header -->
<div style="background-color:#1e40af; padding:24px 32px;">
  <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700;">Q-TRAIN System</h1>
  <p style="margin:6px 0 0; color:#bfdbfe; font-size:14px;">Master Data Registration Request</p>
</div>

<!-- Body -->
<div style="padding:28px 32px; text-align:left;">

<!-- Ignore previous email notice -->
<div style="background-color:#fef2f2; border:1px solid #fecaca; padding:14px 18px; margin:0 0 24px; border-radius:6px;">
  <p style="margin:0; font-size:14px; color:#991b1b; line-height:1.5;">
    <strong>Note:</strong> Please disregard the previous email sent earlier today with the same subject.
    This is the updated version with corrected content. Please reply to <strong>this email</strong> only.
  </p>
</div>

<p style="font-size:15px; line-height:1.7; margin:0 0 20px;">Dear Team,</p>

<p style="font-size:15px; line-height:1.7; margin:0 0 20px;">
We are setting up the <strong>Q-TRAIN Training Management System</strong> for HWK Vietnam.
<strong>Employee data and Training Programs</strong> are already registered in the system.
To make the system fully operational, we need the following <strong>4 additional datasets</strong> to be prepared and submitted.
</p>

<!-- Summary Table -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 28px;">
<tr style="background-color:#1e40af;">
  <th style="padding:10px 14px; text-align:left; color:#fff; font-size:13px; border:1px solid #1e40af; width:30px;">#</th>
  <th style="padding:10px 14px; text-align:left; color:#fff; font-size:13px; border:1px solid #1e40af; width:140px;">Data Category</th>
  <th style="padding:10px 14px; text-align:left; color:#fff; font-size:13px; border:1px solid #1e40af;">Description</th>
  <th style="padding:10px 14px; text-align:center; color:#fff; font-size:13px; border:1px solid #1e40af; width:90px;">Priority</th>
</tr>
<tr>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px;">1</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px; font-weight:600;">Trainers</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px;">Internal &amp; external trainers — name, type (internal/external), department or company, email, phone, specializations (which programs they teach), certifications</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px; text-align:center;"><span style="background:#f59e0b; color:#fff; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600;">HIGH</span></td>
</tr>
<tr style="background-color:#f9fafb;">
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px;">2</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px; font-weight:600;">Competencies</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px;">Competency framework — code, names in 3 languages (English/Vietnamese/Korean), category, description, whether it is a core competency, related training programs</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px; text-align:center;"><span style="background:#f59e0b; color:#fff; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600;">HIGH</span></td>
</tr>
<tr>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px;">3</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px; font-weight:600;">TQC Teams</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px;">New-employee training team structure — team names (EN/VI/KR), factory/building assignment, production line</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px; text-align:center;"><span style="background:#6366f1; color:#fff; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600;">MEDIUM</span></td>
</tr>
<tr style="background-color:#f9fafb;">
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px;">4</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px; font-weight:600;">Training Costs</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px;">Historical &amp; planned costs per program per month — trainer fees, material costs, facility costs, other costs</td>
  <td style="padding:10px 14px; border:1px solid #e5e7eb; font-size:13px; text-align:center;"><span style="background:#6366f1; color:#fff; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600;">MEDIUM</span></td>
</tr>
</table>

<!-- Attachment info -->
<div style="background-color:#eff6ff; border-left:4px solid #2563eb; padding:16px 20px; margin:0 0 28px;">
  <p style="margin:0 0 8px; font-weight:600; font-size:14px; color:#1e40af;">Attached: Q-TRAIN_Master_Data_Template.xlsx</p>
  <p style="margin:0; font-size:13px; color:#374151; line-height:1.6;">
    The attached Excel file contains <strong>4 worksheets</strong> (one per data category above) with:
  </p>
  <ul style="margin:8px 0 0; padding-left:20px; font-size:13px; color:#374151; line-height:1.8;">
    <li>Column headers with field descriptions</li>
    <li>Yellow example rows showing the expected data format</li>
    <li>Dropdown lists for standardized values (trainer type, competency category, etc.)</li>
    <li>An Instructions sheet with detailed guidance</li>
  </ul>
</div>

<!-- Details & Examples -->
<h2 style="font-size:17px; color:#1e40af; border-bottom:2px solid #dbeafe; padding-bottom:8px; margin:0 0 20px;">Details &amp; Examples</h2>

<!-- 1. Trainers -->
<h3 style="font-size:15px; color:#1f2937; margin:24px 0 8px;">1. Trainer Data</h3>
<p style="font-size:14px; line-height:1.6; margin:0 0 12px; color:#4b5563;">
All internal and external trainers who conduct training sessions. Include their specializations (which program codes they are qualified to teach).
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 8px; font-size:13px;">
<tr style="background-color:#f3f4f6;">
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">trainer_name</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">type</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">department / company</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">email</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">specializations</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">certifications</th>
</tr>
<tr>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Kim Anh</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">INTERNAL</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">QA</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">kimanh@hsvina.com</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">QIP-001, QIP-002, QIP-003</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">ISO 9001 Auditor</td>
</tr>
<tr style="background-color:#f9fafb;">
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Dr. Park Jihun</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">EXTERNAL</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Korea Quality Institute</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">parkjh@kqi.co.kr</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">QIP-010, QIP-011</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">PhD Quality Eng., 6 Sigma BB</td>
</tr>
</table>
<p style="font-size:12px; color:#6b7280; margin:0 0 20px;">
Type must be either <strong>INTERNAL</strong> (HWK employee) or <strong>EXTERNAL</strong> (outside company).
For internal trainers, fill in the "department" column. For external trainers, fill in the "company" column.
</p>

<!-- 2. Competencies -->
<h3 style="font-size:15px; color:#1f2937; margin:24px 0 8px;">2. Competency Framework</h3>
<p style="font-size:14px; line-height:1.6; margin:0 0 12px; color:#4b5563;">
Define the competencies (skills and knowledge areas) that employees should develop through training.
This data powers the <strong>skill gap analysis</strong> and <strong>learning path recommendations</strong> in the system.
Names are required in <strong>3 languages</strong>: English, Vietnamese, and Korean.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 8px; font-size:13px;">
<tr style="background-color:#f3f4f6;">
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">code</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">name (EN)</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">name (VI)</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">name (KR)</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">category</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">core?</th>
</tr>
<tr>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">COMP-001</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Visual Inspection</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Ki\u1EC3m tra tr\u1EF1c quan</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">\uC678\uAD00 \uAC80\uC0AC</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">QUALITY</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">YES</td>
</tr>
<tr style="background-color:#f9fafb;">
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">COMP-002</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Stitching Quality Control</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Ki\u1EC3m so\u00E1t ch\u1EA5t l\u01B0\u1EE3ng may</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">\uBD09\uC81C \uD488\uC9C8 \uAD00\uB9AC</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">TECHNICAL</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">YES</td>
</tr>
<tr>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">COMP-003</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Safety Procedures</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Quy tr\u00ECnh an to\u00E0n</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">\uC548\uC804 \uC808\uCC28</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">SAFETY</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">YES</td>
</tr>
<tr style="background-color:#f9fafb;">
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">COMP-004</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Team Leadership</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">L\u00E3nh \u0111\u1EA1o nh\u00F3m</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">\uD300 \uB9AC\uB354\uC2ED</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">LEADERSHIP</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">NO</td>
</tr>
</table>
<p style="font-size:12px; color:#6b7280; margin:0 0 20px;">
<strong>Valid categories:</strong> TECHNICAL, QUALITY, SAFETY, LEADERSHIP, COMMUNICATION, PROCESS<br>
<strong>Core competency:</strong> YES if this is a critical skill required for all relevant positions; NO if supplementary.
</p>

<!-- 3. TQC Teams -->
<h3 style="font-size:15px; color:#1f2937; margin:24px 0 8px;">3. TQC Teams</h3>
<p style="font-size:14px; line-height:1.6; margin:0 0 12px; color:#4b5563;">
Team structure for new employee (TQC) training. Each team is assigned to a specific factory/building and production line.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 8px; font-size:13px;">
<tr style="background-color:#f3f4f6;">
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">team_name</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">team_name (VI)</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">team_name (KR)</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">factory</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">line</th>
</tr>
<tr>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Team Alpha</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">\u0110\u1ED9i Alpha</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">\uC54C\uD30C\uD300</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">BUILDING_A</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">L1</td>
</tr>
<tr style="background-color:#f9fafb;">
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">Team Beta</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">\u0110\u1ED9i Beta</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">\uBCA0\uD0C0\uD300</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">BUILDING_B</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">L2</td>
</tr>
</table>
<p style="font-size:12px; color:#6b7280; margin:0 0 20px;">&nbsp;</p>

<!-- 4. Training Costs -->
<h3 style="font-size:15px; color:#1f2937; margin:24px 0 8px;">4. Training Costs (Optional but Recommended)</h3>
<p style="font-size:14px; line-height:1.6; margin:0 0 12px; color:#4b5563;">
Cost data per training program per month. This enables <strong>ROI analysis</strong> and <strong>budget tracking</strong> in the system dashboard.
Include trainer fees, material costs, facility costs, and any other expenses.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 8px; font-size:13px;">
<tr style="background-color:#f3f4f6;">
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">program_code</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:left;">period</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">trainer_cost (VND)</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">material_cost (VND)</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">facility_cost (VND)</th>
  <th style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">other_cost (VND)</th>
</tr>
<tr>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">QIP-001</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">2026-01</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">5,000,000</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">1,200,000</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">500,000</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">300,000</td>
</tr>
<tr style="background-color:#f9fafb;">
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">QIP-002</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb;">2026-01</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">8,000,000</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">2,000,000</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">500,000</td>
  <td style="padding:8px 12px; border:1px solid #e5e7eb; text-align:right;">0</td>
</tr>
</table>
<p style="font-size:12px; color:#6b7280; margin:0 0 20px;">
Period format: <strong>YYYY-MM</strong> (e.g., 2026-01 for January 2026). All costs in VND.
</p>

<!-- Action Required -->
<div style="background-color:#fef3c7; border-left:4px solid #f59e0b; padding:16px 20px; margin:28px 0;">
  <p style="margin:0 0 8px; font-weight:700; font-size:15px; color:#92400e;">Action Required</p>
  <ol style="margin:0; padding-left:20px; font-size:14px; color:#78350f; line-height:2;">
    <li>Download the attached Excel template</li>
    <li>Fill in each sheet with your data (replace the yellow example rows)</li>
    <li>Use the dropdown lists provided for standardized fields</li>
    <li>Priority order: <strong>Trainers &amp; Competencies first</strong>, then TQC Teams &amp; Costs</li>
    <li><strong>Reply to this email</strong> with the completed file attached</li>
  </ol>
</div>

<p style="font-size:14px; line-height:1.6; margin:24px 0 0; color:#4b5563;">
If you have any questions about the data format or need help filling in the template,
please don't hesitate to reach out.
</p>

<p style="font-size:15px; line-height:1.7; margin:28px 0 0;">
Best regards,<br>
<strong>Q-TRAIN System Administrator</strong><br>
<span style="color:#6b7280; font-size:13px;">HWK Vietnam — QIP Training Management</span>
</p>

</div>

<!-- Footer -->
<div style="background-color:#f3f4f6; padding:16px 32px; border-top:1px solid #e5e7eb;">
  <p style="margin:0; font-size:11px; color:#9ca3af; text-align:left;">
    This is an automated message from the Q-TRAIN system. &copy; 2026 HWK Vietnam<br>
    <a href="https://q-train-web.web.app" style="color:#2563eb; text-decoration:none;">https://q-train-web.web.app</a>
  </p>
</div>

</body>
</html>`;

// ─── Send Email ──────────────────────────────────────────────────────────────

async function sendEmail() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Template file not found: ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Q-TRAIN System" <${GMAIL_USER}>`,
    to: RECIPIENTS.join(', '),
    subject: '[Q-TRAIN] Master Data Registration Request — Please Reply to This Email',
    html: htmlBody,
    text: 'Please view this email in HTML format to see the full content and formatting.',
    attachments: [
      {
        filename: 'Q-TRAIN_Master_Data_Template.xlsx',
        path: TEMPLATE_PATH,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Recipients: ${RECIPIENTS.join(', ')}`);
    console.log(`  Attachment: Q-TRAIN_Master_Data_Template.xlsx`);
  } catch (error) {
    console.error('Failed to send email:', error.message);
    process.exit(1);
  }
}

sendEmail();
