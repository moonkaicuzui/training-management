import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFivePrsStore } from '@/stores/fivePrsStore';
import { useRecommendationStore } from '@/stores/recommendationStore';
import { RecommendationSummaryCards } from '@/components/five-prs/recommendations/RecommendationSummaryCards';
import { RecommendationFilters } from '@/components/five-prs/recommendations/RecommendationFilters';
import { RecommendationTable } from '@/components/five-prs/recommendations/RecommendationTable';
import { BatchActionBar } from '@/components/five-prs/recommendations/BatchActionBar';
import { EnrollmentDialog } from '@/components/five-prs/recommendations/EnrollmentDialog';
import { MappingManager } from '@/components/five-prs/recommendations/MappingManager';
import { TqcEmployeeLinker } from '@/components/five-prs/recommendations/TqcEmployeeLinker';
import { ThresholdConfigDialog, PageHeader, EnrollmentLogsTable } from '@/components/five-prs/training-recommendations';
import type { TrainingRecommendation } from '@/types/recommendation';

export default function TrainingRecommendations() {
  const { t } = useTranslation();

  // 5PRS Store
  const {
    months,
    selectedMonth,
    isLoadingMonths,
    isLoadingData,
  } = useFivePrsStore(useShallow((state) => ({
    months: state.months,
    selectedMonth: state.selectedMonth,
    isLoadingMonths: state.isLoadingMonths,
    isLoadingData: state.isLoadingData,
  })));
  const fetchMonths = useFivePrsStore((s) => s.fetchMonths);
  const fetchData = useFivePrsStore((s) => s.fetchData);
  const setSelectedMonth = useFivePrsStore((s) => s.setSelectedMonth);

  // Recommendation Store
  const {
    thresholds,
    recommendations,
    enrollmentLogs,
    programs,
    filters,
    selectedIds,
    isLoadingConfig,
    isAnalyzing,
    isEnrolling,
    isLoadingLogs,
    error: recError,
  } = useRecommendationStore(useShallow((state) => ({
    thresholds: state.thresholds,
    recommendations: state.recommendations,
    enrollmentLogs: state.enrollmentLogs,
    programs: state.programs,
    filters: state.filters,
    selectedIds: state.selectedIds,
    isLoadingConfig: state.isLoadingConfig,
    isAnalyzing: state.isAnalyzing,
    isEnrolling: state.isEnrolling,
    isLoadingLogs: state.isLoadingLogs,
    error: state.error,
  })));
  const fetchConfig = useRecommendationStore((s) => s.fetchConfig);
  const analyzeRecs = useRecommendationStore((s) => s.analyzeRecommendations);
  const setFilters = useRecommendationStore((s) => s.setFilters);
  const setSelectedIds = useRecommendationStore((s) => s.setSelectedIds);
  const enrollRecommendation = useRecommendationStore((s) => s.enrollRecommendation);
  const batchEnroll = useRecommendationStore((s) => s.batchEnroll);
  const updateThresholds = useRecommendationStore((s) => s.updateThresholds);
  const fetchLogs = useRecommendationStore((s) => s.fetchLogs);
  const clearError = useRecommendationStore((s) => s.clearError);

  // Local UI state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<TrainingRecommendation | null>(null);

  // Initial data load
  useEffect(() => {
    fetchMonths();
    fetchConfig();
  }, [fetchMonths, fetchConfig]);

  // Extract unique buildings for filters
  const buildings = useMemo(() => {
    const set = new Set<string>();
    recommendations.forEach((r) => r.buildings.forEach((b) => set.add(b)));
    return Array.from(set).sort();
  }, [recommendations]);

  // Run Analysis
  const handleRunAnalysis = useCallback(async () => {
    await fetchData();
    await analyzeRecs();
  }, [fetchData, analyzeRecs]);

  // Month change
  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  // Enroll single
  const handleEnrollClick = (rec: TrainingRecommendation) => {
    setEnrollTarget(rec);
    setEnrollDialogOpen(true);
  };

  const handleEnrollConfirm = async (programCode: string) => {
    if (enrollTarget) {
      await enrollRecommendation(enrollTarget, programCode, selectedMonth);
      setEnrollDialogOpen(false);
      setEnrollTarget(null);
    }
  };

  // Batch enroll
  const handleBatchEnroll = async () => {
    const selectedRecs = recommendations.filter(
      (r) => selectedIds.includes(r.tqc_id) && r.linkedEmployee && r.recommendedPrograms.length > 0
    );
    if (selectedRecs.length === 0) return;

    // Use the first recommended program for batch enrollment
    const programCode = selectedRecs[0].recommendedPrograms[0]?.program_code;
    if (programCode) {
      await batchEnroll(selectedRecs, programCode, selectedMonth);
    }
  };

  // Fetch logs when switching to the tab
  const handleTabChange = (value: string) => {
    if (value === 'logs') {
      fetchLogs();
    }
  };

  const isLoading = isLoadingMonths || isLoadingData || isLoadingConfig;
  const isProcessing = isAnalyzing || isEnrolling;

  return (
    <div className="space-y-6">
      <PageHeader
        selectedMonth={selectedMonth}
        months={months}
        isLoadingMonths={isLoadingMonths}
        isLoading={isLoading}
        isProcessing={isProcessing}
        isAnalyzing={isAnalyzing}
        onMonthChange={handleMonthChange}
        onRunAnalysis={handleRunAnalysis}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {recError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {recError}
            <button onClick={clearError} className="text-sm underline ml-2">
              {t('common.close')}
            </button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <>
          <RecommendationSummaryCards recommendations={recommendations} />

          <Tabs defaultValue="recommendations" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="recommendations">
                {t('recommendation.tabs.recommendations')}
              </TabsTrigger>
              <TabsTrigger value="mappings">
                {t('recommendation.tabs.defectMapping')}
              </TabsTrigger>
              <TabsTrigger value="links">
                {t('recommendation.tabs.tqcEmployeeLinks')}
              </TabsTrigger>
              <TabsTrigger value="logs">
                {t('recommendation.tabs.enrollmentHistory')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              <RecommendationFilters
                filters={filters}
                onFiltersChange={setFilters}
                buildings={buildings}
              />

              {isAnalyzing ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {t('recommendation.analyzing')}
                    </p>
                  </div>
                </div>
              ) : (
                <RecommendationTable
                  recommendations={recommendations}
                  filters={filters}
                  selectedIds={selectedIds}
                  onSelectedIdsChange={setSelectedIds}
                  onEnroll={handleEnrollClick}
                />
              )}

              <BatchActionBar
                selectedCount={selectedIds.length}
                onBatchEnroll={handleBatchEnroll}
                onClearSelection={() => setSelectedIds([])}
                isEnrolling={isEnrolling}
              />
            </TabsContent>

            <TabsContent value="mappings">
              <MappingManager />
            </TabsContent>

            <TabsContent value="links">
              <TqcEmployeeLinker />
            </TabsContent>

            <TabsContent value="logs">
              <EnrollmentLogsTable
                isLoadingLogs={isLoadingLogs}
                enrollmentLogs={enrollmentLogs}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <ThresholdConfigDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        thresholds={thresholds}
        onSave={updateThresholds}
      />

      <EnrollmentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        recommendation={enrollTarget}
        programs={programs}
        yearMonth={selectedMonth}
        onConfirm={handleEnrollConfirm}
        isLoading={isEnrolling}
      />
    </div>
  );
}
