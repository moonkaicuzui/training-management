#!/usr/bin/env node
/**
 * Metal Detector Weekly Inspection - User Manual PPTX Generator
 * Generates 2 language versions: English, Vietnamese
 * Usage: node scripts/generateMDManual.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// pptxgenjs는 CJS 모듈이므로 동적 import
const PptxGenJS = (await import(resolve(__dirname, '..', 'node_modules', 'pptxgenjs', 'dist', 'pptxgen.cjs.js'))).default;

const OUTPUT_DIR = join(__dirname, 'output');
mkdirSync(OUTPUT_DIR, { recursive: true });

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
};

const FONT = {
  title: { fontFace: 'Arial', fontSize: 28, color: C.white, bold: true },
  subtitle: { fontFace: 'Arial', fontSize: 16, color: C.blue100 },
  sectionTitle: { fontFace: 'Arial', fontSize: 24, color: C.primaryDark, bold: true },
  heading: { fontFace: 'Arial', fontSize: 18, color: C.primaryDark, bold: true },
  subheading: { fontFace: 'Arial', fontSize: 14, color: C.primary, bold: true },
  body: { fontFace: 'Arial', fontSize: 13, color: C.black },
  bodySmall: { fontFace: 'Arial', fontSize: 11, color: C.gray },
  bullet: { fontFace: 'Arial', fontSize: 12, color: C.black },
  label: { fontFace: 'Arial', fontSize: 10, color: C.gray },
  number: { fontFace: 'Arial', fontSize: 36, color: C.primary, bold: true },
  stepNum: { fontFace: 'Arial', fontSize: 16, color: C.white, bold: true },
};

// ═══════════════════════════════════════════════════════════════
// TEXT CONTENT - 2 LANGUAGES
// ═══════════════════════════════════════════════════════════════

const TEXTS = {
  EN: {
    file: 'MD_Manual_EN.pptx',
    // Slide 1: Cover
    cover: {
      title: 'Metal Detector Weekly Inspection',
      subtitle: 'User Manual',
      system: 'Q-TRAIN System',
      org: 'HWK Vietnam - QIP Department',
      date: 'March 2026',
      version: 'v1.0',
    },
    // Slide 2: TOC
    toc: {
      title: 'Table of Contents',
      items: [
        '1. System Overview',
        '2. Login & Navigation',
        '3. Quick Entry Mode (NEW!)',
        '4. Quick Entry - Step by Step',
        '5. Quick Entry - FAIL Handling',
        '6. Quick Entry - Continuous Input Tips',
        '7. Detailed Entry Mode (4-Step Wizard)',
        '8. Dashboard - KPI Summary',
        '9. Dashboard - Factory Comparison',
        '10. Dashboard - Repeated Issues & Pass Rate',
        '11. Inspection History',
        '12. Corrective Action (CA) Tracking',
        '13. PDF Report Generation',
        '14. Daily Workflow Summary',
        '15. FAQ',
        '16. Contact & Support',
      ],
    },
    // Slide 3: Before/After
    beforeAfter: {
      title: 'Process Change: Before & After',
      beforeTitle: 'BEFORE (Manual Process)',
      beforeItems: [
        'Record inspection results on paper forms',
        'Manually compile data into Excel spreadsheet',
        'Create weekly report email manually',
        'Send email to management every week',
        'Track corrective actions in separate files',
        'No real-time visibility of inspection status',
      ],
      afterTitle: 'AFTER (Q-TRAIN System)',
      afterItems: [
        'Enter results directly on phone or PC',
        'Automatic dashboard with real-time KPIs',
        'Weekly report generated automatically',
        'PDF report download with one click',
        'Corrective actions tracked in the system',
        'Real-time factory comparison & trend analysis',
      ],
      keyChange: 'Key Improvement: From 2+ hours of manual work to 5 minutes of data entry per day!',
    },
    // Slide 4: Login
    login: {
      title: 'How to Access the System',
      steps: [
        { num: '1', title: 'Open Browser', desc: 'Chrome recommended (PC or mobile)' },
        { num: '2', title: 'Enter URL', desc: 'https://q-train-web.web.app/' },
        { num: '3', title: 'Login', desc: 'Use your company email (@hsvina.com)' },
        { num: '4', title: 'Navigate', desc: 'Menu: Equipment > Metal Detector' },
      ],
      urlBox: 'https://q-train-web.web.app/',
      navPath: 'Sidebar  >  Equipment  >  Metal Detector',
      note: 'Note: Only @hsvina.com, @hwaseung.com, @hwaseungvina.com emails are allowed.',
    },
    // Slide 5-6: Quick Entry Overview
    quickEntry: {
      title: 'Quick Entry Mode - Overview',
      desc: 'The fastest way to record daily inspection results',
      features: [
        { icon: 'ZAP', title: 'All-in-One Screen', desc: 'All input fields visible on a single screen - no multiple steps needed' },
        { icon: 'CHECK', title: 'Smart Defaults', desc: 'Result defaults to PASS, date to today, inspector to logged-in user' },
        { icon: 'REPEAT', title: 'Continuous Input', desc: 'After saving, factory/date/inspector/sensitivity are preserved for next entry' },
        { icon: 'COUNT', title: 'Progress Counter', desc: '"Today N items" counter shows how many inspections you\'ve done today' },
      ],
      layoutTitle: 'Screen Layout',
      layoutAreas: [
        { label: 'Row 1', desc: 'Factory (A/B/C/D buttons) + Date picker' },
        { label: 'Row 2', desc: 'Line + Machine ID + Inspector name' },
        { label: 'Row 3', desc: 'Sensitivity: Fe (mm) + SUS (mm) + Non-Fe (mm)' },
        { label: 'Row 4', desc: 'Result (PASS/FAIL buttons) + Save button' },
      ],
      tabNote: 'Select the "Quick Entry" tab at the top of the Input Form page',
    },
    // Slide 7: Quick Entry Step 1
    quickStep1: {
      title: 'Quick Entry - Step by Step (1/2)',
      steps: [
        { num: '1', title: 'Select Factory', desc: 'Click one of A / B / C / D buttons.\nThe selected button turns blue.', field: 'Factory' },
        { num: '2', title: 'Select Date', desc: 'Default: Today\'s date.\nChange only if entering past data.', field: 'Date' },
        { num: '3', title: 'Enter Line', desc: 'Type the production line (e.g. "A-1", "B-3").\nAutocomplete suggests recent lines.', field: 'Line' },
        { num: '4', title: 'Enter Machine ID', desc: 'Type the equipment ID (e.g. "D210103").\nAutocomplete suggests recent IDs.', field: 'Machine ID' },
      ],
      tip: 'TIP: Line and Machine ID fields show autocomplete suggestions based on previous entries.',
    },
    // Slide 8: Quick Entry Step 2
    quickStep2: {
      title: 'Quick Entry - Step by Step (2/2)',
      steps: [
        { num: '5', title: 'Enter Sensitivity', desc: 'Enter 3 values in millimeters:\n  Fe (Iron)\n  SUS (Stainless Steel)\n  Non-Fe (Non-Ferrous)', field: 'Sensitivity' },
        { num: '6', title: 'Select Result', desc: 'Click PASS (green) or FAIL (red).\nDefault is PASS.\nIf FAIL: additional fields appear.', field: 'Result' },
        { num: '7', title: 'Click Save', desc: 'Button is enabled when all required fields are filled.\nSuccess message appears at the top.', field: 'Save' },
      ],
      warning: 'IMPORTANT: If you select FAIL, you MUST fill in the Failure Type and Description before saving.',
    },
    // Slide 9: FAIL Handling
    failHandling: {
      title: 'Quick Entry - FAIL Handling',
      desc: 'When you select FAIL, a red highlighted area appears below the result buttons:',
      failFields: [
        { label: 'Failure Type (Required)', desc: 'Select from dropdown:\n  - Sensitivity Drift\n  - Equipment Malfunction\n  - Calibration Error\n  - Foreign Object\n  - Other' },
        { label: 'Failure Description (Required)', desc: 'Type a detailed description of what happened.' },
      ],
      autoCA: 'AUTOMATIC: When a FAIL record is saved, a Corrective Action (CA) is automatically created with status "Pending".',
      caFlow: 'FAIL saved  →  CA created (Pending)  →  Maintenance team notified  →  Track in History page',
    },
    // Slide 10: Continuous Input Tips
    continuousTips: {
      title: 'Quick Entry - Continuous Input Tips',
      desc: 'Designed for inspecting multiple machines quickly:',
      preserved: {
        title: 'Auto-Preserved After Save',
        items: ['Factory selection', 'Inspection date', 'Inspector name', 'Sensitivity values (Fe, SUS, Non-Fe)'],
      },
      cleared: {
        title: 'Cleared After Save (Enter New)',
        items: ['Line number', 'Machine ID', 'Result (resets to PASS)', 'Remarks', 'Failure details (if any)'],
      },
      tips: [
        '"Today N items" badge: Track your progress - see how many inspections done today.',
        'Success toast: Green message confirms save - auto-hides after 3 seconds.',
        'Same sensitivity: If machines have similar specs, values carry over - just save.',
        'Factory change: Only change factory button when moving to a different building.',
      ],
    },
    // Slide 11: Detailed Entry
    detailedEntry: {
      title: 'Detailed Entry Mode (4-Step Wizard)',
      desc: 'Best suited for FAIL cases that need thorough documentation:',
      steps: [
        { num: '1', title: 'Factory & Line', items: ['Select Factory (A/B/C/D)', 'Enter Line number', 'Enter Machine ID (optional)'] },
        { num: '2', title: 'Inspector Info', items: ['Select inspection date', 'Enter inspector name', 'Enter product name (optional)'] },
        { num: '3', title: 'Sensitivity', items: ['Enter Fe sensitivity (mm)', 'Enter SUS sensitivity (mm)', 'Enter Non-Fe sensitivity (mm)'] },
        { num: '4', title: 'Result', items: ['Select PASS or FAIL', 'If FAIL: select failure type', 'If FAIL: enter description', 'Enter remarks (optional)'] },
      ],
      navNote: 'Use Back/Next buttons to navigate between steps. Progress indicator shows completed steps with green checkmarks.',
    },
    // Slide 12: Dashboard KPI
    dashboardKPI: {
      title: 'Dashboard - KPI Summary',
      desc: 'Select year and week number to view the weekly report:',
      kpis: [
        { num: '1', title: 'Total Machines\nChecked', desc: 'Number of inspections\nthis week', color: C.grayLight },
        { num: '2', title: 'Failed\nLast Week', desc: 'FAIL count from\nprevious week', color: C.orangeLight },
        { num: '3', title: 'Failed\nThis Week', desc: 'FAIL count for\ncurrent week', color: C.failLight },
        { num: '4', title: 'Fixed\nOn Time', desc: 'CA completed count\nvs last week fails', color: C.blue50 },
        { num: '5', title: 'Maintenance\nFix Rate', desc: 'Percentage of last week\nfails that are fixed', color: C.passLight },
        { num: '6', title: 'Repeated\nIssues', desc: 'Machines failed\n2+ consecutive weeks', color: C.amberLight },
        { num: '7', title: 'Repeated\nIssue Rate', desc: 'Repeated / Total\ninspected machines %', color: C.yellowLight },
      ],
      weekSelector: 'Use the Year and Week (W1-W52) dropdowns at the top right to select the report period.',
    },
    // Slide 13: Factory Comparison
    factoryComparison: {
      title: 'Dashboard - Factory Comparison',
      desc: 'WEEKLY COMPARISON BY FACTORY - Compare this week vs last week:',
      tableHeaders: ['Factory', 'Failed Last Week', 'Failed This Week', 'Improvement'],
      tableRows: [
        ['Factory A', '2', '1', 'Improved'],
        ['Factory B', '0', '0', 'No Change'],
        ['Factory C', '3', '4', 'Increased'],
        ['Factory D', '1', '0', 'Improved'],
      ],
      badges: {
        improved: { text: 'Improved', color: C.passDark, bg: C.passLight },
        noChange: { text: 'No Change', color: C.gray, bg: C.grayLight },
        increased: { text: 'Increased', color: C.failDark, bg: C.failLight },
      },
      chartsNote: 'Below the table: Bar chart (Pass/Fail by factory) and Line chart (12-week pass rate trend).',
    },
    // Slide 14: Repeated Issues & Pass Rate
    repeatedAndPassRate: {
      title: 'Dashboard - Repeated Issues & Pass Rate',
      section1Title: 'Repeated Issue Machine Analysis',
      section1Desc: 'Lists machines that FAILED in both this week AND last week:',
      section1Headers: ['Machine ID', 'Factory', 'Line', 'Key Issue', 'Status'],
      section1Example: ['D210103', 'Factory A', 'A-1', 'Failed to detect metal test piece', 'REPEATED'],
      section2Title: 'Pass Rate Comparison (2 Weeks)',
      section2Desc: 'Compares pass rate between last week and this week by factory:',
      section2Headers: ['Factory', 'Last Week (Wn)', 'This Week (Wn+1)'],
      section2Example: [
        ['Factory A', '95%', '97%'],
        ['Factory B', '100%', '100%'],
        ['Factory C', '88%', '85%'],
        ['Factory D', '96%', '100%'],
        ['Total', '94%', '95%'],
      ],
      passRateNote: 'Green = improved vs last week, Red = decreased vs last week',
    },
    // Slide 15: History
    history: {
      title: 'Inspection History',
      desc: 'View and search all past inspection records:',
      filters: [
        { label: 'Factory', desc: 'All / A / B / C / D' },
        { label: 'Result', desc: 'All / PASS / FAIL' },
        { label: 'Date From', desc: 'Start date filter' },
        { label: 'Date To', desc: 'End date filter' },
        { label: 'Clear', desc: 'Reset all filters' },
      ],
      tableHeaders: ['Date', 'Factory', 'Line', 'Machine ID', 'Result', 'Fe', 'SUS', 'Non-Fe', 'Inspector'],
      clickNote: 'Click any row to open a detail modal with full information and CA tracking (for FAIL items).',
      navPath: 'Menu: Equipment > Metal Detector > History',
    },
    // Slide 16: CA Tracking
    caTracking: {
      title: 'Corrective Action (CA) Tracking',
      desc: 'Track and update the fix status for each failed inspection:',
      howTo: [
        { num: '1', title: 'Open History', desc: 'Go to Equipment > Metal Detector > History' },
        { num: '2', title: 'Find FAIL Item', desc: 'Filter by Result = FAIL, click on a row' },
        { num: '3', title: 'View CA Status', desc: 'In the detail modal, see the current CA status badge' },
        { num: '4', title: 'Update Status', desc: 'Select new status from dropdown:\n  Pending → In Progress → Completed' },
        { num: '5', title: 'Add Description', desc: 'Enter what was done to fix the issue' },
        { num: '6', title: 'Save', desc: 'Click "Update" button to save the CA change' },
      ],
      statuses: [
        { name: 'Pending', color: C.yellow, desc: 'New - awaiting maintenance action' },
        { name: 'In Progress', color: C.primaryLight, desc: 'Maintenance is working on the fix' },
        { name: 'Completed', color: C.pass, desc: 'Issue fixed and verified' },
        { name: 'Overdue', color: C.fail, desc: 'Not fixed within expected timeframe' },
      ],
      dashboardNote: 'CA completion is automatically reflected in the Dashboard\'s "Maintenance Fix Rate" KPI.',
    },
    // Slide 17: PDF Report
    pdfReport: {
      title: 'PDF Report Generation',
      desc: 'Generate and download a PDF report for any week:',
      steps: [
        { num: '1', title: 'Go to Report Page', desc: 'Menu: Equipment > Metal Detector > Report' },
        { num: '2', title: 'Select Period', desc: 'Choose Year and Week number (W1-W52)' },
        { num: '3', title: 'Preview', desc: 'View summary cards:\n  Total Inspections, Pass Rate, Pass Count, Fail Count' },
        { num: '4', title: 'Factory Breakdown', desc: 'See pass rate for each factory (A/B/C/D)' },
        { num: '5', title: 'Generate PDF', desc: 'Click "Generate PDF" button\nFile downloads: MD_Report_2026_W11.pdf' },
      ],
      fileName: 'File name format: MD_Report_{Year}_W{Week}.pdf',
      noDataNote: 'If no data exists for the selected week, a "No data" message is shown and the PDF button is disabled.',
    },
    // Slide 18: Daily Workflow
    dailyWorkflow: {
      title: 'Daily Workflow Summary',
      workflows: [
        {
          timing: 'DAILY',
          icon: 'CALENDAR',
          title: 'Record Inspections',
          steps: [
            'Open Q-TRAIN on your phone or PC',
            'Go to Equipment > Metal Detector > Input',
            'Use Quick Entry mode for fast input',
            'Enter each machine: Line, Machine ID, Sensitivity, Result',
            'Click Save after each machine',
            'Check "Today N items" counter to confirm all done',
          ],
        },
        {
          timing: 'WHEN FAIL',
          icon: 'ALERT',
          title: 'Handle Failures',
          steps: [
            'Select FAIL result for the machine',
            'Choose Failure Type from dropdown',
            'Enter detailed description of the issue',
            'Save — CA is automatically created',
            'Notify maintenance team about the failure',
          ],
        },
        {
          timing: 'WEEKLY',
          icon: 'CHART',
          title: 'Review Dashboard',
          steps: [
            'Check Dashboard for weekly KPI summary',
            'Review Factory Comparison for trends',
            'Check Repeated Issues list',
            'Generate PDF report if needed',
          ],
        },
        {
          timing: 'AFTER FIX',
          icon: 'WRENCH',
          title: 'Update CA Status',
          steps: [
            'Go to History page',
            'Find the FAIL item (filter by Result = FAIL)',
            'Click the row to open detail modal',
            'Update CA status: Pending → In Progress → Completed',
            'Add description of fix actions taken',
          ],
        },
      ],
    },
    // Slide 19: FAQ
    faq: {
      title: 'Frequently Asked Questions (FAQ)',
      items: [
        {
          q: 'Is Machine ID required?',
          a: 'No, Machine ID is optional. However, it is strongly recommended for tracking repeated issues. Without it, the system uses Factory + Line combination.',
        },
        {
          q: 'Can I inspect the same machine twice?',
          a: 'Yes, you can create multiple inspection records for the same machine on the same day. Each record is saved independently.',
        },
        {
          q: 'Can I change a FAIL to PASS after saving?',
          a: 'The result cannot be changed after saving. If you made an error, create a new correct record and contact the admin to handle the incorrect entry.',
        },
        {
          q: 'How are repeated issues detected?',
          a: 'The system compares FAIL records by Machine ID (or Factory+Line) across two consecutive weeks. If the same machine fails in both weeks, it is flagged as "Repeated".',
        },
        {
          q: 'What if I enter data for the wrong date?',
          a: 'You can change the inspection date in the date picker. The system will assign the correct ISO week number automatically.',
        },
        {
          q: 'Can I use this on my mobile phone?',
          a: 'Yes! Q-TRAIN is a responsive web application. Open the URL in Chrome on your phone and it works like an app. You can add it to your home screen.',
        },
      ],
    },
    // Slide 20: Contact
    contact: {
      title: 'Contact & Support',
      systemTitle: 'System Information',
      systemItems: [
        { label: 'System URL', value: 'https://q-train-web.web.app/' },
        { label: 'Module', value: 'Equipment > Metal Detector' },
        { label: 'Languages', value: 'Korean, English, Vietnamese' },
        { label: 'Access', value: 'Company email (@hsvina.com) required' },
      ],
      supportTitle: 'Support Contacts',
      supportItems: [
        { label: 'System Admin', value: 'QIP Department' },
        { label: 'Technical Support', value: 'ksmoon@hsvina.com' },
        { label: 'QA Team', value: 'hwk_qa@hsvina.com' },
      ],
      thankYou: 'Thank you for using Q-TRAIN!',
      tagline: 'Accurate inspection data leads to better quality products.',
    },
  },

  VI: {
    file: 'MD_Manual_VI.pptx',
    cover: {
      title: 'Kiểm tra máy dò kim loại hàng tuần',
      subtitle: 'Hướng dẫn sử dụng',
      system: 'Hệ thống Q-TRAIN',
      org: 'HWK Vietnam - Bộ phận QIP',
      date: 'Tháng 3, 2026',
      version: 'v1.0',
    },
    toc: {
      title: 'Mục lục',
      items: [
        '1. Tổng quan hệ thống',
        '2. Đăng nhập & Điều hướng',
        '3. Chế độ nhập nhanh (MỚI!)',
        '4. Nhập nhanh - Từng bước',
        '5. Nhập nhanh - Xử lý FAIL',
        '6. Nhập nhanh - Mẹo nhập liên tục',
        '7. Chế độ nhập chi tiết (4 bước)',
        '8. Bảng điều khiển - Tóm tắt KPI',
        '9. Bảng điều khiển - So sánh nhà máy',
        '10. Bảng điều khiển - Vấn đề lặp lại & Tỷ lệ đạt',
        '11. Lịch sử kiểm tra',
        '12. Theo dõi hành động khắc phục (CA)',
        '13. Tạo báo cáo PDF',
        '14. Tóm tắt quy trình hàng ngày',
        '15. Câu hỏi thường gặp',
        '16. Liên hệ & Hỗ trợ',
      ],
    },
    beforeAfter: {
      title: 'Thay đổi quy trình: Trước & Sau',
      beforeTitle: 'TRƯỚC ĐÂY (Quy trình thủ công)',
      beforeItems: [
        'Ghi kết quả kiểm tra trên giấy',
        'Tổng hợp dữ liệu thủ công vào Excel',
        'Tạo báo cáo hàng tuần bằng tay',
        'Gửi email báo cáo cho ban quản lý mỗi tuần',
        'Theo dõi hành động khắc phục trong file riêng',
        'Không có khả năng theo dõi trạng thái kiểm tra theo thời gian thực',
      ],
      afterTitle: 'SAU (Hệ thống Q-TRAIN)',
      afterItems: [
        'Nhập kết quả trực tiếp trên điện thoại hoặc PC',
        'Bảng điều khiển tự động với KPI thời gian thực',
        'Báo cáo hàng tuần được tạo tự động',
        'Tải báo cáo PDF chỉ với một cú nhấp',
        'Hành động khắc phục được theo dõi trong hệ thống',
        'So sánh nhà máy & phân tích xu hướng theo thời gian thực',
      ],
      keyChange: 'Cải thiện chính: Từ 2+ giờ làm việc thủ công xuống 5 phút nhập dữ liệu mỗi ngày!',
    },
    login: {
      title: 'Cách truy cập hệ thống',
      steps: [
        { num: '1', title: 'Mở trình duyệt', desc: 'Khuyến nghị dùng Chrome (PC hoặc di động)' },
        { num: '2', title: 'Nhập URL', desc: 'https://q-train-web.web.app/' },
        { num: '3', title: 'Đăng nhập', desc: 'Sử dụng email công ty (@hsvina.com)' },
        { num: '4', title: 'Điều hướng', desc: 'Menu: Equipment > Metal Detector' },
      ],
      urlBox: 'https://q-train-web.web.app/',
      navPath: 'Thanh bên  >  Equipment  >  Metal Detector',
      note: 'Lưu ý: Chỉ cho phép email @hsvina.com, @hwaseung.com, @hwaseungvina.com.',
    },
    quickEntry: {
      title: 'Chế độ nhập nhanh - Tổng quan',
      desc: 'Cách nhanh nhất để ghi lại kết quả kiểm tra hàng ngày',
      features: [
        { icon: 'ZAP', title: 'Màn hình tất cả', desc: 'Tất cả trường nhập hiển thị trên một màn hình - không cần nhiều bước' },
        { icon: 'CHECK', title: 'Giá trị mặc định', desc: 'Kết quả mặc định PASS, ngày hôm nay, người kiểm tra là người đăng nhập' },
        { icon: 'REPEAT', title: 'Nhập liên tục', desc: 'Sau khi lưu, nhà máy/ngày/người kiểm tra/độ nhạy được giữ lại cho lần nhập tiếp' },
        { icon: 'COUNT', title: 'Bộ đếm tiến độ', desc: 'Bộ đếm "Hôm nay N mục" hiển thị số lượng kiểm tra đã thực hiện hôm nay' },
      ],
      layoutTitle: 'Bố cục màn hình',
      layoutAreas: [
        { label: 'Hàng 1', desc: 'Nhà máy (nút A/B/C/D) + Chọn ngày' },
        { label: 'Hàng 2', desc: 'Line + Mã máy + Tên người kiểm tra' },
        { label: 'Hàng 3', desc: 'Độ nhạy: Fe (mm) + SUS (mm) + Non-Fe (mm)' },
        { label: 'Hàng 4', desc: 'Kết quả (nút PASS/FAIL) + Nút Lưu' },
      ],
      tabNote: 'Chọn tab "Quick Entry" ở đầu trang Input Form',
    },
    quickStep1: {
      title: 'Nhập nhanh - Từng bước (1/2)',
      steps: [
        { num: '1', title: 'Chọn nhà máy', desc: 'Nhấp một trong các nút A / B / C / D.\nNút được chọn chuyển sang màu xanh.', field: 'Nhà máy' },
        { num: '2', title: 'Chọn ngày', desc: 'Mặc định: Ngày hôm nay.\nChỉ thay đổi khi nhập dữ liệu cũ.', field: 'Ngày' },
        { num: '3', title: 'Nhập Line', desc: 'Nhập dây chuyền sản xuất (VD: "A-1", "B-3").\nTự động gợi ý các line gần đây.', field: 'Line' },
        { num: '4', title: 'Nhập mã máy', desc: 'Nhập mã thiết bị (VD: "D210103").\nTự động gợi ý các ID gần đây.', field: 'Mã máy' },
      ],
      tip: 'MẸO: Trường Line và Mã máy hiển thị gợi ý tự động dựa trên các lần nhập trước.',
    },
    quickStep2: {
      title: 'Nhập nhanh - Từng bước (2/2)',
      steps: [
        { num: '5', title: 'Nhập độ nhạy', desc: 'Nhập 3 giá trị tính bằng mm:\n  Fe (Sắt)\n  SUS (Thép không gỉ)\n  Non-Fe (Phi kim loại)', field: 'Độ nhạy' },
        { num: '6', title: 'Chọn kết quả', desc: 'Nhấp PASS (xanh) hoặc FAIL (đỏ).\nMặc định là PASS.\nNếu FAIL: xuất hiện trường bổ sung.', field: 'Kết quả' },
        { num: '7', title: 'Nhấp Lưu', desc: 'Nút được kích hoạt khi đã điền đủ trường bắt buộc.\nThông báo thành công xuất hiện ở trên.', field: 'Lưu' },
      ],
      warning: 'QUAN TRỌNG: Nếu bạn chọn FAIL, bạn PHẢI điền Loại lỗi và Mô tả trước khi lưu.',
    },
    failHandling: {
      title: 'Nhập nhanh - Xử lý FAIL',
      desc: 'Khi bạn chọn FAIL, vùng có viền đỏ xuất hiện bên dưới nút kết quả:',
      failFields: [
        { label: 'Loại lỗi (Bắt buộc)', desc: 'Chọn từ danh sách:\n  - Trôi độ nhạy\n  - Thiết bị trục trặc\n  - Lỗi hiệu chuẩn\n  - Vật thể lạ\n  - Khác' },
        { label: 'Mô tả lỗi (Bắt buộc)', desc: 'Nhập mô tả chi tiết về những gì đã xảy ra.' },
      ],
      autoCA: 'TỰ ĐỘNG: Khi bản ghi FAIL được lưu, hành động khắc phục (CA) tự động được tạo với trạng thái "Chờ xử lý".',
      caFlow: 'Lưu FAIL  →  Tạo CA (Chờ xử lý)  →  Thông báo cho nhóm bảo trì  →  Theo dõi trên trang Lịch sử',
    },
    continuousTips: {
      title: 'Nhập nhanh - Mẹo nhập liên tục',
      desc: 'Được thiết kế để kiểm tra nhiều máy nhanh chóng:',
      preserved: {
        title: 'Tự động giữ lại sau khi lưu',
        items: ['Nhà máy đã chọn', 'Ngày kiểm tra', 'Tên người kiểm tra', 'Giá trị độ nhạy (Fe, SUS, Non-Fe)'],
      },
      cleared: {
        title: 'Xóa sau khi lưu (Nhập mới)',
        items: ['Số line', 'Mã máy', 'Kết quả (đặt lại thành PASS)', 'Ghi chú', 'Chi tiết lỗi (nếu có)'],
      },
      tips: [
        'Huy hiệu "Hôm nay N mục": Theo dõi tiến độ - xem đã kiểm tra bao nhiêu máy hôm nay.',
        'Thông báo thành công: Tin nhắn xanh xác nhận đã lưu - tự ẩn sau 3 giây.',
        'Cùng độ nhạy: Nếu các máy có thông số tương tự, giá trị được giữ lại - chỉ cần lưu.',
        'Đổi nhà máy: Chỉ thay đổi nút nhà máy khi chuyển sang tòa nhà khác.',
      ],
    },
    detailedEntry: {
      title: 'Chế độ nhập chi tiết (4 bước)',
      desc: 'Phù hợp nhất cho trường hợp FAIL cần tài liệu chi tiết:',
      steps: [
        { num: '1', title: 'Nhà máy & Line', items: ['Chọn nhà máy (A/B/C/D)', 'Nhập số line', 'Nhập mã máy (tùy chọn)'] },
        { num: '2', title: 'Thông tin người kiểm tra', items: ['Chọn ngày kiểm tra', 'Nhập tên người kiểm tra', 'Nhập tên sản phẩm (tùy chọn)'] },
        { num: '3', title: 'Độ nhạy', items: ['Nhập độ nhạy Fe (mm)', 'Nhập độ nhạy SUS (mm)', 'Nhập độ nhạy Non-Fe (mm)'] },
        { num: '4', title: 'Kết quả', items: ['Chọn PASS hoặc FAIL', 'Nếu FAIL: chọn loại lỗi', 'Nếu FAIL: nhập mô tả', 'Nhập ghi chú (tùy chọn)'] },
      ],
      navNote: 'Sử dụng nút Quay lại/Tiếp theo để điều hướng giữa các bước. Chỉ báo tiến trình hiển thị dấu kiểm xanh cho các bước đã hoàn thành.',
    },
    dashboardKPI: {
      title: 'Bảng điều khiển - Tóm tắt KPI',
      desc: 'Chọn năm và số tuần để xem báo cáo hàng tuần:',
      kpis: [
        { num: '1', title: 'Tổng máy\nđã kiểm tra', desc: 'Số lượng kiểm tra\ntuần này', color: C.grayLight },
        { num: '2', title: 'Lỗi\ntuần trước', desc: 'Số FAIL từ\ntuần trước', color: C.orangeLight },
        { num: '3', title: 'Lỗi\ntuần này', desc: 'Số FAIL cho\ntuần hiện tại', color: C.failLight },
        { num: '4', title: 'Sửa\nđúng hạn', desc: 'Số CA hoàn thành\nvs lỗi tuần trước', color: C.blue50 },
        { num: '5', title: 'Tỷ lệ sửa\nbảo trì', desc: 'Phần trăm lỗi tuần\ntrước đã được sửa', color: C.passLight },
        { num: '6', title: 'Vấn đề\nlặp lại', desc: 'Máy lỗi 2+ tuần\nliên tiếp', color: C.amberLight },
        { num: '7', title: 'Tỷ lệ\nlặp lại', desc: 'Lặp lại / Tổng\nmáy kiểm tra %', color: C.yellowLight },
      ],
      weekSelector: 'Sử dụng dropdown Năm và Tuần (W1-W52) ở góc trên bên phải để chọn kỳ báo cáo.',
    },
    factoryComparison: {
      title: 'Bảng điều khiển - So sánh nhà máy',
      desc: 'SO SÁNH HÀNG TUẦN THEO NHÀ MÁY - So sánh tuần này vs tuần trước:',
      tableHeaders: ['Nhà máy', 'Lỗi tuần trước', 'Lỗi tuần này', 'Cải thiện'],
      tableRows: [
        ['Nhà máy A', '2', '1', 'Cải thiện'],
        ['Nhà máy B', '0', '0', 'Không đổi'],
        ['Nhà máy C', '3', '4', 'Tăng'],
        ['Nhà máy D', '1', '0', 'Cải thiện'],
      ],
      badges: {
        improved: { text: 'Cải thiện', color: C.passDark, bg: C.passLight },
        noChange: { text: 'Không đổi', color: C.gray, bg: C.grayLight },
        increased: { text: 'Tăng', color: C.failDark, bg: C.failLight },
      },
      chartsNote: 'Bên dưới bảng: Biểu đồ cột (Đạt/Lỗi theo nhà máy) và Biểu đồ đường (xu hướng tỷ lệ đạt 12 tuần).',
    },
    repeatedAndPassRate: {
      title: 'Bảng điều khiển - Vấn đề lặp lại & Tỷ lệ đạt',
      section1Title: 'Phân tích máy có vấn đề lặp lại',
      section1Desc: 'Liệt kê các máy FAIL cả tuần này VÀ tuần trước:',
      section1Headers: ['Mã máy', 'Nhà máy', 'Line', 'Vấn đề chính', 'Trạng thái'],
      section1Example: ['D210103', 'Nhà máy A', 'A-1', 'Không phát hiện mẫu kim loại', 'LẶP LẠI'],
      section2Title: 'So sánh tỷ lệ đạt (2 tuần)',
      section2Desc: 'So sánh tỷ lệ đạt giữa tuần trước và tuần này theo nhà máy:',
      section2Headers: ['Nhà máy', 'Tuần trước (Wn)', 'Tuần này (Wn+1)'],
      section2Example: [
        ['Nhà máy A', '95%', '97%'],
        ['Nhà máy B', '100%', '100%'],
        ['Nhà máy C', '88%', '85%'],
        ['Nhà máy D', '96%', '100%'],
        ['Tổng', '94%', '95%'],
      ],
      passRateNote: 'Xanh = cải thiện so với tuần trước, Đỏ = giảm so với tuần trước',
    },
    history: {
      title: 'Lịch sử kiểm tra',
      desc: 'Xem và tìm kiếm tất cả bản ghi kiểm tra trước đây:',
      filters: [
        { label: 'Nhà máy', desc: 'Tất cả / A / B / C / D' },
        { label: 'Kết quả', desc: 'Tất cả / PASS / FAIL' },
        { label: 'Từ ngày', desc: 'Bộ lọc ngày bắt đầu' },
        { label: 'Đến ngày', desc: 'Bộ lọc ngày kết thúc' },
        { label: 'Xóa', desc: 'Đặt lại tất cả bộ lọc' },
      ],
      tableHeaders: ['Ngày', 'Nhà máy', 'Line', 'Mã máy', 'Kết quả', 'Fe', 'SUS', 'Non-Fe', 'Người KT'],
      clickNote: 'Nhấp vào bất kỳ hàng nào để mở chi tiết và theo dõi CA (cho các mục FAIL).',
      navPath: 'Menu: Equipment > Metal Detector > History',
    },
    caTracking: {
      title: 'Theo dõi hành động khắc phục (CA)',
      desc: 'Theo dõi và cập nhật trạng thái sửa chữa cho mỗi lần kiểm tra lỗi:',
      howTo: [
        { num: '1', title: 'Mở Lịch sử', desc: 'Vào Equipment > Metal Detector > History' },
        { num: '2', title: 'Tìm mục FAIL', desc: 'Lọc theo Kết quả = FAIL, nhấp vào một hàng' },
        { num: '3', title: 'Xem trạng thái CA', desc: 'Trong cửa sổ chi tiết, xem huy hiệu trạng thái CA hiện tại' },
        { num: '4', title: 'Cập nhật trạng thái', desc: 'Chọn trạng thái mới từ danh sách:\n  Chờ xử lý → Đang xử lý → Hoàn thành' },
        { num: '5', title: 'Thêm mô tả', desc: 'Nhập nội dung đã thực hiện để khắc phục sự cố' },
        { num: '6', title: 'Lưu', desc: 'Nhấp nút "Cập nhật" để lưu thay đổi CA' },
      ],
      statuses: [
        { name: 'Chờ xử lý', color: C.yellow, desc: 'Mới - chờ hành động bảo trì' },
        { name: 'Đang xử lý', color: C.primaryLight, desc: 'Bảo trì đang tiến hành sửa chữa' },
        { name: 'Hoàn thành', color: C.pass, desc: 'Sự cố đã sửa và xác minh' },
        { name: 'Quá hạn', color: C.fail, desc: 'Chưa sửa trong thời gian dự kiến' },
      ],
      dashboardNote: 'Hoàn thành CA tự động được phản ánh trong KPI "Tỷ lệ sửa bảo trì" trên Bảng điều khiển.',
    },
    pdfReport: {
      title: 'Tạo báo cáo PDF',
      desc: 'Tạo và tải xuống báo cáo PDF cho bất kỳ tuần nào:',
      steps: [
        { num: '1', title: 'Vào trang Báo cáo', desc: 'Menu: Equipment > Metal Detector > Report' },
        { num: '2', title: 'Chọn kỳ', desc: 'Chọn Năm và số Tuần (W1-W52)' },
        { num: '3', title: 'Xem trước', desc: 'Xem thẻ tóm tắt:\n  Tổng kiểm tra, Tỷ lệ đạt, Số đạt, Số lỗi' },
        { num: '4', title: 'Phân tích nhà máy', desc: 'Xem tỷ lệ đạt cho từng nhà máy (A/B/C/D)' },
        { num: '5', title: 'Tạo PDF', desc: 'Nhấp nút "Tạo PDF"\nFile tải xuống: MD_Report_2026_W11.pdf' },
      ],
      fileName: 'Định dạng tên file: MD_Report_{Năm}_W{Tuần}.pdf',
      noDataNote: 'Nếu không có dữ liệu cho tuần đã chọn, thông báo "Không có dữ liệu" hiển thị và nút PDF bị vô hiệu hóa.',
    },
    dailyWorkflow: {
      title: 'Tóm tắt quy trình hàng ngày',
      workflows: [
        {
          timing: 'HÀNG NGÀY',
          icon: 'CALENDAR',
          title: 'Ghi nhận kiểm tra',
          steps: [
            'Mở Q-TRAIN trên điện thoại hoặc PC',
            'Vào Equipment > Metal Detector > Input',
            'Sử dụng chế độ nhập nhanh',
            'Nhập từng máy: Line, Mã máy, Độ nhạy, Kết quả',
            'Nhấp Lưu sau mỗi máy',
            'Kiểm tra bộ đếm "Hôm nay N mục" để xác nhận hoàn tất',
          ],
        },
        {
          timing: 'KHI FAIL',
          icon: 'ALERT',
          title: 'Xử lý lỗi',
          steps: [
            'Chọn kết quả FAIL cho máy đó',
            'Chọn Loại lỗi từ danh sách',
            'Nhập mô tả chi tiết về sự cố',
            'Lưu — CA được tạo tự động',
            'Thông báo cho nhóm bảo trì về sự cố',
          ],
        },
        {
          timing: 'HÀNG TUẦN',
          icon: 'CHART',
          title: 'Xem bảng điều khiển',
          steps: [
            'Kiểm tra bảng điều khiển về tóm tắt KPI tuần',
            'Xem So sánh nhà máy để biết xu hướng',
            'Kiểm tra danh sách Vấn đề lặp lại',
            'Tạo báo cáo PDF nếu cần',
          ],
        },
        {
          timing: 'SAU SỬA',
          icon: 'WRENCH',
          title: 'Cập nhật trạng thái CA',
          steps: [
            'Vào trang Lịch sử',
            'Tìm mục FAIL (lọc theo Kết quả = FAIL)',
            'Nhấp vào hàng để mở chi tiết',
            'Cập nhật trạng thái CA: Chờ → Đang xử lý → Hoàn thành',
            'Thêm mô tả về hành động sửa chữa đã thực hiện',
          ],
        },
      ],
    },
    faq: {
      title: 'Câu hỏi thường gặp (FAQ)',
      items: [
        {
          q: 'Mã máy có bắt buộc không?',
          a: 'Không, Mã máy là tùy chọn. Tuy nhiên, rất khuyến khích để theo dõi vấn đề lặp lại. Nếu không có, hệ thống sử dụng tổ hợp Nhà máy + Line.',
        },
        {
          q: 'Có thể kiểm tra cùng một máy hai lần không?',
          a: 'Có, bạn có thể tạo nhiều bản ghi kiểm tra cho cùng một máy trong cùng ngày. Mỗi bản ghi được lưu độc lập.',
        },
        {
          q: 'Có thể đổi FAIL thành PASS sau khi lưu không?',
          a: 'Kết quả không thể thay đổi sau khi lưu. Nếu bạn nhập sai, hãy tạo bản ghi đúng mới và liên hệ quản trị viên để xử lý bản ghi sai.',
        },
        {
          q: 'Vấn đề lặp lại được phát hiện như thế nào?',
          a: 'Hệ thống so sánh bản ghi FAIL theo Mã máy (hoặc Nhà máy+Line) qua hai tuần liên tiếp. Nếu cùng một máy lỗi ở cả hai tuần, nó được đánh dấu "Lặp lại".',
        },
        {
          q: 'Nếu tôi nhập dữ liệu sai ngày thì sao?',
          a: 'Bạn có thể thay đổi ngày kiểm tra trong bộ chọn ngày. Hệ thống sẽ tự động gán số tuần ISO chính xác.',
        },
        {
          q: 'Tôi có thể dùng trên điện thoại không?',
          a: 'Có! Q-TRAIN là ứng dụng web responsive. Mở URL trong Chrome trên điện thoại và nó hoạt động như một ứng dụng. Bạn có thể thêm vào màn hình chính.',
        },
      ],
    },
    contact: {
      title: 'Liên hệ & Hỗ trợ',
      systemTitle: 'Thông tin hệ thống',
      systemItems: [
        { label: 'URL hệ thống', value: 'https://q-train-web.web.app/' },
        { label: 'Module', value: 'Equipment > Metal Detector' },
        { label: 'Ngôn ngữ', value: 'Tiếng Hàn, Tiếng Anh, Tiếng Việt' },
        { label: 'Truy cập', value: 'Cần email công ty (@hsvina.com)' },
      ],
      supportTitle: 'Liên hệ hỗ trợ',
      supportItems: [
        { label: 'Quản trị hệ thống', value: 'Bộ phận QIP' },
        { label: 'Hỗ trợ kỹ thuật', value: 'ksmoon@hsvina.com' },
        { label: 'Nhóm QA', value: 'hwk_qa@hsvina.com' },
      ],
      thankYou: 'Cảm ơn bạn đã sử dụng Q-TRAIN!',
      tagline: 'Dữ liệu kiểm tra chính xác dẫn đến sản phẩm chất lượng tốt hơn.',
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// SLIDE HELPERS
// ═══════════════════════════════════════════════════════════════

/** Add a gradient background */
function addBg(slide, color1 = C.primary, color2 = C.primaryDark) {
  slide.background = { fill: color1 };
}

