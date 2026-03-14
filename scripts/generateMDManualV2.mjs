#!/usr/bin/env node
/**
 * Metal Detector Weekly Inspection - User Manual v2.0 PPTX Generator
 * With REAL SCREENSHOTS embedded in each slide
 * Generates 2 language versions: English, Vietnamese
 * Usage: node scripts/generateMDManualV2.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PptxGenJS = (await import(resolve(__dirname, '..', 'node_modules', 'pptxgenjs', 'dist', 'pptxgen.cjs.js'))).default;

const OUTPUT_DIR = join(__dirname, 'output');
const SCREENSHOT_DIR = join(__dirname, 'screenshots');
mkdirSync(OUTPUT_DIR, { recursive: true });

// ═══════════════════════════════════════════════════════════════
// SCREENSHOT PATHS
// ═══════════════════════════════════════════════════════════════

const IMG = {
  login_page: join(SCREENSHOT_DIR, '01_login_page.png'),
  login_filled: join(SCREENSHOT_DIR, '02_login_filled.png'),
  main_dashboard: join(SCREENSHOT_DIR, '03_main_dashboard.png'),
  md_dashboard_empty: join(SCREENSHOT_DIR, '04_md_dashboard_empty.png'),
  md_dashboard_full: join(SCREENSHOT_DIR, '05_md_dashboard_full.png'),
  md_input_quick_empty: join(SCREENSHOT_DIR, '06_md_input_quick_empty.png'),
  md_input_factory_selected: join(SCREENSHOT_DIR, '07_md_input_factory_selected.png'),
  md_input_line_machine: join(SCREENSHOT_DIR, '08_md_input_line_machine.png'),
  md_input_sensitivity: join(SCREENSHOT_DIR, '09_md_input_sensitivity_filled.png'),
  md_input_ready_to_save: join(SCREENSHOT_DIR, '10_md_input_ready_to_save.png'),
  md_input_fail: join(SCREENSHOT_DIR, '11_md_input_fail_selected.png'),
  md_input_detailed: join(SCREENSHOT_DIR, '12_md_input_detailed_mode.png'),
  md_history: join(SCREENSHOT_DIR, '13_md_history.png'),
  md_history_full: join(SCREENSHOT_DIR, '14_md_history_full.png'),
  md_report: join(SCREENSHOT_DIR, '15_md_report.png'),
  sidebar: join(SCREENSHOT_DIR, '16_sidebar_navigation.png'),
};

// Verify screenshots exist
for (const [key, path] of Object.entries(IMG)) {
  if (!existsSync(path)) {
    console.warn(`WARNING: Screenshot not found: ${key} → ${path}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// COLORS & STYLES
// ═══════════════════════════════════════════════════════════════

const C = {
  primary: '1E40AF',
  primaryDark: '1E3A8A',
  primaryLight: '3B82F6',
  accent: '60A5FA',
  pass: '22C55E',
  passDark: '16A34A',
  passLight: 'DCFCE7',
  fail: 'EF4444',
  failDark: 'DC2626',
  failLight: 'FEE2E2',
  white: 'FFFFFF',
  black: '1F2937',
  gray: '6B7280',
  grayLight: 'F3F4F6',
  grayMid: 'E5E7EB',
  blue50: 'EFF6FF',
  blue100: 'DBEAFE',
  orange: 'F97316',
  orangeLight: 'FFF7ED',
  amber: 'F59E0B',
  amberLight: 'FFFBEB',
  yellow: 'EAB308',
  yellowLight: 'FEF9C3',
  darkBg: '0F172A',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/** Add a numbered circle callout on a slide */
function addCallout(slide, num, x, y, opts = {}) {
  const size = opts.size || 0.35;
  const bg = opts.bg || C.fail;
  const color = opts.color || C.white;
  slide.addShape('ellipse', {
    x, y, w: size, h: size,
    fill: { color: bg },
    shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.3 },
  });
  slide.addText(String(num), {
    x, y, w: size, h: size,
    fontSize: size > 0.3 ? 14 : 11,
    fontFace: 'Arial',
    bold: true,
    color,
    align: 'center',
    valign: 'middle',
  });
}

/** Add a text label near a callout */
function addCalloutLabel(slide, text, x, y, opts = {}) {
  slide.addText(text, {
    x, y, w: opts.w || 2.5, h: opts.h || 0.35,
    fontSize: opts.fontSize || 10,
    fontFace: 'Arial',
    bold: opts.bold !== false,
    color: opts.color || C.white,
    fill: { color: opts.bg || C.primaryDark },
    rectRadius: 0.05,
    valign: 'middle',
    margin: [0, 6, 0, 6],
  });
}

/** Add slide number footer */
function addSlideNumber(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: 8.5, y: 7.2, w: 1.2, h: 0.3,
    fontSize: 8, fontFace: 'Arial', color: C.gray, align: 'right',
  });
}

/** Add page title bar */
function addTitleBar(slide, title, opts = {}) {
  const bg = opts.bg || C.primary;
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 0.85,
    fill: { color: bg },
  });
  slide.addText(title, {
    x: 0.4, y: 0.1, w: 9.2, h: 0.65,
    fontSize: opts.fontSize || 24,
    fontFace: 'Arial',
    bold: true,
    color: opts.color || C.white,
    valign: 'middle',
  });
}

/** Add a screenshot image to the slide */
function addScreenshot(slide, imgPath, x, y, w, h, opts = {}) {
  slide.addImage({
    path: imgPath,
    x, y, w, h,
    rounding: opts.rounding || false,
    shadow: opts.shadow !== false ? { type: 'outer', blur: 6, offset: 3, color: '000000', opacity: 0.2 } : undefined,
  });
  // Optional border
  if (opts.border) {
    slide.addShape('rect', {
      x, y, w, h,
      line: { color: opts.borderColor || C.grayMid, width: 1 },
      fill: { type: 'none' },
      rectRadius: opts.rounding ? 0.05 : 0,
    });
  }
}

/** Add a step badge */
function addStepBadge(slide, text, x, y, opts = {}) {
  const w = opts.w || 1.8;
  const h = opts.h || 0.32;
  slide.addShape('roundRect', {
    x, y, w, h,
    fill: { color: opts.bg || C.primary },
    rectRadius: 0.05,
  });
  slide.addText(text, {
    x, y, w, h,
    fontSize: opts.fontSize || 12,
    fontFace: 'Arial',
    bold: true,
    color: opts.color || C.white,
    align: 'center',
    valign: 'middle',
  });
}

// ═══════════════════════════════════════════════════════════════
// TEXT CONTENT - 2 LANGUAGES
// ═══════════════════════════════════════════════════════════════

