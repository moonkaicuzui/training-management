/**
 * AQL Training Recommendations Page
 *
 * AQL 데이터를 분석하여 EMPLOYEE NO(TQC/RQC 검사원) 기준 FAIL 결과를 기반으로
 * 교육 추천을 생성하고, 검사원 및 상사의 교육 등록을 관리합니다.
 *
 * EMPLOYEE NO = TQC/RQC 검사원 (교육 대상), OFFICIAL INSPECTOR = CFA 검사관 (참고용)
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Loader2, AlertCircle, Play, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAqlStore } from '@/stores/aqlStore';
import { AqlMonthSelector } from '@/components/aql/AqlMonthSelector';
import { AqlRecommendationSummaryCards } from '@/components/aql/recommendations/AqlRecommendationSummaryCards';
import { AqlRecommendationFilters } from '@/components/aql/recommendations/AqlRecommendationFilters';
import { AqlRecommendationTable } from '@/components/aql/recommendations/AqlRecommendationTable';
import { AqlEnrollmentDialog } from '@/components/aql/recommendations/AqlEnrollmentDialog';
import { AqlBatchActionBar } from '@/components/aql/recommendations/AqlBatchActionBar';
import { AqlEmployeeLinker } from '@/components/aql/recommendations/AqlEmployeeLinker';
import { SupervisorImporter } from '@/components/aql/recommendations/SupervisorImporter';
import { MappingManager } from '@/components/five-prs/recommendations/MappingManager';
import { logger } from '@/utils/logger';
import type { AqlTrainingRecommendation, AqlFilters } from '@/types/aql';

export default function AqlTrainingRecommendations() {
  const { t } = useTranslation();

  const {
    months,
    selectedMonth,
    processedData,
    isLoadingMonths,
    isLoadingData,
    isLoadingConfig,
    isAnalyzing,
    isEnrolling,
    isImporting,
    error,
    recommendations,
    filters,
    selectedIds,
    aqlLinks,
    supervisorLinks,
    employees,
    programs,
    fetchMonths,
    fetchData,
    fetchConfig,
    setSelectedMonth,
    analyzeRecommendations,
    enrollRecommendation,
    batchEnroll,
    createAqlLink,
    deleteAqlLink,
    importSupervisorLinks,
    autoImportSupervisorLinks,
    setFilters,
    setSelectedIds,
    clearError,
  } = useAqlStore(useShallow((state) => ({
    months: state.months,
    selectedMonth: state.selectedMonth,
    processedData: state.processedData,
    isLoadingMonths: state.isLoadingMonths,
    isLoadingData: state.isLoadingData,
    isLoadingConfig: state.isLoadingConfig,
    isAnalyzing: state.isAnalyzing,
    isEnrolling: state.isEnrolling,
    isImporting: state.isImporting,
    error: state.error,
    recommendations: state.recommendations,
    filters: state.filters,
    selectedIds: state.selectedIds,
    aqlLinks: state.aqlLinks,
    supervisorLinks: state.supervisorLinks,
    employees: state.employees,
    programs: state.programs,
    fetchMonths: state.fetchMonths,
    fetchData: state.fetchData,
    fetchConfig: state.fetchConfig,
    setSelectedMonth: state.setSelectedMonth,
    analyzeRecommendations: state.analyzeRecommendations,
    enrollRecommendation: state.enrollRecommendation,
    batchEnroll: state.batchEnroll,
    createAqlLink: state.createAqlLink,
    deleteAqlLink: state.deleteAqlLink,
    importSupervisorLinks: state.importSupervisorLinks,
    autoImportSupervisorLinks: state.autoImportSupervisorLinks,
    setFilters: state.setFilters,
    setSelectedIds: state.setSelectedIds,
    clearError: state.clearError,
  })));

  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<AqlTrainingRecommendation | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Load months and config on mount (cache guards prevent redundant calls)
  useEffect(() => {
    Promise.all([fetchMonths(), fetchConfig()]).catch((err) => { logger.error('AqlTrainingRecommendations 초기 데이터 로드 실패:', err); });
  }, [fetchMonths, fetchConfig]);

  // Auto-fetch data when month selected
  useEffect(() => {
    if (selectedMonth) {
      fetchData(selectedMonth);
    }
  }, [selectedMonth, fetchData]);

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;

    if (filters.priority) {
      filtered = filtered.filter((r) => r.priority === filters.priority);
    }
    if (filters.building) {
      filtered = filtered.filter((r) => r.buildings.includes(filters.building!));
    }
    if (filters.reason && filters.reason !== 'all') {
      filtered = filtered.filter((r) => r.enrollment_reason === filters.reason);
    }
    if (filters.linkStatus && filters.linkStatus !== 'all') {
      filtered = filtered.filter((r) =>
        filters.linkStatus === 'linked' ? !!r.linked_employee : !r.linked_employee
      );
    }
    if (filters.enrollmentStatus && filters.enrollmentStatus !== 'all') {
      filtered = filtered.filter((r) => r.enrollment_status === filters.enrollmentStatus);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.aql_employee_no.toLowerCase().includes(s) ||
          r.aql_employee_name.toLowerCase().includes(s)
      );
    }

    return filtered;
  }, [recommendations, filters]);

  // Get unique buildings from recommendations
  const buildings = useMemo(() => {
    const set = new Set<string>();
    for (const r of recommendations) {
      for (const b of r.buildings) set.add(b);
    }
    return Array.from(set).sort();
  }, [recommendations]);

  // Get unique TQC/RQC employee names for linker
  const inspectorNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of recommendations) {
      if (r.enrollment_reason === 'INSPECTOR_FAIL') {
        map.set(r.aql_employee_no, r.aql_employee_name);
      }
    }
    return Array.from(map.entries()).map(([employee_no, employee_name]) => ({
      employee_no,
      employee_name,
    }));
  }, [recommendations]);

  const handleAnalyze = useCallback(() => {
    analyzeRecommendations();
  }, [analyzeRecommendations]);

  const handleEnroll = useCallback((rec: AqlTrainingRecommendation) => {
    setEnrollTarget(rec);
    setEnrollDialogOpen(true);
  }, []);

  const handleEnrollConfirm = useCallback(
    async (programCode: string) => {
      if (!enrollTarget) return;
      await enrollRecommendation(enrollTarget, programCode, selectedMonth);
      setEnrollDialogOpen(false);
      setEnrollTarget(null);
    },
    [enrollTarget, enrollRecommendation, selectedMonth]
  );

  const handleBatchEnroll = useCallback(async () => {
    const selected = recommendations.filter(
      (r) =>
        selectedIds.includes(`${r.aql_employee_no}-${r.enrollment_reason}`) &&
        r.linked_employee &&
        r.enrollment_status === 'PENDING'
    );
    if (selected.length === 0) return;

    // Always use INS-001 for AQL batch enrollment
    await batchEnroll(selected, 'INS-001', selectedMonth);
  }, [recommendations, selectedIds, batchEnroll, selectedMonth]);

  const handleFilterChange = useCallback(
    (newFilters: AqlFilters) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  const isLoading = isLoadingMonths || isLoadingData || isLoadingConfig;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('aql.recommendations.title', 'AQL Training Recommendations')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('aql.recommendations.description', 'Analyze AQL fail data and enroll TQC/RQC inspectors + supervisors for training')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AqlMonthSelector
            months={months}
            selectedMonth={selectedMonth}
            onSelect={setSelectedMonth}
            isLoading={isLoadingMonths}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {t('aql.recommendations.config', 'Config')}
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={!processedData || isAnalyzing}
            size="sm"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            {t('aql.recommendations.analyze', 'Analyze')}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button onClick={clearError} className="text-sm underline ml-4">
              {t('common.dismiss', 'Dismiss')}
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && recommendations.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Results */}
      {recommendations.length > 0 && (
        <>
          <AqlRecommendationSummaryCards recommendations={recommendations} />

          <AqlRecommendationFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            buildings={buildings}
          />

          <AqlRecommendationTable
            recommendations={recommendations}
            filteredRecommendations={filteredRecommendations}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onEnroll={handleEnroll}
          />
        </>
      )}

      {/* Empty State */}
      {!isLoading && recommendations.length === 0 && processedData && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>{t('aql.recommendations.noResults', 'Click "Analyze" to generate training recommendations')}</p>
        </div>
      )}

      {/* Batch Action Bar */}
      <AqlBatchActionBar
        selectedCount={selectedIds.length}
        onBatchEnroll={handleBatchEnroll}
        onClearSelection={() => setSelectedIds([])}
        isEnrolling={isEnrolling}
      />

      {/* Enrollment Dialog */}
      <AqlEnrollmentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        recommendation={enrollTarget}
        programs={programs}
        onConfirm={handleEnrollConfirm}
        isEnrolling={isEnrolling}
      />

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('aql.recommendations.configTitle', 'AQL Configuration')}
            </DialogTitle>
            <DialogDescription>
              {t('aql.recommendations.configDescription', 'Manage employee links, supervisor mappings, and defect-training mappings')}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="links">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="links">
                {t('aql.recommendations.employeeLinks', 'Employee Links')}
              </TabsTrigger>
              <TabsTrigger value="supervisors">
                {t('aql.recommendations.supervisors', 'Supervisors')}
              </TabsTrigger>
              <TabsTrigger value="mappings">
                {t('aql.recommendations.mappings', 'Defect Mappings')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="links">
              <AqlEmployeeLinker
                aqlLinks={aqlLinks}
                employees={employees}
                inspectorNames={inspectorNames}
                onCreateLink={createAqlLink}
                onDeleteLink={deleteAqlLink}
              />
            </TabsContent>

            <TabsContent value="supervisors">
              <SupervisorImporter
                supervisorLinks={supervisorLinks}
                onImport={importSupervisorLinks}
                onAutoImport={autoImportSupervisorLinks}
                isImporting={isImporting}
              />
            </TabsContent>

            <TabsContent value="mappings">
              <MappingManager />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