/** Add a white background with colored top bar */
function addWhiteBg(slide) {
  slide.background = { fill: C.white };
  // Top accent bar
  slide.addShape('rect', { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: C.primary } });
}

/** Add page number */
function addPageNum(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: 8.8, y: 7.0, w: 1.2, h: 0.3,
    fontSize: 8, color: C.gray, align: 'right', fontFace: 'Arial',
  });
}

/** Add section header with icon area */
function addSectionHeader(slide, title, desc) {
  slide.addText(title, { x: 0.5, y: 0.3, w: 9.0, h: 0.5, ...FONT.sectionTitle });
  if (desc) {
    slide.addText(desc, { x: 0.5, y: 0.8, w: 9.0, h: 0.35, ...FONT.body, color: C.gray });
  }
}

/** Draw a numbered step box */
function addStepBox(slide, x, y, w, h, num, title, desc, numColor = C.primary) {
  // Number circle
  slide.addShape('ellipse', { x: x, y: y, w: 0.35, h: 0.35, fill: { color: numColor } });
  slide.addText(num, { x: x, y: y, w: 0.35, h: 0.35, ...FONT.stepNum, align: 'center', valign: 'middle' });
  // Title
  slide.addText(title, { x: x + 0.45, y: y - 0.02, w: w - 0.5, h: 0.3, ...FONT.subheading });
  // Description
  if (desc) {
    slide.addText(desc, { x: x + 0.45, y: y + 0.28, w: w - 0.5, h: h - 0.35, ...FONT.bullet, valign: 'top' });
  }
}

