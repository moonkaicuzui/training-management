/**
 * PPTX Report Generator
 *
 * Generates PowerPoint reports in the browser using pptxgenjs.
 * No Cloud Function required — runs entirely client-side.
 */

import PptxGenJS from 'pptxgenjs';

// ========== Types ==========

export interface PptxKPIData {
  period: string;
  overallCompletionRate: number;
  passRate: number;
  firstTimePassRate: number;
  averageScore: number;
  retrainingCount: number;
  expiringCount: number;
  totalEmployees: number;
  monthlyCompletions: number;
}

export interface PptxMonthlyTrend {
  month: string;
  completionRate: number;
  passRate: number;
  averageScore: number;
  retrainingRate: number;
}

export interface PptxGradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

export interface PptxCAPASummary {
  total: number;
  open: number;
  closed: number;
  overdue: number;
}

export interface PptxReportInput {
  period: string;
  kpi: PptxKPIData;
  monthlyTrends?: PptxMonthlyTrend[];
  gradeDistribution?: PptxGradeDistribution[];
  capaSummary?: PptxCAPASummary;
  recommendations?: string[];
}

// ========== Color Theme ==========

const THEME = {
  primary: '1e40af',     // Blue 800
  secondary: '3b82f6',   // Blue 500
  accent: '10b981',      // Emerald 500
  warning: 'f59e0b',     // Amber 500
  danger: 'ef4444',      // Red 500
  dark: '1f2937',        // Gray 800
  medium: '6b7280',      // Gray 500
  light: 'f3f4f6',       // Gray 100
  white: 'ffffff',
};

// ========== Helper Functions ==========

function addSlideTitle(slide: PptxGenJS.Slide, title: string) {
  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: THEME.dark,
  });
  // Divider line
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 0.85,
    w: 9,
    h: 0.03,
    fill: { color: THEME.secondary },
  });
}

function addKPIBox(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  color: string
) {
  slide.addShape('roundRect' as PptxGenJS.ShapeType, {
    x, y, w, h,
    fill: { color: THEME.light },
    rectRadius: 0.1,
  });
  slide.addText(value, {
    x, y: y + 0.15, w, h: 0.5,
    fontSize: 24,
    bold: true,
    color,
    align: 'center',
  });
  slide.addText(label, {
    x, y: y + 0.65, w, h: 0.3,
    fontSize: 10,
    color: THEME.medium,
    align: 'center',
  });
}

// ========== Slide Generators ==========

function addTitleSlide(pptx: PptxGenJS, input: PptxReportInput) {
  const slide = pptx.addSlide();
  slide.background = { fill: THEME.primary };

  slide.addText('Q-TRAIN', {
    x: 0.5, y: 1.5, w: 9, h: 0.8,
    fontSize: 40,
    bold: true,
    color: THEME.white,
    align: 'center',
  });
  slide.addText('Training Management Report', {
    x: 0.5, y: 2.3, w: 9, h: 0.5,
    fontSize: 20,
    color: THEME.white,
    align: 'center',
  });
  slide.addText(input.period, {
    x: 0.5, y: 3.0, w: 9, h: 0.5,
    fontSize: 16,
    color: THEME.white,
    align: 'center',
    italic: true,
  });
  slide.addText('HWK Vietnam (화승비나) QIP', {
    x: 0.5, y: 4.0, w: 9, h: 0.4,
    fontSize: 12,
    color: THEME.white,
    align: 'center',
  });
  slide.addText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: 0.5, y: 4.8, w: 9, h: 0.3,
    fontSize: 10,
    color: THEME.white,
    align: 'center',
  });
}

function addKPISummarySlide(pptx: PptxGenJS, input: PptxReportInput) {
  const slide = pptx.addSlide();
  addSlideTitle(slide, 'KPI Summary');

  const { kpi } = input;

  // Row 1 - 4 KPI boxes
  addKPIBox(slide, 0.5, 1.2, 2.1, 1.1, 'Completion Rate', `${kpi.overallCompletionRate}%`, THEME.primary);
  addKPIBox(slide, 2.8, 1.2, 2.1, 1.1, 'Pass Rate', `${kpi.passRate}%`, THEME.accent);
  addKPIBox(slide, 5.1, 1.2, 2.1, 1.1, 'Avg Score', `${kpi.averageScore}`, THEME.secondary);
  addKPIBox(slide, 7.4, 1.2, 2.1, 1.1, 'Employees', `${kpi.totalEmployees}`, THEME.dark);

  // Row 2 - 4 KPI boxes
  addKPIBox(slide, 0.5, 2.6, 2.1, 1.1, 'First-Time Pass', `${kpi.firstTimePassRate}%`, THEME.accent);
  addKPIBox(slide, 2.8, 2.6, 2.1, 1.1, 'Retraining', `${kpi.retrainingCount}`, THEME.warning);
  addKPIBox(slide, 5.1, 2.6, 2.1, 1.1, 'Expiring', `${kpi.expiringCount}`, THEME.danger);
  addKPIBox(slide, 7.4, 2.6, 2.1, 1.1, 'Monthly Done', `${kpi.monthlyCompletions}`, THEME.secondary);
}

