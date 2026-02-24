import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFivePrsStore } from '@/stores/fivePrsStore';
import { MonthSelector } from '@/components/five-prs/MonthSelector';
import { InspectionKPICards } from '@/components/five-prs/InspectionKPICards';
import { TqcAnalysisTable } from '@/components/five-prs/TqcAnalysisTable';
import { DefectDistributionChart } from '@/components/five-prs/DefectDistributionChart';
import { BuildingHeatmap } from '@/components/five-prs/BuildingHeatmap';
import { DailyTrendChart } from '@/components/five-prs/DailyTrendChart';

export default function FivePrsDashboard() {
  const { t } = useTranslation();
  const {
    processedData,
    selectedMonth,
    isLoadingMonths,
    isLoadingData,
    error,
  } = useFivePrsStore();
  const fetchMonths = useFivePrsStore((s) => s.fetchMonths);
  const fetchData = useFivePrsStore((s) => s.fetchData);
  const clearError = useFivePrsStore((s) => s.clearError);

  useEffect(() => {
    fetchMonths();
  }, [fetchMonths]);

  useEffect(() => {
    if (selectedMonth) {
      fetchData(selectedMonth);
    }
  }, [selectedMonth, fetchData]);

  const isLoading = isLoadingMonths || isLoadingData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('fivePrs.dashboardTitle')}</h1>
          <p className="text-muted-foreground">{t('fivePrs.dashboardDescription')}</p>
        </div>
        <MonthSelector />
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button onClick={clearError} className="text-sm underline ml-2">
              {t('common.close')}
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Content */}
      {!isLoading && processedData && (
        <>
          <InspectionKPICards stats={processedData.stats} />

          <DailyTrendChart records={processedData.dailyRecords} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TqcAnalysisTable records={processedData.tqcRecords} />
            <DefectDistributionChart defects={processedData.defectTypes} />
          </div>

          <BuildingHeatmap records={processedData.buildingRecords} />
        </>
      )}

      {/* Empty state */}
      {!isLoading && !processedData && !error && (
        <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
          {t('fivePrs.selectMonthPrompt')}
        </div>
      )}
    </div>
  );
}