/** Draw a colored info box */
function addInfoBox(slide, x, y, w, h, text, bgColor, textColor = C.black, opts = {}) {
  slide.addShape('roundRect', { x, y, w, h, fill: { color: bgColor }, rectRadius: 0.08 });
  slide.addText(text, { x: x + 0.1, y, w: w - 0.2, h, fontSize: 11, fontFace: 'Arial', color: textColor, valign: 'middle', ...opts });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE GENERATORS
// ═══════════════════════════════════════════════════════════════

function slideCover(pptx, t) {
  const slide = pptx.addSlide();
  addBg(slide);
  // Title area
  slide.addText(t.cover.title, { x: 0.8, y: 1.5, w: 8.4, h: 1.0, ...FONT.title, fontSize: 36 });
  slide.addText(t.cover.subtitle, { x: 0.8, y: 2.5, w: 8.4, h: 0.6, ...FONT.subtitle, fontSize: 22 });
  // Divider
  slide.addShape('rect', { x: 0.8, y: 3.3, w: 3, h: 0.04, fill: { color: C.accent } });
  // System & Org
  slide.addText(t.cover.system, { x: 0.8, y: 3.6, w: 8.4, h: 0.4, ...FONT.subtitle, fontSize: 16 });
  slide.addText(t.cover.org, { x: 0.8, y: 4.1, w: 8.4, h: 0.35, ...FONT.subtitle, fontSize: 14, color: C.blue100 });
  // Date & Version
  slide.addText(`${t.cover.date}  |  ${t.cover.version}`, { x: 0.8, y: 5.0, w: 8.4, h: 0.3, ...FONT.subtitle, fontSize: 12, color: C.accent });
}

function slideTOC(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.toc.title);
  addPageNum(slide, 2, 16);

  const items = t.toc.items;
  const colSize = Math.ceil(items.length / 2);
  // Left column
  for (let i = 0; i < colSize; i++) {
    const y = 1.2 + i * 0.37;
    slide.addText(items[i], { x: 0.7, y, w: 4.2, h: 0.33, ...FONT.bullet, fontSize: 11 });
  }
  // Right column
  for (let i = colSize; i < items.length; i++) {
    const y = 1.2 + (i - colSize) * 0.37;
    slide.addText(items[i], { x: 5.2, y, w: 4.5, h: 0.33, ...FONT.bullet, fontSize: 11 });
  }
}

