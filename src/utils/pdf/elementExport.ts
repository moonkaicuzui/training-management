import { logger } from '@/utils/logger';

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

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

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

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    const x = (pageWidth - scaledWidth) / 2;
    const y = margin;

    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
    pdf.save(filename);
  } catch (error) {
    logger.error('[pdfExport] Failed to export element to PDF:', error);
    throw new Error('PDF 파일 내보내기에 실패했습니다.');
  }
}
