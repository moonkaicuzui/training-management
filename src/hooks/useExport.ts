import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

/**
 * 도메인 객체 배열을 Record<string, unknown>[]로 안전하게 변환합니다.
 * 이중 단언(as unknown as) 없이 단일 타입 단언만 사용합니다.
 */
export function toExportData<T extends object>(data: T[]): Record<string, unknown>[] {
  return data as Record<string, unknown>[];
}

export function useExport() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const exportExcel = useCallback(
    async (
      data: Record<string, unknown>[],
      options?: { sheetName?: string; filename?: string }
    ) => {
      setExporting(true);
      try {
        const { exportToExcel } = await import('@/utils/excelExport');
        await exportToExcel(data, options);
        toast({
          title: t('export.success'),
          variant: 'default',
        });
      } catch {
        toast({
          title: t('export.error'),
          variant: 'destructive',
        });
      } finally {
        setExporting(false);
      }
    },
    [t, toast]
  );

  const exportPDF = useCallback(
    async (
      data: Record<string, unknown>[],
      columns: Array<{ header: string; dataKey: string }>,
      options?: { title?: string; filename?: string; orientation?: 'portrait' | 'landscape' }
    ) => {
      setExporting(true);
      try {
        const { exportToPDF } = await import('@/utils/pdfExport');
        await exportToPDF(data, columns, options);
        toast({
          title: t('export.success'),
          variant: 'default',
        });
      } catch {
        toast({
          title: t('export.error'),
          variant: 'destructive',
        });
      } finally {
        setExporting(false);
      }
    },
    [t, toast]
  );

  return { exporting, exportExcel, exportPDF };
}