function slideBeforeAfter(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.beforeAfter.title);
  addPageNum(slide, 3, 16);

  // BEFORE column
  slide.addShape('roundRect', { x: 0.4, y: 1.2, w: 4.4, h: 4.2, fill: { color: C.failLight }, rectRadius: 0.1 });
  slide.addText(t.beforeAfter.beforeTitle, { x: 0.6, y: 1.3, w: 4.0, h: 0.4, ...FONT.subheading, color: C.failDark });
  t.beforeAfter.beforeItems.forEach((item, i) => {
    slide.addText(`  ${item}`, { x: 0.6, y: 1.8 + i * 0.55, w: 4.0, h: 0.5, ...FONT.bullet, fontSize: 11, bullet: true });
  });

  // AFTER column
  slide.addShape('roundRect', { x: 5.2, y: 1.2, w: 4.4, h: 4.2, fill: { color: C.passLight }, rectRadius: 0.1 });
  slide.addText(t.beforeAfter.afterTitle, { x: 5.4, y: 1.3, w: 4.0, h: 0.4, ...FONT.subheading, color: C.passDark });
  t.beforeAfter.afterItems.forEach((item, i) => {
    slide.addText(`  ${item}`, { x: 5.4, y: 1.8 + i * 0.55, w: 4.0, h: 0.5, ...FONT.bullet, fontSize: 11, bullet: true });
  });

  // Arrow
  slide.addText('>>>', { x: 4.4, y: 3.0, w: 0.8, h: 0.5, fontSize: 20, color: C.primary, bold: true, align: 'center' });

  // Key change box
  addInfoBox(slide, 0.4, 5.6, 9.2, 0.55, t.beforeAfter.keyChange, C.blue50, C.primaryDark, { bold: true, fontSize: 12 });
}

