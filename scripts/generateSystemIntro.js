#!/usr/bin/env node
/**
 * Q-TRAIN System Introduction PPTX Generator
 * Generates 3 language versions: Korean, English, Vietnamese
 * Usage: node scripts/generateSystemIntro.js
 */

const path = require('path');
const PptxGenJS = require(path.resolve(__dirname, '..', 'node_modules', 'pptxgenjs'));

const OUTPUT_DIR = path.join(__dirname, 'output');

// ═══════════════════════════════════════════════════════════════
// COLORS & STYLES
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  primary: '1e40af',      // Deep blue
  primaryDark: '1e3a8a',  // Darker blue
  primaryLight: '3b82f6',  // Lighter blue
  accent: '60a5fa',       // Accent blue
  bg: 'eff6ff',           // Light blue background
  bgDark: 'dbeafe',       // Slightly darker bg
  white: 'ffffff',
  black: '1f2937',
  gray: '6b7280',
  grayLight: 'f3f4f6',
  green: '059669',
  orange: 'ea580c',
  red: 'dc2626',
};

// ═══════════════════════════════════════════════════════════════
// TEXT CONTENT - 3 LANGUAGES
// ═══════════════════════════════════════════════════════════════

const TEXTS = {
  ko: {
    file: 'Q-TRAIN_System_Intro_KO.pptx',
    slides: [
      // 1. Cover
      {
        type: 'cover',
        title: 'Q-TRAIN',
        subtitle: '교육 관리 시스템',
        org: 'HWK Vietnam QIP',
        date: '2026.03',
        tagline: '직원 교육과 품질 관리를 한곳에서',
      },
      // 2. System Overview
      {
        type: 'content',
        title: '시스템 개요',
        description: 'Q-TRAIN은 무엇인가요?',
        bullets: [
          '목적: 직원 교육과 품질 검사를 쉽게 관리하는 웹 시스템이에요.',
          '누가 쓰나요: QIP 관리자, 교육 강사, 공장 직원 모두 사용해요.',
          '핵심 기능: 교육 프로그램, 시험 결과, 품질 검사, 자격 인증을 한곳에서 관리해요.',
          '어디서나: 컴퓨터나 핸드폰으로 어디서든 접속할 수 있어요.',
          '3개 언어: 한국어, 영어, 베트남어를 지원해요.',
        ],
      },
      // 3. Dashboard
      {
        type: 'content',
        title: '대시보드',
        description: '메인 화면에서 모든 정보를 한눈에 볼 수 있어요.',
        bullets: [
          'KPI 카드: 총 직원 수, 교육 완료율, 이번 달 교육 수 같은 숫자를 바로 볼 수 있어요.',
          '차트: 월별 교육 현황, 부서별 진행률을 그래프로 쉽게 확인해요.',
          '알림: 곧 만료되는 자격, 재교육 대상자 등 중요한 알림을 놓치지 않아요.',
          '모든 사용자가 사용: 관리자, 강사, 직원 모두 자기에게 맞는 정보를 볼 수 있어요.',
        ],
      },
      // 4. Training Programs
      {
        type: 'content',
        title: '교육 프로그램 관리',
        description: '67개 교육 프로그램을 체계적으로 관리해요.',
        bullets: [
          '6개 카테고리: QIP, PRODUCTION, RETRAINING, NEWCOMER, PROMOTION, INSPECTION',
          'QIP 부서에서 교육 계획을 세우고 관리해요.',
          '각 프로그램마다 합격 점수, 유효 기간, 대상 직급을 설정해요.',
          '새 프로그램을 추가하거나 기존 프로그램을 수정할 수 있어요.',
          '한국어, 영어, 베트남어로 프로그램 이름이 저장되어 있어요.',
        ],
      },
      // 5. Progress Matrix
      {
        type: 'content',
        title: '교육 진행 매트릭스',
        description: '누가 어떤 교육을 받았는지 한눈에 확인해요.',
        bullets: [
          '직원 × 프로그램 매트릭스: 표에서 각 직원의 교육 이수 상태를 확인해요.',
          '부서별, 직급별로 필터링해서 볼 수 있어요.',
          '아직 교육을 안 받은 항목을 바로 찾을 수 있어요.',
          '색깔로 상태를 구분해요: 초록(합격), 빨강(불합격), 회색(미이수).',
        ],
      },
      // 6. Results Input
      {
        type: 'content',
        title: '교육 결과 입력',
        description: '교육이 끝나면 강사가 결과를 입력해요.',
        bullets: [
          '강사가 교육 후에 각 직원의 점수를 입력해요.',
          '등급이 자동으로 계산돼요: AA(100점), A(90~99점), B(80~89점), C(79점 이하=불합격)',
          '불합격(C등급)이면 재교육 목록에 자동으로 올라가요.',
          '한번 입력한 결과는 삭제할 수 없어요 (기록 보존).',
          '수정할 때는 수정 이유를 남겨야 해요.',
        ],
      },
      // 7. AQL Integration
      {
        type: 'content',
        title: 'AQL 품질 검사 연동',
        description: '외부 품질 검사 결과와 자동으로 연결돼요.',
        bullets: [
          'AQL 검사 데이터를 외부 시스템에서 자동으로 가져와요.',
          '검사관의 불합격률이 높으면 교육을 자동으로 추천해요.',
          '우선순위: 심각(50% 이상), 높음(30% 이상), 보통(10% 이상)',
          '검사관 성적을 분석하고 추이를 확인할 수 있어요.',
          'Q-TRAIN 직원과 AQL 검사관을 자동으로 매칭해요.',
        ],
      },
      // 8. 5PRS Integration
      {
        type: 'content',
        title: '5PRS 검사 연동',
        description: 'TQC 검사 데이터를 분석하고 교육을 추천해요.',
        bullets: [
          '5PRS 검사 데이터를 매달 자동으로 수집해요.',
          '불량 유형별로 어떤 교육이 필요한지 추천해요.',
          '건물별, 라인별 불량 현황을 히트맵으로 보여줘요.',
          'AI 브리핑: 인공지능이 검사 결과를 분석해서 요약해줘요.',
          '추천된 교육은 바로 등록할 수 있어요.',
        ],
      },
      // 9. Inspection Training (INS-001)
      {
        type: 'content',
        title: '검사 교육 (INS-001)',
        description: '검사원의 판정 능력을 테스트해요.',
        bullets: [
          '20쌍 판정 테스트: 20개 샘플을 보고 합격/불합격을 판정해요.',
          '검사관의 판정과 교육생의 판정을 비교해서 매칭률을 계산해요.',
          '등급: AA(100%), A(95% 이상), B(85% 이상), C(85% 미만)',
          '3진 아웃 규칙: 3번 연속 불합격하면 다른 업무로 재배치해요.',
          '80% 이상 매칭해야 합격이에요.',
        ],
      },
      // 10. CAPA
      {
        type: 'content',
        title: 'CAPA 시정조치',
        description: '문제가 발견되면 5단계로 해결해요.',
        bullets: [
          '1단계 - 발견: 문제를 발견하고 기록해요.',
          '2단계 - 조사: 왜 문제가 생겼는지 원인을 찾아요.',
          '3단계 - 조치: 문제를 고치기 위한 방법을 실행해요.',
          '4단계 - 검증: 문제가 정말 해결됐는지 확인해요.',
          '5단계 - 종결: 모든 것이 확인되면 종결해요.',
          '심각도(심각/중요/경미)와 우선순위(높음/중간/낮음)를 관리해요.',
        ],
      },
      // 11. New TQC
      {
        type: 'content',
        title: '신입 TQC 교육',
        description: '새로 들어온 직원의 1개월 교육 과정을 관리해요.',
        bullets: [
          '색맹 검사: 색을 잘 구분하는지 먼저 검사해요.',
          '4단계 교육: 오리엔테이션 → 기본 교육 → 라인 배치 → 현장 평가',
          '미팅 추적: 1주, 1개월, 3개월 미팅을 자동으로 잡아줘요.',
          '교육 진행 상황을 타임라인으로 볼 수 있어요.',
          '교육을 마치면 수료증을 발급해요.',
        ],
      },
      // 12. Metal Detector
      {
        type: 'content',
        title: '금속 탐지기 검사',
        description: '매일 금속 탐지기가 잘 작동하는지 점검해요.',
        bullets: [
          '공장별, 라인별로 매일 점검 결과를 기록해요.',
          '감도(철, 스테인리스, 비철)를 확인해요.',
          '검사 실패 시 바로 시정조치를 시작해요.',
          'ISO 주차를 자동으로 계산해줘요.',
          '12주 추이를 차트로 확인할 수 있어요.',
        ],
      },
      // 13. Projects
      {
        type: 'content',
        title: '프로젝트 관리',
        description: 'QIP 부서의 과제와 프로젝트를 관리해요.',
        bullets: [
          '과제 추적: 할 일, 진행 중, 완료 상태를 관리해요.',
          '실시간 메시지: 팀원끼리 프로젝트 안에서 대화할 수 있어요.',
          '자동화 규칙: 특정 조건이 되면 자동으로 상태가 바뀌어요.',
          '캘린더: 프로젝트 일정을 달력에서 볼 수 있어요.',
          '멤버 관리: 팀원을 추가하고 역할을 지정해요.',
        ],
      },
      // 14. System Issues
      {
        type: 'content',
        title: '시스템 이슈 등록',
        description: '시스템에 문제가 있거나 개선할 점이 있으면 알려주세요.',
        bullets: [
          '버그 신고: 시스템이 이상하게 작동하면 알려주세요.',
          '개선 요청: "이런 기능이 있으면 좋겠어요"라고 제안해주세요.',
          '신규 기능 요청: 완전히 새로운 기능이 필요하면 요청해주세요.',
          '관리자가 요청을 검토하고 처리 상태를 알려줘요.',
          '모든 이슈는 기록으로 남아요.',
        ],
      },
      // 15. Workflow Diagram
      {
        type: 'workflow',
        title: '워크플로우 연계도',
        description: '각 모듈이 서로 어떻게 연결되어 있는지 보여줘요.',
        flows: [
          { from: 'AQL/5PRS 검사', arrow: '→', to: '교육 자동 추천' },
          { from: '교육 추천', arrow: '→', to: '교육 등록 & 실시' },
          { from: '교육 결과', arrow: '→', to: '합격/불합격 판정' },
          { from: '불합격', arrow: '→', to: '재교육 자동 등록' },
          { from: '품질 문제', arrow: '→', to: 'CAPA 시정조치' },
          { from: 'CAPA 완료', arrow: '→', to: '교육 효과 검증' },
        ],
        summary: '품질 검사 → 교육 → 재검사 → 개선의 선순환 구조',
      },
      // 16. Access Info
      {
        type: 'content',
        title: '접속 방법',
        description: 'Q-TRAIN에 접속하는 방법을 안내해요.',
        bullets: [
          'URL: https://q-train-web.web.app/',
          '웹 브라우저(Chrome 권장)에서 위 주소를 입력하세요.',
          '회사 이메일(@hwaseung.com, @hwaseungvina.com, @hsvina.com)로 로그인하세요.',
          'Google 계정 로그인 또는 이메일/비밀번호 로그인을 사용하세요.',
          '접속 권한이 필요하면 QIP 부서에 요청해주세요.',
          '핸드폰에서도 접속할 수 있어요 (PWA 지원).',
        ],
      },
      // 17. Feedback
      {
        type: 'closing',
        title: '피드백 요청',
        description: '여러분의 의견이 시스템을 더 좋게 만들어요!',
        bullets: [
          '시스템을 사용하면서 불편한 점이 있으면 알려주세요.',
          '"이런 기능이 있으면 좋겠다"는 아이디어를 공유해주세요.',
          '시스템 내 "이슈 등록" 기능을 이용해주세요.',
          'QIP 부서에 직접 말씀해주셔도 돼요.',
        ],
        thanks: '감사합니다!',
        contact: 'QIP 부서 | ksmoon@hsvina.com',
      },
    ],
  },

  en: {
    file: 'Q-TRAIN_System_Intro_EN.pptx',
    slides: [
      // 1. Cover
      {
        type: 'cover',
        title: 'Q-TRAIN',
        subtitle: 'Training Management System',
        org: 'HWK Vietnam QIP',
        date: '2026.03',
        tagline: 'Employee Training & Quality Management in One Place',
      },
      // 2. System Overview
      {
        type: 'content',
        title: 'System Overview',
        description: 'What is Q-TRAIN?',
        bullets: [
          'Purpose: A web system that makes it easy to manage employee training and quality checks.',
          'Who uses it: QIP managers, trainers, and factory workers all use it.',
          'Key features: Training programs, test results, quality checks, and certifications in one place.',
          'Access anywhere: You can use it on your computer or phone from anywhere.',
          '3 languages: Supports Korean, English, and Vietnamese.',
        ],
      },
      // 3. Dashboard
      {
        type: 'content',
        title: 'Dashboard',
        description: 'See all important information at a glance on the main screen.',
        bullets: [
          'KPI cards: See numbers like total employees, training completion rate, and monthly trainings right away.',
          'Charts: Easily check monthly training status and department progress with graphs.',
          'Alerts: Never miss important alerts like expiring certifications or retraining needs.',
          'For everyone: Managers, trainers, and employees all see information that matters to them.',
        ],
      },
      // 4. Training Programs
      {
        type: 'content',
        title: 'Training Program Management',
        description: 'Manage 67 training programs in an organized way.',
        bullets: [
          '6 categories: QIP, PRODUCTION, RETRAINING, NEWCOMER, PROMOTION, INSPECTION',
          'The QIP department plans and manages all training.',
          'Each program has a passing score, valid period, and target positions.',
          'You can add new programs or change existing ones.',
          'Program names are saved in Korean, English, and Vietnamese.',
        ],
      },
      // 5. Progress Matrix
      {
        type: 'content',
        title: 'Training Progress Matrix',
        description: 'See who completed which training at a glance.',
        bullets: [
          'Employee x Program matrix: Check each employee\'s training status in a table.',
          'Filter by department or position.',
          'Quickly find items that are not yet completed.',
          'Colors show status: Green (pass), Red (fail), Gray (not done).',
        ],
      },
      // 6. Results Input
      {
        type: 'content',
        title: 'Training Results Entry',
        description: 'After training, the trainer enters the results.',
        bullets: [
          'Trainers enter each employee\'s score after training.',
          'Grades are calculated automatically: AA (100), A (90-99), B (80-89), C (below 79 = fail).',
          'If someone fails (grade C), they are automatically added to the retraining list.',
          'Results cannot be deleted once entered (records are kept safe).',
          'When editing, you must write a reason for the change.',
        ],
      },
      // 7. AQL Integration
      {
        type: 'content',
        title: 'AQL Quality Inspection Link',
        description: 'Automatically connected to external quality inspection results.',
        bullets: [
          'AQL inspection data is automatically collected from an external system.',
          'If an inspector\'s fail rate is high, training is automatically recommended.',
          'Priority: Critical (over 50%), High (over 30%), Medium (over 10%).',
          'You can analyze inspector scores and track trends.',
          'Q-TRAIN employees and AQL inspectors are automatically matched.',
        ],
      },
      // 8. 5PRS Integration
      {
        type: 'content',
        title: '5PRS Inspection Link',
        description: 'Analyze TQC inspection data and recommend training.',
        bullets: [
          '5PRS inspection data is collected automatically every month.',
          'The system recommends which training is needed based on defect types.',
          'See defect status by building and line using a heatmap.',
          'AI Briefing: AI analyzes inspection results and gives you a summary.',
          'Recommended training can be registered right away.',
        ],
      },
      // 9. Inspection Training (INS-001)
      {
        type: 'content',
        title: 'Inspection Training (INS-001)',
        description: 'Test how well inspectors can judge quality.',
        bullets: [
          '20-pair test: Look at 20 samples and judge if they pass or fail.',
          'Compare the trainee\'s judgment with the inspector\'s to calculate a match rate.',
          'Grades: AA (100%), A (95%+), B (85%+), C (below 85%).',
          '3-strike rule: 3 fails in a row means reassignment to a different job.',
          'You need 80% or higher match rate to pass.',
        ],
      },
      // 10. CAPA
      {
        type: 'content',
        title: 'CAPA Corrective Action',
        description: 'When a problem is found, solve it in 5 steps.',
        bullets: [
          'Step 1 - Discovery: Find and record the problem.',
          'Step 2 - Investigation: Find out why the problem happened.',
          'Step 3 - Action: Do something to fix the problem.',
          'Step 4 - Verification: Make sure the problem is really fixed.',
          'Step 5 - Closure: When everything is confirmed, close the case.',
          'Manage severity (critical/major/minor) and priority (high/medium/low).',
        ],
      },
      // 11. New TQC
      {
        type: 'content',
        title: 'New Employee TQC Training',
        description: 'Manage the 1-month training course for new employees.',
        bullets: [
          'Color blind test: First check if the person can tell colors apart.',
          '4-stage training: Orientation → Basic Training → Line Assignment → Field Evaluation.',
          'Meeting tracking: Meetings at 1 week, 1 month, and 3 months are set up automatically.',
          'See training progress on a timeline.',
          'A certificate is issued when training is completed.',
        ],
      },
      // 12. Metal Detector
      {
        type: 'content',
        title: 'Metal Detector Inspection',
        description: 'Check every day that metal detectors are working properly.',
        bullets: [
          'Record daily inspection results for each factory and line.',
          'Check sensitivity (iron, stainless steel, non-ferrous).',
          'If inspection fails, start corrective action right away.',
          'ISO week numbers are calculated automatically.',
          'See 12-week trends in a chart.',
        ],
      },
      // 13. Projects
      {
        type: 'content',
        title: 'Project Management',
        description: 'Manage QIP department tasks and projects.',
        bullets: [
          'Task tracking: Manage to-do, in progress, and done status.',
          'Real-time messaging: Team members can chat inside the project.',
          'Automation rules: Status changes automatically when certain conditions are met.',
          'Calendar: See project schedules on a calendar.',
          'Member management: Add team members and assign roles.',
        ],
      },
      // 14. System Issues
      {
        type: 'content',
        title: 'System Issue Reporting',
        description: 'Let us know if there are problems or things to improve.',
        bullets: [
          'Bug report: Tell us if the system is not working right.',
          'Improvement request: Suggest "it would be nice if this feature existed."',
          'New feature request: Ask for a completely new feature if needed.',
          'An admin will review your request and update the status.',
          'All issues are kept as records.',
        ],
      },
      // 15. Workflow
      {
        type: 'workflow',
        title: 'Workflow Connections',
        description: 'See how each module is connected to each other.',
        flows: [
          { from: 'AQL/5PRS Inspection', arrow: '→', to: 'Auto Training Recommendation' },
          { from: 'Training Recommendation', arrow: '→', to: 'Training Registration & Delivery' },
          { from: 'Training Results', arrow: '→', to: 'Pass/Fail Decision' },
          { from: 'Fail', arrow: '→', to: 'Auto Retraining Registration' },
          { from: 'Quality Issue', arrow: '→', to: 'CAPA Corrective Action' },
          { from: 'CAPA Complete', arrow: '→', to: 'Training Effectiveness Check' },
        ],
        summary: 'Quality Check → Training → Re-check → Improvement cycle',
      },
      // 16. Access Info
      {
        type: 'content',
        title: 'How to Access',
        description: 'Here is how to access Q-TRAIN.',
        bullets: [
          'URL: https://q-train-web.web.app/',
          'Enter the address above in your web browser (Chrome recommended).',
          'Log in with your company email (@hwaseung.com, @hwaseungvina.com, @hsvina.com).',
          'Use Google account login or email/password login.',
          'If you need access, please ask the QIP department.',
          'You can also use it on your phone (PWA supported).',
        ],
      },
      // 17. Feedback
      {
        type: 'closing',
        title: 'Feedback Request',
        description: 'Your feedback makes the system better!',
        bullets: [
          'Let us know if something is hard to use or confusing.',
          'Share your ideas: "It would be great if we had this feature."',
          'Use the "Issue Registration" feature in the system.',
          'You can also talk directly to the QIP department.',
        ],
        thanks: 'Thank you!',
        contact: 'QIP Department | ksmoon@hsvina.com',
      },
    ],
  },

  vi: {
    file: 'Q-TRAIN_System_Intro_VI.pptx',
    slides: [
      // 1. Cover
      {
        type: 'cover',
        title: 'Q-TRAIN',
        subtitle: 'Hệ thống Quản lý Đào tạo',
        org: 'HWK Vietnam QIP',
        date: '2026.03',
        tagline: 'Đào tạo nhân viên và Quản lý chất lượng tại một nơi',
      },
      // 2. System Overview
      {
        type: 'content',
        title: 'Tổng quan Hệ thống',
        description: 'Q-TRAIN là gì?',
        bullets: [
          'Mục đích: Hệ thống web giúp quản lý đào tạo nhân viên và kiểm tra chất lượng dễ dàng.',
          'Ai sử dụng: Quản lý QIP, giảng viên và công nhân nhà máy đều sử dụng.',
          'Tính năng chính: Quản lý chương trình đào tạo, kết quả thi, kiểm tra chất lượng và chứng chỉ tại một nơi.',
          'Truy cập mọi nơi: Bạn có thể sử dụng trên máy tính hoặc điện thoại từ bất kỳ đâu.',
          '3 ngôn ngữ: Hỗ trợ tiếng Hàn, tiếng Anh và tiếng Việt.',
        ],
      },
      // 3. Dashboard
      {
        type: 'content',
        title: 'Bảng điều khiển',
        description: 'Xem tất cả thông tin quan trọng trên màn hình chính.',
        bullets: [
          'Thẻ KPI: Xem ngay các số liệu như tổng số nhân viên, tỷ lệ hoàn thành đào tạo, số lượng đào tạo trong tháng.',
          'Biểu đồ: Dễ dàng kiểm tra tình hình đào tạo hàng tháng và tiến độ từng bộ phận bằng đồ thị.',
          'Thông báo: Không bỏ lỡ các thông báo quan trọng như chứng chỉ sắp hết hạn hoặc cần đào tạo lại.',
          'Dành cho tất cả: Quản lý, giảng viên và nhân viên đều xem được thông tin phù hợp với mình.',
        ],
      },
      // 4. Training Programs
      {
        type: 'content',
        title: 'Quản lý Chương trình Đào tạo',
        description: 'Quản lý 67 chương trình đào tạo một cách có hệ thống.',
        bullets: [
          '6 danh mục: QIP, PRODUCTION, RETRAINING, NEWCOMER, PROMOTION, INSPECTION',
          'Bộ phận QIP lập kế hoạch và quản lý toàn bộ đào tạo.',
          'Mỗi chương trình có điểm đạt, thời hạn hiệu lực và vị trí mục tiêu.',
          'Bạn có thể thêm chương trình mới hoặc sửa chương trình hiện có.',
          'Tên chương trình được lưu bằng tiếng Hàn, tiếng Anh và tiếng Việt.',
        ],
      },
      // 5. Progress Matrix
      {
        type: 'content',
        title: 'Ma trận Tiến độ Đào tạo',
        description: 'Xem ai đã hoàn thành đào tạo nào trong nháy mắt.',
        bullets: [
          'Ma trận Nhân viên × Chương trình: Kiểm tra trạng thái đào tạo của từng nhân viên trong bảng.',
          'Lọc theo bộ phận hoặc chức vụ.',
          'Tìm nhanh các mục chưa hoàn thành.',
          'Màu sắc cho biết trạng thái: Xanh (đạt), Đỏ (không đạt), Xám (chưa học).',
        ],
      },
      // 6. Results Input
      {
        type: 'content',
        title: 'Nhập Kết quả Đào tạo',
        description: 'Sau khi đào tạo, giảng viên nhập kết quả.',
        bullets: [
          'Giảng viên nhập điểm của từng nhân viên sau khi đào tạo.',
          'Xếp hạng được tính tự động: AA (100 điểm), A (90-99), B (80-89), C (dưới 79 = không đạt).',
          'Nếu không đạt (hạng C), tự động được thêm vào danh sách đào tạo lại.',
          'Kết quả đã nhập không thể xóa (lưu giữ hồ sơ).',
          'Khi sửa, phải ghi lý do thay đổi.',
        ],
      },
      // 7. AQL Integration
      {
        type: 'content',
        title: 'Liên kết Kiểm tra Chất lượng AQL',
        description: 'Tự động kết nối với kết quả kiểm tra chất lượng bên ngoài.',
        bullets: [
          'Dữ liệu kiểm tra AQL được thu thập tự động từ hệ thống bên ngoài.',
          'Nếu tỷ lệ không đạt của kiểm tra viên cao, đào tạo được đề xuất tự động.',
          'Ưu tiên: Nghiêm trọng (trên 50%), Cao (trên 30%), Trung bình (trên 10%).',
          'Bạn có thể phân tích điểm kiểm tra viên và theo dõi xu hướng.',
          'Nhân viên Q-TRAIN và kiểm tra viên AQL được ghép nối tự động.',
        ],
      },
      // 8. 5PRS Integration
      {
        type: 'content',
        title: 'Liên kết Kiểm tra 5PRS',
        description: 'Phân tích dữ liệu kiểm tra TQC và đề xuất đào tạo.',
        bullets: [
          'Dữ liệu kiểm tra 5PRS được thu thập tự động hàng tháng.',
          'Hệ thống đề xuất đào tạo cần thiết dựa trên loại lỗi.',
          'Xem tình trạng lỗi theo tòa nhà và dây chuyền bằng bản đồ nhiệt.',
          'Tóm tắt AI: AI phân tích kết quả kiểm tra và đưa ra bản tóm tắt.',
          'Đào tạo được đề xuất có thể đăng ký ngay lập tức.',
        ],
      },
      // 9. Inspection Training (INS-001)
      {
        type: 'content',
        title: 'Đào tạo Kiểm tra (INS-001)',
        description: 'Kiểm tra khả năng đánh giá chất lượng của kiểm tra viên.',
        bullets: [
          'Bài kiểm tra 20 cặp: Xem 20 mẫu và đánh giá đạt hoặc không đạt.',
          'So sánh đánh giá của học viên với kiểm tra viên để tính tỷ lệ khớp.',
          'Xếp hạng: AA (100%), A (95% trở lên), B (85% trở lên), C (dưới 85%).',
          'Quy tắc 3 lần: 3 lần không đạt liên tiếp sẽ được chuyển sang công việc khác.',
          'Cần tỷ lệ khớp 80% trở lên để đạt.',
        ],
      },
      // 10. CAPA
      {
        type: 'content',
        title: 'CAPA Hành động Khắc phục',
        description: 'Khi phát hiện vấn đề, giải quyết theo 5 bước.',
        bullets: [
          'Bước 1 - Phát hiện: Tìm và ghi nhận vấn đề.',
          'Bước 2 - Điều tra: Tìm nguyên nhân tại sao vấn đề xảy ra.',
          'Bước 3 - Hành động: Thực hiện cách khắc phục vấn đề.',
          'Bước 4 - Xác minh: Đảm bảo vấn đề thực sự đã được giải quyết.',
          'Bước 5 - Kết thúc: Khi mọi thứ được xác nhận, đóng hồ sơ.',
          'Quản lý mức độ nghiêm trọng (nghiêm trọng/quan trọng/nhẹ) và ưu tiên (cao/trung bình/thấp).',
        ],
      },
      // 11. New TQC
      {
        type: 'content',
        title: 'Đào tạo TQC Nhân viên mới',
        description: 'Quản lý khóa đào tạo 1 tháng cho nhân viên mới.',
        bullets: [
          'Kiểm tra mù màu: Kiểm tra xem người đó có phân biệt được màu sắc không.',
          '4 giai đoạn đào tạo: Định hướng → Đào tạo cơ bản → Phân công dây chuyền → Đánh giá thực tế.',
          'Theo dõi cuộc họp: Cuộc họp lúc 1 tuần, 1 tháng và 3 tháng được tự động lên lịch.',
          'Xem tiến trình đào tạo trên dòng thời gian.',
          'Chứng chỉ được cấp khi hoàn thành đào tạo.',
        ],
      },
      // 12. Metal Detector
      {
        type: 'content',
        title: 'Kiểm tra Máy dò Kim loại',
        description: 'Kiểm tra hàng ngày để đảm bảo máy dò kim loại hoạt động tốt.',
        bullets: [
          'Ghi kết quả kiểm tra hàng ngày cho từng nhà máy và dây chuyền.',
          'Kiểm tra độ nhạy (sắt, thép không gỉ, kim loại màu).',
          'Nếu kiểm tra không đạt, bắt đầu hành động khắc phục ngay.',
          'Số tuần ISO được tính tự động.',
          'Xem xu hướng 12 tuần trên biểu đồ.',
        ],
      },
      // 13. Projects
      {
        type: 'content',
        title: 'Quản lý Dự án',
        description: 'Quản lý nhiệm vụ và dự án của bộ phận QIP.',
        bullets: [
          'Theo dõi nhiệm vụ: Quản lý trạng thái cần làm, đang làm và hoàn thành.',
          'Nhắn tin thời gian thực: Thành viên nhóm có thể trò chuyện trong dự án.',
          'Quy tắc tự động: Trạng thái tự động thay đổi khi đáp ứng điều kiện nhất định.',
          'Lịch: Xem lịch trình dự án trên lịch.',
          'Quản lý thành viên: Thêm thành viên nhóm và phân công vai trò.',
        ],
      },
      // 14. System Issues
      {
        type: 'content',
        title: 'Báo cáo Sự cố Hệ thống',
        description: 'Hãy cho chúng tôi biết nếu có vấn đề hoặc cần cải thiện.',
        bullets: [
          'Báo lỗi: Hãy cho biết nếu hệ thống hoạt động không đúng.',
          'Yêu cầu cải thiện: Đề xuất "sẽ tốt hơn nếu có tính năng này."',
          'Yêu cầu tính năng mới: Yêu cầu tính năng hoàn toàn mới nếu cần.',
          'Quản trị viên sẽ xem xét yêu cầu và cập nhật trạng thái.',
          'Tất cả sự cố đều được lưu làm hồ sơ.',
        ],
      },
      // 15. Workflow
      {
        type: 'workflow',
        title: 'Sơ đồ Luồng công việc',
        description: 'Xem các module kết nối với nhau như thế nào.',
        flows: [
          { from: 'Kiểm tra AQL/5PRS', arrow: '→', to: 'Đề xuất Đào tạo tự động' },
          { from: 'Đề xuất Đào tạo', arrow: '→', to: 'Đăng ký & Thực hiện Đào tạo' },
          { from: 'Kết quả Đào tạo', arrow: '→', to: 'Quyết định Đạt/Không đạt' },
          { from: 'Không đạt', arrow: '→', to: 'Tự động Đăng ký Đào tạo lại' },
          { from: 'Vấn đề Chất lượng', arrow: '→', to: 'CAPA Hành động Khắc phục' },
          { from: 'CAPA Hoàn thành', arrow: '→', to: 'Kiểm tra Hiệu quả Đào tạo' },
        ],
        summary: 'Kiểm tra Chất lượng → Đào tạo → Kiểm tra lại → Chu trình Cải thiện',
      },
      // 16. Access Info
      {
        type: 'content',
        title: 'Cách Truy cập',
        description: 'Đây là cách truy cập Q-TRAIN.',
        bullets: [
          'URL: https://q-train-web.web.app/',
          'Nhập địa chỉ trên vào trình duyệt web (khuyến nghị Chrome).',
          'Đăng nhập bằng email công ty (@hwaseung.com, @hwaseungvina.com, @hsvina.com).',
          'Sử dụng đăng nhập tài khoản Google hoặc đăng nhập email/mật khẩu.',
          'Nếu bạn cần quyền truy cập, hãy liên hệ bộ phận QIP.',
          'Bạn cũng có thể sử dụng trên điện thoại (hỗ trợ PWA).',
        ],
      },
      // 17. Feedback
      {
        type: 'closing',
        title: 'Yêu cầu Phản hồi',
        description: 'Phản hồi của bạn giúp hệ thống tốt hơn!',
        bullets: [
          'Hãy cho chúng tôi biết nếu có gì khó sử dụng hoặc khó hiểu.',
          'Chia sẻ ý tưởng: "Sẽ tuyệt vời nếu chúng ta có tính năng này."',
          'Sử dụng tính năng "Báo cáo Sự cố" trong hệ thống.',
          'Bạn cũng có thể nói trực tiếp với bộ phận QIP.',
        ],
        thanks: 'Cảm ơn bạn!',
        contact: 'Bộ phận QIP | ksmoon@hsvina.com',
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// SLIDE GENERATORS
// ═══════════════════════════════════════════════════════════════

function addSlideNumber(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: 8.5, y: 7.0, w: 1.2, h: 0.3,
    fontSize: 8, color: COLORS.gray,
    align: 'right',
  });
}

function addFooter(slide) {
  // Bottom line
  slide.addShape('rect', {
    x: 0, y: 7.15, w: 10, h: 0.03,
    fill: { color: COLORS.primaryLight },
  });
  slide.addText('Q-TRAIN Training Management System | HWK Vietnam QIP', {
    x: 0.4, y: 7.2, w: 6, h: 0.3,
    fontSize: 7, color: COLORS.gray,
  });
}

function createCoverSlide(pptx, data) {
  const slide = pptx.addSlide();

  // Full blue background
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 7.5,
    fill: { color: COLORS.primary },
  });

  // Accent stripe
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 0.15,
    fill: { color: COLORS.accent },
  });

  // Bottom accent
  slide.addShape('rect', {
    x: 0, y: 7.0, w: 10, h: 0.5,
    fill: { color: COLORS.primaryDark },
  });

  // Title
  slide.addText(data.title, {
    x: 0.8, y: 1.5, w: 8.4, h: 1.5,
    fontSize: 54, fontFace: 'Arial',
    color: COLORS.white, bold: true,
    align: 'center',
  });

  // Subtitle
  slide.addText(data.subtitle, {
    x: 0.8, y: 3.0, w: 8.4, h: 0.8,
    fontSize: 28, fontFace: 'Arial',
    color: COLORS.accent,
    align: 'center',
  });

  // Tagline
  slide.addText(data.tagline, {
    x: 1.5, y: 4.2, w: 7, h: 0.6,
    fontSize: 16, fontFace: 'Arial',
    color: COLORS.white,
    align: 'center',
    italic: true,
  });

  // Org + Date
  slide.addText(`${data.org}  |  ${data.date}`, {
    x: 0.8, y: 7.05, w: 8.4, h: 0.4,
    fontSize: 12, fontFace: 'Arial',
    color: COLORS.accent,
    align: 'center',
  });
}

