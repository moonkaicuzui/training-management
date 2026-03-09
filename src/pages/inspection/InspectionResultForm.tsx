import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  User,
  FileText,
  Grid3X3,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InspectionPairGrid } from '@/components/inspection/InspectionPairGrid';
import { InspectionStrikeIndicator } from '@/components/inspection/InspectionStrikeIndicator';
import { useShallow } from 'zustand/react/shallow';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useAuthStore } from '@/stores/authStore';
import { getEmployees } from '@/services/api';
import type { Employee } from '@/types';
import type { InspectionPairResult, PairJudgment } from '@/types/inspection';

const TOTAL_PAIRS = 20;
const CARTON_COUNT = 2;

function createEmptyPairs(): InspectionPairResult[] {
  return Array.from({ length: TOTAL_PAIRS }, (_, i) => ({
    pair_number: i + 1,
    trainee_judgment: 'PASS' as PairJudgment,
    inspector_judgment: 'PASS' as PairJudgment,
    is_match: true,
  }));
}

export default function InspectionResultForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { submitResult, checkStrikes, isSubmitting, error, clearError } = useInspectionStore(useShallow((state) => ({
    submitResult: state.submitResult,
    checkStrikes: state.checkStrikes,
    isSubmitting: state.isSubmitting,
    error: state.error,
    clearError: state.clearError,
  })));
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(1);

  // Step 1: Employee
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeResults, setEmployeeResults] = useState<Employee[]>([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [enrollmentId, setEnrollmentId] = useState('');

  // Employee search with debounce
  const searchEmployees = useCallback(async (query: string) => {
    if (query.length < 2) {
      setEmployeeResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await getEmployees({ search: query, status: 'ACTIVE' as const });
      setEmployeeResults(results.slice(0, 10));
    } catch {
      setEmployeeResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (employeeSearch) searchEmployees(employeeSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearch, searchEmployees]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectEmployee = (emp: Employee) => {
    setEmployeeId(emp.employee_id);
    setEmployeeName(emp.employee_name);
    setEmployeeSearch('');
    setShowEmployeeDropdown(false);
  };

  const clearEmployee = () => {
    setEmployeeId('');
    setEmployeeName('');
  };

  // Step 2: Inspection info
  const [inspectorId, setInspectorId] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [location, setLocation] = useState('AQL Room');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Step 3: Pairs
  const [pairs, setPairs] = useState<InspectionPairResult[]>(createEmptyPairs());

  // Step 4: Result preview
  const [strikeInfo, setStrikeInfo] = useState<{ consecutive_failures: number; requires_reassignment: boolean } | null>(null);
  const [showReassignmentDialog, setShowReassignmentDialog] = useState(false);

  const matchedCount = useMemo(() => pairs.filter((p) => p.is_match).length, [pairs]);
  const matchRate = Math.round((matchedCount / TOTAL_PAIRS) * 100);
  const result = matchRate >= 80 ? 'PASS' : 'FAIL';
  const grade = matchRate >= 100 ? 'AA' : matchRate >= 95 ? 'A' : matchRate >= 85 ? 'B' : 'C';

  const handlePairChange = (pairNumber: number, field: 'trainee_judgment' | 'inspector_judgment', value: PairJudgment) => {
    setPairs((prev) =>
      prev.map((p) => {
        if (p.pair_number !== pairNumber) return p;
        const updated = { ...p, [field]: value };
        updated.is_match = updated.trainee_judgment === updated.inspector_judgment;
        return updated;
      })
    );
  };

  const canProceedStep1 = employeeId.trim() !== '';
  const canProceedStep2 = inspectorId.trim() !== '' && inspectorName.trim() !== '' && trainerName.trim() !== '';

  const handleGoToStep4 = async () => {
    setStep(4);
    try {
      const info = await checkStrikes(employeeId);
      setStrikeInfo(info);
      if (result === 'FAIL' && info.consecutive_failures >= 2) {
        setShowReassignmentDialog(true);
      }
    } catch {
      // Strike check failed, proceed without
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    clearError();

    try {
      await submitResult(
        {
          employee_id: employeeId,
          program_code: 'INS-001',
          training_date: inspectionDate,
          inspector_id: inspectorId,
          inspector_name: inspectorName,
          trainer_name: trainerName,
          carton_count: CARTON_COUNT,
          total_pairs: TOTAL_PAIRS,
          pairs,
          location,
          notes,
          enrollment_id: enrollmentId || undefined,
        },
        user.id
      );
      navigate('/inspection/dashboard');
    } catch {
      // Error is set in store
    }
  };

  const STEPS = [
    { num: 1, label: t('inspection.result.step1'), icon: User },
    { num: 2, label: t('inspection.result.step2'), icon: FileText },
    { num: 3, label: t('inspection.result.step3'), icon: Grid3X3 },
    { num: 4, label: t('inspection.result.step4'), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6" aria-label={t('common.aria.inspectionForm')}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
          {t('inspection.result.title')}
        </h1>
      </div>

      {/* Step Indicator */}
      <nav aria-label={t('common.aria.stepIndicator', { current: step, total: 4 })}>
      <div className="flex items-center gap-2">
        {STEPS.map(({ num, label, icon: Icon }) => (
          <div key={num} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                step === num
                  ? 'bg-primary text-primary-foreground'
                  : step > num
                  ? 'bg-green-100 text-green-800'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{num}</span>
            </div>
            {num < 4 && <div className="w-4 h-0.5 bg-muted" />}
          </div>
        ))}
      </div>
      </nav>

      {/* Error */}
      {error && (
        <Card className="border-destructive bg-destructive/10" role="alert">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Select Employee */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('inspection.result.step1')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('inspection.common.employee')}</Label>
              {employeeId ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{employeeName}</span>
                  <span className="text-sm text-muted-foreground">({employeeId})</span>
                  <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={clearEmployee} aria-label={t('common.aria.clearEmployee')}>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setShowEmployeeDropdown(true);
                      }}
                      onFocus={() => employeeSearch.length >= 2 && setShowEmployeeDropdown(true)}
                      placeholder={t('inspection.result.selectEmployee')}
                      className="pl-9"
                      aria-label={t('common.aria.searchEmployee')}
                      role="combobox"
                      aria-expanded={showEmployeeDropdown && employeeSearch.length >= 2}
                      aria-autocomplete="list"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-b-2 border-primary rounded-full" />
                      </div>
                    )}
                  </div>
                  {showEmployeeDropdown && employeeSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto" role="listbox">
                      {employeeResults.length === 0 && !isSearching ? (
                        <p className="p-3 text-sm text-muted-foreground text-center">
                          {t('inspection.result.noEmployeeFound')}
                        </p>
                      ) : (
                        employeeResults.map((emp) => (
                          <button
                            key={emp.employee_id}
                            className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-2 border-b last:border-b-0"
                            onClick={() => selectEmployee(emp)}
                            role="option"
                          >
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{emp.employee_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {emp.employee_id} · {emp.department} · {emp.position}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label>Enrollment ID ({t('common.optional')})</Label>
              <Input
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                placeholder="ENR-..."
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                {t('common.next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Inspection Info */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('inspection.result.step2')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t('inspection.result.inspectorId')}</Label>
                <Input value={inspectorId} onChange={(e) => setInspectorId(e.target.value)} />
              </div>
              <div>
                <Label>{t('inspection.result.inspectorName')}</Label>
                <Input value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} />
              </div>
              <div>
                <Label>{t('inspection.result.trainerName')}</Label>
                <Input value={trainerName} onChange={(e) => setTrainerName(e.target.value)} />
              </div>
              <div>
                <Label>{t('inspection.result.location')}</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <Label>{t('inspection.result.inspectionDate')}</Label>
                <Input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} />
              </div>
              <div>
                <Label>{t('inspection.result.notes')}</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t('common.back')}
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                {t('common.next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: 20-Pair Comparison */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('inspection.result.step3')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InspectionPairGrid pairs={pairs} onPairChange={handlePairChange} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                {t('common.back')}
              </Button>
              <Button onClick={handleGoToStep4}>
                {t('common.next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('inspection.result.step4')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('inspection.common.employee')}</p>
                <p className="font-semibold">{employeeName || employeeId}</p>
                {employeeName && <p className="text-xs text-muted-foreground">{employeeId}</p>}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inspection.result.inspectorName')}</p>
                <p className="font-semibold">{inspectorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inspection.common.date')}</p>
                <p className="font-semibold">{inspectionDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inspection.result.location')}</p>
                <p className="font-semibold">{location}</p>
              </div>
            </div>

            {/* Result Summary */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">{t('inspection.result.autoResult')}</p>
                <Badge variant={result === 'PASS' ? 'default' : 'destructive'} className="text-lg px-4 py-1">
                  {result === 'PASS' ? t('inspection.common.pass') : t('inspection.common.fail')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inspection.common.matchRate')}</p>
                <p className="text-2xl font-bold">{matchRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inspection.result.grade')}</p>
                <p className="text-2xl font-bold">{grade}</p>
              </div>
            </div>

            {/* Strike Warning */}
            {strikeInfo && strikeInfo.consecutive_failures > 0 && (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <InspectionStrikeIndicator
                  consecutiveFailures={result === 'FAIL' ? strikeInfo.consecutive_failures + 1 : 0}
                />
              </div>
            )}

            {/* Reassignment Dialog */}
            {showReassignmentDialog && strikeInfo && strikeInfo.consecutive_failures + 1 >= 3 && result === 'FAIL' && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-300">
                <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t('inspection.strike.reassignmentDialog.title')}
                </h3>
                <p className="text-sm text-red-700">{t('inspection.strike.reassignmentDialog.message')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowReassignmentDialog(false)}
                >
                  {t('inspection.strike.reassignmentDialog.confirm')}
                </Button>
              </div>
            )}

            {/* Pair Grid (read-only) */}
            <InspectionPairGrid pairs={pairs} readOnly />

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                {t('common.back')}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t('inspection.result.submitting') : t('inspection.result.submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