function addMonthlyTrendSlide(pptx: PptxGenJS, trends: PptxMonthlyTrend[]) {
  const slide = pptx.addSlide();
  addSlideTitle(slide, 'Monthly Trend (Last 6 Months)');

  // Table
  const headerRow: PptxGenJS.TableCell[] = [
    { text: 'Month', options: { bold: true, fill: { color: THEME.primary }, color: THEME.white, fontSize: 10 } },
    { text: 'Completion %', options: { bold: true, fill: { color: THEME.primary }, color: THEME.white, fontSize: 10, align: 'center' } },
    { text: 'Pass Rate %', options: { bold: true, fill: { color: THEME.primary }, color: THEME.white, fontSize: 10, align: 'center' } },
    { text: 'Avg Score', options: { bold: true, fill: { color: THEME.primary }, color: THEME.white, fontSize: 10, align: 'center' } },
    { text: 'Retrain %', options: { bold: true, fill: { color: THEME.primary }, color: THEME.white, fontSize: 10, align: 'center' } },
  ];

  const dataRows: PptxGenJS.TableCell[][] = trends.map((t, i) => {
    const bg = i % 2 === 0 ? THEME.white : THEME.light;
    return [
      { text: t.month, options: { fontSize: 10, fill: { color: bg } } },
      { text: `${t.completionRate}%`, options: { fontSize: 10, align: 'center', fill: { color: bg } } },
      { text: `${t.passRate}%`, options: { fontSize: 10, align: 'center', fill: { color: bg } } },
      { text: `${t.averageScore}`, options: { fontSize: 10, align: 'center', fill: { color: bg } } },
      { text: `${t.retrainingRate}%`, options: { fontSize: 10, align: 'center', fill: { color: bg } } },
    ];
  });

  slide.addTable([headerRow, ...dataRows], {
    x: 0.5,
    y: 1.2,
    w: 9,
    colW: [2, 1.75, 1.75, 1.75, 1.75],
    border: { type: 'solid', pt: 0.5, color: 'e5e7eb' },
    rowH: 0.4,
  });
}

function addGradeDistributionSlide(pptx: PptxGenJS, grades: PptxGradeDistribution[]) {
  const slide = pptx.addSlide();
  addSlideTitle(slide, 'Grade Distribution');

  const gradeColors: Record<string, string> = {
    AA: '059669',
    A: '10b981',
    B: 'f59e0b',
    C: 'ef4444',
  };

  grades.forEach((g, i) => {
    const x = 0.5 + i * 2.3;
    const color = gradeColors[g.grade] || THEME.medium;

    // Grade box
    slide.addShape('roundRect' as PptxGenJS.ShapeType, {
      x, y: 1.5, w: 2, h: 2.5,
      fill: { color: THEME.light },
      rectRadius: 0.15,
    });

    // Grade letter
    slide.addText(g.grade, {
      x, y: 1.7, w: 2, h: 0.7,
      fontSize: 36,
      bold: true,
      color,
      align: 'center',
    });

    // Count
    slide.addText(`${g.count}`, {
      x, y: 2.5, w: 2, h: 0.5,
      fontSize: 20,
      bold: true,
      color: THEME.dark,
      align: 'center',
    });

    // Percentage
    slide.addText(`${g.percentage}%`, {
      x, y: 3.0, w: 2, h: 0.4,
      fontSize: 14,
      color: THEME.medium,
      align: 'center',
    });
  });
}

function addCAPASlide(pptx: PptxGenJS, capa: PptxCAPASummary) {
  const slide = pptx.addSlide();
  addSlideTitle(slide, 'CAPA Status Summary');

  addKPIBox(slide, 0.5, 1.5, 2.1, 1.2, 'Total CAPAs', `${capa.total}`, THEME.primary);
  addKPIBox(slide, 2.8, 1.5, 2.1, 1.2, 'Open', `${capa.open}`, THEME.warning);
  addKPIBox(slide, 5.1, 1.5, 2.1, 1.2, 'Closed', `${capa.closed}`, THEME.accent);
  addKPIBox(slide, 7.4, 1.5, 2.1, 1.2, 'Overdue', `${capa.overdue}`, THEME.danger);
}

function addRecommendationsSlide(pptx: PptxGenJS, recommendations: string[]) {
  const slide = pptx.addSlide();
  addSlideTitle(slide, 'Recommendations');

  recommendations.forEach((rec, i) => {
    slide.addText(`${i + 1}. ${rec}`, {
      x: 0.8,
      y: 1.3 + i * 0.5,
      w: 8.5,
      h: 0.4,
      fontSize: 14,
      color: THEME.dark,
      bullet: false,
    });
  });
}

// ========== Main Export ==========

/**
 * Generate a PPTX report and trigger browser download.
 */
export async function generatePptxReport(input: PptxReportInput): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
  pptx.author = 'Q-TRAIN System';
  pptx.company = 'HWK Vietnam';
  pptx.title = `Q-TRAIN Training Report - ${input.period}`;

  // Slide 1: Title
  addTitleSlide(pptx, input);

  // Slide 2: KPI Summary
  addKPISummarySlide(pptx, input);

  // Slide 3: Monthly Trend (if data available)
  if (input.monthlyTrends && input.monthlyTrends.length > 0) {
    addMonthlyTrendSlide(pptx, input.monthlyTrends);
  }

  // Slide 4: Grade Distribution (if data available)
  if (input.gradeDistribution && input.gradeDistribution.length > 0) {
    addGradeDistributionSlide(pptx, input.gradeDistribution);
  }

  // Slide 5: CAPA Summary (if data available)
  if (input.capaSummary) {
    addCAPASlide(pptx, input.capaSummary);
  }

  // Slide 6: Recommendations (if data available)
  if (input.recommendations && input.recommendations.length > 0) {
    addRecommendationsSlide(pptx, input.recommendations);
  }

  // Generate and download
  const filename = `Q-TRAIN_Report_${input.period.replace(/\s/g, '_')}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