const TEXTS = {
  EN: {
    file: 'MD_Manual_v2_EN.pptx',
    cover: {
      title: 'Metal Detector\nWeekly Inspection',
      subtitle: 'User Manual v2.0',
      system: 'Q-TRAIN System',
      org: 'HWK Vietnam - QIP Department',
      date: 'March 2026',
    },
    whatChanged: {
      title: 'What Changed? Before vs After',
      beforeTitle: 'BEFORE (Manual Process)',
      beforeItems: [
        'Record on paper forms',
        'Compile Excel manually',
        'Email weekly report',
        'Track CA in separate files',
        'No real-time visibility',
      ],
      afterTitle: 'AFTER (Q-TRAIN System)',
      afterItems: [
        'Enter on phone or PC',
        'Auto dashboard & KPI',
        'PDF report in 1 click',
        'CA tracked in system',
        'Real-time factory comparison',
      ],
      keyChange: 'From 2+ hours manual work → 5 minutes data entry per day!',
    },
    overview: {
      title: 'System Overview - 4 Pages',
      pages: [
        { icon: '📊', name: 'Dashboard', desc: 'KPI summary, factory comparison, trends' },
        { icon: '📝', name: 'Input Form', desc: 'Quick Entry + Detailed Entry modes' },
        { icon: '📋', name: 'History', desc: 'All inspection records, CA tracking' },
        { icon: '📄', name: 'Report', desc: 'PDF report generation by week' },
      ],
    },
    loginOpen: {
      title: 'Step 1: Open Q-TRAIN',
      url: 'https://q-train-web.web.app/',
      desc: 'Open Chrome browser and enter the URL above',
      fields: ['Email field', 'Password field', 'Login button'],
    },
    loginFill: {
      title: 'Step 2: Enter Credentials & Login',
      steps: [
        'Enter your company email (@hsvina.com)',
        'Enter your password',
        'Click "Login" button',
      ],
      note: 'Only @hsvina.com, @hwaseung.com, @hwaseungvina.com emails allowed',
    },
    navigation: {
      title: 'Step 3: Navigate to Metal Detector',
      path: 'Sidebar > Equipment Compliance > Metal Detector',
      submenus: ['Dashboard', 'Input Form', 'History', 'Report'],
      tip: 'The sidebar menu shows all Q-TRAIN modules. Metal Detector is under "Equipment Compliance".',
    },
    quickOverview: {
      title: 'Quick Entry: Overview',
      desc: 'All input fields on ONE screen - the fastest way to record inspections',
      highlights: [
        '"Quick Entry" tab selected at top',
        'Factory A/B/C/D buttons',
        'Line + Machine ID + Inspector',
        'Sensitivity: Fe / SUS / Non-Fe',
        'PASS/FAIL result + Save button',
        '"Today: 0" counter at top right',
      ],
    },
    quickFactory: {
      title: 'Step 4: Select Factory',
      desc: 'Click one of A / B / C / D buttons. The selected button turns blue.',
      note: 'Factory selection is retained after saving for continuous input.',
    },
    quickLine: {
      title: 'Step 5: Enter Line & Machine ID',
      steps: [
        'Line field (e.g., 4-1)',
        'Machine ID field (e.g., A410201)',
      ],
      tip: 'Machine ID is printed on the machine label. Auto-complete suggests previously used IDs.',
    },
    quickSensitivity: {
      title: 'Step 6: Enter Sensitivity Values',
      fields: ['Fe = 1.5 mm', 'SUS = 2.0 mm', 'Non-Fe = 2.5 mm'],
      note: 'These values are retained after save for the next entry.',
    },
    quickSave: {
      title: 'Step 7: Select Result & Save',
      steps: [
        'PASS button (green) - default',
        'Save button',
      ],
      note: 'Default is PASS. Only click FAIL if the machine failed the test.',
    },
    quickFail: {
      title: 'If FAIL: Enter Failure Details',
      desc: 'When FAIL is selected, a red section appears:',
      fields: [
        'Failure Type (dropdown): Sensitivity Drift, Equipment Malfunction, Calibration Error, etc.',
        'Description (text): Describe what happened',
      ],
      auto: 'AUTOMATIC: A Corrective Action (CA) is automatically created with status "Pending"',
    },
    quickTips: {
      title: 'Quick Entry: Continuous Input Tips',
      preserved: {
        title: 'Retained after save',
        items: ['Factory', 'Date', 'Inspector', 'Sensitivity values'],
        icon: '✅',
      },
      cleared: {
        title: 'Reset after save',
        items: ['Line', 'Machine ID', 'Result (→ PASS)', 'Failure details'],
        icon: '🔄',
      },
      tips: [
        'Just change Line + Machine ID for each machine',
        '"Today: N" counter tracks your progress',
        'Green success message auto-hides after 3 seconds',
        'Only change Factory button when moving to different building',
      ],
    },
    detailedMode: {
      title: 'Detailed Entry Mode (4 Steps)',
      desc: 'Use when you need Product Name or detailed Remarks',
      steps: ['Step 1: Factory & Line', 'Step 2: Inspector Info', 'Step 3: Sensitivity', 'Step 4: Result & Save'],
      note: 'Use Back/Next buttons to navigate. Green checkmarks show completed steps.',
    },
    dashKPI: {
      title: 'Dashboard: KPI Summary',
      desc: 'Select Year and Week (W1-W52) at top right',
      kpis: [
        { n: '1', label: 'Total Checked' },
        { n: '2', label: 'Failed Last Week' },
        { n: '3', label: 'Failed This Week' },
        { n: '4', label: 'Fixed On Time' },
        { n: '5', label: 'Maintenance Fix Rate' },
        { n: '6', label: 'Repeated Issues' },
        { n: '7', label: 'Repeated Issue Rate' },
      ],
    },
    dashFactory: {
      title: 'Dashboard: Factory Comparison',
      desc: 'Compare this week vs last week by factory',
      badges: [
        { text: 'Improved', color: C.passDark, bg: C.passLight },
        { text: 'No Change', color: C.gray, bg: C.grayLight },
        { text: 'Increased', color: C.failDark, bg: C.failLight },
      ],
      note: 'This replaces the email report sent to management.',
    },
    dashPassRate: {
      title: 'Dashboard: Pass Rate Comparison',
      desc: '2-week comparison table by factory',
      explain: 'Green = improved vs last week\nRed = decreased vs last week',
      note: 'Charts below: Bar chart (Pass/Fail by factory) + Line chart (12-week trend)',
    },
    historyFilters: {
      title: 'Inspection History: Search & Filter',
      filters: ['Factory: All / A / B / C / D', 'Result: All / PASS / FAIL', 'Date From / Date To', 'Clear: Reset all filters'],
      tip: 'Click any row to see full details and update CA status.',
    },
    historyCA: {
      title: 'History: Update Corrective Action',
      flow: ['Pending → Waiting for maintenance', 'In Progress → Being fixed', 'Completed → Fixed and verified'],
      howTo: [
        '1. Go to History page',
        '2. Filter: Result = FAIL',
        '3. Click the FAIL row',
        '4. Update CA status in modal',
        '5. Add fix description',
        '6. Click Update',
      ],
      note: 'CA completion feeds the "Maintenance Fix Rate" KPI on Dashboard.',
    },
    report: {
      title: 'Weekly Report: PDF Generation',
      steps: [
        'Select Year',
        'Select Week (W1-W52)',
        'Click "Generate PDF"',
      ],
      fileName: 'File: MD_Report_2026_W11.pdf',
      note: 'If no data for selected week, PDF button is disabled.',
    },
    workflow: {
      title: 'Daily Workflow Summary',
      phases: [
        { timing: 'MORNING', title: 'Record Inspections', items: ['Open Q-TRAIN', 'Quick Entry mode', 'Enter each machine', 'Check "Today: N" counter'] },
        { timing: 'IF FAIL', title: 'Handle Failure', items: ['Select FAIL result', 'Choose Failure Type', 'Enter description', 'Save → CA auto-created'] },
        { timing: 'WEEKLY', title: 'Review Dashboard', items: ['Check KPI summary', 'Review factory comparison', 'Check repeated issues', 'Generate PDF if needed'] },
        { timing: 'AFTER FIX', title: 'Update CA', items: ['Go to History', 'Find FAIL item', 'Update CA status', 'Add fix description'] },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        { q: 'Do I need Machine ID?', a: 'Optional, but needed for repeated issue tracking.' },
        { q: 'What if I make a mistake?', a: 'Find in History, contact admin to correct.' },
        { q: 'How is repeated issue detected?', a: 'Same machine/line FAIL 2 weeks in a row.' },
        { q: 'Who updates CA status?', a: 'QIP or maintenance team.' },
        { q: 'Can I use my phone?', a: 'Yes! Works on Chrome mobile. Add to home screen.' },
      ],
    },
    contact: {
      title: 'Contact & Support',
      url: 'https://q-train-web.web.app/',
      dept: 'QIP Department',
      email: 'ksmoon@hsvina.com',
      thanks: 'Thank you for using Q-TRAIN!',
      tagline: 'Accurate inspection data leads to better quality.',
    },
  },

  VI: {
    file: 'MD_Manual_v2_VI.pptx',
    cover: {
      title: 'Kiểm tra máy dò kim loại\nhàng tuần',
      subtitle: 'Hướng dẫn sử dụng v2.0',
      system: 'Hệ thống Q-TRAIN',
      org: 'HWK Vietnam - Bộ phận QIP',
      date: 'Tháng 3, 2026',
    },
    whatChanged: {
      title: 'Thay đổi gì? Trước vs Sau',
      beforeTitle: 'TRƯỚC ĐÂY (Thủ công)',
      beforeItems: [
        'Ghi trên giấy',
        'Tổng hợp Excel thủ công',
        'Gửi email báo cáo hàng tuần',
        'Theo dõi CA trong file riêng',
        'Không có theo dõi thời gian thực',
      ],
      afterTitle: 'SAU (Hệ thống Q-TRAIN)',
      afterItems: [
        'Nhập trên điện thoại hoặc PC',
        'Dashboard & KPI tự động',
        'Báo cáo PDF 1 cú nhấp',
        'CA được theo dõi trong hệ thống',
        'So sánh nhà máy thời gian thực',
      ],
      keyChange: 'Từ 2+ giờ làm việc thủ công → 5 phút nhập dữ liệu mỗi ngày!',
    },
    overview: {
      title: 'Tổng quan hệ thống - 4 Trang',
      pages: [
        { icon: '📊', name: 'Dashboard', desc: 'Tóm tắt KPI, so sánh nhà máy, xu hướng' },
        { icon: '📝', name: 'Input Form', desc: 'Nhập nhanh + Nhập chi tiết' },
        { icon: '📋', name: 'History', desc: 'Tất cả bản ghi, theo dõi CA' },
        { icon: '📄', name: 'Report', desc: 'Tạo báo cáo PDF theo tuần' },
      ],
    },
    loginOpen: {
      title: 'Bước 1: Mở Q-TRAIN',
      url: 'https://q-train-web.web.app/',
      desc: 'Mở trình duyệt Chrome và nhập URL ở trên',
      fields: ['Trường Email', 'Trường Mật khẩu', 'Nút Đăng nhập'],
    },
    loginFill: {
      title: 'Bước 2: Nhập thông tin & Đăng nhập',
      steps: [
        'Nhập email công ty (@hsvina.com)',
        'Nhập mật khẩu',
        'Nhấp nút "Đăng nhập"',
      ],
      note: 'Chỉ cho phép email @hsvina.com, @hwaseung.com, @hwaseungvina.com',
    },
    navigation: {
      title: 'Bước 3: Điều hướng đến Metal Detector',
      path: 'Thanh bên > Equipment Compliance > Metal Detector',
      submenus: ['Dashboard', 'Input Form', 'History', 'Report'],
      tip: 'Menu thanh bên hiển thị tất cả module Q-TRAIN. Metal Detector nằm trong "Equipment Compliance".',
    },
    quickOverview: {
      title: 'Nhập nhanh: Tổng quan',
      desc: 'Tất cả trường nhập trên MỘT màn hình - cách nhanh nhất ghi kết quả',
      highlights: [
        'Tab "Quick Entry" đã chọn ở trên',
        'Nút nhà máy A/B/C/D',
        'Line + Mã máy + Người kiểm tra',
        'Độ nhạy: Fe / SUS / Non-Fe',
        'Kết quả PASS/FAIL + Nút Lưu',
        'Bộ đếm "Today: 0" góc trên phải',
      ],
    },
    quickFactory: {
      title: 'Bước 4: Chọn nhà máy',
      desc: 'Nhấp một trong các nút A / B / C / D. Nút được chọn chuyển sang màu xanh.',
      note: 'Nhà máy được giữ lại sau khi lưu cho nhập liên tục.',
    },
    quickLine: {
      title: 'Bước 5: Nhập Line & Mã máy',
      steps: [
        'Trường Line (VD: 4-1)',
        'Trường Mã máy (VD: A410201)',
      ],
      tip: 'Mã máy in trên nhãn máy. Tự động gợi ý các ID đã dùng trước đó.',
    },
    quickSensitivity: {
      title: 'Bước 6: Nhập giá trị độ nhạy',
      fields: ['Fe = 1.5 mm', 'SUS = 2.0 mm', 'Non-Fe = 2.5 mm'],
      note: 'Các giá trị này được giữ lại sau khi lưu cho lần nhập tiếp.',
    },
    quickSave: {
      title: 'Bước 7: Chọn kết quả & Lưu',
      steps: [
        'Nút PASS (xanh) - mặc định',
        'Nút Lưu',
      ],
      note: 'Mặc định là PASS. Chỉ nhấp FAIL nếu máy không đạt.',
    },
    quickFail: {
      title: 'Nếu FAIL: Nhập chi tiết lỗi',
      desc: 'Khi chọn FAIL, vùng đỏ xuất hiện:',
      fields: [
        'Loại lỗi (dropdown): Trôi độ nhạy, Trục trặc, Lỗi hiệu chuẩn, v.v.',
        'Mô tả (text): Mô tả chi tiết sự cố',
      ],
      auto: 'TỰ ĐỘNG: Hành động khắc phục (CA) tự động tạo với trạng thái "Chờ xử lý"',
    },
    quickTips: {
      title: 'Nhập nhanh: Mẹo nhập liên tục',
      preserved: {
        title: 'Giữ lại sau khi lưu',
        items: ['Nhà máy', 'Ngày', 'Người kiểm tra', 'Giá trị độ nhạy'],
        icon: '✅',
      },
      cleared: {
        title: 'Xóa sau khi lưu',
        items: ['Line', 'Mã máy', 'Kết quả (→ PASS)', 'Chi tiết lỗi'],
        icon: '🔄',
      },
      tips: [
        'Chỉ cần thay Line + Mã máy cho mỗi máy',
        'Bộ đếm "Today: N" theo dõi tiến độ',
        'Thông báo xanh tự ẩn sau 3 giây',
        'Chỉ đổi nhà máy khi chuyển sang tòa nhà khác',
      ],
    },
    detailedMode: {
      title: 'Chế độ nhập chi tiết (4 bước)',
      desc: 'Sử dụng khi cần Tên sản phẩm hoặc Ghi chú chi tiết',
      steps: ['Bước 1: Nhà máy & Line', 'Bước 2: Thông tin KT', 'Bước 3: Độ nhạy', 'Bước 4: Kết quả & Lưu'],
      note: 'Sử dụng nút Quay lại/Tiếp theo. Dấu kiểm xanh = bước hoàn thành.',
    },
    dashKPI: {
      title: 'Dashboard: Tóm tắt KPI',
      desc: 'Chọn Năm và Tuần (W1-W52) ở góc trên phải',
      kpis: [
        { n: '1', label: 'Tổng đã kiểm tra' },
        { n: '2', label: 'Lỗi tuần trước' },
        { n: '3', label: 'Lỗi tuần này' },
        { n: '4', label: 'Sửa đúng hạn' },
        { n: '5', label: 'Tỷ lệ sửa' },
        { n: '6', label: 'Lặp lại' },
        { n: '7', label: 'Tỷ lệ lặp lại' },
      ],
    },
    dashFactory: {
      title: 'Dashboard: So sánh nhà máy',
      desc: 'So sánh tuần này vs tuần trước theo nhà máy',
      badges: [
        { text: 'Cải thiện', color: C.passDark, bg: C.passLight },
        { text: 'Không đổi', color: C.gray, bg: C.grayLight },
        { text: 'Tăng', color: C.failDark, bg: C.failLight },
      ],
      note: 'Thay thế báo cáo email gửi cho quản lý.',
    },
    dashPassRate: {
      title: 'Dashboard: So sánh tỷ lệ đạt',
      desc: 'Bảng so sánh 2 tuần theo nhà máy',
      explain: 'Xanh = cải thiện so với tuần trước\nĐỏ = giảm so với tuần trước',
      note: 'Biểu đồ: Cột (Đạt/Lỗi) + Đường (xu hướng 12 tuần)',
    },
    historyFilters: {
      title: 'Lịch sử kiểm tra: Tìm kiếm & Lọc',
      filters: ['Nhà máy: Tất cả / A / B / C / D', 'Kết quả: Tất cả / PASS / FAIL', 'Từ ngày / Đến ngày', 'Xóa: Đặt lại tất cả'],
      tip: 'Nhấp vào bất kỳ hàng nào để xem chi tiết và cập nhật CA.',
    },
    historyCA: {
      title: 'Lịch sử: Cập nhật hành động khắc phục',
      flow: ['Pending → Chờ bảo trì', 'In Progress → Đang sửa', 'Completed → Đã sửa và xác nhận'],
      howTo: [
        '1. Vào trang Lịch sử',
        '2. Lọc: Kết quả = FAIL',
        '3. Nhấp vào hàng FAIL',
        '4. Cập nhật trạng thái CA',
        '5. Thêm mô tả sửa chữa',
        '6. Nhấp Cập nhật',
      ],
      note: 'Hoàn thành CA tự động cập nhật KPI "Tỷ lệ sửa bảo trì" trên Dashboard.',
    },
    report: {
      title: 'Báo cáo tuần: Tạo PDF',
      steps: [
        'Chọn Năm',
        'Chọn Tuần (W1-W52)',
        'Nhấp "Generate PDF"',
      ],
      fileName: 'File: MD_Report_2026_W11.pdf',
      note: 'Nếu không có dữ liệu cho tuần đã chọn, nút PDF bị vô hiệu.',
    },
    workflow: {
      title: 'Tóm tắt quy trình hàng ngày',
      phases: [
        { timing: 'SÁNG', title: 'Ghi kiểm tra', items: ['Mở Q-TRAIN', 'Chế độ nhập nhanh', 'Nhập từng máy', 'Kiểm tra "Today: N"'] },
        { timing: 'NẾU FAIL', title: 'Xử lý lỗi', items: ['Chọn FAIL', 'Chọn loại lỗi', 'Nhập mô tả', 'Lưu → CA tự tạo'] },
        { timing: 'HÀNG TUẦN', title: 'Xem Dashboard', items: ['Kiểm tra KPI', 'So sánh nhà máy', 'Vấn đề lặp lại', 'Tạo PDF nếu cần'] },
        { timing: 'SAU SỬA', title: 'Cập nhật CA', items: ['Vào Lịch sử', 'Tìm mục FAIL', 'Cập nhật trạng thái', 'Thêm mô tả'] },
      ],
    },
    faq: {
      title: 'Câu hỏi thường gặp',
      items: [
        { q: 'Mã máy có bắt buộc?', a: 'Không, nhưng cần cho theo dõi lỗi lặp lại.' },
        { q: 'Nhập sai thì sao?', a: 'Tìm trong Lịch sử, liên hệ admin để sửa.' },
        { q: 'Lỗi lặp lại được phát hiện thế nào?', a: 'Cùng máy/line FAIL 2 tuần liên tiếp.' },
        { q: 'Ai cập nhật trạng thái CA?', a: 'QIP hoặc nhóm bảo trì.' },
        { q: 'Dùng điện thoại được không?', a: 'Được! Dùng Chrome mobile. Thêm vào màn hình chính.' },
      ],
    },
    contact: {
      title: 'Liên hệ & Hỗ trợ',
      url: 'https://q-train-web.web.app/',
      dept: 'Bộ phận QIP',
      email: 'ksmoon@hsvina.com',
      thanks: 'Cảm ơn bạn đã sử dụng Q-TRAIN!',
      tagline: 'Dữ liệu kiểm tra chính xác dẫn đến chất lượng tốt hơn.',
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// SLIDE BUILDERS
// ═══════════════════════════════════════════════════════════════

const TOTAL_SLIDES = 23;

function buildSlides(pptx, T) {
  let slideNum = 0;

  // ──────────────── SLIDE 1: COVER ────────────────
  slideNum++;
  const s1 = pptx.addSlide();
  s1.background = { fill: C.primaryDark };
  // Decorative shapes
  s1.addShape('rect', { x: -1, y: -0.5, w: 4, h: 9, fill: { color: C.primary }, rotate: -10 });
  s1.addShape('ellipse', { x: 7.5, y: 5.5, w: 4, h: 4, fill: { color: '1E3375' } });
  // Title
  s1.addText(T.cover.title, {
    x: 1.0, y: 1.5, w: 8, h: 2.0,
    fontSize: 36, fontFace: 'Arial', bold: true, color: C.white,
    lineSpacing: 44,
  });
  s1.addShape('rect', { x: 1.0, y: 3.6, w: 3.5, h: 0.06, fill: { color: C.accent } });
  s1.addText(T.cover.subtitle, {
    x: 1.0, y: 3.8, w: 8, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: C.accent,
  });
  s1.addText(T.cover.system, {
    x: 1.0, y: 4.8, w: 8, h: 0.4,
    fontSize: 16, fontFace: 'Arial', bold: true, color: C.blue100,
  });
  s1.addText(T.cover.org, {
    x: 1.0, y: 5.3, w: 8, h: 0.35,
    fontSize: 13, fontFace: 'Arial', color: C.blue100,
  });
  s1.addText(T.cover.date, {
    x: 1.0, y: 5.7, w: 8, h: 0.35,
    fontSize: 13, fontFace: 'Arial', color: C.blue100,
  });
  addSlideNumber(s1, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 2: WHAT CHANGED ────────────────
  slideNum++;
  const s2 = pptx.addSlide();
  addTitleBar(s2, T.whatChanged.title);

  // Before column (red)
  s2.addShape('roundRect', {
    x: 0.3, y: 1.1, w: 4.5, h: 4.5,
    fill: { color: C.failLight }, rectRadius: 0.1,
    line: { color: C.fail, width: 2 },
  });
  s2.addText(T.whatChanged.beforeTitle, {
    x: 0.5, y: 1.2, w: 4.1, h: 0.5,
    fontSize: 16, fontFace: 'Arial', bold: true, color: C.failDark,
  });
  T.whatChanged.beforeItems.forEach((item, i) => {
    s2.addText(`✗  ${item}`, {
      x: 0.6, y: 1.8 + i * 0.6, w: 4.0, h: 0.5,
      fontSize: 13, fontFace: 'Arial', color: C.failDark,
    });
  });

  // Arrow
  s2.addText('→', {
    x: 4.5, y: 2.8, w: 1.0, h: 0.8,
    fontSize: 40, fontFace: 'Arial', bold: true, color: C.primary, align: 'center',
  });

  // After column (green)
  s2.addShape('roundRect', {
    x: 5.2, y: 1.1, w: 4.5, h: 4.5,
    fill: { color: C.passLight }, rectRadius: 0.1,
    line: { color: C.pass, width: 2 },
  });
  s2.addText(T.whatChanged.afterTitle, {
    x: 5.4, y: 1.2, w: 4.1, h: 0.5,
    fontSize: 16, fontFace: 'Arial', bold: true, color: C.passDark,
  });
  T.whatChanged.afterItems.forEach((item, i) => {
    s2.addText(`✓  ${item}`, {
      x: 5.5, y: 1.8 + i * 0.6, w: 4.0, h: 0.5,
      fontSize: 13, fontFace: 'Arial', color: C.passDark,
    });
  });

  // Key change bar
  s2.addShape('roundRect', {
    x: 0.3, y: 5.9, w: 9.4, h: 0.6,
    fill: { color: C.primary }, rectRadius: 0.1,
  });
  s2.addText(T.whatChanged.keyChange, {
    x: 0.5, y: 5.95, w: 9.0, h: 0.5,
    fontSize: 14, fontFace: 'Arial', bold: true, color: C.white, align: 'center',
  });
  addSlideNumber(s2, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 3: SYSTEM OVERVIEW ────────────────
  slideNum++;
  const s3 = pptx.addSlide();
  addTitleBar(s3, T.overview.title);

  T.overview.pages.forEach((page, i) => {
    const x = 0.3 + i * 2.4;
    s3.addShape('roundRect', {
      x, y: 1.2, w: 2.2, h: 2.8,
      fill: { color: C.blue50 }, rectRadius: 0.1,
      line: { color: C.primary, width: 1 },
    });
    s3.addText(page.icon, {
      x, y: 1.3, w: 2.2, h: 0.7,
      fontSize: 32, align: 'center',
    });
    s3.addText(page.name, {
      x, y: 2.0, w: 2.2, h: 0.5,
      fontSize: 16, fontFace: 'Arial', bold: true, color: C.primaryDark, align: 'center',
    });
    s3.addText(page.desc, {
      x: x + 0.15, y: 2.5, w: 1.9, h: 1.2,
      fontSize: 11, fontFace: 'Arial', color: C.gray, align: 'center',
      valign: 'top',
    });
  });

  // Add main dashboard screenshot
  addScreenshot(s3, IMG.main_dashboard, 0.5, 4.3, 9.0, 3.0, { border: true });
  addSlideNumber(s3, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 4: LOGIN PAGE ────────────────
  slideNum++;
  const s4 = pptx.addSlide();
  addTitleBar(s4, T.loginOpen.title);

  // URL box
  s4.addShape('roundRect', {
    x: 0.4, y: 0.95, w: 6.0, h: 0.45,
    fill: { color: C.blue50 }, rectRadius: 0.08,
    line: { color: C.primary, width: 1 },
  });
  s4.addText(T.loginOpen.url, {
    x: 0.6, y: 0.98, w: 5.6, h: 0.38,
    fontSize: 13, fontFace: 'Arial', bold: true, color: C.primary,
    valign: 'middle',
  });
  s4.addText(T.loginOpen.desc, {
    x: 6.6, y: 0.98, w: 3.2, h: 0.38,
    fontSize: 11, fontFace: 'Arial', color: C.gray, valign: 'middle',
  });

  // Screenshot
  addScreenshot(s4, IMG.login_page, 0.5, 1.6, 9.0, 5.5, { border: true });

  // Callouts
  addCallout(s4, '1', 3.2, 3.6);
  addCalloutLabel(s4, T.loginOpen.fields[0], 3.6, 3.62, { w: 1.5 });
  addCallout(s4, '2', 3.2, 4.2);
  addCalloutLabel(s4, T.loginOpen.fields[1], 3.6, 4.22, { w: 1.8 });
  addCallout(s4, '3', 3.2, 4.9);
  addCalloutLabel(s4, T.loginOpen.fields[2], 3.6, 4.92, { w: 1.5 });
  addSlideNumber(s4, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 5: LOGIN FILLED ────────────────
  slideNum++;
  const s5 = pptx.addSlide();
  addTitleBar(s5, T.loginFill.title);

  addScreenshot(s5, IMG.login_filled, 0.5, 1.2, 9.0, 5.5, { border: true });

  // Step labels on right
  T.loginFill.steps.forEach((step, i) => {
    addCallout(s5, i + 1, 7.2, 3.0 + i * 0.7);
    addCalloutLabel(s5, step, 7.65, 3.02 + i * 0.7, { w: 2.2, fontSize: 9 });
  });

  // Note at bottom
  s5.addShape('roundRect', {
    x: 0.5, y: 6.9, w: 9.0, h: 0.45,
    fill: { color: C.amberLight }, rectRadius: 0.08,
    line: { color: C.amber, width: 1 },
  });
  s5.addText(T.loginFill.note, {
    x: 0.7, y: 6.92, w: 8.6, h: 0.4,
    fontSize: 10, fontFace: 'Arial', color: C.black,
    valign: 'middle',
  });
  addSlideNumber(s5, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 6: NAVIGATION ────────────────
  slideNum++;
  const s6 = pptx.addSlide();
  addTitleBar(s6, T.navigation.title);

  // Navigation path
  s6.addShape('roundRect', {
    x: 0.4, y: 0.95, w: 9.2, h: 0.45,
    fill: { color: C.blue50 }, rectRadius: 0.08,
  });
  s6.addText(T.navigation.path, {
    x: 0.6, y: 0.98, w: 8.8, h: 0.38,
    fontSize: 14, fontFace: 'Arial', bold: true, color: C.primary,
    valign: 'middle',
  });

  // Sidebar screenshot
  addScreenshot(s6, IMG.sidebar, 0.3, 1.6, 4.0, 5.5, { border: true });

  // Submenu explanation on right
  s6.addText(T.navigation.tip, {
    x: 4.6, y: 1.6, w: 5.0, h: 0.8,
    fontSize: 12, fontFace: 'Arial', color: C.gray,
    valign: 'top',
  });

  T.navigation.submenus.forEach((menu, i) => {
    const y = 2.6 + i * 0.7;
    s6.addShape('roundRect', {
      x: 4.8, y, w: 4.5, h: 0.55,
      fill: { color: i === 0 ? C.blue50 : C.grayLight }, rectRadius: 0.08,
      line: { color: i === 0 ? C.primary : C.grayMid, width: 1 },
    });
    addCallout(s6, i + 1, 4.9, y + 0.1, { size: 0.35, bg: C.primary });
    s6.addText(menu, {
      x: 5.4, y, w: 3.5, h: 0.55,
      fontSize: 14, fontFace: 'Arial', bold: i === 0, color: C.black,
      valign: 'middle',
    });
  });
  addSlideNumber(s6, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 7: QUICK ENTRY OVERVIEW ────────────────
  slideNum++;
  const s7 = pptx.addSlide();
  addTitleBar(s7, T.quickOverview.title);

  s7.addText(T.quickOverview.desc, {
    x: 0.4, y: 0.95, w: 9.2, h: 0.35,
    fontSize: 12, fontFace: 'Arial', color: C.gray,
  });

  // Screenshot
  addScreenshot(s7, IMG.md_input_quick_empty, 0.3, 1.4, 9.4, 5.2, { border: true });

  // Highlight labels
  const hlColors = [C.primary, C.primaryDark, C.primary, C.primaryDark, C.primary, C.primary];
  T.quickOverview.highlights.forEach((h, i) => {
    addCallout(s7, i + 1, 0.35 + (i % 3) * 3.2, 6.7, { bg: hlColors[i] || C.primary, size: 0.28 });
    s7.addText(h, {
      x: 0.7 + (i % 3) * 3.2, y: 6.65, w: 2.8, h: 0.35,
      fontSize: 8, fontFace: 'Arial', color: C.black,
      valign: 'middle',
    });
  });
  addSlideNumber(s7, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 8: SELECT FACTORY ────────────────
  slideNum++;
  const s8 = pptx.addSlide();
  addTitleBar(s8, T.quickFactory.title);

  s8.addText(T.quickFactory.desc, {
    x: 0.4, y: 0.95, w: 9.2, h: 0.35,
    fontSize: 13, fontFace: 'Arial', color: C.black,
  });

  addScreenshot(s8, IMG.md_input_factory_selected, 0.5, 1.5, 9.0, 5.0, { border: true });

  addCallout(s8, '!', 2.5, 2.5, { bg: C.pass, size: 0.4 });
  addCalloutLabel(s8, 'Factory A selected (blue)', 3.0, 2.55, { w: 2.5, bg: C.passDark });

  s8.addShape('roundRect', {
    x: 0.5, y: 6.7, w: 9.0, h: 0.45,
    fill: { color: C.blue50 }, rectRadius: 0.08,
  });
  s8.addText(T.quickFactory.note, {
    x: 0.7, y: 6.72, w: 8.6, h: 0.4,
    fontSize: 11, fontFace: 'Arial', color: C.primary,
    valign: 'middle',
  });
  addSlideNumber(s8, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 9: LINE & MACHINE ID ────────────────
  slideNum++;
  const s9 = pptx.addSlide();
  addTitleBar(s9, T.quickLine.title);

  addScreenshot(s9, IMG.md_input_line_machine, 0.5, 1.2, 9.0, 5.0, { border: true });

  addCallout(s9, '1', 2.0, 3.0);
  addCalloutLabel(s9, T.quickLine.steps[0], 2.45, 3.02, { w: 2.5 });
  addCallout(s9, '2', 5.0, 3.0);
  addCalloutLabel(s9, T.quickLine.steps[1], 5.45, 3.02, { w: 3.0 });

  s9.addShape('roundRect', {
    x: 0.5, y: 6.5, w: 9.0, h: 0.6,
    fill: { color: C.blue50 }, rectRadius: 0.08,
  });
  s9.addText('💡 ' + T.quickLine.tip, {
    x: 0.7, y: 6.52, w: 8.6, h: 0.55,
    fontSize: 11, fontFace: 'Arial', color: C.primary,
    valign: 'middle',
  });
  addSlideNumber(s9, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 10: SENSITIVITY ────────────────
  slideNum++;
  const s10 = pptx.addSlide();
  addTitleBar(s10, T.quickSensitivity.title);

  addScreenshot(s10, IMG.md_input_sensitivity, 0.5, 1.2, 9.0, 5.0, { border: true });

  // Field labels
  T.quickSensitivity.fields.forEach((f, i) => {
    addCallout(s10, i + 1, 2.0 + i * 2.5, 3.5);
    addCalloutLabel(s10, f, 2.45 + i * 2.5, 3.52, { w: 2.0 });
  });

  s10.addShape('roundRect', {
    x: 0.5, y: 6.5, w: 9.0, h: 0.5,
    fill: { color: C.passLight }, rectRadius: 0.08,
    line: { color: C.pass, width: 1 },
  });
  s10.addText('✓ ' + T.quickSensitivity.note, {
    x: 0.7, y: 6.52, w: 8.6, h: 0.45,
    fontSize: 11, fontFace: 'Arial', color: C.passDark,
    valign: 'middle',
  });
  addSlideNumber(s10, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 11: RESULT & SAVE ────────────────
  slideNum++;
  const s11 = pptx.addSlide();
  addTitleBar(s11, T.quickSave.title);

  addScreenshot(s11, IMG.md_input_ready_to_save, 0.5, 1.2, 9.0, 5.0, { border: true });

  addCallout(s11, '1', 3.0, 4.3, { bg: C.pass, size: 0.4 });
  addCalloutLabel(s11, T.quickSave.steps[0], 3.5, 4.34, { w: 2.8, bg: C.passDark });
  addCallout(s11, '2', 6.5, 4.3, { bg: C.primary, size: 0.4 });
  addCalloutLabel(s11, T.quickSave.steps[1], 7.0, 4.34, { w: 1.5, bg: C.primaryDark });

  s11.addShape('roundRect', {
    x: 0.5, y: 6.5, w: 9.0, h: 0.5,
    fill: { color: C.blue50 }, rectRadius: 0.08,
  });
  s11.addText(T.quickSave.note, {
    x: 0.7, y: 6.52, w: 8.6, h: 0.45,
    fontSize: 12, fontFace: 'Arial', color: C.primary,
    valign: 'middle',
  });
  addSlideNumber(s11, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 12: FAIL HANDLING ────────────────
  slideNum++;
  const s12 = pptx.addSlide();
  addTitleBar(s12, T.quickFail.title, { bg: C.failDark });

  s12.addText(T.quickFail.desc, {
    x: 0.4, y: 0.95, w: 9.2, h: 0.35,
    fontSize: 12, fontFace: 'Arial', color: C.failDark, bold: true,
  });

  addScreenshot(s12, IMG.md_input_fail, 0.5, 1.4, 9.0, 4.5, { border: true });

  // Fail field labels
  T.quickFail.fields.forEach((f, i) => {
    s12.addShape('roundRect', {
      x: 0.5, y: 6.0 + i * 0.55, w: 9.0, h: 0.48,
      fill: { color: i === 0 ? C.failLight : C.grayLight }, rectRadius: 0.05,
    });
    addCallout(s12, i + 1, 0.6, 6.06 + i * 0.55, { bg: C.fail, size: 0.3 });
    s12.addText(f, {
      x: 1.0, y: 6.02 + i * 0.55, w: 8.3, h: 0.45,
      fontSize: 10, fontFace: 'Arial', color: C.black,
      valign: 'middle',
    });
  });

  // Auto CA note
  s12.addShape('roundRect', {
    x: 0.5, y: 7.15, w: 9.0, h: 0.35,
    fill: { color: C.amberLight }, rectRadius: 0.05,
    line: { color: C.amber, width: 1 },
  });
  s12.addText(T.quickFail.auto, {
    x: 0.7, y: 7.16, w: 8.6, h: 0.32,
    fontSize: 9, fontFace: 'Arial', bold: true, color: C.black,
    valign: 'middle',
  });
  addSlideNumber(s12, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 13: CONTINUOUS INPUT TIPS ────────────────
  slideNum++;
  const s13 = pptx.addSlide();
  addTitleBar(s13, T.quickTips.title);

  // Preserved column
  s13.addShape('roundRect', {
    x: 0.3, y: 1.1, w: 4.5, h: 2.8,
    fill: { color: C.passLight }, rectRadius: 0.1,
    line: { color: C.pass, width: 2 },
  });
  s13.addText(`${T.quickTips.preserved.icon}  ${T.quickTips.preserved.title}`, {
    x: 0.5, y: 1.2, w: 4.1, h: 0.45,
    fontSize: 14, fontFace: 'Arial', bold: true, color: C.passDark,
  });
  T.quickTips.preserved.items.forEach((item, i) => {
    s13.addText(`•  ${item}`, {
      x: 0.7, y: 1.7 + i * 0.45, w: 3.8, h: 0.4,
      fontSize: 13, fontFace: 'Arial', color: C.passDark,
    });
  });

  // Cleared column
  s13.addShape('roundRect', {
    x: 5.2, y: 1.1, w: 4.5, h: 2.8,
    fill: { color: C.blue50 }, rectRadius: 0.1,
    line: { color: C.primaryLight, width: 2 },
  });
  s13.addText(`${T.quickTips.cleared.icon}  ${T.quickTips.cleared.title}`, {
    x: 5.4, y: 1.2, w: 4.1, h: 0.45,
    fontSize: 14, fontFace: 'Arial', bold: true, color: C.primary,
  });
  T.quickTips.cleared.items.forEach((item, i) => {
    s13.addText(`•  ${item}`, {
      x: 5.6, y: 1.7 + i * 0.45, w: 3.8, h: 0.4,
      fontSize: 13, fontFace: 'Arial', color: C.primary,
    });
  });

  // Tips
  s13.addText('💡  Tips', {
    x: 0.3, y: 4.1, w: 9.4, h: 0.4,
    fontSize: 16, fontFace: 'Arial', bold: true, color: C.primaryDark,
  });
  T.quickTips.tips.forEach((tip, i) => {
    s13.addShape('roundRect', {
      x: 0.3, y: 4.6 + i * 0.6, w: 9.4, h: 0.5,
      fill: { color: i % 2 === 0 ? C.grayLight : C.white }, rectRadius: 0.05,
    });
    addCallout(s13, i + 1, 0.45, 4.67 + i * 0.6, { bg: C.primary, size: 0.3 });
    s13.addText(tip, {
      x: 0.9, y: 4.62 + i * 0.6, w: 8.6, h: 0.45,
      fontSize: 12, fontFace: 'Arial', color: C.black,
      valign: 'middle',
    });
  });
  addSlideNumber(s13, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 14: DETAILED ENTRY ────────────────
  slideNum++;
  const s14 = pptx.addSlide();
  addTitleBar(s14, T.detailedMode.title);

  s14.addText(T.detailedMode.desc, {
    x: 0.4, y: 0.95, w: 9.2, h: 0.35,
    fontSize: 12, fontFace: 'Arial', color: C.gray,
  });

  addScreenshot(s14, IMG.md_input_detailed, 0.5, 1.5, 9.0, 4.5, { border: true });

  // 4 step badges
  T.detailedMode.steps.forEach((step, i) => {
    const x = 0.5 + i * 2.3;
    addStepBadge(s14, step, x, 6.2, { w: 2.1, bg: i === 0 ? C.pass : C.primary });
  });

  s14.addText(T.detailedMode.note, {
    x: 0.5, y: 6.7, w: 9.0, h: 0.5,
    fontSize: 11, fontFace: 'Arial', color: C.gray,
    valign: 'middle',
  });
  addSlideNumber(s14, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 15: DASHBOARD KPI ────────────────
  slideNum++;
  const s15 = pptx.addSlide();
  addTitleBar(s15, T.dashKPI.title);

  s15.addText(T.dashKPI.desc, {
    x: 0.4, y: 0.95, w: 9.2, h: 0.35,
    fontSize: 12, fontFace: 'Arial', color: C.gray,
  });

  addScreenshot(s15, IMG.md_dashboard_empty, 0.3, 1.4, 9.4, 4.5, { border: true });

  // KPI labels at bottom
  const kpiColors = [C.grayLight, C.orangeLight, C.failLight, C.blue50, C.passLight, C.amberLight, C.yellowLight];
  const kpiTextColors = [C.black, C.orange, C.failDark, C.primary, C.passDark, C.amber, C.yellow];
  T.dashKPI.kpis.forEach((kpi, i) => {
    const x = 0.2 + i * 1.38;
    s15.addShape('roundRect', {
      x, y: 6.1, w: 1.3, h: 1.1,
      fill: { color: kpiColors[i] }, rectRadius: 0.08,
      line: { color: kpiTextColors[i], width: 1 },
    });
    s15.addText(kpi.n, {
      x, y: 6.1, w: 1.3, h: 0.4,
      fontSize: 16, fontFace: 'Arial', bold: true, color: kpiTextColors[i], align: 'center',
    });
    s15.addText(kpi.label, {
      x: x + 0.05, y: 6.5, w: 1.2, h: 0.65,
      fontSize: 8, fontFace: 'Arial', color: C.black, align: 'center', valign: 'top',
    });
  });
  addSlideNumber(s15, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 16: DASHBOARD FACTORY COMPARISON ────────────────
  slideNum++;
  const s16 = pptx.addSlide();
  addTitleBar(s16, T.dashFactory.title);

  s16.addText(T.dashFactory.desc, {
    x: 0.4, y: 0.95, w: 9.2, h: 0.35,
    fontSize: 12, fontFace: 'Arial', color: C.gray,
  });

  addScreenshot(s16, IMG.md_dashboard_full, 0.3, 1.4, 9.4, 4.5, { border: true });

  // Badge legend
  T.dashFactory.badges.forEach((badge, i) => {
    const x = 0.5 + i * 3.2;
    s16.addShape('roundRect', {
      x, y: 6.2, w: 2.8, h: 0.5,
      fill: { color: badge.bg }, rectRadius: 0.08,
      line: { color: badge.color, width: 1 },
    });
    s16.addText(badge.text, {
      x, y: 6.2, w: 2.8, h: 0.5,
      fontSize: 13, fontFace: 'Arial', bold: true, color: badge.color, align: 'center', valign: 'middle',
    });
  });

  s16.addText(T.dashFactory.note, {
    x: 0.5, y: 6.9, w: 9.0, h: 0.4,
    fontSize: 11, fontFace: 'Arial', bold: true, color: C.primary,
    valign: 'middle',
  });
  addSlideNumber(s16, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 17: DASHBOARD PASS RATE ────────────────
  slideNum++;
  const s17 = pptx.addSlide();
  addTitleBar(s17, T.dashPassRate.title);

  s17.addText(T.dashPassRate.desc, {
    x: 0.4, y: 0.95, w: 9.2, h: 0.35,
    fontSize: 13, fontFace: 'Arial', color: C.black,
  });

  // Use dashboard full screenshot (lower half focus)
  addScreenshot(s17, IMG.md_dashboard_full, 0.3, 1.4, 9.4, 4.0, { border: true });

  s17.addText(T.dashPassRate.explain, {
    x: 0.5, y: 5.6, w: 4.5, h: 0.8,
    fontSize: 12, fontFace: 'Arial', color: C.black,
    valign: 'top',
  });

  s17.addShape('roundRect', {
    x: 5.5, y: 5.6, w: 4.0, h: 0.8,
    fill: { color: C.blue50 }, rectRadius: 0.08,
  });
  s17.addText(T.dashPassRate.note, {
    x: 5.7, y: 5.65, w: 3.6, h: 0.7,
    fontSize: 11, fontFace: 'Arial', color: C.primary,
    valign: 'middle',
  });
  addSlideNumber(s17, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 18: HISTORY FILTERS ────────────────
  slideNum++;
  const s18 = pptx.addSlide();
  addTitleBar(s18, T.historyFilters.title);

  addScreenshot(s18, IMG.md_history, 0.3, 1.1, 9.4, 4.8, { border: true });

  // Filter labels
  T.historyFilters.filters.forEach((f, i) => {
    s18.addShape('roundRect', {
      x: 0.3 + i * 2.4, y: 6.1, w: 2.2, h: 0.55,
      fill: { color: C.blue50 }, rectRadius: 0.05,
      line: { color: C.primary, width: 1 },
    });
    addCallout(s18, i + 1, 0.35 + i * 2.4, 6.15, { bg: C.primary, size: 0.28 });
    s18.addText(f, {
      x: 0.7 + i * 2.4, y: 6.12, w: 1.7, h: 0.5,
      fontSize: 9, fontFace: 'Arial', color: C.primaryDark,
      valign: 'middle',
    });
  });

  s18.addShape('roundRect', {
    x: 0.3, y: 6.8, w: 9.4, h: 0.45,
    fill: { color: C.amberLight }, rectRadius: 0.05,
  });
  s18.addText('💡 ' + T.historyFilters.tip, {
    x: 0.5, y: 6.82, w: 9.0, h: 0.4,
    fontSize: 11, fontFace: 'Arial', color: C.black,
    valign: 'middle',
  });
  addSlideNumber(s18, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 19: CA TRACKING ────────────────
  slideNum++;
  const s19 = pptx.addSlide();
  addTitleBar(s19, T.historyCA.title);

  // CA status flow
  const flowColors = [C.amber, C.primaryLight, C.pass];
  T.historyCA.flow.forEach((item, i) => {
    const x = 0.3 + i * 3.3;
    s19.addShape('roundRect', {
      x, y: 1.0, w: 3.0, h: 0.55,
      fill: { color: flowColors[i] }, rectRadius: 0.1,
    });
    s19.addText(item, {
      x, y: 1.0, w: 3.0, h: 0.55,
      fontSize: 11, fontFace: 'Arial', bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    if (i < 2) {
      s19.addText('→', {
        x: x + 3.0, y: 0.95, w: 0.3, h: 0.65,
        fontSize: 24, fontFace: 'Arial', bold: true, color: C.gray, align: 'center',
      });
    }
  });

  // How-to steps
  T.historyCA.howTo.forEach((step, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i < 3 ? i : i - 3;
    const x = 0.3 + col * 5.0;
    const y = 1.8 + row * 0.55;
    s19.addShape('roundRect', {
      x, y, w: 4.6, h: 0.48,
      fill: { color: i % 2 === 0 ? C.grayLight : C.white }, rectRadius: 0.05,
    });
    s19.addText(step, {
      x: x + 0.15, y, w: 4.3, h: 0.48,
      fontSize: 12, fontFace: 'Arial', color: C.black, valign: 'middle',
    });
  });

  // History screenshot (smaller)
  addScreenshot(s19, IMG.md_history_full, 0.3, 3.6, 9.4, 3.0, { border: true });

  s19.addShape('roundRect', {
    x: 0.3, y: 6.8, w: 9.4, h: 0.45,
    fill: { color: C.passLight }, rectRadius: 0.05,
  });
  s19.addText('✓ ' + T.historyCA.note, {
    x: 0.5, y: 6.82, w: 9.0, h: 0.4,
    fontSize: 11, fontFace: 'Arial', bold: true, color: C.passDark,
    valign: 'middle',
  });
  addSlideNumber(s19, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 20: REPORT ────────────────
  slideNum++;
  const s20 = pptx.addSlide();
  addTitleBar(s20, T.report.title);

  addScreenshot(s20, IMG.md_report, 0.5, 1.2, 9.0, 5.0, { border: true });

  // Step callouts
  T.report.steps.forEach((step, i) => {
    addCallout(s20, i + 1, 1.0 + i * 3.0, 2.5);
    addCalloutLabel(s20, step, 1.45 + i * 3.0, 2.52, { w: 2.5 });
  });

  s20.addShape('roundRect', {
    x: 0.5, y: 6.4, w: 4.5, h: 0.45,
    fill: { color: C.blue50 }, rectRadius: 0.08,
  });
  s20.addText(T.report.fileName, {
    x: 0.7, y: 6.42, w: 4.1, h: 0.4,
    fontSize: 12, fontFace: 'Arial', bold: true, color: C.primary,
    valign: 'middle',
  });

  s20.addText(T.report.note, {
    x: 5.2, y: 6.42, w: 4.3, h: 0.4,
    fontSize: 11, fontFace: 'Arial', color: C.gray,
    valign: 'middle',
  });
  addSlideNumber(s20, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 21: DAILY WORKFLOW ────────────────
  slideNum++;
  const s21 = pptx.addSlide();
  addTitleBar(s21, T.workflow.title);

  const phaseColors = [C.primary, C.fail, C.amber, C.pass];
  const phaseIcons = ['📋', '⚠️', '📊', '🔧'];

  T.workflow.phases.forEach((phase, i) => {
    const x = 0.2 + i * 2.45;
    // Phase card
    s21.addShape('roundRect', {
      x, y: 1.1, w: 2.3, h: 6.0,
      fill: { color: C.white }, rectRadius: 0.1,
      line: { color: phaseColors[i], width: 2 },
      shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 },
    });
    // Timing badge
    s21.addShape('roundRect', {
      x: x + 0.1, y: 1.2, w: 2.1, h: 0.55,
      fill: { color: phaseColors[i] }, rectRadius: 0.08,
    });
    s21.addText(phase.timing, {
      x: x + 0.1, y: 1.2, w: 2.1, h: 0.55,
      fontSize: 12, fontFace: 'Arial', bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    // Icon + Title
    s21.addText(phaseIcons[i], {
      x, y: 1.9, w: 2.3, h: 0.5,
      fontSize: 24, align: 'center',
    });
    s21.addText(phase.title, {
      x: x + 0.1, y: 2.4, w: 2.1, h: 0.5,
      fontSize: 13, fontFace: 'Arial', bold: true, color: phaseColors[i], align: 'center',
    });
    // Items
    phase.items.forEach((item, j) => {
      s21.addText(`${j + 1}. ${item}`, {
        x: x + 0.15, y: 3.0 + j * 0.55, w: 2.0, h: 0.5,
        fontSize: 11, fontFace: 'Arial', color: C.black,
        valign: 'top',
      });
    });
  });
  addSlideNumber(s21, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 22: FAQ ────────────────
  slideNum++;
  const s22 = pptx.addSlide();
  addTitleBar(s22, T.faq.title);

  T.faq.items.forEach((item, i) => {
    const y = 1.1 + i * 1.2;
    // Q
    s22.addShape('roundRect', {
      x: 0.3, y, w: 9.4, h: 0.48,
      fill: { color: C.blue50 }, rectRadius: 0.05,
    });
    s22.addText(`Q${i + 1}: ${item.q}`, {
      x: 0.5, y, w: 9.0, h: 0.48,
      fontSize: 13, fontFace: 'Arial', bold: true, color: C.primaryDark,
      valign: 'middle',
    });
    // A
    s22.addShape('roundRect', {
      x: 0.5, y: y + 0.53, w: 9.0, h: 0.48,
      fill: { color: C.grayLight }, rectRadius: 0.05,
    });
    s22.addText(`A: ${item.a}`, {
      x: 0.7, y: y + 0.53, w: 8.6, h: 0.48,
      fontSize: 12, fontFace: 'Arial', color: C.black,
      valign: 'middle',
    });
  });
  addSlideNumber(s22, slideNum, TOTAL_SLIDES);

  // ──────────────── SLIDE 23: CONTACT ────────────────
  slideNum++;
  const s23 = pptx.addSlide();
  s23.background = { fill: C.primaryDark };
  s23.addShape('rect', { x: -1, y: -0.5, w: 4, h: 9, fill: { color: C.primary }, rotate: -10 });
  s23.addShape('ellipse', { x: 7.5, y: 5.5, w: 4, h: 4, fill: { color: '1E3375' } });

  s23.addText(T.contact.title, {
    x: 1.0, y: 1.0, w: 8, h: 0.7,
    fontSize: 28, fontFace: 'Arial', bold: true, color: C.white,
  });
  s23.addShape('rect', { x: 1.0, y: 1.8, w: 3.0, h: 0.06, fill: { color: C.accent } });

  // Info cards
  const contactItems = [
    { label: 'System URL', value: T.contact.url },
    { label: 'Support', value: T.contact.dept },
    { label: 'Email', value: T.contact.email },
  ];
  contactItems.forEach((item, i) => {
    const y = 2.2 + i * 0.9;
    s23.addShape('roundRect', {
      x: 1.0, y, w: 7.0, h: 0.7,
      fill: { color: '1E3375' }, rectRadius: 0.1,
    });
    s23.addText(item.label, {
      x: 1.3, y, w: 2.0, h: 0.7,
      fontSize: 12, fontFace: 'Arial', color: C.accent, valign: 'middle',
    });
    s23.addText(item.value, {
      x: 3.3, y, w: 4.5, h: 0.7,
      fontSize: 14, fontFace: 'Arial', bold: true, color: C.white, valign: 'middle',
    });
  });

  s23.addText(T.contact.thanks, {
    x: 1.0, y: 5.0, w: 8, h: 0.6,
    fontSize: 22, fontFace: 'Arial', bold: true, color: C.white,
  });
  s23.addText(T.contact.tagline, {
    x: 1.0, y: 5.6, w: 8, h: 0.4,
    fontSize: 14, fontFace: 'Arial', color: C.blue100,
  });
  addSlideNumber(s23, slideNum, TOTAL_SLIDES);
}

// ═══════════════════════════════════════════════════════════════
// MAIN - Generate both language versions
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('=== MD Manual v2.0 PPTX Generator (with Screenshots) ===\n');

  for (const lang of ['EN', 'VI']) {
    const T = TEXTS[lang];
    const pptx = new PptxGenJS();

    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'Q-TRAIN System';
    pptx.company = 'HWK Vietnam';
    pptx.subject = `Metal Detector Manual v2.0 (${lang})`;
    pptx.title = `MD Manual v2.0 - ${lang}`;

    buildSlides(pptx, T);

    const outPath = join(OUTPUT_DIR, T.file);
    await pptx.writeFile({ fileName: outPath });
    console.log(`✅ ${lang}: ${outPath}`);
  }

  console.log('\n=== Done! 2 PPTX files generated ===');
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