function slideLogin(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.login.title);
  addPageNum(slide, 4, 16);

  t.login.steps.forEach((step, i) => {
    const y = 1.3 + i * 1.15;
    addStepBox(slide, 0.5, y, 9.0, 0.95, step.num, step.title, step.desc);
  });

  // URL box
  slide.addShape('roundRect', { x: 0.5, y: 5.6, w: 5.5, h: 0.5, fill: { color: C.blue50 }, line: { color: C.primaryLight, width: 1.5 }, rectRadius: 0.08 });
  slide.addText(t.login.urlBox, { x: 0.7, y: 5.6, w: 5.1, h: 0.5, fontSize: 14, fontFace: 'Courier New', color: C.primary, bold: true, valign: 'middle' });

  // Navigation path
  slide.addText(t.login.navPath, { x: 0.5, y: 6.2, w: 9.0, h: 0.3, ...FONT.bodySmall });
  // Note
  addInfoBox(slide, 0.5, 6.6, 9.0, 0.4, t.login.note, C.yellowLight, C.black, { fontSize: 10 });
}

function slideQuickEntry(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.quickEntry.title, t.quickEntry.desc);
  addPageNum(slide, 5, 16);

  // Features (2x2 grid)
  t.quickEntry.features.forEach((feat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.7;
    const y = 1.3 + row * 1.2;
    slide.addShape('roundRect', { x, y, w: 4.4, h: 1.0, fill: { color: C.blue50 }, rectRadius: 0.08 });
    slide.addText(feat.title, { x: x + 0.15, y: y + 0.05, w: 4.1, h: 0.3, ...FONT.subheading, fontSize: 12 });
    slide.addText(feat.desc, { x: x + 0.15, y: y + 0.38, w: 4.1, h: 0.55, ...FONT.bullet, fontSize: 10 });
  });

  // Layout section
  slide.addText(t.quickEntry.layoutTitle, { x: 0.5, y: 3.8, w: 9.0, h: 0.35, ...FONT.heading, fontSize: 14 });

  // Layout mockup
  t.quickEntry.layoutAreas.forEach((area, i) => {
    const y = 4.3 + i * 0.6;
    const colors = [C.blue50, C.grayLight, C.blue50, C.grayLight];
    slide.addShape('roundRect', { x: 0.5, y, w: 9.0, h: 0.5, fill: { color: colors[i] }, rectRadius: 0.06 });
    slide.addText(area.label, { x: 0.7, y, w: 1.2, h: 0.5, ...FONT.subheading, fontSize: 10, valign: 'middle' });
    slide.addText(area.desc, { x: 1.9, y, w: 7.4, h: 0.5, ...FONT.bullet, fontSize: 10, valign: 'middle' });
  });

  // Tab note
  addInfoBox(slide, 0.5, 6.8, 9.0, 0.35, t.quickEntry.tabNote, C.yellowLight, C.black, { fontSize: 10 });
}

