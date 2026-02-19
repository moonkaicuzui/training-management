#!/usr/bin/env python3
"""Send Q-TRAIN QIP Head Guide PPTX via Gmail SMTP"""

import smtplib
import os
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

RECIPIENTS = ["ksmoon@hsvina.com"]
SUBJECT = "[Q-TRAIN] QIP 부서장 업무 가이드 (30 슬라이드)"

# Read credentials from environment variables
GMAIL_USER = os.environ.get("GMAIL_USER")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GUIDE_FILE = os.path.join(SCRIPT_DIR, "Q-TRAIN_QIP_Head_Guide_KO.pptx")

HTML_BODY = """\
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; color:#1f2937; background-color:#ffffff;">

<!-- Header -->
<div style="background-color:#1e3a5f; padding:24px 32px;">
  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Q-TRAIN QIP 부서장 업무 가이드</h1>
  <p style="margin:6px 0 0 0; color:#93c5fd; font-size:14px;">업무 유형별 시스템 활용 종합 교육 자료</p>
</div>

<!-- Body -->
<div style="padding:32px;">

  <div style="background:#f8fafc; border-left:4px solid #2563eb; padding:20px; margin:0 0 24px 0; border-radius:0 8px 8px 0;">
    <h2 style="margin:0 0 12px 0; color:#1e3a5f; font-size:18px;">안녕하세요,</h2>
    <p style="font-size:15px; line-height:1.7; margin:0 0 16px 0;">
      Q-TRAIN 시스템의 <strong>QIP 부서장 업무 가이드</strong>를 보내드립니다.
    </p>
    <p style="font-size:15px; line-height:1.7; margin:0 0 16px 0;">
      본 가이드는 <strong>업무 유형별 9개 카테고리, 30 슬라이드</strong>로 구성되어 있으며,
      QIP 부서장이 일상 업무에서 Q-TRAIN 시스템을 효과적으로 활용하는 방법을 상세히 설명합니다.
    </p>
  </div>

  <!-- Contents -->
  <div style="background:#eff6ff; border:1px solid #93c5fd; border-radius:8px; padding:20px; margin:0 0 24px 0;">
    <h3 style="margin:0 0 12px 0; color:#1e40af; font-size:16px;">목차 (9개 카테고리)</h3>
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <tr><td style="padding:6px 0;"><strong>A.</strong> 시스템 접속 & 기본 화면</td><td style="color:#6b7280;">로그인, 메뉴 구조, 언어 전환</td></tr>
      <tr><td style="padding:6px 0;"><strong>B.</strong> 일일 업무 — 교육 현황 모니터링</td><td style="color:#6b7280;">대시보드, 알림, 일일 점검</td></tr>
      <tr><td style="padding:6px 0;"><strong>C.</strong> 교육 운영 관리</td><td style="color:#6b7280;">프로그램/일정/출석/결과</td></tr>
      <tr><td style="padding:6px 0;"><strong>D.</strong> 직원 역량 & 진도 관리</td><td style="color:#6b7280;">직원DB, 매트릭스, 역량/갭 분석</td></tr>
      <tr><td style="padding:6px 0;"><strong>E.</strong> 재교육 & 자격증 관리</td><td style="color:#6b7280;">불합격 처리, 만료 관리, 이수증</td></tr>
      <tr><td style="padding:6px 0;"><strong>F.</strong> 신입사원 교육 (New TQC)</td><td style="color:#6b7280;">4단계 교육, 면담, 퇴사 분석</td></tr>
      <tr><td style="padding:6px 0;"><strong>G.</strong> 품질 개선 활동</td><td style="color:#6b7280;">CAPA, 5PRS, 교육 추천</td></tr>
      <tr><td style="padding:6px 0;"><strong>H.</strong> 프로젝트 & 협업</td><td style="color:#6b7280;">프로젝트 관리, 과제, 캘린더</td></tr>
      <tr><td style="padding:6px 0;"><strong>I.</strong> 분석/리포트 & 시스템 관리</td><td style="color:#6b7280;">경영진 보고, 감사, 동기화</td></tr>
    </table>
  </div>

  <!-- Bonus -->
  <div style="background:#ecfdf5; border:1px solid #6ee7b7; border-radius:8px; padding:20px; margin:0 0 24px 0;">
    <h3 style="margin:0 0 8px 0; color:#047a57; font-size:16px;">추가 포함 내용</h3>
    <ul style="margin:0; padding:0 0 0 20px; font-size:14px; line-height:1.8;">
      <li><strong>사이드바 메뉴 개선 제안</strong> — 현재 7개 섹션을 9개 카테고리로 재구성하는 제안</li>
      <li><strong>QIP 부서장 업무 체크리스트</strong> — 일/주/월/분기별 정기 업무 가이드</li>
      <li><strong>핵심 규칙 & 원칙</strong> — 데이터 무결성, 자동화, 다국어, 단축키</li>
      <li><strong>FAQ</strong> — 자주 묻는 질문 8가지</li>
    </ul>
  </div>

  <!-- Attachment -->
  <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px 20px; margin:0 0 24px 0;">
    <p style="margin:0; font-size:14px;">
      &#x1F4CE; <strong>Q-TRAIN_QIP_Head_Guide_KO.pptx</strong> (30 슬라이드, 한국어)
    </p>
  </div>

  <p style="font-size:15px; line-height:1.7; margin:0 0 20px 0;">
    Q-TRAIN: <a href="https://q-train-web.web.app/" style="color:#1e40af; font-weight:600;">https://q-train-web.web.app/</a>
  </p>

  <p style="font-size:15px; line-height:1.7; margin:24px 0 0 0;">
    Best regards,<br>
    <strong>Q-TRAIN System</strong><br>
    <span style="color:#6b7280; font-size:13px;">HWK Vietnam - Quality Improvement Program</span>
  </p>

</div>

<!-- Footer -->
<div style="background-color:#f3f4f6; padding:16px 32px; border-top:1px solid #e5e7eb;">
  <p style="margin:0; font-size:12px; color:#9ca3af;">
    Contact: ksmoon@hsvina.com | Q-TRAIN System
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

    if not os.path.exists(GUIDE_FILE):
        print(f"Error: Guide file not found: {GUIDE_FILE}")
        print("Run the generation script first:")
        print("  python scripts/generate_qip_head_guide.py")
        sys.exit(1)

    # Build the email
    msg = MIMEMultipart()
    msg["From"] = f"Q-TRAIN System <{GMAIL_USER}>"
    msg["To"] = ", ".join(RECIPIENTS)
    msg["Subject"] = SUBJECT
    msg.attach(MIMEText(HTML_BODY, "html", "utf-8"))

    # Attach PPTX
    attach_file(msg, GUIDE_FILE)

    file_size = os.path.getsize(GUIDE_FILE)
    print(f"Sending QIP Head Guide email...")
    print(f"  From: {GMAIL_USER}")
    print(f"  To: {', '.join(RECIPIENTS)}")
    print(f"  Attachment: Q-TRAIN_QIP_Head_Guide_KO.pptx ({file_size / 1024:.1f} KB)")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, RECIPIENTS, msg.as_string())
        print("\nSent successfully!")
    except smtplib.SMTPAuthenticationError:
        print("\nError: Authentication failed.")
        print("  Generate an App Password at: https://myaccount.google.com/apppasswords")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
