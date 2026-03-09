/**
 * AQL Dashboard Page
 *
 * Displays AQL inspection statistics: month selection, KPI cards,
 * inspector table, and building analysis.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAqlStore } from '@/stores/aqlStore';
import { AqlMonthSelector } from '@/components/aql/AqlMonthSelector';
import { AqlKPICards } from '@/components/aql/AqlKPICards';
import { AqlInspectorTable } from '@/components/aql/AqlInspectorTable';

export default function AqlDashboard() {
  const { t } = useTranslation();

  const {
    months,
    selectedMonth,
    processedData,
    isLoadingMonths,
    isLoadingData,
    error,
    fetchMonths,
    fetchData,
    setSelectedMonth,
    clearError,
  } = useAqlStore(useShallow((state) => ({
    months: state.months,
    selectedMonth: state.selectedMonth,
    processedData: state.processedData,
    isLoadingMonths: state.isLoadingMonths,
    isLoadingData: state.isLoadingData,
    error: state.error,
    fetchMonths: state.fetchMonths,
    fetchData: state.fetchData,
    setSelectedMonth: state.setSelectedMonth,
    clearError: state.clearError,
  })));

  // Load months on mount (cache guard inside store prevents redundant calls)
  useEffect(() => {
    fetchMonths();
  }, [fetchMonths]);

  // Fetch data when selectedMonth changes (cache guard inside store prevents redundant calls)
  useEffect(() => {
    if (selectedMonth) {
      fetchData(selectedMonth);
    }
  }, [selectedMonth, fetchData]);

  const handleMonthChange = (yearMonth: string) => {
    setSelectedMonth(yearMonth);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t('aql.dashboard.title', 'AQL Dashboard')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('aql.dashboard.description', 'AQL inspection results and inspector analysis')}
          </p>
        </div>
        <AqlMonthSelector
          months={months}
          selectedMonth={selectedMonth}
          onSelect={handleMonthChange}
          isLoading={isLoadingMonths}
        />
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button onClick={clearError} className="text-sm underline ml-4">
              {t('common.dismiss', 'Dismiss')}
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoadingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* KPI Cards */}
      {!isLoadingData && (
        <AqlKPICards
          stats={processedData?.stats ?? null}
          isLoading={isLoadingData}
        />
      )}

      {/* Inspector Table */}
      {!isLoadingData && processedData && (
        <AqlInspectorTable
          records={processedData.inspectorRecords}
          isLoading={isLoadingData}
        />
      )}

      {/* Building Analysis */}
      {!isLoadingData && processedData && processedData.buildingRecords.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('aql.dashboard.buildingAnalysis', 'Building Analysis')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {processedData.buildingRecords.map((b) => (
              <div
                key={b.building}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{b.building}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('aql.dashboard.totalLabel', 'Total')}: {b.total}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    b.fail_rate > 30 ? 'text-red-600' :
                    b.fail_rate >= 10 ? 'text-orange-500' :
                    b.fail_rate > 0 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {b.fail_rate}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {b.fail_count} {t('aql.dashboard.fails', 'fails')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingData && !isLoadingMonths && !processedData && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>{t('aql.dashboard.noData', 'Select a month to load AQL data')}</p>
        </div>
      )}
    </div>
  );
}