function slideQuickStep1(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.quickStep1.title);
  addPageNum(slide, 6, 16);

  t.quickStep1.steps.forEach((step, i) => {
    const y = 1.1 + i * 1.35;
    // Step background
    slide.addShape('roundRect', { x: 0.4, y, w: 9.2, h: 1.15, fill: { color: i % 2 === 0 ? C.blue50 : C.grayLight }, rectRadius: 0.08 });
    addStepBox(slide, 0.55, y + 0.1, 5.0, 0.95, step.num, step.title, step.desc);
    // Field label
    slide.addShape('roundRect', { x: 7.2, y: y + 0.3, w: 2.2, h: 0.45, fill: { color: C.primary }, rectRadius: 0.06 });
    slide.addText(step.field, { x: 7.2, y: y + 0.3, w: 2.2, h: 0.45, fontSize: 11, fontFace: 'Arial', color: C.white, align: 'center', valign: 'middle', bold: true });
  });

  // Tip box
  addInfoBox(slide, 0.4, 6.6, 9.2, 0.45, t.quickStep1.tip, C.passLight, C.passDark, { fontSize: 10 });
}

function slideQuickStep2(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.quickStep2.title);
  addPageNum(slide, 7, 16);

  t.quickStep2.steps.forEach((step, i) => {
    const y = 1.1 + i * 1.55;
    slide.addShape('roundRect', { x: 0.4, y, w: 9.2, h: 1.35, fill: { color: i % 2 === 0 ? C.blue50 : C.grayLight }, rectRadius: 0.08 });
    addStepBox(slide, 0.55, y + 0.1, 5.0, 1.2, step.num, step.title, step.desc);
    // Field label
    const labelColor = step.field === 'Save' ? C.pass : (step.field === 'Result' || step.field === 'Kết quả' ? C.orange : C.primary);
    slide.addShape('roundRect', { x: 7.2, y: y + 0.4, w: 2.2, h: 0.45, fill: { color: labelColor }, rectRadius: 0.06 });
    slide.addText(step.field, { x: 7.2, y: y + 0.4, w: 2.2, h: 0.45, fontSize: 11, fontFace: 'Arial', color: C.white, align: 'center', valign: 'middle', bold: true });
  });

  // Warning box
  addInfoBox(slide, 0.4, 5.9, 9.2, 0.55, t.quickStep2.warning, C.failLight, C.failDark, { bold: true, fontSize: 11 });
}

function slideFailHandling(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.failHandling.title, t.failHandling.desc);
  addPageNum(slide, 8, 16);

  // FAIL fields
  t.failHandling.failFields.forEach((field, i) => {
    const y = 1.4 + i * 1.8;
    slide.addShape('roundRect', { x: 0.5, y, w: 9.0, h: 1.6, fill: { color: C.failLight }, line: { color: C.fail, width: 1 }, rectRadius: 0.08 });
    slide.addText(field.label, { x: 0.7, y: y + 0.1, w: 8.6, h: 0.3, ...FONT.subheading, color: C.failDark, fontSize: 13 });
    slide.addText(field.desc, { x: 0.7, y: y + 0.45, w: 8.6, h: 1.0, ...FONT.bullet, fontSize: 11 });
  });

  // Auto CA box
  addInfoBox(slide, 0.5, 5.2, 9.0, 0.55, t.failHandling.autoCA, C.blue50, C.primaryDark, { bold: true, fontSize: 11 });

  // CA flow
  slide.addShape('roundRect', { x: 0.5, y: 5.9, w: 9.0, h: 0.5, fill: { color: C.grayLight }, rectRadius: 0.06 });
  slide.addText(t.failHandling.caFlow, { x: 0.7, y: 5.9, w: 8.6, h: 0.5, fontSize: 11, fontFace: 'Arial', color: C.primary, align: 'center', valign: 'middle', bold: true });
}

function slideContinuousTips(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.continuousTips.title, t.continuousTips.desc);
  addPageNum(slide, 9, 16);

  // Preserved column
  slide.addShape('roundRect', { x: 0.4, y: 1.3, w: 4.4, h: 2.8, fill: { color: C.passLight }, rectRadius: 0.08 });
  slide.addText(t.continuousTips.preserved.title, { x: 0.6, y: 1.4, w: 4.0, h: 0.35, ...FONT.subheading, color: C.passDark, fontSize: 12 });
  t.continuousTips.preserved.items.forEach((item, i) => {
    slide.addText(`  ${item}`, { x: 0.6, y: 1.85 + i * 0.45, w: 4.0, h: 0.4, ...FONT.bullet, fontSize: 11, bullet: true });
  });

  // Cleared column
  slide.addShape('roundRect', { x: 5.2, y: 1.3, w: 4.4, h: 2.8, fill: { color: C.blue50 }, rectRadius: 0.08 });
  slide.addText(t.continuousTips.cleared.title, { x: 5.4, y: 1.4, w: 4.0, h: 0.35, ...FONT.subheading, color: C.primary, fontSize: 12 });
  t.continuousTips.cleared.items.forEach((item, i) => {
    slide.addText(`  ${item}`, { x: 5.4, y: 1.85 + i * 0.45, w: 4.0, h: 0.4, ...FONT.bullet, fontSize: 11, bullet: true });
  });

  // Tips
  slide.addText('Tips:', { x: 0.4, y: 4.3, w: 9.2, h: 0.3, ...FONT.heading, fontSize: 14 });
  t.continuousTips.tips.forEach((tip, i) => {
    const y = 4.7 + i * 0.5;
    slide.addText(`  ${tip}`, { x: 0.5, y, w: 9.0, h: 0.45, ...FONT.bullet, fontSize: 10, bullet: true });
  });
}

function slideDetailedEntry(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.detailedEntry.title, t.detailedEntry.desc);
  addPageNum(slide, 10, 16);

  // 4-step wizard mockup
  // Step indicator at top
  const stepColors = [C.primary, C.primary, C.primary, C.primary];
  t.detailedEntry.steps.forEach((step, i) => {
    const x = 0.5 + i * 2.4;
    // Circle
    slide.addShape('ellipse', { x: x + 0.7, y: 1.3, w: 0.4, h: 0.4, fill: { color: stepColors[i] } });
    slide.addText(step.num, { x: x + 0.7, y: 1.3, w: 0.4, h: 0.4, ...FONT.stepNum, fontSize: 14, align: 'center', valign: 'middle' });
    // Connector line
    if (i < 3) {
      slide.addShape('rect', { x: x + 1.15, y: 1.47, w: 1.7, h: 0.04, fill: { color: C.grayMid } });
    }
  });

  // Step cards
  t.detailedEntry.steps.forEach((step, i) => {
    const x = 0.4 + i * 2.4;
    const y = 1.9;
    slide.addShape('roundRect', { x, y, w: 2.2, h: 3.8, fill: { color: i % 2 === 0 ? C.blue50 : C.grayLight }, rectRadius: 0.08 });
    slide.addText(step.title, { x: x + 0.1, y: y + 0.1, w: 2.0, h: 0.35, ...FONT.subheading, fontSize: 11, align: 'center' });
    step.items.forEach((item, j) => {
      slide.addText(`  ${item}`, { x: x + 0.1, y: y + 0.55 + j * 0.55, w: 2.0, h: 0.5, ...FONT.bullet, fontSize: 9, bullet: true });
    });
  });

  // Nav note
  addInfoBox(slide, 0.4, 6.0, 9.2, 0.55, t.detailedEntry.navNote, C.yellowLight, C.black, { fontSize: 10 });
}

function slideDashboardKPI(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.dashboardKPI.title, t.dashboardKPI.desc);
  addPageNum(slide, 11, 16);

  // 7 KPI cards (first row 4, second row 3)
  t.dashboardKPI.kpis.forEach((kpi, i) => {
    const row = i < 4 ? 0 : 1;
    const col = row === 0 ? i : i - 4;
    const cardW = row === 0 ? 2.2 : 2.95;
    const x = 0.4 + col * (cardW + 0.15);
    const y = 1.3 + row * 2.2;

    slide.addShape('roundRect', { x, y, w: cardW, h: 1.9, fill: { color: kpi.color }, rectRadius: 0.08 });
    // Number
    slide.addShape('ellipse', { x: x + cardW / 2 - 0.2, y: y + 0.15, w: 0.4, h: 0.4, fill: { color: C.primary } });
    slide.addText(kpi.num, { x: x + cardW / 2 - 0.2, y: y + 0.15, w: 0.4, h: 0.4, ...FONT.stepNum, fontSize: 14, align: 'center', valign: 'middle' });
    // Title
    slide.addText(kpi.title, { x: x + 0.1, y: y + 0.65, w: cardW - 0.2, h: 0.6, ...FONT.subheading, fontSize: 10, align: 'center', valign: 'middle' });
    // Description
    slide.addText(kpi.desc, { x: x + 0.1, y: y + 1.25, w: cardW - 0.2, h: 0.55, ...FONT.label, fontSize: 8, align: 'center', valign: 'middle' });
  });

  // Week selector note
  addInfoBox(slide, 0.4, 5.9, 9.2, 0.45, t.dashboardKPI.weekSelector, C.blue50, C.primaryDark, { fontSize: 10 });
}

