#!/usr/bin/env python3
"""Send Q-TRAIN Scenario Training Guides (KO/EN/VI) via Gmail SMTP"""

import smtplib
import os
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

RECIPIENTS = ["ksmoon@hsvina.com"]
SUBJECT = "[Q-TRAIN] Scenario-Based Training Guide / 시나리오 기반 교육 가이드 (KO/EN/VI)"

GMAIL_USER = os.environ.get("GMAIL_USER")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FILES = [
    os.path.join(SCRIPT_DIR, "Q-TRAIN_Scenario_Training_KO.pptx"),
    os.path.join(SCRIPT_DIR, "Q-TRAIN_Scenario_Training_EN.pptx"),
    os.path.join(SCRIPT_DIR, "Q-TRAIN_Scenario_Training_VI.pptx"),
]

HTML_BODY = """\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; color:#1f2937; background:#fff;">

<div style="background:#1e3a5f; padding:24px 32px;">
  <h1 style="margin:0; color:#fff; font-size:24px;">Q-TRAIN Scenario-Based Training Guide</h1>
  <p style="margin:6px 0 0; color:#93c5fd; font-size:14px;">시나리오 기반 실무 교육 가이드 | Hướng dẫn đào tạo theo kịch bản</p>
</div>

<div style="padding:32px;">
  <div style="background:#f8fafc; border-left:4px solid #2563eb; padding:20px; margin:0 0 24px; border-radius:0 8px 8px 0;">
    <p style="font-size:15px; line-height:1.7; margin:0 0 12px;">
      Q-TRAIN 시스템의 <strong>시나리오 기반 교육 가이드</strong>를 보내드립니다.<br>
      Attached are the <strong>scenario-based training guides</strong> for Q-TRAIN system.<br>
      Đính kèm là <strong>hướng dẫn đào tạo theo kịch bản</strong> cho hệ thống Q-TRAIN.
    </p>
    <p style="font-size:15px; line-height:1.7; margin:0;">
      총 <strong>8가지 실무 시나리오</strong>를 통해 시스템 사용법을 상세히 설명합니다.
    </p>
  </div>

  <div style="background:#eff6ff; border:1px solid #93c5fd; border-radius:8px; padding:20px; margin:0 0 24px;">
    <h3 style="margin:0 0 12px; color:#1e40af; font-size:16px;">8 Scenarios / 8가지 시나리오</h3>
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <tr><td style="padding:5px 0;"><strong>A.</strong> Daily Morning Routine / 출근 후 일일 업무</td></tr>
      <tr><td style="padding:5px 0;"><strong>B.</strong> Register New Training Program / 신규 교육 프로그램 등록</td></tr>
      <tr><td style="padding:5px 0;"><strong>C.</strong> Conduct Session & Enter Results / 교육 실시 & 결과 입력</td></tr>
      <tr><td style="padding:5px 0;"><strong>D.</strong> Handle Failed Trainees / 불합격자 재교육</td></tr>
      <tr><td style="padding:5px 0;"><strong>E.</strong> New Inspector Training (TQC) / 신입 검사원 교육</td></tr>
      <tr><td style="padding:5px 0;"><strong>F.</strong> Quality Issue Response (CAPA & 5PRS) / 품질 문제 대응</td></tr>
      <tr><td style="padding:5px 0;"><strong>G.</strong> Competency Matrix Management / 역량 매트릭스 관리</td></tr>
      <tr><td style="padding:5px 0;"><strong>H.</strong> Executive Reporting / 경영진 보고</td></tr>
    </table>
  </div>

  <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px 20px; margin:0 0 16px;">
    <p style="margin:0; font-size:14px;">&#x1F4CE; <strong>Q-TRAIN_Scenario_Training_KO.pptx</strong> (한국어)</p>
  </div>
  <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px 20px; margin:0 0 16px;">
    <p style="margin:0; font-size:14px;">&#x1F4CE; <strong>Q-TRAIN_Scenario_Training_EN.pptx</strong> (English)</p>
  </div>
  <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px 20px; margin:0 0 24px;">
    <p style="margin:0; font-size:14px;">&#x1F4CE; <strong>Q-TRAIN_Scenario_Training_VI.pptx</strong> (Tiếng Việt)</p>
  </div>

  <p style="font-size:15px; margin:0 0 20px;">
    Q-TRAIN: <a href="https://q-train-web.web.app/" style="color:#1e40af; font-weight:600;">https://q-train-web.web.app/</a>
  </p>

  <p style="font-size:15px; margin:24px 0 0;">
    Best regards,<br><strong>Q-TRAIN System</strong><br>
    <span style="color:#6b7280; font-size:13px;">HWK Vietnam - QIP Training Management</span>
  </p>
</div>

<div style="background:#f3f4f6; padding:16px 32px; border-top:1px solid #e5e7eb;">
  <p style="margin:0; font-size:12px; color:#9ca3af;">Contact: ksmoon@hsvina.com | Q-TRAIN System</p>
</div>

</body></html>
"""


def attach_file(msg, filepath):
    filename = os.path.basename(filepath)
    with open(filepath, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f"attachment; filename={filename}")
    msg.attach(part)


def main():
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("Error: Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.")
        sys.exit(1)

    for f in FILES:
        if not os.path.exists(f):
            print(f"Error: File not found: {f}")
            print("Run: python scripts/generate_scenario_training.py")
            sys.exit(1)

    msg = MIMEMultipart()
    msg["From"] = f"Q-TRAIN System <{GMAIL_USER}>"
    msg["To"] = ", ".join(RECIPIENTS)
    msg["Subject"] = SUBJECT
    msg.attach(MIMEText(HTML_BODY, "html", "utf-8"))

    total_size = 0
    for f in FILES:
        attach_file(msg, f)
        sz = os.path.getsize(f)
        total_size += sz
        print(f"  Attached: {os.path.basename(f)} ({sz / 1024:.1f} KB)")

    print(f"\nSending to: {', '.join(RECIPIENTS)}")
    print(f"Total attachment size: {total_size / 1024:.1f} KB")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, RECIPIENTS, msg.as_string())
        print("\nSent successfully!")
    except smtplib.SMTPAuthenticationError:
        print("\nError: Authentication failed.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
