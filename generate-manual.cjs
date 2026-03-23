const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'manual-screenshots');
const BLUE = '1E40AF';
const WHITE = 'FFFFFF';
const GRAY = '6B7280';

const T = {
  ko: {
    title: 'HWK 금속 발견 신발 보고서 시스템',
    subtitle: 'Q-TRAIN Metal Shoe Case — 사용자 매뉴얼',
    date: '2026년 3월 20일',
    beforeAfter: '업무 프로세스: 전(Before) vs 후(After)',
    beforeTitle: '기존 방식 (수작업)',
    beforeItems: ['엑셀 파일로 수동 기록 (144건/년)', 'QA 직원 1명이 단독 관리', '업체 액션플랜 이메일로 수동 요청/추적', '보고서 수동 작성 (주간/월간)', '데이터 공유 불가, 실시간 현황 파악 어려움'],
    afterTitle: '새로운 시스템 (Q-TRAIN)',
    afterItems: ['웹 기반 케이스 등록 + 엑셀 일괄 임포트', '실시간 대시보드 (KPI, 차트, 공장별/업체별)', '업체 유형별 자동 워크플로우 (창→Return Dashboard / 갑피→PPTX)', 'PDF/Excel/PPTX 보고서 1클릭 생성', '3개 프로젝트 연동 (Q-TRAIN ↔ Return Dashboard ↔ Quality OS)'],
    dashboardTitle: '1. 대시보드', dashboardDesc: '6개 KPI 카드, 공장별 테이블, 업체별 차트, 주간 추이',
    registerTitle: '2. 케이스 등록 (수동)', registerDesc: '수동 입력 폼 — 15개 필드 (날짜, 공장, 라인, 모델, 업체, 부품, X-Ray 등)',
    importTitle: '3. 케이스 등록 (엑셀)', importDesc: '기존 엑셀 파일 업로드 → 업체명 자동 매칭 → 일괄 임포트',
    trackingTitle: '4. 케이스 추적', trackingDesc: '8건 테이블 + 검색/상태/업체 필터 + 상세 모달',
    bottomTitle: '5. Bottom(창) 업체 워크플로우', bottomDesc: 'Return Dashboard 자동 연동 → 업체가 액션플랜 등록 → 역동기화',
    upperTitle: '6. Upper/Internal(갑피/재단) 업체 워크플로우', upperDesc: 'PPTX 액션 요청서 다운로드 → 팀에 전달 → 회신 후 사진+내용 업로드',
    reportTitle: '7. 보고서 생성', reportDesc: '연간 Excel (4시트), 주간 PDF (jsPDF), 업체 통보서 PPTX (16:9)',
    scenario: '시나리오 예시',
    s1Title: '시나리오 1: Bottom — TS RG Outsole 금속 발견',
    s1Steps: ['1. QA가 케이스 등록 (VS PACE 2.0, RG D 10-1, BOTTOM)', '2. 시스템이 Return Dashboard에 이슈 자동 생성', '3. TS RG Outsole이 Return Dashboard에서 액션플랜 등록', '4. QA가 "액션 동기화" 클릭 → 완료 확인', '5. 상태: Confirmed → Action Received → Closed'],
    s2Title: '시나리오 2: Upper — RG A Stitching 금속 발견',
    s2Steps: ['1. QA가 케이스 등록 (TENSAUR SPORT, RG A 3-1, UPPER)', '2. Tracking에서 "액션 요청서 다운로드 (PPTX)" 클릭', '3. PPTX를 RG A 재봉팀에 이메일 전달', '4. 재봉팀이 근본원인+시정조치 작성 후 회신', '5. QA가 "액션플랜 등록" → 내용+사진 업로드', '6. 상태: Confirmed → Action Received → Closed'],
    s3Title: '시나리오 3: 엑셀 일괄 임포트',
    s3Steps: ['1. 기존 엑셀 파일 준비 (DATA 시트)', '2. Case Register → Excel Import → 파일 업로드', '3. 업체명 자동 매칭 (TSRG → TAESUNG_RG_OUTSOLE)', '4. 미매칭 업체 확인 → Import 클릭', '5. 대시보드에서 전체 현황 즉시 확인'],
    contact: '문의: hwk_qa@hsvina.com | 시스템: https://q-train-web.web.app/equipment/metal-shoes',
  },
  en: {
    title: 'HWK Metal Found in Shoes Report System',
    subtitle: 'Q-TRAIN Metal Shoe Case — User Manual',
    date: 'March 20, 2026',
    beforeAfter: 'Workflow: Before vs After',
    beforeTitle: 'Previous (Manual)',
    beforeItems: ['Manual Excel recording (144 cases/year)', 'Single QA staff managing alone', 'Action plans requested/tracked via email', 'Reports manually created (weekly/monthly)', 'No data sharing, no real-time visibility'],
    afterTitle: 'New System (Q-TRAIN)',
    afterItems: ['Web-based case registration + Excel bulk import', 'Real-time dashboard (KPI, charts, by factory/supplier)', 'Auto workflow by supplier type (Bottom→Return Dashboard / Upper→PPTX)', 'PDF/Excel/PPTX reports with 1-click', '3-project integration (Q-TRAIN ↔ Return Dashboard ↔ Quality OS)'],
    dashboardTitle: '1. Dashboard', dashboardDesc: '6 KPI cards, factory table, supplier chart, weekly trend',
    registerTitle: '2. Case Register (Manual)', registerDesc: 'Manual entry form — 15 fields (date, factory, line, model, supplier, component, X-Ray etc.)',
    importTitle: '3. Case Register (Excel)', importDesc: 'Upload existing Excel file → Auto-match supplier names → Bulk import',
    trackingTitle: '4. Case Tracking', trackingDesc: 'Table with search/status/supplier filters + detail modal',
    bottomTitle: '5. Bottom Supplier Workflow', bottomDesc: 'Auto sync to Return Dashboard → Supplier submits action plan → Reverse sync',
    upperTitle: '6. Upper/Internal Supplier Workflow', upperDesc: 'Download PPTX action request → Send to team → Upload photos + description',
    reportTitle: '7. Report Generation', reportDesc: 'Annual Excel (4 sheets), Weekly PDF (jsPDF), Supplier Notice PPTX (16:9)',
    scenario: 'Example Scenarios',
    s1Title: 'Scenario 1: Bottom — TS RG Outsole Metal Found',
    s1Steps: ['1. QA registers case (VS PACE 2.0, RG D 10-1, BOTTOM)', '2. System auto-creates issue in Return Dashboard', '3. TS RG Outsole submits action plan in Return Dashboard', '4. QA clicks "Sync Actions" → Confirmed', '5. Status: Confirmed → Action Received → Closed'],
    s2Title: 'Scenario 2: Upper — RG A Stitching Metal Found',
    s2Steps: ['1. QA registers case (TENSAUR SPORT, RG A 3-1, UPPER)', '2. Click "Download Action Request (PPTX)" in Tracking', '3. Email PPTX to RG A stitching team', '4. Team replies with root cause + corrective action', '5. QA clicks "Register Action Plan" → upload photos', '6. Status: Confirmed → Action Received → Closed'],
    s3Title: 'Scenario 3: Excel Bulk Import',
    s3Steps: ['1. Prepare existing Excel file (DATA sheet)', '2. Case Register → Excel Import → Upload file', '3. Auto-match supplier names (TSRG → TAESUNG_RG_OUTSOLE)', '4. Review unmatched → Click Import', '5. Dashboard shows all data immediately'],
    contact: 'Contact: hwk_qa@hsvina.com | System: https://q-train-web.web.app/equipment/metal-shoes',
  },
  vi: {
    title: 'Hệ thống báo cáo phát hiện kim loại trong giày HWK',
    subtitle: 'Q-TRAIN Metal Shoe Case — Hướng dẫn sử dụng',
    date: 'Ngày 20 tháng 3 năm 2026',
    beforeAfter: 'Quy trình: Trước và Sau',
    beforeTitle: 'Trước đây (Thủ công)',
    beforeItems: ['Ghi chép thủ công bằng Excel (144 ca/năm)', '1 nhân viên QA quản lý một mình', 'Yêu cầu/theo dõi kế hoạch hành động qua email', 'Báo cáo tạo thủ công (hàng tuần/tháng)', 'Không chia sẻ dữ liệu, không theo dõi thời gian thực'],
    afterTitle: 'Hệ thống mới (Q-TRAIN)',
    afterItems: ['Đăng ký ca qua web + nhập hàng loạt từ Excel', 'Bảng điều khiển thời gian thực (KPI, biểu đồ)', 'Quy trình tự động theo loại NCC (Bottom→Return Dashboard / Upper→PPTX)', 'Báo cáo PDF/Excel/PPTX chỉ 1 click', 'Tích hợp 3 dự án (Q-TRAIN ↔ Return Dashboard ↔ Quality OS)'],
    dashboardTitle: '1. Bảng điều khiển', dashboardDesc: '6 thẻ KPI, bảng nhà máy, biểu đồ NCC, xu hướng tuần',
    registerTitle: '2. Đăng ký ca (Thủ công)', registerDesc: 'Form nhập thủ công — 15 trường (ngày, nhà máy, dây chuyền, mẫu, NCC...)',
    importTitle: '3. Đăng ký ca (Excel)', importDesc: 'Tải file Excel hiện có → Tự khớp tên NCC → Nhập hàng loạt',
    trackingTitle: '4. Theo dõi ca', trackingDesc: 'Bảng với tìm kiếm/lọc + modal chi tiết',
    bottomTitle: '5. Quy trình NCC Bottom (Đế)', bottomDesc: 'Tự đồng bộ Return Dashboard → NCC đăng ký hành động → Đồng bộ ngược',
    upperTitle: '6. Quy trình NCC Upper/Internal', upperDesc: 'Tải PPTX yêu cầu → Gửi cho nhóm → Tải ảnh + mô tả lên',
    reportTitle: '7. Tạo báo cáo', reportDesc: 'Excel năm (4 sheet), PDF tuần, PPTX thông báo NCC',
    scenario: 'Ví dụ tình huống',
    s1Title: 'TH 1: Bottom — TS RG Outsole phát hiện kim loại',
    s1Steps: ['1. QA đăng ký ca (VS PACE 2.0, RG D 10-1, BOTTOM)', '2. Hệ thống tự tạo vấn đề trong Return Dashboard', '3. TS RG Outsole đăng ký hành động trong Return Dashboard', '4. QA nhấp "Đồng bộ hành động" → Xác nhận', '5. Trạng thái: Confirmed → Action Received → Closed'],
    s2Title: 'TH 2: Upper — RG A Stitching phát hiện kim loại',
    s2Steps: ['1. QA đăng ký ca (TENSAUR SPORT, RG A 3-1, UPPER)', '2. Nhấp "Tải yêu cầu hành động (PPTX)"', '3. Gửi PPTX cho nhóm may RG A', '4. Nhóm trả lời với phân tích + hành động', '5. QA nhấp "Đăng ký kế hoạch" → tải ảnh', '6. Trạng thái: Confirmed → Action Received → Closed'],
    s3Title: 'TH 3: Nhập hàng loạt từ Excel',
    s3Steps: ['1. Chuẩn bị file Excel (sheet DATA)', '2. Case Register → Excel Import → Tải file', '3. Tự khớp tên NCC (TSRG → TAESUNG_RG_OUTSOLE)', '4. Kiểm tra NCC chưa khớp → Nhấp Import', '5. Bảng điều khiển hiển thị ngay'],
    contact: 'Liên hệ: hwk_qa@hsvina.com | Hệ thống: https://q-train-web.web.app/equipment/metal-shoes',
  },
};