function slideFactoryComparison(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.factoryComparison.title, t.factoryComparison.desc);
  addPageNum(slide, 12, 16);

  // Table
  const tableX = 0.5;
  const tableY = 1.3;
  const colW = [2.2, 2.2, 2.2, 2.8];
  const rowH = 0.5;

  // Header row
  t.factoryComparison.tableHeaders.forEach((header, i) => {
    const x = tableX + colW.slice(0, i).reduce((a, b) => a + b, 0);
    slide.addShape('rect', { x, y: tableY, w: colW[i], h: rowH, fill: { color: C.primary } });
    slide.addText(header, { x, y: tableY, w: colW[i], h: rowH, fontSize: 11, fontFace: 'Arial', color: C.white, bold: true, align: 'center', valign: 'middle' });
  });

  // Data rows
  const badgeColors = [
    t.factoryComparison.badges.improved,
    t.factoryComparison.badges.noChange,
    t.factoryComparison.badges.increased,
    t.factoryComparison.badges.improved,
  ];
  t.factoryComparison.tableRows.forEach((row, ri) => {
    const y = tableY + (ri + 1) * rowH;
    const bg = ri % 2 === 0 ? C.grayLight : C.white;
    row.forEach((cell, ci) => {
      const x = tableX + colW.slice(0, ci).reduce((a, b) => a + b, 0);
      slide.addShape('rect', { x, y, w: colW[ci], h: rowH, fill: { color: bg }, line: { color: C.grayMid, width: 0.5 } });
      if (ci === 3) {
        // Badge
        const badge = badgeColors[ri];
        slide.addShape('roundRect', { x: x + 0.3, y: y + 0.1, w: colW[ci] - 0.6, h: 0.3, fill: { color: badge.bg }, rectRadius: 0.06 });
        slide.addText(badge.text, { x: x + 0.3, y: y + 0.1, w: colW[ci] - 0.6, h: 0.3, fontSize: 10, fontFace: 'Arial', color: badge.color, align: 'center', valign: 'middle', bold: true });
      } else {
        slide.addText(cell, { x, y, w: colW[ci], h: rowH, fontSize: 11, fontFace: 'Arial', color: C.black, align: 'center', valign: 'middle' });
      }
    });
  });

  // Charts note
  addInfoBox(slide, 0.5, 4.0, 9.0, 0.5, t.factoryComparison.chartsNote, C.blue50, C.primaryDark, { fontSize: 10 });

  // Chart mockup area
  slide.addShape('roundRect', { x: 0.5, y: 4.7, w: 4.2, h: 2.0, fill: { color: C.grayLight }, rectRadius: 0.08 });
  slide.addText('Bar Chart: Pass/Fail by Factory', { x: 0.5, y: 4.7, w: 4.2, h: 2.0, fontSize: 10, fontFace: 'Arial', color: C.gray, align: 'center', valign: 'middle' });

  slide.addShape('roundRect', { x: 5.0, y: 4.7, w: 4.5, h: 2.0, fill: { color: C.grayLight }, rectRadius: 0.08 });
  slide.addText('Line Chart: 12-Week Pass Rate Trend', { x: 5.0, y: 4.7, w: 4.5, h: 2.0, fontSize: 10, fontFace: 'Arial', color: C.gray, align: 'center', valign: 'middle' });
}

function slideRepeatedAndPassRate(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.repeatedAndPassRate.title);
  addPageNum(slide, 13, 16);

  // Section 1: Repeated Issues
  slide.addText(t.repeatedAndPassRate.section1Title, { x: 0.5, y: 0.8, w: 9.0, h: 0.35, ...FONT.subheading, color: C.failDark, fontSize: 13 });
  slide.addText(t.repeatedAndPassRate.section1Desc, { x: 0.5, y: 1.15, w: 9.0, h: 0.25, ...FONT.bodySmall, fontSize: 9 });

  // Mini table header
  const s1Headers = t.repeatedAndPassRate.section1Headers;
  const s1ColW = [1.6, 1.5, 0.9, 3.0, 1.6];
  s1Headers.forEach((h, i) => {
    const x = 0.5 + s1ColW.slice(0, i).reduce((a, b) => a + b, 0);
    slide.addShape('rect', { x, y: 1.5, w: s1ColW[i], h: 0.35, fill: { color: C.failDark } });
    slide.addText(h, { x, y: 1.5, w: s1ColW[i], h: 0.35, fontSize: 9, fontFace: 'Arial', color: C.white, align: 'center', valign: 'middle', bold: true });
  });
  // Example row
  const ex = t.repeatedAndPassRate.section1Example;
  ex.forEach((cell, i) => {
    const x = 0.5 + s1ColW.slice(0, i).reduce((a, b) => a + b, 0);
    slide.addShape('rect', { x, y: 1.85, w: s1ColW[i], h: 0.35, fill: { color: C.failLight }, line: { color: C.grayMid, width: 0.5 } });
    if (i === 4) {
      slide.addShape('roundRect', { x: x + 0.15, y: 1.9, w: s1ColW[i] - 0.3, h: 0.25, fill: { color: C.fail }, rectRadius: 0.04 });
      slide.addText(cell, { x: x + 0.15, y: 1.9, w: s1ColW[i] - 0.3, h: 0.25, fontSize: 8, fontFace: 'Arial', color: C.white, align: 'center', valign: 'middle', bold: true });
    } else {
      slide.addText(cell, { x, y: 1.85, w: s1ColW[i], h: 0.35, fontSize: 9, fontFace: 'Arial', color: C.black, align: 'center', valign: 'middle' });
    }
  });

  // Section 2: Pass Rate
  slide.addText(t.repeatedAndPassRate.section2Title, { x: 0.5, y: 2.6, w: 9.0, h: 0.35, ...FONT.subheading, fontSize: 13 });
  slide.addText(t.repeatedAndPassRate.section2Desc, { x: 0.5, y: 2.95, w: 9.0, h: 0.25, ...FONT.bodySmall, fontSize: 9 });

  const s2Headers = t.repeatedAndPassRate.section2Headers;
  const s2ColW = [2.5, 2.5, 2.5];
  const s2X = 1.3;
  s2Headers.forEach((h, i) => {
    const x = s2X + s2ColW.slice(0, i).reduce((a, b) => a + b, 0);
    slide.addShape('rect', { x, y: 3.3, w: s2ColW[i], h: 0.35, fill: { color: C.primary } });
    slide.addText(h, { x, y: 3.3, w: s2ColW[i], h: 0.35, fontSize: 10, fontFace: 'Arial', color: C.white, align: 'center', valign: 'middle', bold: true });
  });

  t.repeatedAndPassRate.section2Example.forEach((row, ri) => {
    const y = 3.65 + ri * 0.35;
    const bg = ri === t.repeatedAndPassRate.section2Example.length - 1 ? C.blue50 : (ri % 2 === 0 ? C.grayLight : C.white);
    const isBold = ri === t.repeatedAndPassRate.section2Example.length - 1;
    row.forEach((cell, ci) => {
      const x = s2X + s2ColW.slice(0, ci).reduce((a, b) => a + b, 0);
      slide.addShape('rect', { x, y, w: s2ColW[ci], h: 0.35, fill: { color: bg }, line: { color: C.grayMid, width: 0.5 } });
      // Color code pass rates
      let textColor = C.black;
      if (ci === 2 && !isBold) {
        const lastVal = parseFloat(row[1]);
        const thisVal = parseFloat(cell);
        if (thisVal > lastVal) textColor = C.passDark;
        else if (thisVal < lastVal) textColor = C.failDark;
      }
      slide.addText(cell, { x, y, w: s2ColW[ci], h: 0.35, fontSize: 10, fontFace: 'Arial', color: textColor, align: 'center', valign: 'middle', bold: isBold });
    });
  });

  addInfoBox(slide, 0.5, 5.5, 9.0, 0.35, t.repeatedAndPassRate.passRateNote, C.yellowLight, C.black, { fontSize: 9 });
}

function slideHistory(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.history.title, t.history.desc);
  addPageNum(slide, 14, 16);

  // Filters mockup
  slide.addText('Filters:', { x: 0.5, y: 1.2, w: 1.0, h: 0.3, ...FONT.subheading, fontSize: 11 });
  t.history.filters.forEach((filter, i) => {
    const x = 0.5 + i * 1.85;
    slide.addShape('roundRect', { x, y: 1.55, w: 1.7, h: 0.7, fill: { color: C.grayLight }, rectRadius: 0.06 });
    slide.addText(filter.label, { x, y: 1.55, w: 1.7, h: 0.3, ...FONT.label, fontSize: 9, align: 'center', bold: true });
    slide.addText(filter.desc, { x, y: 1.85, w: 1.7, h: 0.35, ...FONT.label, fontSize: 8, align: 'center' });
  });

  // Table header mockup
  const hdrY = 2.5;
  const hColW = [1.0, 0.9, 0.7, 1.1, 0.8, 0.7, 0.7, 0.8, 1.1];
  t.history.tableHeaders.forEach((h, i) => {
    const x = 0.35 + hColW.slice(0, i).reduce((a, b) => a + b, 0);
    slide.addShape('rect', { x, y: hdrY, w: hColW[i], h: 0.35, fill: { color: C.primary } });
    slide.addText(h, { x, y: hdrY, w: hColW[i], h: 0.35, fontSize: 8, fontFace: 'Arial', color: C.white, align: 'center', valign: 'middle', bold: true });
  });

  // Sample rows
  const sampleRows = [
    ['2026-03-10', 'A', 'A-1', 'D210103', 'PASS', '1.2', '1.5', '2.0', 'Nguyen'],
    ['2026-03-10', 'A', 'A-2', 'D210104', 'FAIL', '1.3', '1.4', '2.1', 'Nguyen'],
    ['2026-03-10', 'B', 'B-1', 'D220201', 'PASS', '1.1', '1.6', '1.9', 'Tran'],
  ];
  sampleRows.forEach((row, ri) => {
    const y = hdrY + 0.35 + ri * 0.35;
    const bg = ri % 2 === 0 ? C.white : C.grayLight;
    row.forEach((cell, ci) => {
      const x = 0.35 + hColW.slice(0, ci).reduce((a, b) => a + b, 0);
      slide.addShape('rect', { x, y, w: hColW[ci], h: 0.35, fill: { color: bg }, line: { color: C.grayMid, width: 0.3 } });
      let cellColor = C.black;
      if (ci === 4) cellColor = cell === 'PASS' ? C.passDark : C.failDark;
      slide.addText(cell, { x, y, w: hColW[ci], h: 0.35, fontSize: 8, fontFace: 'Arial', color: cellColor, align: 'center', valign: 'middle', bold: ci === 4 });
    });
  });

  // Click note
  addInfoBox(slide, 0.5, 4.0, 9.0, 0.5, t.history.clickNote, C.blue50, C.primaryDark, { fontSize: 11 });

  // Navigation path
  slide.addText(t.history.navPath, { x: 0.5, y: 4.7, w: 9.0, h: 0.3, ...FONT.bodySmall });

  // Detail modal mockup
  slide.addShape('roundRect', { x: 2.0, y: 5.1, w: 6.0, h: 1.8, fill: { color: C.white }, line: { color: C.grayMid, width: 1 }, rectRadius: 0.1 });
  slide.addShape('rect', { x: 2.0, y: 5.1, w: 6.0, h: 0.35, fill: { color: C.primary } });
  slide.addText('Inspection Detail Modal', { x: 2.0, y: 5.1, w: 6.0, h: 0.35, fontSize: 10, fontFace: 'Arial', color: C.white, align: 'center', valign: 'middle', bold: true });
  slide.addText('Date: 2026-03-10  |  Factory A  |  Line A-2  |  FAIL\nFe: 1.3mm  |  SUS: 1.4mm  |  Non-Fe: 2.1mm\nCA Status: Pending  →  [Update Status]', {
    x: 2.2, y: 5.5, w: 5.6, h: 1.2, fontSize: 9, fontFace: 'Arial', color: C.black, valign: 'top',
  });
}