function createContentSlide(pptx, data, slideNum, totalSlides) {
  const slide = pptx.addSlide();

  // Header background
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 1.2,
    fill: { color: COLORS.primary },
  });

  // Slide number circle
  slide.addShape('ellipse', {
    x: 0.4, y: 0.25, w: 0.65, h: 0.65,
    fill: { color: COLORS.accent },
  });
  slide.addText(String(slideNum - 1), {
    x: 0.4, y: 0.25, w: 0.65, h: 0.65,
    fontSize: 18, fontFace: 'Arial',
    color: COLORS.primaryDark, bold: true,
    align: 'center', valign: 'middle',
  });

  // Title
  slide.addText(data.title, {
    x: 1.3, y: 0.2, w: 8.2, h: 0.75,
    fontSize: 26, fontFace: 'Arial',
    color: COLORS.white, bold: true,
  });

  // Description box
  slide.addShape('rect', {
    x: 0.5, y: 1.5, w: 9, h: 0.65,
    fill: { color: COLORS.bgDark },
    rectRadius: 0.1,
  });
  slide.addText(data.description, {
    x: 0.7, y: 1.5, w: 8.6, h: 0.65,
    fontSize: 15, fontFace: 'Arial',
    color: COLORS.primary, bold: true,
    valign: 'middle',
  });

  // Bullet points
  const bulletY = 2.5;
  const bullets = data.bullets || [];

  bullets.forEach((text, i) => {
    const y = bulletY + i * 0.72;

    // Bullet dot
    slide.addShape('ellipse', {
      x: 0.7, y: y + 0.15, w: 0.18, h: 0.18,
      fill: { color: COLORS.primaryLight },
    });

    // Bullet text
    slide.addText(text, {
      x: 1.1, y: y, w: 8.2, h: 0.65,
      fontSize: 13, fontFace: 'Arial',
      color: COLORS.black,
      valign: 'top',
      lineSpacingMultiple: 1.1,
    });
  });

  addFooter(slide);
  addSlideNumber(slide, slideNum, totalSlides);
}

