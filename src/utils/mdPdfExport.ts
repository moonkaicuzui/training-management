/**
 * Metal Detector Weekly Report PDF Export
 * jsPDF + jspdf-autotable 동적 import
 */

import type { MDInspection, MDFailure, MDDashboardKPI, FactoryCode } from '@/types/metalDetector';

interface ReportData {
  inspections: MDInspection[];
  kpis: MDDashboardKPI | null;
  failures: MDFailure[];
}

export async function generateMDWeeklyReport(
  year: number,
  weekNumber: number,
  data: ReportData
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ========== Cover Page ==========
  doc.setFontSize(24);
  doc.text('Metal Detector Inspection Report', pageWidth / 2, 50, { align: 'center' });

  doc.setFontSize(16);
  doc.text(`${year} - Week ${weekNumber}`, pageWidth / 2, 70, { align: 'center' });

  const totalInspections = data.inspections.length;
  const passCount = data.inspections.filter((i) => i.result === 'PASS').length;
  const passRate = totalInspections > 0 ? ((passCount / totalInspections) * 100).toFixed(1) : '0.0';

  doc.setFontSize(14);
  doc.text(`Total Inspections: ${totalInspections}`, pageWidth / 2, 100, { align: 'center' });
  doc.text(`Pass Rate: ${passRate}%`, pageWidth / 2, 112, { align: 'center' });
  doc.text(`Pass: ${passCount} / Fail: ${totalInspections - passCount}`, pageWidth / 2, 124, {
    align: 'center',
  });

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 20, {
    align: 'center',
  });

  // ========== Factory Pages ==========
  const factories: FactoryCode[] = ['A', 'B', 'C', 'D'];

  factories.forEach((factory) => {
    const factoryInspections = data.inspections.filter((i) => i.factory === factory);
    if (factoryInspections.length === 0) return;

    doc.addPage();

    // Factory Header
    doc.setFontSize(18);
    doc.text(`Factory ${factory}`, margin, 20);

    const fPass = factoryInspections.filter((i) => i.result === 'PASS').length;
    const fRate =
      factoryInspections.length > 0
        ? ((fPass / factoryInspections.length) * 100).toFixed(1)
        : '0.0';

    doc.setFontSize(12);
    doc.text(
      `Total: ${factoryInspections.length} | Pass: ${fPass} | Fail: ${factoryInspections.length - fPass} | Rate: ${fRate}%`,
      margin,
      30
    );

    // Table
    const tableData = factoryInspections.map((i) => [
      i.inspectionDate,
      i.line,
      i.result,
      `${i.sensitivity.fe}`,
      `${i.sensitivity.sus}`,
      `${i.sensitivity.nonFe}`,
      i.inspectorName,
      i.productName || '-',
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['Date', 'Line', 'Result', 'Fe(mm)', 'SUS(mm)', 'Non-Fe(mm)', 'Inspector', 'Product']],
      body: tableData,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        2: {
          cellWidth: 18,
          halign: 'center',
        },
      },
      didParseCell: (hookData) => {
        // Color PASS/FAIL cells
        if (hookData.column.index === 2 && hookData.section === 'body') {
          const value = hookData.cell.raw as string;
          if (value === 'PASS') {
            hookData.cell.styles.textColor = [34, 197, 94];
            hookData.cell.styles.fontStyle = 'bold';
          } else if (value === 'FAIL') {
            hookData.cell.styles.textColor = [239, 68, 68];
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
  });

  // ========== Failures Page ==========
  if (data.failures.length > 0) {
    doc.addPage();
    doc.setFontSize(18);
    doc.text('Failure Details & Corrective Actions', margin, 20);

    const failureData = data.failures.map((f) => [
      f.failureDate,
      `Factory ${f.factory}`,
      f.line,
      f.failureType,
      f.description,
      f.caStatus,
      f.caDescription || '-',
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Factory', 'Line', 'Type', 'Description', 'CA Status', 'CA Action']],
      body: failureData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [239, 68, 68] },
      columnStyles: {
        4: { cellWidth: 50 },
        6: { cellWidth: 50 },
      },
    });
  }

  // Save
  doc.save(`MD_Report_${year}_W${weekNumber}.pdf`);
}
