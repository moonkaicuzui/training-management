/**
 * PDF Export Utility
 * jspdf 라이브러리를 동적 import하여 번들 크기 최적화
 * 한글/베트남어 지원을 위해 html2canvas 방식도 제공
 */

import type { jsPDF } from 'jspdf';

/**
 * Export HTML element to PDF using html2canvas
 * 한글/베트남어 등 유니코드 문자를 올바르게 렌더링합니다.
 *
 * @param element - HTML element to capture
 * @param filename - Output filename
 * @param options - PDF export options
 */
export async function exportElementToPDF(
  element: HTMLElement,
  filename: string = 'report.pdf',
  options: {
    orientation?: 'portrait' | 'landscape';
    scale?: number;
    margin?: number;
  } = {}
): Promise<void> {
  const { orientation = 'landscape', scale = 2, margin = 10 } = options;

  // Dynamic imports
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Capture element as canvas
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  // Calculate dimensions
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;

  // Scale image to fit page
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
  const scaledWidth = imgWidth * ratio;
  const scaledHeight = imgHeight * ratio;

  // Center image on page
  const x = (pageWidth - scaledWidth) / 2;
  const y = margin;

  pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
  pdf.save(filename);
}

/**
 * Export table to PDF using browser print dialog
 * 브라우저의 인쇄 기능을 사용하여 PDF로 내보냅니다 (모든 언어 완벽 지원)
 */
export function exportTableToPDFWithUnicode<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ header: string; dataKey: string }>,
  options: {
    title?: string;
    filename?: string;
    orientation?: 'portrait' | 'landscape';
  } = {}
): void {
  const {
    title = 'Q-TRAIN Report',
    orientation = 'landscape',
  } = options;

  // Build HTML content
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
          margin: 15mm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
        }
        .header {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #1e40af;
        }
        .header h1 {
          font-size: 22px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 11px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        th {
          background: #1e40af;
          color: white;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #1e40af;
        }
        td {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
        }
        tr:nth-child(even) {
          background: #f8fafc;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated: ${dateStr}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${columns.map((col) => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${columns
                .map((col) => {
                  const value = row[col.dataKey];
                  const displayValue = value === null || value === undefined ? '' : String(value);
                  return `<td>${displayValue}</td>`;
                })
                .join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">
        Q-TRAIN - Training Management System
      </div>
    </body>
    </html>
  `;

  // Open new window and print
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      // Close window after print dialog closes (optional)
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  }
}

export interface PDFExportOptions {
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  fontSize?: number;
  headerFontSize?: number;
  margin?: number;
  includeDate?: boolean;
  includePageNumbers?: boolean;
}

export interface PDFTableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

/**
 * Create a new jsPDF document with common settings
 */
async function createPDFDocument(options: PDFExportOptions): Promise<jsPDF> {
  const { orientation = 'portrait', pageSize = 'a4' } = options;

  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf');

  return new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });
}

/**
 * Add header to PDF document
 */
function addHeader(
  doc: jsPDF,
  title: string,
  options: PDFExportOptions
): number {
  const { headerFontSize = 16, margin = 15, includeDate = true } = options;
  let yPos = margin;

  // Title
  doc.setFontSize(headerFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, yPos);
  yPos += 8;

  // Date
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

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
  yPos += 5;

  return yPos;
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(doc: jsPDF, margin: number): void {
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

/**
 * Export data to PDF with a table
 * Uses jspdf-autotable for automatic table layout
 *
 * @param data - Array of data objects to export
 * @param columns - Column definitions for the table
 * @param options - PDF export options
 */
export async function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: PDFTableColumn[],
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    title = 'Q-TRAIN Report',
    filename = `report_${new Date().toISOString().split('T')[0]}.pdf`,
    fontSize = 10,
    margin = 15,
    includePageNumbers = true,
  } = options;

  const doc = await createPDFDocument(options);

  // Dynamic import autotable
  const { default: autoTable } = await import('jspdf-autotable');

  // Add header
  const startY = addHeader(doc, title, options);

  // Prepare table data
  const tableHeaders = columns.map((col) => col.header);
  const tableData = data.map((row) =>
    columns.map((col) => {
      const value = row[col.dataKey];
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return value.toLocaleDateString('ko-KR');
      return String(value);
    })
  );

  // Generate table using autoTable
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY,
    margin: { left: margin, right: margin },
    styles: {
      fontSize,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 64, 175], // Blue-800
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Gray-50
    },
    columnStyles: columns.reduce(
      (acc, col, index) => {
        if (col.width) {
          acc[index] = { cellWidth: col.width };
        }
        return acc;
      },
      {} as Record<number, { cellWidth: number }>
    ),
  });

  // Add page numbers
  if (includePageNumbers) {
    addPageNumbers(doc, margin);
  }

  // Download the PDF
  doc.save(filename);
}

/**
 * Export multiple tables to a single PDF
 *
 * @param sections - Array of sections with title, data, and columns
 * @param options - PDF export options
 */
export async function exportMultiTablePDF<T extends Record<string, unknown>>(
  sections: Array<{
    title: string;
    data: T[];
    columns: PDFTableColumn[];
  }>,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    title = 'Q-TRAIN Report',
    filename = `report_${new Date().toISOString().split('T')[0]}.pdf`,
    fontSize = 10,
    margin = 15,
    includePageNumbers = true,
  } = options;

  const doc = await createPDFDocument(options);
  const { default: autoTable } = await import('jspdf-autotable');

  let currentY = addHeader(doc, title, options);

  sections.forEach((section, sectionIndex) => {
    // Check if we need a new page
    if (sectionIndex > 0 && currentY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      currentY = margin;
    }

    // Section title
    if (sectionIndex > 0) {
      currentY += 10;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, margin, currentY);
    currentY += 6;

    // Table data
    const tableHeaders = section.columns.map((col) => col.header);
    const tableData = section.data.map((row) =>
      section.columns.map((col) => {
        const value = row[col.dataKey];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toLocaleDateString('ko-KR');
        return String(value);
      })
    );

    // Generate table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: {
        fontSize,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: (data) => {
        currentY = data.cursor?.y ?? margin;
      },
    });

    // Update currentY after table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable?.finalY ?? currentY + 20;
  });

  // Add page numbers
  if (includePageNumbers) {
    addPageNumbers(doc, margin);
  }

  doc.save(filename);
}

/**
 * Export training results summary to PDF
 */
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

  const doc = await createPDFDocument({ ...options, orientation: 'landscape' });
  const { default: autoTable } = await import('jspdf-autotable');

  let currentY = addHeader(doc, title, options);

  // Summary section
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

  // Results table
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
}

/**
 * Export certificate to PDF
 */
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

  const doc = await createPDFDocument({ ...options, orientation: 'landscape' });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const centerX = pageWidth / 2;

  // Border
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Header
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('CERTIFICATE OF COMPLETION', centerX, 45, { align: 'center' });

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Q-TRAIN Training Management System', centerX, 55, { align: 'center' });

  // Main content
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

  // Details
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

  // Trainer signature area
  doc.setFontSize(10);
  doc.line(centerX - 40, pageHeight - 45, centerX + 40, pageHeight - 45);
  doc.text(data.trainerName, centerX, pageHeight - 40, { align: 'center' });
  doc.text('Trainer', centerX, pageHeight - 35, { align: 'center' });

  doc.save(filename);
}