function createWorkflowSlide(pptx, data, slideNum, totalSlides) {
  const slide = pptx.addSlide();

  // Header background
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 1.2,
    fill: { color: COLORS.primary },
  });

  // Slide number circle
  slide.addShape('ellipse', {
    x: 0.4, y: 0.25, w: 0.65, h: 0.65,
    fill: { color: COLORS.accent },
  });
  slide.addText(String(slideNum - 1), {
    x: 0.4, y: 0.25, w: 0.65, h: 0.65,
    fontSize: 18, fontFace: 'Arial',
    color: COLORS.primaryDark, bold: true,
    align: 'center', valign: 'middle',
  });

  // Title
  slide.addText(data.title, {
    x: 1.3, y: 0.2, w: 8.2, h: 0.75,
    fontSize: 26, fontFace: 'Arial',
    color: COLORS.white, bold: true,
  });

  // Description
  slide.addText(data.description, {
    x: 0.5, y: 1.5, w: 9, h: 0.5,
    fontSize: 14, fontFace: 'Arial',
    color: COLORS.primary, bold: true,
  });

  // Flow items
  const flows = data.flows || [];
  const startY = 2.3;

  flows.forEach((flow, i) => {
    const y = startY + i * 0.7;

    // From box
    slide.addShape('rect', {
      x: 0.8, y: y, w: 3.0, h: 0.5,
      fill: { color: i % 2 === 0 ? COLORS.bgDark : COLORS.bg },
      rectRadius: 0.08,
      line: { color: COLORS.primaryLight, width: 1 },
    });
    slide.addText(flow.from, {
      x: 0.8, y: y, w: 3.0, h: 0.5,
      fontSize: 11, fontFace: 'Arial',
      color: COLORS.black,
      align: 'center', valign: 'middle',
      bold: true,
    });

    // Arrow
    slide.addText(flow.arrow, {
      x: 3.9, y: y, w: 0.8, h: 0.5,
      fontSize: 20, fontFace: 'Arial',
      color: COLORS.primaryLight,
      align: 'center', valign: 'middle',
      bold: true,
    });

    // To box
    slide.addShape('rect', {
      x: 4.8, y: y, w: 4.2, h: 0.5,
      fill: { color: i % 2 === 0 ? COLORS.bg : COLORS.bgDark },
      rectRadius: 0.08,
      line: { color: COLORS.primaryLight, width: 1 },
    });
    slide.addText(flow.to, {
      x: 4.8, y: y, w: 4.2, h: 0.5,
      fontSize: 11, fontFace: 'Arial',
      color: COLORS.black,
      align: 'center', valign: 'middle',
      bold: true,
    });
  });

  // Summary box
  const summaryY = startY + flows.length * 0.7 + 0.4;
  slide.addShape('rect', {
    x: 1.5, y: summaryY, w: 7, h: 0.6,
    fill: { color: COLORS.primary },
    rectRadius: 0.1,
  });
  slide.addText(data.summary, {
    x: 1.5, y: summaryY, w: 7, h: 0.6,
    fontSize: 14, fontFace: 'Arial',
    color: COLORS.white,
    align: 'center', valign: 'middle',
    bold: true,
  });

  addFooter(slide);
  addSlideNumber(slide, slideNum, totalSlides);
}

