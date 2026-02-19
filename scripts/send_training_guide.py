#!/usr/bin/env python3
"""Send Q-TRAIN Training Guide PPTX files via Gmail SMTP"""

import smtplib
import os
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

RECIPIENTS = ["hwk_qa@hsvina.com", "ksmoon@hsvina.com"]
SUBJECT = "[Q-TRAIN] Training Management Guide / 교육 관리 가이드"

# Read credentials from environment variables
GMAIL_USER = os.environ.get("GMAIL_USER")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
KO_GUIDE = os.path.join(SCRIPT_DIR, "Q-TRAIN_Training_Guide_KO.pptx")
EN_GUIDE = os.path.join(SCRIPT_DIR, "Q-TRAIN_Training_Guide_EN.pptx")

HTML_BODY = """\
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; color:#1f2937; background-color:#ffffff;">

<!-- Header -->
<div style="background-color:#1e40af; padding:24px 32px;">
  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Q-TRAIN Training Management Guide</h1>
  <p style="margin:6px 0 0 0; color:#93c5fd; font-size:14px;">HWK Vietnam QIP Training Management System</p>
</div>

<!-- Body -->
<div style="padding:32px;">

  <!-- Korean Section -->
  <div style="background:#f8fafc; border-left:4px solid #2563eb; padding:20px; margin:0 0 24px 0; border-radius:0 8px 8px 0;">
    <h2 style="margin:0 0 12px 0; color:#1e3a5f; font-size:18px;">안녕하세요,</h2>
    <p style="font-size:15px; line-height:1.7; margin:0 0 16px 0;">
      Q-TRAIN <strong>관리 모듈 업데이트 가이드</strong>를 첨부하여 보내드립니다.
    </p>
    <p style="font-size:15px; line-height:1.7; margin:0 0 16px 0;">
      본 가이드는 <strong>8가지 실무 시나리오</strong>를 통해 Q-TRAIN 관리 기능을 설명합니다:
    </p>
    <ol style="margin:0; padding:0 0 0 20px; font-size:14px; line-height:2;">
      <li>신규 교육 프로그램 등록</li>
      <li>교육 세션 스케줄링 &amp; 결과 입력</li>
      <li>불합격자 재교육 관리</li>
      <li>TQC 신입교육 프로세스</li>
      <li>5PRS 교육 추천 시스템 활용</li>
      <li>CAPA 프로세스 연동</li>
      <li>역량 매트릭스 관리</li>
      <li>대시보드 &amp; 리포트 활용</li>
    </ol>
  </div>

  <!-- English Section -->
  <div style="background:#f8fafc; border-left:4px solid #059669; padding:20px; margin:0 0 24px 0; border-radius:0 8px 8px 0;">
    <h2 style="margin:0 0 12px 0; color:#1e3a5f; font-size:18px;">Dear Team,</h2>
    <p style="font-size:15px; line-height:1.7; margin:0 0 16px 0;">
      Please find attached the <strong>Q-TRAIN Admin Module Update Guide</strong> in both Korean and English.
    </p>
    <p style="font-size:15px; line-height:1.7; margin:0 0 16px 0;">
      The guide covers <strong>8 practical scenarios</strong> to help you understand the Q-TRAIN management features,
      including program registration, session scheduling, retraining management, TQC onboarding,
      5PRS recommendations, CAPA integration, competency management, and dashboard reporting.
    </p>
  </div>

  <!-- Attachments Info -->
  <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:20px; margin:0 0 24px 0;">
    <h3 style="margin:0 0 12px 0; color:#166534; font-size:16px;">Attached Files / 첨부 파일</h3>
    <table style="width:100%; border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0; vertical-align:top; width:30px;">&#x1F4CE;</td>
        <td style="padding:8px 0;">
          <strong>Q-TRAIN_Training_Guide_KO.pptx</strong> (Korean / 한국어)<br>
          <span style="color:#6b7280; font-size:13px;">8가지 시나리오 기반 관리 모듈 업데이트 가이드</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0; vertical-align:top;">&#x1F4CE;</td>
        <td style="padding:8px 0;">
          <strong>Q-TRAIN_Training_Guide_EN.pptx</strong> (English)<br>
          <span style="color:#6b7280; font-size:13px;">8 scenario-based admin module update guide</span>
        </td>
      </tr>
    </table>
  </div>

  <p style="font-size:15px; line-height:1.7; margin:0 0 20px 0;">
    Q-TRAIN: <a href="https://q-train-web.web.app/" style="color:#1e40af; font-weight:600;">https://q-train-web.web.app/</a>
  </p>

  <p style="font-size:15px; line-height:1.7; margin:24px 0 0 0;">
    Best regards,<br>
    <strong>Q-TRAIN System Team</strong><br>
    <span style="color:#6b7280; font-size:13px;">HWK Vietnam - Quality Improvement Program</span>
  </p>

</div>

<!-- Footer -->
<div style="background-color:#f3f4f6; padding:16px 32px; border-top:1px solid #e5e7eb;">
  <p style="margin:0; font-size:12px; color:#9ca3af; text-align:left;">
    Contact: ksmoon@hsvina.com | This email was sent by the Q-TRAIN System.
  </p>
</div>

</body>
</html>
"""


def attach_file(msg, filepath):
    """Attach a file to the email message."""
    filename = os.path.basename(filepath)
    with open(filepath, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f"attachment; filename={filename}")
    msg.attach(part)


def main():
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("Error: GMAIL_USER and GMAIL_APP_PASSWORD environment variables must be set.")
        print("  export GMAIL_USER=your-email@gmail.com")
        print("  export GMAIL_APP_PASSWORD=your-app-password")
        sys.exit(1)

    # Verify attachment files exist
    missing = []
    for fpath in [KO_GUIDE, EN_GUIDE]:
        if not os.path.exists(fpath):
            missing.append(fpath)
    if missing:
        print("Error: The following attachment files were not found:")
        for f in missing:
            print(f"  {f}")
        print("\nRun the generation scripts first:")
        print("  python scripts/generate_training_guide_ko.py")
        print("  python scripts/generate_training_guide_en.py")
        sys.exit(1)

    # Build the email
    msg = MIMEMultipart()
    msg["From"] = f"Q-TRAIN System <{GMAIL_USER}>"
    msg["To"] = ", ".join(RECIPIENTS)
    msg["Subject"] = SUBJECT
    msg.attach(MIMEText(HTML_BODY, "html", "utf-8"))

    # Attach PPTX files
    attach_file(msg, KO_GUIDE)
    attach_file(msg, EN_GUIDE)

    # Send via Gmail SMTP
    print(f"Sending Q-TRAIN Training Guide email...")
    print(f"  From: {GMAIL_USER}")
    print(f"  To: {', '.join(RECIPIENTS)}")
    print(f"  Attachments: 2 files")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, RECIPIENTS, msg.as_string())
        print("\nSent successfully!")
    except smtplib.SMTPAuthenticationError:
        print("\nError: Authentication failed. Check your GMAIL_USER and GMAIL_APP_PASSWORD.")
        print("  Note: You need a Gmail App Password, not your regular password.")
        print("  Generate one at: https://myaccount.google.com/apppasswords")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: Failed to send email: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
