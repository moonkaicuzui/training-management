import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, Settings, Play } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFivePrsStore } from '@/stores/fivePrsStore';
import { useRecommendationStore } from '@/stores/recommendationStore';
import { RecommendationSummaryCards } from '@/components/five-prs/recommendations/RecommendationSummaryCards';
import { RecommendationFilters } from '@/components/five-prs/recommendations/RecommendationFilters';
import { RecommendationTable } from '@/components/five-prs/recommendations/RecommendationTable';
import { BatchActionBar } from '@/components/five-prs/recommendations/BatchActionBar';
import { EnrollmentDialog } from '@/components/five-prs/recommendations/EnrollmentDialog';
import { MappingManager } from '@/components/five-prs/recommendations/MappingManager';
import { TqcEmployeeLinker } from '@/components/five-prs/recommendations/TqcEmployeeLinker';
import type { TrainingRecommendation, RecommendationThreshold } from '@/types/recommendation';
import { DEFAULT_THRESHOLDS } from '@/types/recommendation';

// ============================================================
// ThresholdConfigDialog (inline component)
// ============================================================

interface ThresholdConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thresholds: RecommendationThreshold | null;
  onSave: (updates: Partial<RecommendationThreshold>) => Promise<void>;
}

function ThresholdConfigDialog({
  open,
  onOpenChange,
  thresholds,
  onSave,
}: ThresholdConfigDialogProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    immediate_rate: DEFAULT_THRESHOLDS.immediate_rate,
    preventive_rate_min: DEFAULT_THRESHOLDS.preventive_rate_min,
    preventive_rate_max: DEFAULT_THRESHOLDS.preventive_rate_max,
    min_validation_count: DEFAULT_THRESHOLDS.min_validation_count,
    surge_multiplier: DEFAULT_THRESHOLDS.surge_multiplier,
    surge_min_rate: DEFAULT_THRESHOLDS.surge_min_rate,
    surge_recent_days: DEFAULT_THRESHOLDS.surge_recent_days,
    surge_past_days: DEFAULT_THRESHOLDS.surge_past_days,
  });

  useEffect(() => {
    if (open && thresholds) {
      setForm({
        immediate_rate: thresholds.immediate_rate,
        preventive_rate_min: thresholds.preventive_rate_min,
        preventive_rate_max: thresholds.preventive_rate_max,
        min_validation_count: thresholds.min_validation_count,
        surge_multiplier: thresholds.surge_multiplier,
        surge_min_rate: thresholds.surge_min_rate,
        surge_recent_days: thresholds.surge_recent_days,
        surge_past_days: thresholds.surge_past_days,
      });
    }
  }, [open, thresholds]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: Number(value) || 0 }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('recommendation.settings.title')}</DialogTitle>
          <DialogDescription>
            {t('recommendation.settings.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="immediate_rate">
                {t('recommendation.settings.immediateRate')}
              </Label>
              <Input
                id="immediate_rate"
                type="number"
                step="0.1"
                value={form.immediate_rate}
                onChange={(e) => handleChange('immediate_rate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_validation_count">
                {t('recommendation.settings.minValidationCount')}
              </Label>
              <Input
                id="min_validation_count"
                type="number"
                value={form.min_validation_count}
                onChange={(e) => handleChange('min_validation_count', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preventive_rate_min">
                {t('recommendation.settings.preventiveRateMin')}
              </Label>
              <Input
                id="preventive_rate_min"
                type="number"
                step="0.1"
                value={form.preventive_rate_min}
                onChange={(e) => handleChange('preventive_rate_min', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preventive_rate_max">
                {t('recommendation.settings.preventiveRateMax')}
              </Label>
              <Input
                id="preventive_rate_max"
                type="number"
                step="0.1"
                value={form.preventive_rate_max}
                onChange={(e) => handleChange('preventive_rate_max', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surge_multiplier">
                {t('recommendation.settings.surgeMultiplier')}
              </Label>
              <Input
                id="surge_multiplier"
                type="number"
                step="0.1"
                value={form.surge_multiplier}
                onChange={(e) => handleChange('surge_multiplier', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surge_min_rate">
                {t('recommendation.settings.surgeMinRate')}
              </Label>
              <Input
                id="surge_min_rate"
                type="number"
                step="0.1"
                value={form.surge_min_rate}
                onChange={(e) => handleChange('surge_min_rate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surge_recent_days">
                {t('recommendation.settings.surgeRecentDays')}
              </Label>
              <Input
                id="surge_recent_days"
                type="number"
                value={form.surge_recent_days}
                onChange={(e) => handleChange('surge_recent_days', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="surge_past_days">
              {t('recommendation.settings.surgePastDays')}
            </Label>
            <Input
              id="surge_past_days"
              type="number"
              value={form.surge_past_days}
              onChange={(e) => handleChange('surge_past_days', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// TrainingRecommendations Page
// ============================================================

export default function TrainingRecommendations() {
  const { t } = useTranslation();

  // 5PRS Store
  const {
    months,
    selectedMonth,
    isLoadingMonths,
    isLoadingData,
  } = useFivePrsStore();
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
  } = useRecommendationStore();
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('recommendation.pageTitle')}
          </h1>
          <p className="text-muted-foreground">
            {t('recommendation.pageDescription')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <Select
            value={selectedMonth}
            onValueChange={handleMonthChange}
            disabled={isLoadingMonths || months.length === 0}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('fivePrs.monthSelect')} />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.year_month} value={m.year_month}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Run Analysis */}
          <Button
            onClick={handleRunAnalysis}
            disabled={!selectedMonth || isProcessing || isLoading}
          >
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {t('recommendation.runAnalysis')}
          </Button>

          {/* Settings */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('recommendation.settings.title')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error */}
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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <>
          {/* KPI Cards */}
          <RecommendationSummaryCards recommendations={recommendations} />

          {/* Tabs */}
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

            {/* Recommendations Tab */}
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

            {/* Defect-Training Mapping Tab */}
            <TabsContent value="mappings">
              <MappingManager />
            </TabsContent>

            {/* TQC-Employee Links Tab */}
            <TabsContent value="links">
              <TqcEmployeeLinker />
            </TabsContent>

            {/* Enrollment History Tab */}
            <TabsContent value="logs">
              {isLoadingLogs ? (
                <div className="flex items-center justify-center min-h-[200px]">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : enrollmentLogs.length === 0 ? (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                  {t('common.noData')}
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('recommendation.logs.date')}</TableHead>
                        <TableHead>{t('recommendation.logs.tqc')}</TableHead>
                        <TableHead>{t('recommendation.logs.employee')}</TableHead>
                        <TableHead>{t('recommendation.logs.program')}</TableHead>
                        <TableHead>{t('recommendation.logs.priority')}</TableHead>
                        <TableHead className="text-right">
                          {t('recommendation.logs.score')}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('recommendation.logs.rejectRate')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollmentLogs.map((log) => (
                        <TableRow key={log.log_id}>
                          <TableCell className="text-sm">
                            {log.enrolled_at}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-mono">{log.tqc_id}</span>
                              <span className="text-muted-foreground ml-1">
                                ({log.tqc_name})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-mono">{log.employee_id}</span>
                              <span className="text-muted-foreground ml-1">
                                ({log.employee_name})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <Badge variant="outline" className="mr-1">
                                {log.program_code}
                              </Badge>
                              {log.program_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.priority === 'IMMEDIATE'
                                  ? 'destructive'
                                  : log.priority === 'SURGE'
                                    ? 'warning'
                                    : 'secondary'
                              }
                            >
                              {t(`recommendation.priorities.${log.priority}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {log.priority_score}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {log.reject_rate.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Threshold Config Dialog */}
      <ThresholdConfigDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        thresholds={thresholds}
        onSave={updateThresholds}
      />

      {/* Enrollment Dialog */}
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