function createClosingSlide(pptx, data, slideNum, totalSlides) {
  const slide = pptx.addSlide();

  // Full blue background
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 7.5,
    fill: { color: COLORS.primary },
  });

  // Top accent
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 0.1,
    fill: { color: COLORS.accent },
  });

  // Title
  slide.addText(data.title, {
    x: 0.8, y: 0.8, w: 8.4, h: 0.8,
    fontSize: 30, fontFace: 'Arial',
    color: COLORS.white, bold: true,
    align: 'center',
  });

  // Description
  slide.addText(data.description, {
    x: 1.5, y: 1.7, w: 7, h: 0.6,
    fontSize: 16, fontFace: 'Arial',
    color: COLORS.accent,
    align: 'center',
    italic: true,
  });

  // Bullets
  const bullets = data.bullets || [];
  const bulletY = 2.8;

  bullets.forEach((text, i) => {
    const y = bulletY + i * 0.6;

    slide.addText(`•  ${text}`, {
      x: 1.5, y: y, w: 7, h: 0.5,
      fontSize: 14, fontFace: 'Arial',
      color: COLORS.white,
      valign: 'middle',
    });
  });

  // Thanks
  const thanksY = bulletY + bullets.length * 0.6 + 0.5;
  slide.addText(data.thanks, {
    x: 0.8, y: thanksY, w: 8.4, h: 1.0,
    fontSize: 36, fontFace: 'Arial',
    color: COLORS.accent, bold: true,
    align: 'center',
  });

  // Contact
  slide.addText(data.contact, {
    x: 0.8, y: 6.5, w: 8.4, h: 0.5,
    fontSize: 12, fontFace: 'Arial',
    color: COLORS.white,
    align: 'center',
  });

  addSlideNumber(slide, slideNum, totalSlides);
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION
// ═══════════════════════════════════════════════════════════════