function slideCATracking(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.caTracking.title, t.caTracking.desc);
  addPageNum(slide, 15, 16);

  // How-to steps (left side)
  t.caTracking.howTo.forEach((step, i) => {
    const y = 1.2 + i * 0.72;
    addStepBox(slide, 0.5, y, 5.5, 0.65, step.num, step.title, step.desc);
  });

  // CA Status legend (right side)
  slide.addShape('roundRect', { x: 6.2, y: 1.2, w: 3.5, h: 3.5, fill: { color: C.grayLight }, rectRadius: 0.08 });
  slide.addText('CA Status Flow:', { x: 6.4, y: 1.3, w: 3.1, h: 0.3, ...FONT.subheading, fontSize: 11 });

  t.caTracking.statuses.forEach((status, i) => {
    const y = 1.7 + i * 0.75;
    slide.addShape('roundRect', { x: 6.5, y, w: 2.0, h: 0.28, fill: { color: status.color }, rectRadius: 0.04 });
    slide.addText(status.name, { x: 6.5, y, w: 2.0, h: 0.28, fontSize: 9, fontFace: 'Arial', color: C.white, align: 'center', valign: 'middle', bold: true });
    slide.addText(status.desc, { x: 6.5, y: y + 0.3, w: 3.0, h: 0.3, ...FONT.label, fontSize: 8 });
  });

  // Flow arrows
  slide.addText('Pending  →  In Progress  →  Completed', { x: 6.4, y: 4.5, w: 3.2, h: 0.25, fontSize: 9, fontFace: 'Arial', color: C.primary, align: 'center', bold: true });

  // Dashboard note
  addInfoBox(slide, 0.5, 5.8, 9.0, 0.5, t.caTracking.dashboardNote, C.passLight, C.passDark, { fontSize: 10 });
}

function slidePDFReport(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.pdfReport.title, t.pdfReport.desc);
  addPageNum(slide, 16, 16);

  t.pdfReport.steps.forEach((step, i) => {
    const y = 1.2 + i * 1.0;
    slide.addShape('roundRect', { x: 0.4, y, w: 9.2, h: 0.85, fill: { color: i % 2 === 0 ? C.blue50 : C.grayLight }, rectRadius: 0.06 });
    addStepBox(slide, 0.55, y + 0.05, 8.8, 0.75, step.num, step.title, step.desc);
  });

  // Filename format
  addInfoBox(slide, 0.5, 6.3, 4.5, 0.4, t.pdfReport.fileName, C.grayLight, C.black, { fontSize: 10, fontFace: 'Courier New' });

  // No data note
  addInfoBox(slide, 5.2, 6.3, 4.3, 0.4, t.pdfReport.noDataNote, C.yellowLight, C.black, { fontSize: 9 });
}

function slideDailyWorkflow(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.dailyWorkflow.title);

  // 4 workflow cards (2x2)
  const timingColors = { DAILY: C.primary, 'WHEN FAIL': C.fail, WEEKLY: C.pass, 'AFTER FIX': C.orange, 'HÀNG NGÀY': C.primary, 'KHI FAIL': C.fail, 'HÀNG TUẦN': C.pass, 'SAU SỬA': C.orange };

  t.dailyWorkflow.workflows.forEach((wf, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.3 + col * 4.85;
    const y = 0.9 + row * 3.2;
    const cardW = 4.6;
    const cardH = 3.0;

    slide.addShape('roundRect', { x, y, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.grayMid, width: 1 }, rectRadius: 0.1 });
    // Timing badge
    const badgeColor = timingColors[wf.timing] || C.primary;
    slide.addShape('roundRect', { x: x + 0.1, y: y + 0.1, w: 1.5, h: 0.3, fill: { color: badgeColor }, rectRadius: 0.04 });
    slide.addText(wf.timing, { x: x + 0.1, y: y + 0.1, w: 1.5, h: 0.3, fontSize: 9, fontFace: 'Arial', color: C.white, align: 'center', valign: 'middle', bold: true });
    // Title
    slide.addText(wf.title, { x: x + 1.7, y: y + 0.1, w: 2.7, h: 0.3, ...FONT.subheading, fontSize: 11, valign: 'middle' });
    // Steps
    wf.steps.forEach((step, j) => {
      slide.addText(`${j + 1}. ${step}`, { x: x + 0.15, y: y + 0.5 + j * 0.38, w: cardW - 0.3, h: 0.35, fontSize: 9, fontFace: 'Arial', color: C.black, valign: 'top' });
    });
  });
}

function slideFAQ(pptx, t) {
  const slide = pptx.addSlide();
  addWhiteBg(slide);
  addSectionHeader(slide, t.faq.title);

  t.faq.items.forEach((item, i) => {
    const y = 0.85 + i * 1.05;
    // Q
    slide.addText(`Q: ${item.q}`, { x: 0.5, y, w: 9.0, h: 0.3, ...FONT.subheading, fontSize: 11, color: C.primaryDark });
    // A
    slide.addText(`A: ${item.a}`, { x: 0.7, y: y + 0.3, w: 8.8, h: 0.65, ...FONT.bullet, fontSize: 10, color: C.gray });
  });
}

function slideContact(pptx, t) {
  const slide = pptx.addSlide();
  addBg(slide);

  slide.addText(t.contact.title, { x: 0.8, y: 0.5, w: 8.4, h: 0.6, ...FONT.title, fontSize: 28 });

  // System info box
  slide.addShape('roundRect', { x: 0.5, y: 1.4, w: 4.3, h: 2.8, fill: { color: '1E3A8A' }, rectRadius: 0.1 });
  slide.addText(t.contact.systemTitle, { x: 0.7, y: 1.5, w: 3.9, h: 0.35, ...FONT.subtitle, fontSize: 14, bold: true });
  t.contact.systemItems.forEach((item, i) => {
    slide.addText(`${item.label}:`, { x: 0.7, y: 2.0 + i * 0.5, w: 1.8, h: 0.4, fontSize: 11, fontFace: 'Arial', color: C.accent });
    slide.addText(item.value, { x: 2.5, y: 2.0 + i * 0.5, w: 2.1, h: 0.4, fontSize: 11, fontFace: 'Arial', color: C.white });
  });

  // Support info box
  slide.addShape('roundRect', { x: 5.2, y: 1.4, w: 4.3, h: 2.8, fill: { color: '1E3A8A' }, rectRadius: 0.1 });
  slide.addText(t.contact.supportTitle, { x: 5.4, y: 1.5, w: 3.9, h: 0.35, ...FONT.subtitle, fontSize: 14, bold: true });
  t.contact.supportItems.forEach((item, i) => {
    slide.addText(`${item.label}:`, { x: 5.4, y: 2.0 + i * 0.6, w: 2.0, h: 0.4, fontSize: 11, fontFace: 'Arial', color: C.accent });
    slide.addText(item.value, { x: 7.4, y: 2.0 + i * 0.6, w: 1.9, h: 0.4, fontSize: 11, fontFace: 'Arial', color: C.white });
  });

  // Thank you
  slide.addText(t.contact.thankYou, { x: 0.5, y: 5.0, w: 9.0, h: 0.6, fontSize: 24, fontFace: 'Arial', color: C.white, bold: true, align: 'center' });
  slide.addText(t.contact.tagline, { x: 0.5, y: 5.6, w: 9.0, h: 0.4, fontSize: 14, fontFace: 'Arial', color: C.accent, align: 'center' });
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════

async function createManual(lang) {
  const t = TEXTS[lang];
  if (!t) throw new Error(`Unknown language: ${lang}`);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
  pptx.author = 'Q-TRAIN System';
  pptx.company = 'HWK Vietnam';
  pptx.subject = 'Metal Detector Weekly Inspection - User Manual';

  // Generate all 16 slides
  slideCover(pptx, t);           // 1
  slideTOC(pptx, t);             // 2
  slideBeforeAfter(pptx, t);     // 3
  slideLogin(pptx, t);           // 4
  slideQuickEntry(pptx, t);      // 5
  slideQuickStep1(pptx, t);      // 6
  slideQuickStep2(pptx, t);      // 7
  slideFailHandling(pptx, t);    // 8
  slideContinuousTips(pptx, t);  // 9
  slideDetailedEntry(pptx, t);   // 10
  slideDashboardKPI(pptx, t);    // 11
  slideFactoryComparison(pptx, t); // 12
  slideRepeatedAndPassRate(pptx, t); // 13
  slideHistory(pptx, t);         // 14
  slideCATracking(pptx, t);      // 15 (CA + PDF merged for slide count)
  slidePDFReport(pptx, t);       // 16
  slideDailyWorkflow(pptx, t);   // 17
  slideFAQ(pptx, t);             // 18
  slideContact(pptx, t);         // 19

  const filePath = join(OUTPUT_DIR, t.file);
  await pptx.writeFile({ fileName: filePath });
  console.log(`[OK] Generated: ${filePath}`);
}

// ═══════════════════════════════════════════════════════════════
// EXECUTE
// ═══════════════════════════════════════════════════════════════

console.log('=== Metal Detector Manual PPTX Generator ===\n');

try {
  await createManual('EN');
  await createManual('VI');
  console.log('\n=== Done! 2 files generated in scripts/output/ ===');
} catch (err) {
  console.error('ERROR:', err);
  process.exit(1);
}
