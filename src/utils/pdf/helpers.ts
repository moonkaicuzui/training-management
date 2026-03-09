import type { jsPDF } from 'jspdf';
import type { PDFExportOptions } from './types';

export async function createPDFDocument(options: PDFExportOptions): Promise<jsPDF> {
  const { orientation = 'portrait', pageSize = 'a4' } = options;

  const { jsPDF } = await import('jspdf');

  return new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });
}

export function addHeader(
  doc: jsPDF,
  title: string,
  options: PDFExportOptions
): number {
  const { headerFontSize = 16, margin = 15, includeDate = true } = options;
  let yPos = margin;

  doc.setFontSize(headerFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, yPos);
  yPos += 8;

  if (includeDate) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Generated: ${dateStr}`, margin, yPos);
    yPos += 8;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
  yPos += 5;

  return yPos;
}

export function addPageNumbers(doc: jsPDF, margin: number): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - margin - 25,
      doc.internal.pageSize.height - margin
    );
  }
}
