import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

export function useExport() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const exportExcel = useCallback(
    async <T extends Record<string, unknown>>(
      data: T[],
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
    async <T extends Record<string, unknown>>(
      data: T[],
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
