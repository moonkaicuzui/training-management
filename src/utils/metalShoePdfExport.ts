import type { MetalShoeCase, MetalShoeDashboardKPI } from '../types/metalShoe';

/**
 * 금속 신발 주간 PDF 보고서
 * jsPDF + jspdf-autotable 동적 import (기존 mdPdfExport.ts 패턴)
 */
export async function generateMetalShoePdfReport(
  cases: MetalShoeCase[],
  year: number,
  weekNumber: number,
  kpis: MetalShoeDashboardKPI | null
): Promise<void> {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Page 1: Cover ──────────────────────────────────────────
  doc.setFontSize(24);
  doc.setTextColor(30, 64, 175);
  doc.text('HWK Metal Found in Shoes Report', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(75, 85, 99);
  doc.text(`Year ${year} - Week ${String(weekNumber).padStart(2, '0')}`, pageWidth / 2, 55, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 65, { align: 'center' });

  // KPI Summary
  if (kpis) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const kpiY = 85;
    const kpiData = [
      ['Total Cases', String(kpis.totalCases)],
      ['Bottom', String(kpis.bottomCases)],
      ['Upper', String(kpis.upperCases)],
      ['X-Ray Pending', String(kpis.xrayPending)],
      ['Action Pending', String(kpis.actionPending)],
      ['Closed', String(kpis.closedCases)],
    ];

    autoTable(doc, {
      startY: kpiY,
      head: [['Metric', 'Value']],
      body: kpiData,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 4 },
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] },
      margin: { left: 60, right: 60 },
    });
  }

  // ── Page 2: Case Details ───────────────────────────────────
  if (cases.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Case Details', 14, 15);

    const tableData = cases.map((c) => [
      c.detectionDate,
      c.factory,
      c.line || '-',
      c.model,
      c.supplierName,
      c.component,
      c.side,
      c.xraySentStatus,
      c.metalConfirm,
      c.status,
    ]);

    autoTable(doc, {
      startY: 22,
      head: [['Date', 'Factory', 'Line', 'Model', 'Supplier', 'Comp', 'Side', 'X-Ray', 'Confirm', 'Status']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 7 },
      columnStyles: {
        3: { cellWidth: 35 },
        4: { cellWidth: 30 },
      },
    });
  }

  // ── Page 3: Supplier Summary ───────────────────────────────
  if (kpis && Object.keys(kpis.bySupplier).length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Supplier Summary', 14, 15);

    const supplierData = Object.entries(kpis.bySupplier)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([id, data]) => {
        const supplier = cases.find((c) => c.supplierId === id);
        return [supplier?.supplierName || id, String(data.total), String(data.bottom), String(data.upper)];
      });

    autoTable(doc, {
      startY: 22,
      head: [['Supplier', 'Total', 'Bottom', 'Upper']],
      body: supplierData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] },
    });
  }

  // ── Save ───────────────────────────────────────────────────
  doc.save(`Metal_Shoe_W${String(weekNumber).padStart(2, '0')}_${year}.pdf`);
}
