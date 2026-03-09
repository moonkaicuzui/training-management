import { logger } from '@/utils/logger';
import type { PDFExportOptions } from './types';
import { createPDFDocument, addHeader, addPageNumbers } from './helpers';

export async function exportTrainingResultsPDF(
  data: {
    employees: Array<{ name: string; id: string; department: string }>;
    results: Array<{
      employee_id: string;
      program: string;
      score: number;
      result: string;
      date: string;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
  },
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    title = 'Training Results Report',
    filename = `training_results_${new Date().toISOString().split('T')[0]}.pdf`,
    margin = 15,
    includePageNumbers = true,
  } = options;

  try {
    const doc = await createPDFDocument({ ...options, orientation: 'landscape' });
    const { default: autoTable } = await import('jspdf-autotable');

    let currentY = addHeader(doc, title, options);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, currentY);
    currentY += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Employees: ${data.summary.total}`, margin, currentY);
    currentY += 5;
    doc.text(`Passed: ${data.summary.passed}`, margin, currentY);
    currentY += 5;
    doc.text(`Failed: ${data.summary.failed}`, margin, currentY);
    currentY += 5;
    doc.text(`Pass Rate: ${data.summary.passRate.toFixed(1)}%`, margin, currentY);
    currentY += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Results', margin, currentY);
    currentY += 6;

    const tableData = data.results.map((result) => {
      const employee = data.employees.find((e) => e.id === result.employee_id);
      return [
        employee?.name ?? result.employee_id,
        employee?.department ?? '-',
        result.program,
        String(result.score),
        result.result,
        result.date,
      ];
    });

    autoTable(doc, {
      head: [['Employee', 'Department', 'Program', 'Score', 'Result', 'Date']],
      body: tableData,
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
      },
    });

    if (includePageNumbers) {
      addPageNumbers(doc, margin);
    }

    doc.save(filename);
  } catch (error) {
    logger.error('[pdfExport] Failed to export training results PDF:', error);
    throw new Error('PDF 파일 내보내기에 실패했습니다.');
  }
}

export async function exportCertificatePDF(
  data: {
    employeeName: string;
    employeeId: string;
    programName: string;
    completionDate: string;
    score: number;
    grade: string;
    trainerName: string;
    validUntil?: string;
  },
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = `certificate_${data.employeeId}_${new Date().toISOString().split('T')[0]}.pdf`,
  } = options;

  try {
    const doc = await createPDFDocument({ ...options, orientation: 'landscape' });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const centerX = pageWidth / 2;

    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('CERTIFICATE OF COMPLETION', centerX, 45, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Q-TRAIN Training Management System', centerX, 55, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('This is to certify that', centerX, 80, { align: 'center' });

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(data.employeeName, centerX, 95, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Employee ID: ${data.employeeId}`, centerX, 105, { align: 'center' });

    doc.setFontSize(14);
    doc.text('has successfully completed the training program', centerX, 120, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(data.programName, centerX, 135, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const detailsY = 155;
    doc.text(`Completion Date: ${data.completionDate}`, centerX - 60, detailsY);
    doc.text(`Score: ${data.score}`, centerX - 60, detailsY + 8);
    doc.text(`Grade: ${data.grade}`, centerX + 40, detailsY);
    if (data.validUntil) {
      doc.text(`Valid Until: ${data.validUntil}`, centerX + 40, detailsY + 8);
    }

    doc.setFontSize(10);
    doc.line(centerX - 40, pageHeight - 45, centerX + 40, pageHeight - 45);
    doc.text(data.trainerName, centerX, pageHeight - 40, { align: 'center' });
    doc.text('Trainer', centerX, pageHeight - 35, { align: 'center' });

    doc.save(filename);
  } catch (error) {
    logger.error('[pdfExport] Failed to export certificate PDF:', error);
    throw new Error('PDF 파일 내보내기에 실패했습니다.');
  }
}
