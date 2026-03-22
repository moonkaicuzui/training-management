import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserCheck,
  AlertTriangle,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  X,
  User,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useShallow } from 'zustand/react/shallow';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useAuthStore } from '@/stores/authStore';
import { getEmployees } from '@/services/api';
import type { Employee } from '@/types';
import type { InspectionEnrollmentSource } from '@/types/inspection';

const STATUS_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock,
  SCHEDULED: Calendar,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  REASSIGNMENT_REQUIRED: ShieldAlert,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REASSIGNMENT_REQUIRED: 'bg-red-100 text-red-800',
};

export default function InspectionEnrollments() {
  const { t } = useTranslation();
  const {
    enrollments,
    isLoadingEnrollments,
    isSubmitting,
    error,
    fetchEnrollments,
    enrollEmployee,
    updateEnrollmentStatus,
    autoEnrollFromSource,
    clearError,
  } = useInspectionStore(useShallow((state) => ({
    enrollments: state.enrollments,
    isLoadingEnrollments: state.isLoadingEnrollments,
    isSubmitting: state.isSubmitting,
    error: state.error,
    fetchEnrollments: state.fetchEnrollments,
    enrollEmployee: state.enrollEmployee,
    updateEnrollmentStatus: state.updateEnrollmentStatus,
    autoEnrollFromSource: state.autoEnrollFromSource,
    clearError: state.clearError,
  })));
  const user = useAuthStore((s) => s.user);
  const [autoEnrollResult, setAutoEnrollResult] = useState<{ enrolled: number; skipped: number; errors: number } | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [showNewForm, setShowNewForm] = useState(false);

  // New enrollment form
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState('');

  // Employee search for enrollment form
  const [empSearch, setEmpSearch] = useState('');
  const [empResults, setEmpResults] = useState<Employee[]>([]);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [isEmpSearching, setIsEmpSearching] = useState(false);
  const empSearchRef = useRef<HTMLDivElement>(null);

  const searchEmp = useCallback(async (query: string) => {
    if (query.length < 2) { setEmpResults([]); return; }
    setIsEmpSearching(true);
    try {
      const results = await getEmployees({ search: query, status: 'ACTIVE' as const });
      setEmpResults(results.slice(0, 10));
    } catch { setEmpResults([]); }
    finally { setIsEmpSearching(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (empSearch) searchEmp(empSearch); }, 300);
    return () => clearTimeout(timer);
  }, [empSearch, searchEmp]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (empSearchRef.current && !empSearchRef.current.contains(e.target as Node)) {
        setShowEmpDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (statusFilter) filters.status = statusFilter;
    if (sourceFilter) filters.source = sourceFilter;
    fetchEnrollments(Object.keys(filters).length > 0 ? filters : undefined);
  }, [fetchEnrollments, statusFilter, sourceFilter]);

  const handleAutoEnroll = async (source: 'FIVE_PRS_RECOMMENDATION' | 'AQL_RECOMMENDATION') => {
    if (!user) return;
    try {
      const result = await autoEnrollFromSource(source, user.id);
      setAutoEnrollResult(result);
      setTimeout(() => setAutoEnrollResult(null), 5000);
    } catch {
      // Error handled in store
    }
  };

  const handleNewEnrollment = async () => {
    if (!user || !newEmployeeId || !newEmployeeName) return;
    try {
      await enrollEmployee({
        employee_id: newEmployeeId,
        employee_name: newEmployeeName,
        program_code: 'INS-001',
        source: 'MANUAL' as InspectionEnrollmentSource,
        enrolled_by: user.id,
        scheduled_date: newScheduledDate || undefined,
      });
      setShowNewForm(false);
      setNewEmployeeId('');
      setNewEmployeeName('');
      setNewScheduledDate('');
    } catch {
      // Error handled in store
    }
  };

  return (
    <main className="space-y-6" aria-label={t('inspection.enrollments.title')}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCheck className="h-6 w-6" aria-hidden="true" />
          {t('inspection.enrollments.title')}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleAutoEnroll('FIVE_PRS_RECOMMENDATION')} disabled={isSubmitting}>
            {t('inspection.enrollments.autoEnroll5PRS')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAutoEnroll('AQL_RECOMMENDATION')} disabled={isSubmitting}>
            {t('inspection.enrollments.autoEnrollAQL')}
          </Button>
          <Button onClick={() => setShowNewForm(!showNewForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('inspection.enrollments.newEnrollment')}
          </Button>
        </div>
      </div>

      {/* Auto-enroll result notification */}
      {autoEnrollResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              {t('inspection.enrollments.autoEnrollResult', {
                enrolled: autoEnrollResult.enrolled,
                skipped: autoEnrollResult.skipped,
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError}>
              {t('common.dismiss')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Enrollment Form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t('inspection.enrollments.newEnrollment')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t('inspection.common.employee')}</Label>
                {newEmployeeId ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{newEmployeeName}</span>
                    <span className="text-sm text-muted-foreground">({newEmployeeId})</span>
                    <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => { setNewEmployeeId(''); setNewEmployeeName(''); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative" ref={empSearchRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={empSearch}
                        onChange={(e) => { setEmpSearch(e.target.value); setShowEmpDropdown(true); }}
                        onFocus={() => empSearch.length >= 2 && setShowEmpDropdown(true)}
                        placeholder={t('inspection.result.selectEmployee')}
                        className="pl-9"
                      />
                      {isEmpSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-b-2 border-primary rounded-full" />
                        </div>
                      )}
                    </div>
                    {showEmpDropdown && empSearch.length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {empResults.length === 0 && !isEmpSearching ? (
                          <p className="p-3 text-sm text-muted-foreground text-center">
                            {t('inspection.result.noEmployeeFound')}
                          </p>
                        ) : (
                          empResults.map((emp) => (
                            <button
                              key={emp.employee_id}
                              className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-2 border-b last:border-b-0"
                              onClick={() => {
                                setNewEmployeeId(emp.employee_id);
                                setNewEmployeeName(emp.employee_name);
                                setEmpSearch('');
                                setShowEmpDropdown(false);
                              }}
                            >
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="font-medium text-sm">{emp.employee_name}</p>
                                <p className="text-xs text-muted-foreground">{emp.employee_id} · {emp.department} · {emp.position}</p>
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
                <Label>{t('inspection.enrollments.scheduledDate')}</Label>
                <Input type="date" value={newScheduledDate} onChange={(e) => setNewScheduledDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleNewEnrollment} disabled={isSubmitting || !newEmployeeId || !newEmployeeName}>
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          className="rounded-md border px-3 py-2 text-sm bg-background"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label={t('inspection.enrollments.allStatuses')}
        >
          <option value="">{t('inspection.enrollments.allStatuses')}</option>
          {['PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'REASSIGNMENT_REQUIRED'].map((s) => (
            <option key={s} value={s}>
              {t(`inspection.enrollments.statusTypes.${s}`)}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border px-3 py-2 text-sm bg-background"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label={t('inspection.enrollments.allSources')}
        >
          <option value="">{t('inspection.enrollments.allSources')}</option>
          {['FIVE_PRS_RECOMMENDATION', 'AQL_RECOMMENDATION', 'MANUAL'].map((s) => (
            <option key={s} value={s}>
              {t(`inspection.enrollments.sourceTypes.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoadingEnrollments && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
        </div>
      )}

      {/* Enrollments List */}
      {!isLoadingEnrollments && (
        <Card>
          <CardContent className="pt-6">
            {enrollments.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                <p className="text-muted-foreground">
                  {t('inspection.enrollments.noEnrollments')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('inspection.enrollments.emptyGuide')}
                </p>
                <Button variant="outline" onClick={() => setShowNewForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('inspection.enrollments.newEnrollment')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => {
                  const StatusIcon = STATUS_ICONS[enrollment.status] || Clock;
                  return (
                    <div
                      key={enrollment.enrollment_id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{enrollment.employee_name}</p>
                          <span className="text-xs text-muted-foreground">({enrollment.employee_id})</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {t('inspection.enrollments.source')}:{' '}
                            {t(`inspection.enrollments.sourceTypes.${enrollment.source}`)}
                          </span>
                          <span>
                            {t('inspection.enrollments.enrolledAt')}: {enrollment.enrolled_at.slice(0, 10)}
                          </span>
                          {enrollment.scheduled_date && (
                            <span>
                              {t('inspection.enrollments.scheduledDate')}: {enrollment.scheduled_date}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_COLORS[enrollment.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`inspection.enrollments.statusTypes.${enrollment.status}`)}
                        </Badge>
                        {enrollment.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateEnrollmentStatus(enrollment.enrollment_id, 'SCHEDULED')}
                            >
                              {t('inspection.enrollments.schedule')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateEnrollmentStatus(enrollment.enrollment_id, 'CANCELLED')}
                            >
                              {t('inspection.enrollments.cancel')}
                            </Button>
                          </div>
                        )}
                        {enrollment.status === 'SCHEDULED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateEnrollmentStatus(enrollment.enrollment_id, 'CANCELLED')}
                          >
                            {t('inspection.enrollments.cancel')}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
