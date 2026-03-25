import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useMetalShoeStore } from '../../stores/metalShoeStore';
import { Loader2, FileSpreadsheet, FileText, Presentation, Download } from 'lucide-react';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

export default function MetalShoeReport() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);
  const [generating, setGenerating] = useState<string | null>(null);

  const { fetchCases, fetchSuppliers } = useMetalShoeStore(
    useShallow((state) => ({
      fetchCases: state.fetchCases,
      fetchSuppliers: state.fetchSuppliers,
    }))
  );

  const handleExcelExport = async () => {
    setGenerating('excel');
    try {
      await fetchCases({ year: selectedYear });
      const { generateMetalShoeExcel } = await import('../../utils/metalShoeExcelExport');
      const currentCases = useMetalShoeStore.getState().cases;
      await generateMetalShoeExcel(currentCases, selectedYear);
    } catch (err) {
      logger.error('Excel export failed:', err);
      toast({
        title: t('metalShoe.report.exportFailed', 'Excel export failed'),
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  const handlePdfExport = async () => {
    if (!selectedWeek) return;
    setGenerating('pdf');
    try {
      await fetchCases({ year: selectedYear, weekNumber: selectedWeek });
      const { generateMetalShoePdfReport } = await import('../../utils/metalShoePdfExport');
      const currentCases = useMetalShoeStore.getState().cases;
      const kpis = useMetalShoeStore.getState().dashboardKPIs;
      await generateMetalShoePdfReport(currentCases, selectedYear, selectedWeek, kpis);
    } catch (err) {
      logger.error('PDF export failed:', err);
      toast({
        title: t('metalShoe.report.exportFailed', 'PDF export failed'),
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  const handlePptxExport = async () => {
    setGenerating('pptx');
    try {
      await fetchCases({ year: selectedYear, weekNumber: selectedWeek });
      await fetchSuppliers();
      const { generateSupplierNotice } = await import('../../utils/metalShoeSupplierNotice');
      const currentCases = useMetalShoeStore.getState().cases;
      const currentSuppliers = useMetalShoeStore.getState().suppliers;
      // Group by supplier and generate for the first supplier with cases
      const supplierIds = [...new Set(currentCases.map((c) => c.supplierId))];
      if (supplierIds.length > 0) {
        const targetId = supplierIds[0];
        const supplierCases = currentCases.filter((c) => c.supplierId === targetId);
        const supplier = currentSuppliers.find((s) => s.id === targetId);
        await generateSupplierNotice(supplierCases, supplier?.name || targetId, selectedYear, selectedWeek);
      }
    } catch (err) {
      logger.error('PPTX export failed:', err);
      toast({
        title: t('metalShoe.report.exportFailed', 'PPTX export failed'),
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {t('metalShoe.report.title', 'Reports')}
        </h1>
        <p className="text-sm text-gray-500">
          {t('metalShoe.report.subtitle', 'Generate Excel, PDF, and PPTX reports')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={selectedWeek ?? ''}
          onChange={(e) => setSelectedWeek(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">{t('metalShoe.allWeeks', 'All Weeks')}</option>
          {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>W{String(w).padStart(2, '0')}</option>
          ))}
        </select>
      </div>

      {/* Report Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Excel Report */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-green-50 p-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t('metalShoe.report.excelTitle', 'Annual Excel Report')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('metalShoe.report.excelDesc', 'Download all cases for the selected year')}
              </p>
            </div>
          </div>
          <p className="mb-4 text-xs text-gray-400">
            {t('metalShoe.report.excelContent', 'DATA sheet + Supplier Tracking + Action Tracking + Summary')}
          </p>
          <button
            onClick={handleExcelExport}
            disabled={generating === 'excel'}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {generating === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t('metalShoe.report.downloadExcel', 'Download Excel')}
          </button>
        </div>

        {/* PDF Report */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-red-50 p-2">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t('metalShoe.report.pdfTitle', 'Weekly PDF Report')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('metalShoe.report.pdfDesc', 'Generate PDF for the selected week')}
              </p>
            </div>
          </div>
          <p className="mb-4 text-xs text-gray-400">
            {t('metalShoe.report.pdfContent', 'Cover + Case details + Supplier summary + Action status')}
          </p>
          <button
            onClick={handlePdfExport}
            disabled={generating === 'pdf' || !selectedWeek}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {generating === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {selectedWeek
              ? t('metalShoe.report.downloadPdf', 'Download PDF (W{{week}})', { week: String(selectedWeek).padStart(2, '0') })
              : t('metalShoe.report.selectWeek', 'Select a week first')
            }
          </button>
        </div>

        {/* PPTX Supplier Notice */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-orange-50 p-2">
              <Presentation className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t('metalShoe.report.pptxTitle', 'Supplier Notice')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('metalShoe.report.pptxDesc', 'Generate supplier notification PPTX')}
              </p>
            </div>
          </div>
          <p className="mb-4 text-xs text-gray-400">
            {t('metalShoe.report.pptxContent', 'Cover + Case summary + Action request + Tracking status')}
          </p>
          <button
            onClick={handlePptxExport}
            disabled={generating === 'pptx'}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {generating === 'pptx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t('metalShoe.report.downloadPptx', 'Download PPTX')}
          </button>
        </div>
      </div>
    </div>
  );
}