async function generatePptx(langKey) {
  const content = TEXTS[langKey];
  const slides = content.slides;
  const totalSlides = slides.length;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"
  pptx.author = 'Q-TRAIN System';
  pptx.company = 'HWK Vietnam QIP';
  pptx.subject = 'Q-TRAIN System Introduction';

  slides.forEach((slideData, index) => {
    const slideNum = index + 1;

    switch (slideData.type) {
      case 'cover':
        createCoverSlide(pptx, slideData);
        break;
      case 'content':
        createContentSlide(pptx, slideData, slideNum, totalSlides);
        break;
      case 'workflow':
        createWorkflowSlide(pptx, slideData, slideNum, totalSlides);
        break;
      case 'closing':
        createClosingSlide(pptx, slideData, slideNum, totalSlides);
        break;
    }
  });

  const outputPath = path.join(OUTPUT_DIR, content.file);
  await pptx.writeFile({ fileName: outputPath });
  console.log(`  [OK] ${content.file}`);
}

async function main() {
  console.log('');
  console.log('=== Q-TRAIN System Introduction PPTX Generator ===');
  console.log('');

  const languages = ['ko', 'en', 'vi'];

  for (const lang of languages) {
    await generatePptx(lang);
  }

  console.log('');
  console.log(`All files saved to: ${OUTPUT_DIR}`);
  console.log('Done!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