function addImg(slide, file, opts) {
  const p = path.join(SCREENSHOT_DIR, file);
  if (fs.existsSync(p)) slide.addImage({ path: p, ...opts });
}

function createManual(lang) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Q-TRAIN System';
  pptx.company = 'HWK Vietnam';
  const t = T[lang];

  // S1: Cover
  const s1 = pptx.addSlide(); s1.background = { color: BLUE };
  s1.addText(t.title, { x:0.5, y:1.5, w:12.33, h:1.2, fontSize:32, color:WHITE, bold:true, align:'center' });
  s1.addText(t.subtitle, { x:0.5, y:3, w:12.33, h:0.6, fontSize:18, color:'93C5FD', align:'center' });
  s1.addText(t.date, { x:0.5, y:4, w:12.33, h:0.5, fontSize:14, color:'BFDBFE', align:'center' });
  s1.addText('HWK Vietnam QIP Department', { x:0.5, y:5.5, w:12.33, h:0.4, fontSize:12, color:'93C5FD', align:'center' });

  // S2: Before vs After
  const s2 = pptx.addSlide();
  s2.addText(t.beforeAfter, { x:0.5, y:0.3, w:12.33, h:0.6, fontSize:24, color:BLUE, bold:true });
  s2.addShape(pptx.ShapeType.rect, { x:0.5, y:1.2, w:5.8, h:5.5, fill:{color:'FEF2F2'}, line:{color:'FECACA',width:1} });
  s2.addText('❌ '+t.beforeTitle, { x:0.7, y:1.4, w:5.4, h:0.4, fontSize:16, color:'DC2626', bold:true });
  t.beforeItems.forEach((item,i) => s2.addText('• '+item, { x:0.7, y:2.0+i*0.65, w:5.4, h:0.55, fontSize:11, color:'7F1D1D' }));
  s2.addShape(pptx.ShapeType.rect, { x:7.03, y:1.2, w:5.8, h:5.5, fill:{color:'F0FDF4'}, line:{color:'BBF7D0',width:1} });
  s2.addText('✅ '+t.afterTitle, { x:7.23, y:1.4, w:5.4, h:0.4, fontSize:16, color:'16A34A', bold:true });
  t.afterItems.forEach((item,i) => s2.addText('• '+item, { x:7.23, y:2.0+i*0.65, w:5.4, h:0.55, fontSize:11, color:'14532D' }));

  // S3-S9: Screenshots
  const pages = [
    { title: t.dashboardTitle, desc: t.dashboardDesc, img: '01-dashboard.png' },
    { title: t.registerTitle, desc: t.registerDesc, img: '02-register-manual.png' },
    { title: t.importTitle, desc: t.importDesc, img: '03-register-import.png' },
    { title: t.trackingTitle, desc: t.trackingDesc, img: '04-tracking-table.png' },
    { title: t.bottomTitle, desc: t.bottomDesc, img: '05-tracking-bottom-detail.png' },
    { title: t.upperTitle, desc: t.upperDesc, img: '06-tracking-upper-detail.png' },
    { title: t.reportTitle, desc: t.reportDesc, img: '07-report-page.png' },
  ];
  pages.forEach(({ title, desc, img }) => {
    const s = pptx.addSlide();
    s.addText(title, { x:0.5, y:0.2, w:10, h:0.5, fontSize:22, color:BLUE, bold:true });
    s.addText(desc, { x:0.5, y:0.7, w:12, h:0.3, fontSize:11, color:GRAY });
    addImg(s, img, { x:0.3, y:1.1, w:12.73, h:6.1 });
  });

  // S10-12: Scenarios
  const scenarios = [
    { title: t.s1Title, steps: t.s1Steps, img: '05-tracking-bottom-detail.png' },
    { title: t.s2Title, steps: t.s2Steps, img: '06-tracking-upper-detail.png' },
    { title: t.s3Title, steps: t.s3Steps, img: '03-register-import.png' },
  ];
  scenarios.forEach(({ title, steps, img }) => {
    const s = pptx.addSlide();
    s.addText(t.scenario, { x:0.5, y:0.15, w:5, h:0.3, fontSize:11, color:'F59E0B', bold:true });
    s.addText(title, { x:0.5, y:0.45, w:12.33, h:0.5, fontSize:18, color:BLUE, bold:true });
    steps.forEach((step, i) => s.addText(step, { x:0.5, y:1.1+i*0.5, w:6.2, h:0.45, fontSize:10, color:'374151' }));
    addImg(s, img, { x:7, y:1.1, w:5.8, h:5.8 });
  });

  // S13: End
  const sEnd = pptx.addSlide(); sEnd.background = { color: BLUE };
  sEnd.addText('Thank You', { x:0.5, y:2.5, w:12.33, h:1, fontSize:36, color:WHITE, bold:true, align:'center' });
  sEnd.addText(t.contact, { x:0.5, y:4, w:12.33, h:0.5, fontSize:14, color:'BFDBFE', align:'center' });
  sEnd.addText('Generated by Q-TRAIN System', { x:0.5, y:5, w:12.33, h:0.4, fontSize:10, color:'93C5FD', italic:true, align:'center' });

  const suffix = { ko:'KO', en:'EN', vi:'VI' };
  const fileName = path.join(__dirname, `Metal_Shoe_Manual_${suffix[lang]}.pptx`);
  return pptx.writeFile({ fileName }).then(() => fileName);
}

(async () => {
  for (const lang of ['ko', 'en', 'vi']) {
    const f = await createManual(lang);
    console.log('Created:', path.basename(f));
  }
})();
