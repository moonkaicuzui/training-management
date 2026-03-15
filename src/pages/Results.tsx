import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useExport } from '@/hooks/useExport';
import { useDebounce } from '@/hooks/useDebounce';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShallow } from 'zustand/react/shallow';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';
import type { ResultInput } from '@/types';
import { calculateGrade, programThresholds } from '@/utils/gradeCalculator';

import { ResultsToolbar } from '@/components/results/ResultsToolbar';
import { ResultsTable } from '@/components/results/ResultsTable';
import { ResultInputForm } from '@/components/results/ResultInputDialog';
import type { ResultEntry } from '@/components/results/ResultInputDialog';
import { ResultEditDialog, DuplicateWarningDialog } from '@/components/results/ResultEditDialog';
import type { EditingResultState, DuplicateInfo } from '@/components/results/ResultEditDialog';

export default function Results() {
  const { t } = useTranslation();
  const { sessions, programs, employees, results, loading, fetchSessions, fetchPrograms, fetchEmployees, fetchResults, recordResults, updateResult } = useTrainingStore(useShallow((state) => ({
    sessions: state.sessions,
    programs: state.programs,
    employees: state.employees,
    results: state.results,
    loading: state.loading,
    fetchSessions: state.fetchSessions,
    fetchPrograms: state.fetchPrograms,
    fetchEmployees: state.fetchEmployees,
    fetchResults: state.fetchResults,
    recordResults: state.recordResults,
    updateResult: state.updateResult,
  })));
  const addToast = useUIStore((s) => s.addToast);
  const user = useAuthStore((state) => state.user);
  const { exporting, exportExcel, exportPDF } = useExport();

  const [selectedSession, setSelectedSession] = useState<string>('');
  const [resultEntries, setResultEntries] = useState<ResultEntry[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<EditingResultState | null>(null);

  // Duplicate detection state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [pendingResults, setPendingResults] = useState<ResultInput[]>([]);

  // Submission guards
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // For viewing recent results
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [resultFilter, setResultFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      fetchSessions({ status: 'PLANNED' }),
      fetchPrograms({}),
      fetchEmployees({}),
      fetchResults({}),
    ]);
  }, []);

  // Get session info
  const session = sessions.find(s => s.session_id === selectedSession);
  const program = session ? programs.find(p => p.program_code === session.program_code) : null;

  // Initialize result entries when session is selected
  useEffect(() => {
    if (session && session.attendees.length > 0) {
      const entries: ResultEntry[] = session.attendees.map(empId => {
        const emp = employees.find(e => e.employee_id === empId);
        return {
          employee_id: empId,
          employee_name: emp?.employee_name || empId,
          score: null,
          result: 'PASS' as const,
          remarks: '',
        };
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- session selection initializes entries
      setResultEntries(entries);
    } else {
      setResultEntries([]);
    }
  }, [selectedSession, session, employees]);

  // Filter recent results (debounced search)
  const filteredResults = results.filter(r => {
    const matchesSearch = debouncedSearchQuery === '' ||
      r.employee_id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      r.program_code.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesResult = resultFilter === 'all' || r.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  const handleScoreChange = (index: number, score: string) => {
    const newEntries = [...resultEntries];
    const numScore = score === '' ? null : parseInt(score);
    newEntries[index].score = numScore;
    if (program && numScore !== null) {
      newEntries[index].result = numScore >= program.passing_score ? 'PASS' : 'FAIL';
    }
    setResultEntries(newEntries);
  };

  const handleResultChange = (index: number, result: 'PASS' | 'FAIL' | 'ABSENT') => {
    const newEntries = [...resultEntries];
    newEntries[index].result = result;
    setResultEntries(newEntries);
  };

  const handleRemarksChange = (index: number, remarks: string) => {
    const newEntries = [...resultEntries];
    newEntries[index].remarks = remarks;
    setResultEntries(newEntries);
  };

  const checkForDuplicates = (resultsToCheck: ResultInput[]): DuplicateInfo[] => {
    const foundDuplicates: DuplicateInfo[] = [];
    for (const input of resultsToCheck) {
      const existing = results.find(
        (r) => r.employee_id === input.employee_id && r.program_code === input.program_code && r.training_date === input.training_date
      );
      if (existing) {
        const emp = employees.find((e) => e.employee_id === input.employee_id);
        foundDuplicates.push({
          employee_id: input.employee_id,
          employee_name: emp?.employee_name || input.employee_id,
          existingResult: {
            training_date: existing.training_date,
            score: existing.score,
            result: existing.result,
            grade: existing.grade,
          },
        });
      }
    }
    return foundDuplicates;
  };

  const saveResults = async (resultsToSave: ResultInput[]) => {
    try {
      await recordResults(resultsToSave);
      addToast({ type: 'success', title: t('messages.saveSuccess'), description: t('results.savedCount', { count: resultsToSave.length }) });
      setSelectedSession('');
      setResultEntries([]);
      setDuplicateDialogOpen(false);
      setDuplicates([]);
      setPendingResults([]);
    } catch {
      addToast({ type: 'error', title: t('messages.saveError') });
    }
  };

  const handleSaveResults = async () => {
    if (!session || !program || isSubmitting) return;
    const resultsToSave: ResultInput[] = resultEntries.map((entry) => ({
      session_id: session.session_id,
      employee_id: entry.employee_id,
      program_code: session.program_code,
      training_date: session.session_date,
      score: entry.score,
      result: entry.result,
      evaluated_by: user?.email || user?.name || 'unknown',
      remarks: entry.remarks,
    }));

    const foundDuplicates = checkForDuplicates(resultsToSave);
    if (foundDuplicates.length > 0) {
      setDuplicates(foundDuplicates);
      setPendingResults(resultsToSave);
      setDuplicateDialogOpen(true);
      return;
    }

    setIsSubmitting(true);
    try { await saveResults(resultsToSave); }
    finally { setIsSubmitting(false); }
  };

  const handleConfirmWithDuplicates = async () => {
    if (isSubmitting) return;
    const nonDuplicateResults = pendingResults.filter(
      (r) => !duplicates.some((d) => d.employee_id === r.employee_id)
    );
    if (nonDuplicateResults.length === 0) {
      addToast({ type: 'error', title: t('results.noDuplicateResults'), description: t('results.allAlreadyEntered') });
      setDuplicateDialogOpen(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await saveResults(nonDuplicateResults);
      addToast({ type: 'info', title: t('results.savedExcludingDuplicates'), description: t('results.duplicatesExcluded', { count: duplicates.length }) });
    } finally { setIsSubmitting(false); }
  };

  const handleEditResult = (result: typeof results[0]) => {
    setEditingResult({
      result_id: result.result_id,
      score: result.score,
      result: result.result,
      remarks: result.remarks || '',
      editReason: '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingResult || !editingResult.editReason || isEditSubmitting) {
      if (!editingResult?.editReason) {
        addToast({ type: 'error', title: t('messages.editReasonRequired') });
      }
      return;
    }
    setIsEditSubmitting(true);
    try {
      await updateResult(editingResult.result_id, {
        score: editingResult.score,
        result: editingResult.result,
        remarks: editingResult.remarks,
      }, editingResult.editReason);
      addToast({ type: 'success', title: t('messages.saveSuccess') });
      setEditDialogOpen(false);
      setEditingResult(null);
      fetchResults({});
    } catch {
      addToast({ type: 'error', title: t('messages.saveError') });
    } finally { setIsEditSubmitting(false); }
  };

  const getGrade = (score: number | null) => {
    if (!score || !program) return null;
    return calculateGrade(score, programThresholds(program.grade_aa, program.grade_a, program.grade_b));
  };

  if (loading.sessions || loading.programs || loading.employees) {
    return <PageLoading />;
  }

  const plannedSessions = sessions.filter(s => s.status === 'PLANNED' && s.attendees.length > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('results.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('results.pageDescription')}</p>
        </div>
      </div>

      {/* Session Selection & Result Input */}
      <Card>
        <CardHeader>
          <CardTitle>{t('results.inputTitle')}</CardTitle>
          <CardDescription>{t('results.inputDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label>{t('results.selectSession')}</Label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('results.selectSessionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {plannedSessions.length === 0 ? (
                      <SelectItem value="none" disabled>{t('results.noAvailableSession')}</SelectItem>
                    ) : (
                      plannedSessions.map((s) => (
                        <SelectItem key={s.session_id} value={s.session_id}>
                          {format(new Date(s.session_date), 'yyyy-MM-dd')} | {s.program_code} | {t('results.attendeeCount', { count: s.attendees.length })}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {session && program && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('results.programLabel')}</p>
                    <p className="font-medium">{program.program_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('results.dateLabel')}</p>
                    <p className="font-medium">{format(new Date(session.session_date), 'yyyy-MM-dd')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('results.passingScoreLabel')}</p>
                    <p className="font-medium">{t('results.passingScoreValue', { score: program.passing_score })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('results.attendeesLabel')}</p>
                    <p className="font-medium">{t('results.attendeeCount', { count: session.attendees.length })}</p>
                  </div>
                </div>
              </div>
            )}

            <ResultInputForm
              entries={resultEntries}
              program={program ?? null}
              isSubmitting={isSubmitting}
              onScoreChange={handleScoreChange}
              onResultChange={handleResultChange}
              onRemarksChange={handleRemarksChange}
              onSave={handleSaveResults}
              getGrade={getGrade}
            />

            {selectedSession && resultEntries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('results.noAttendees')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{t('results.recentTitle')}</CardTitle>
              <CardDescription>{t('results.recentDescription')}</CardDescription>
            </div>
            <ResultsToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              resultFilter={resultFilter}
              onResultFilterChange={setResultFilter}
              onExportExcel={() =>
                exportExcel(filteredResults as unknown as Record<string, unknown>[], {
                  sheetName: 'Results',
                  filename: 'training-results',
                })
              }
              onExportPDF={() =>
                exportPDF(
                  filteredResults as unknown as Record<string, unknown>[],
                  [
                    { header: t('training.date'), dataKey: 'training_date' },
                    { header: t('employee.id'), dataKey: 'employee_id' },
                    { header: t('common.program'), dataKey: 'program_code' },
                    { header: t('training.score'), dataKey: 'score' },
                    { header: t('training.grade'), dataKey: 'grade' },
                    { header: t('training.result'), dataKey: 'result' },
                  ],
                  { title: t('nav.results'), filename: 'training-results' }
                )
              }
              exporting={exporting}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ResultsTable
            results={filteredResults}
            employees={employees}
            isLoading={loading.results}
            onEditResult={handleEditResult}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ResultEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editingResult={editingResult}
        onEditingResultChange={setEditingResult}
        onSave={handleSaveEdit}
        isSubmitting={isEditSubmitting}
      />

      <DuplicateWarningDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        duplicates={duplicates}
        pendingCount={pendingResults.length}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmWithDuplicates}
      />
    </div>
  );
}
