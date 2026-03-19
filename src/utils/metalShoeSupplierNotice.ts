import type { MetalShoeCase } from '../types/metalShoe';

/**
 * 업체 통보서 PPTX (pptxgenjs)
 * 기존 src/utils/pptxGenerator.ts 패턴 — LAYOUT_WIDE 16:9
 */
export async function generateSupplierNotice(
  cases: MetalShoeCase[],
  supplierName: string,
  year: number,
  weekNumber?: number
): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 16:9 (13.33 x 7.5 inches)
  pptx.author = 'Q-TRAIN System';
  pptx.company = 'HWK Vietnam';
  pptx.title = `Metal Detection Notice - ${supplierName}`;

  const weekLabel = weekNumber ? `W${String(weekNumber).padStart(2, '0')}` : `Year ${year}`;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  const deadlineStr = deadline.toISOString().split('T')[0];

  // ── Slide 1: Cover ─────────────────────────────────────────
  const slide1 = pptx.addSlide();
  slide1.background = { color: '1E40AF' };

  slide1.addText('HWK METAL DETECTION NOTICE', {
    x: 0.5, y: 1.5, w: 12.33, h: 1,
    fontSize: 32, color: 'FFFFFF', bold: true, align: 'center',
  });

  slide1.addText(supplierName, {
    x: 0.5, y: 3, w: 12.33, h: 0.8,
    fontSize: 24, color: 'BFDBFE', align: 'center',
  });

  slide1.addText(`Period: ${weekLabel} | Year: ${year}`, {
    x: 0.5, y: 4, w: 12.33, h: 0.5,
    fontSize: 14, color: '93C5FD', align: 'center',
  });

  slide1.addText(`Issued: ${new Date().toISOString().split('T')[0]} | Deadline: ${deadlineStr}`, {
    x: 0.5, y: 5, w: 12.33, h: 0.5,
    fontSize: 12, color: '93C5FD', align: 'center',
  });

  slide1.addText(`Total Cases: ${cases.length}`, {
    x: 0.5, y: 5.8, w: 12.33, h: 0.5,
    fontSize: 16, color: 'FCD34D', bold: true, align: 'center',
  });

  // ── Slide 2: Case Summary Table ────────────────────────────
  const slide2 = pptx.addSlide();
  slide2.addText('Case Summary', {
    x: 0.5, y: 0.3, w: 12.33, h: 0.6,
    fontSize: 20, color: '1E40AF', bold: true,
  });

  const tableHeaders = [
    { text: 'Date', options: { bold: true, color: 'FFFFFF', fill: { color: '1E40AF' }, fontSize: 9 } },
    { text: 'Factory', options: { bold: true, color: 'FFFFFF', fill: { color: '1E40AF' }, fontSize: 9 } },
    { text: 'Line', options: { bold: true, color: 'FFFFFF', fill: { color: '1E40AF' }, fontSize: 9 } },
    { text: 'Model', options: { bold: true, color: 'FFFFFF', fill: { color: '1E40AF' }, fontSize: 9 } },
    { text: 'Component', options: { bold: true, color: 'FFFFFF', fill: { color: '1E40AF' }, fontSize: 9 } },
    { text: 'Side', options: { bold: true, color: 'FFFFFF', fill: { color: '1E40AF' }, fontSize: 9 } },
    { text: 'Size', options: { bold: true, color: 'FFFFFF', fill: { color: '1E40AF' }, fontSize: 9 } },
  ];

  const tableRows = cases.slice(0, 15).map((c, i) => [
    { text: c.detectionDate, options: { fontSize: 8, fill: { color: i % 2 === 0 ? 'F3F4F6' : 'FFFFFF' } } },
    { text: c.factory, options: { fontSize: 8, fill: { color: i % 2 === 0 ? 'F3F4F6' : 'FFFFFF' } } },
    { text: c.line || '-', options: { fontSize: 8, fill: { color: i % 2 === 0 ? 'F3F4F6' : 'FFFFFF' } } },
    { text: c.model, options: { fontSize: 8, fill: { color: i % 2 === 0 ? 'F3F4F6' : 'FFFFFF' } } },
    { text: c.component, options: { fontSize: 8, fill: { color: i % 2 === 0 ? 'F3F4F6' : 'FFFFFF' } } },
    { text: c.side, options: { fontSize: 8, fill: { color: i % 2 === 0 ? 'F3F4F6' : 'FFFFFF' } } },
    { text: c.size || '-', options: { fontSize: 8, fill: { color: i % 2 === 0 ? 'F3F4F6' : 'FFFFFF' } } },
  ]);

  slide2.addTable([tableHeaders, ...tableRows], {
    x: 0.5, y: 1.1, w: 12.33,
    border: { type: 'solid', pt: 0.5, color: 'D1D5DB' },
    colW: [1.5, 1.3, 0.8, 3, 1.5, 1, 1],
  });

  if (cases.length > 15) {
    slide2.addText(`... and ${cases.length - 15} more cases`, {
      x: 0.5, y: 6.8, w: 12.33, h: 0.4,
      fontSize: 10, color: '6B7280', italic: true, align: 'center',
    });
  }

  // ── Slide 3: Action Request ────────────────────────────────
  const slide3 = pptx.addSlide();
  slide3.addText('Action Plan Request', {
    x: 0.5, y: 0.3, w: 12.33, h: 0.6,
    fontSize: 20, color: '1E40AF', bold: true,
  });

  slide3.addText(`Please submit your action plan by ${deadlineStr}`, {
    x: 0.5, y: 1.2, w: 12.33, h: 0.5,
    fontSize: 14, color: 'DC2626', bold: true,
  });

  const sections = [
    { title: '1. Root Cause Analysis', desc: 'Identify the root cause of metal contamination in your production process.' },
    { title: '2. Corrective Action', desc: 'Describe immediate corrective actions taken to address the identified issues.' },
    { title: '3. Preventive Action', desc: 'Outline preventive measures to prevent recurrence of metal contamination.' },
    { title: '4. Implementation Timeline', desc: 'Provide a timeline for implementing corrective and preventive actions.' },
  ];

  let yPos = 2.2;
  for (const section of sections) {
    slide3.addText(section.title, {
      x: 0.8, y: yPos, w: 11.53, h: 0.4,
      fontSize: 13, color: '1E3A5F', bold: true,
    });
    slide3.addText(section.desc, {
      x: 0.8, y: yPos + 0.4, w: 11.53, h: 0.35,
      fontSize: 10, color: '6B7280',
    });
    // Blank line area
    slide3.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: yPos + 0.8, w: 11.53, h: 0.4,
      fill: { color: 'F9FAFB' },
      line: { color: 'D1D5DB', dashType: 'dash', width: 0.5 },
    });
    yPos += 1.5;
  }

  // ── Slide 4: Contact ───────────────────────────────────────
  const slide4 = pptx.addSlide();
  slide4.addText('Contact & Submission', {
    x: 0.5, y: 0.3, w: 12.33, h: 0.6,
    fontSize: 20, color: '1E40AF', bold: true,
  });

  slide4.addText([
    { text: 'Submit your action plan to:\n', options: { fontSize: 14, color: '374151' } },
    { text: 'hwk_qa@hsvina.com\n\n', options: { fontSize: 16, color: '1E40AF', bold: true } },
    { text: `Deadline: ${deadlineStr}\n\n`, options: { fontSize: 14, color: 'DC2626', bold: true } },
    { text: 'HWK Vietnam QA Department\n', options: { fontSize: 12, color: '6B7280' } },
    { text: 'Generated by Q-TRAIN System', options: { fontSize: 10, color: '9CA3AF', italic: true } },
  ], {
    x: 2, y: 2, w: 9.33, h: 4,
    valign: 'middle', align: 'center',
  });

  // ── Save ───────────────────────────────────────────────────
  const safeName = supplierName.replace(/[^a-zA-Z0-9]/g, '_');
  await pptx.writeFile({ fileName: `Metal_Notice_${safeName}_${weekLabel}_${year}.pptx` });
}
