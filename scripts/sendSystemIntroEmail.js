#!/usr/bin/env node
/**
 * Q-TRAIN 시스템 소개 이메일 발송
 *
 * PPTX 3개 파일(한국어/영어/베트남어)을 첨부하여
 * hwk_qa@hsvina.com에 시스템 소개 이메일을 발송합니다.
 *
 * 사용법: node scripts/sendSystemIntroEmail.js
 */

const path = require('path');
const { sendEmail } = require('./sendEmail');

const PPTX_DIR = path.join(__dirname, 'output');

async function main() {
  const attachments = [
    {
      filename: 'Q-TRAIN_System_Intro_KO.pptx',
      path: path.join(PPTX_DIR, 'Q-TRAIN_System_Intro_KO.pptx'),
    },
    {
      filename: 'Q-TRAIN_System_Intro_EN.pptx',
      path: path.join(PPTX_DIR, 'Q-TRAIN_System_Intro_EN.pptx'),
    },
    {
      filename: 'Q-TRAIN_System_Intro_VI.pptx',
      path: path.join(PPTX_DIR, 'Q-TRAIN_System_Intro_VI.pptx'),
    },
  ];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; }
    .section { margin-bottom: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .section-title { color: #1e40af; font-size: 18px; margin-bottom: 10px; }
    .flag { font-size: 20px; margin-right: 8px; }
    h1 { color: #1e40af; text-align: center; }
    .highlight { background: #eff6ff; padding: 12px; border-radius: 6px; border-left: 4px solid #1e40af; margin: 10px 0; }
    .login-info { background: #f0fdf4; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981; }
    .ps { background: #fefce8; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-top: 15px; }
    a { color: #1e40af; }
  </style>
</head>
<body>

<h1>Q-TRAIN Training Management System</h1>

<!-- English Section -->
<div class="section">
  <div class="section-title"><span class="flag">🇬🇧</span> English</div>

  <p>Hello,</p>

  <p>We are happy to show you the <strong>Q-TRAIN system</strong>. This system helps us manage training for all workers at our factory.</p>

  <div class="highlight">
    <strong>What can Q-TRAIN do?</strong>
    <ul>
      <li>Keep track of all training programs (67 programs)</li>
      <li>Check who passed and who needs more training</li>
      <li>Connect quality checks (AQL/5PRS) to training</li>
      <li>Manage new worker training (TQC)</li>
      <li>Track problems and solutions (CAPA)</li>
      <li>Check metal detectors every day</li>
    </ul>
  </div>

  <p>Please look at the attached files. There are 3 PowerPoint files (Korean, English, Vietnamese) that explain each page of the system.</p>

  <div class="highlight">
    <strong>What we need from you:</strong>
    <ul>
      <li>Please try the system: <a href="https://q-train-web.web.app">https://q-train-web.web.app</a></li>
      <li>Go to the <strong>"System Feedback"</strong> page in the menu</li>
      <li>Tell us what is good and what needs to be better</li>
      <li>If you find a bug, please report it there</li>
    </ul>
  </div>

  <div class="login-info">
    <strong>Login:</strong><br>
    Website: <a href="https://q-train-web.web.app">https://q-train-web.web.app</a><br>
    ID: hwk_qa@hsvina.com / PW: hwk_qa1!<br>
    <em>If you need your own ID and permissions, please ask us and we will set it up.</em>
  </div>

  <div class="ps">
    <strong>P.S.</strong><br>
    This system is a <strong>first version (draft)</strong>. We need to change it to match how we really work. That is why your feedback is very important. When you plan to move your work to this system, please talk closely with the QC team leaders to get the best results. Thank you!
  </div>
</div>

<!-- Vietnamese Section -->
<div class="section">
  <div class="section-title"><span class="flag">🇻🇳</span> Tiếng Việt</div>

  <p>Xin chào,</p>

  <p>Chúng tôi vui mừng giới thiệu <strong>hệ thống Q-TRAIN</strong>. Hệ thống này giúp quản lý đào tạo cho tất cả công nhân trong nhà máy.</p>

  <div class="highlight">
    <strong>Q-TRAIN có thể làm gì?</strong>
    <ul>
      <li>Theo dõi tất cả chương trình đào tạo (67 chương trình)</li>
      <li>Kiểm tra ai đạt và ai cần đào tạo lại</li>
      <li>Kết nối kiểm tra chất lượng (AQL/5PRS) với đào tạo</li>
      <li>Quản lý đào tạo công nhân mới (TQC)</li>
      <li>Theo dõi vấn đề và giải pháp (CAPA)</li>
      <li>Kiểm tra máy dò kim loại mỗi ngày</li>
    </ul>
  </div>

  <p>Xin hãy xem các tệp đính kèm. Có 3 tệp PowerPoint (tiếng Hàn, tiếng Anh, tiếng Việt) giải thích từng trang của hệ thống.</p>

  <div class="highlight">
    <strong>Chúng tôi cần bạn:</strong>
    <ul>
      <li>Hãy thử hệ thống: <a href="https://q-train-web.web.app">https://q-train-web.web.app</a></li>
      <li>Vào trang <strong>"Phản hồi hệ thống"</strong> trong menu</li>
      <li>Cho chúng tôi biết điều gì tốt và điều gì cần cải thiện</li>
      <li>Nếu phát hiện lỗi, xin báo cáo tại đó</li>
    </ul>
  </div>

  <div class="login-info">
    <strong>Đăng nhập:</strong><br>
    Website: <a href="https://q-train-web.web.app">https://q-train-web.web.app</a><br>
    ID: hwk_qa@hsvina.com / MK: hwk_qa1!<br>
    <em>Nếu bạn cần tài khoản riêng và quyền truy cập, hãy liên hệ và chúng tôi sẽ cài đặt.</em>
  </div>

  <div class="ps">
    <strong>P.S.</strong><br>
    Hệ thống này là <strong>bản thảo đầu tiên</strong>. Chúng ta cần thay đổi để phù hợp với cách làm việc thực tế. Vì vậy, phản hồi của bạn rất quan trọng. Khi chuẩn bị chuyển công việc sang hệ thống, xin hãy trao đổi chặt chẽ với các trưởng nhóm QC để đạt kết quả tốt nhất. Cảm ơn!
  </div>
</div>

<!-- Korean Section -->
<div class="section">
  <div class="section-title"><span class="flag">🇰🇷</span> 한국어</div>

  <p>안녕하세요,</p>

  <p><strong>Q-TRAIN 시스템</strong>을 소개합니다. 이 시스템은 공장의 모든 직원 교육을 관리하는 시스템입니다.</p>

  <div class="highlight">
    <strong>Q-TRAIN이 할 수 있는 일:</strong>
    <ul>
      <li>모든 교육 프로그램을 관리해요 (67개 프로그램)</li>
      <li>누가 합격하고 누가 재교육이 필요한지 확인해요</li>
      <li>품질 검사(AQL/5PRS)와 교육을 연결해요</li>
      <li>신입 직원 교육(TQC)을 관리해요</li>
      <li>문제와 해결방법을 추적해요 (CAPA)</li>
      <li>금속 탐지기를 매일 점검해요</li>
    </ul>
  </div>

  <p>첨부된 파일을 확인해 주세요. 한국어, 영어, 베트남어 3개의 PowerPoint 파일로 시스템의 각 페이지를 설명합니다.</p>

  <div class="highlight">
    <strong>부탁드리는 것:</strong>
    <ul>
      <li>시스템을 사용해 보세요: <a href="https://q-train-web.web.app">https://q-train-web.web.app</a></li>
      <li>메뉴에서 <strong>"시스템 피드백"</strong> 페이지로 가세요</li>
      <li>좋은 점과 개선이 필요한 점을 알려주세요</li>
      <li>버그를 발견하면 그곳에서 신고해 주세요</li>
    </ul>
  </div>

  <div class="login-info">
    <strong>접속 방법:</strong><br>
    주소: <a href="https://q-train-web.web.app">https://q-train-web.web.app</a><br>
    아이디: hwk_qa@hsvina.com / 비밀번호: hwk_qa1!<br>
    <em>개인 아이디와 권한이 필요하시면 요청해 주세요. 바로 업데이트해 드리겠습니다.</em>
  </div>

  <div class="ps">
    <strong>추신:</strong><br>
    이 시스템은 <strong>초안(Draft)</strong>입니다. 우리의 실제 업무 프로세스에 맞게 개선해야 합니다. 그래서 여러분의 피드백이 매우 중요합니다. 업무를 시스템으로 전환할 때, <strong>반드시 QC 담당자와 가깝게 소통하여 결론을 도출</strong>해 주시기 바랍니다. 감사합니다!
  </div>
</div>

<hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
<p style="color: #9ca3af; font-size: 12px; text-align: center;">
  Q-TRAIN Training Management System | HWK Vietnam QIP<br>
  이 메일은 Q-TRAIN 시스템에서 자동 발송되었습니다.
</p>

</body>
</html>
  `.trim();

  try {
    await sendEmail({
      to: 'hwk_qa@hsvina.com',
      subject: '[Q-TRAIN] Training Management System Introduction / 교육 관리 시스템 소개 / Giới thiệu hệ thống quản lý đào tạo',
      html,
      attachments,
    });
    console.log('\n✅ 시스템 소개 이메일 발송 완료!');
  } catch (error) {
    console.error('\n❌ 이메일 발송 실패:', error.message);
    process.exit(1);
  }
}

main();
