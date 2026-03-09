import { logger } from '@/utils/logger';
import type { PDFExportOptions, PDFTableColumn } from './types';
import { createPDFDocument, addHeader, addPageNumbers } from './helpers';

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

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  }
}

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

  try {
    const doc = await createPDFDocument(options);
    const { default: autoTable } = await import('jspdf-autotable');

    const startY = addHeader(doc, title, options);

    const tableHeaders = columns.map((col) => col.header);
    const tableData = data.map((row) =>
      columns.map((col) => {
        const value = row[col.dataKey];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toLocaleDateString('ko-KR');
        return String(value);
      })
    );

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
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
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

    if (includePageNumbers) {
      addPageNumbers(doc, margin);
    }

    doc.save(filename);
  } catch (error) {
    logger.error('[pdfExport] Failed to export table PDF:', error);
    throw new Error('PDF 파일 내보내기에 실패했습니다.');
  }
}

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

  try {
    const doc = await createPDFDocument(options);
    const { default: autoTable } = await import('jspdf-autotable');

    let currentY = addHeader(doc, title, options);

    sections.forEach((section, sectionIndex) => {
      if (sectionIndex > 0 && currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = margin;
      }

      if (sectionIndex > 0) {
        currentY += 10;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, margin, currentY);
      currentY += 6;

      const tableHeaders = section.columns.map((col) => col.header);
      const tableData = section.data.map((row) =>
        section.columns.map((col) => {
          const value = row[col.dataKey];
          if (value === null || value === undefined) return '';
          if (value instanceof Date) return value.toLocaleDateString('ko-KR');
          return String(value);
        })
      );

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable?.finalY ?? currentY + 20;
    });

    if (includePageNumbers) {
      addPageNumbers(doc, margin);
    }

    doc.save(filename);
  } catch (error) {
    logger.error('[pdfExport] Failed to export multi-table PDF:', error);
    throw new Error('PDF 파일 내보내기에 실패했습니다.');
  }
}
