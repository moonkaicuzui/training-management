/**
 * HR V2 직원 데이터 동기화 페이지
 *
 * HR V2 Firestore에서 직원 데이터를 읽어와
 * 변경 이벤트(신입/퇴사/부서이동/건물이동)를 감지하고
 * Q-TRAIN employees 컬렉션에 동기화합니다.
 *
 * 관리자 전용 페이지 (ADMIN role)
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCcw,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { HRChangeEvent, HRSyncResult } from '@/services/api';
import {
  detectHRChanges,
  syncEmployeesFromHR,
  deactivateEmployee,
} from '@/services/api';

// ─── 상수 ─────────────────────────────────────────────

const MONTH_OPTIONS = [
  { value: 'january', labelKey: 'hrSync.months.january' },
  { value: 'february', labelKey: 'hrSync.months.february' },
  { value: 'march', labelKey: 'hrSync.months.march' },
  { value: 'april', labelKey: 'hrSync.months.april' },
  { value: 'may', labelKey: 'hrSync.months.may' },
  { value: 'june', labelKey: 'hrSync.months.june' },
  { value: 'july', labelKey: 'hrSync.months.july' },
  { value: 'august', labelKey: 'hrSync.months.august' },
  { value: 'september', labelKey: 'hrSync.months.september' },
  { value: 'october', labelKey: 'hrSync.months.october' },
  { value: 'november', labelKey: 'hrSync.months.november' },
  { value: 'december', labelKey: 'hrSync.months.december' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const MONTH_NAMES_EN = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

// ─── 헬퍼 컴포넌트 ──────────────────────────────────────

function EventIcon({ type }: { type: HRChangeEvent['type'] }) {
  switch (type) {
    case 'NEW_HIRE':
      return <UserPlus className="h-4 w-4 text-green-600" />;
    case 'RESIGNATION':
      return <UserMinus className="h-4 w-4 text-red-600" />;
    case 'DEPARTMENT_CHANGE':
      return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
    case 'BUILDING_CHANGE':
      return <Building2 className="h-4 w-4 text-orange-600" />;
  }
}

function EventBadge({ type, t }: { type: HRChangeEvent['type']; t: (key: string) => string }) {
  const variants: Record<HRChangeEvent['type'], { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
    NEW_HIRE: { variant: 'default', label: t('hrSync.eventType.newHire') },
    RESIGNATION: { variant: 'destructive', label: t('hrSync.eventType.resignation') },
    DEPARTMENT_CHANGE: { variant: 'secondary', label: t('hrSync.eventType.departmentChange') },
    BUILDING_CHANGE: { variant: 'outline', label: t('hrSync.eventType.buildingChange') },
  };
  const { variant, label } = variants[type];
  return <Badge variant={variant}>{label}</Badge>;
}

function EventDetails({ event, t }: { event: HRChangeEvent; t: (key: string) => string }) {
  switch (event.type) {
    case 'NEW_HIRE':
      return (
        <span className="text-sm text-muted-foreground">
          {t('hrSync.detail.hireDate')}: {event.details.hireDate || '-'} | {t('hrSync.detail.team')}: {event.details.team || '-'} | {t('hrSync.detail.building')}: {event.details.building || '-'}
        </span>
      );
    case 'RESIGNATION':
      return (
        <span className="text-sm text-muted-foreground">
          {t('hrSync.detail.resignDate')}: {event.details.resignDate || '-'} | {t('hrSync.detail.previousTeam')}: {event.details.previousTeam || '-'}
        </span>
      );
    case 'DEPARTMENT_CHANGE':
    case 'BUILDING_CHANGE':
      return (
        <span className="text-sm text-muted-foreground">
          {event.details.from} → {event.details.to}
        </span>
      );
  }
}

// ─── 메인 컴포넌트 ──────────────────────────────────────

export default function HRSync() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTH_NAMES_EN[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [events, setEvents] = useState<HRChangeEvent[]>([]);
  const [syncResult, setSyncResult] = useState<HRSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingIds, setDeactivatingIds] = useState<Set<string>>(new Set());

  // 변경 이벤트 감지
  const handleDetectChanges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEvents([]);
    setSyncResult(null);

    try {
      const detected = await detectHRChanges(selectedMonth, selectedYear);
      setEvents(detected);

      if (detected.length === 0) {
        toast({
          title: t('hrSync.toast.noChanges'),
          description: t('hrSync.toast.noChangesDesc'),
        });
      } else {
        toast({
          title: t('hrSync.toast.changesDetected'),
          description: t('hrSync.toast.changesDetectedDesc', { count: detected.length }),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast({
        title: t('hrSync.toast.error'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, toast, t]);

  // 동기화 실행
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncEmployeesFromHR(selectedMonth, selectedYear);
      setSyncResult(result);
      // 이벤트 목록도 갱신
      setEvents([
        ...result.newEmployees,
        ...result.resignedEmployees,
        ...result.departmentChanges,
        ...result.buildingChanges,
      ]);

      toast({
        title: t('hrSync.toast.syncComplete'),
        description: t('hrSync.toast.syncCompleteDesc', {
          total: result.totalHREmployees,
          updated: result.updatedCount,
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast({
        title: t('hrSync.toast.error'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [selectedMonth, selectedYear, toast, t]);

  // 개별 퇴사자 비활성화
  const handleDeactivate = useCallback(async (employeeId: string) => {
    setDeactivatingIds((prev) => new Set(prev).add(employeeId));
    try {
      await deactivateEmployee(employeeId);
      toast({
        title: t('hrSync.toast.deactivated'),
        description: t('hrSync.toast.deactivatedDesc', { id: employeeId }),
      });
      // 이벤트 목록에서 처리됨 표시 (해당 이벤트 제거)
      setEvents((prev) => prev.filter(
        (e) => !(e.type === 'RESIGNATION' && e.employeeId === employeeId)
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: t('hrSync.toast.error'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeactivatingIds((prev) => {
        const next = new Set(prev);
        next.delete(employeeId);
        return next;
      });
    }
  }, [toast, t]);

  // 이벤트 카운트
  const newHires = events.filter((e) => e.type === 'NEW_HIRE');
  const resignations = events.filter((e) => e.type === 'RESIGNATION');
  const deptChanges = events.filter((e) => e.type === 'DEPARTMENT_CHANGE');
  const bldgChanges = events.filter((e) => e.type === 'BUILDING_CHANGE');

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">{t('hrSync.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('hrSync.description')}</p>
      </div>

      {/* 월/년 선택 + 액션 버튼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('hrSync.selectPeriod')}</CardTitle>
          <CardDescription>{t('hrSync.selectPeriodDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('hrSync.year')}</label>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('hrSync.month')}</label>
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {t(m.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleDetectChanges}
              disabled={isLoading || isSyncing}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              {t('hrSync.detectChanges')}
            </Button>

            <Button
              onClick={handleSync}
              disabled={isLoading || isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              {t('hrSync.runSync')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 동기화 결과 요약 */}
      {syncResult && (
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 mb-3">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{t('hrSync.syncCompleteTitle')}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('hrSync.totalHR')}</span>
                <p className="font-semibold text-lg">{syncResult.totalHREmployees}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('hrSync.updated')}</span>
                <p className="font-semibold text-lg">{syncResult.updatedCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('hrSync.errorsCount')}</span>
                <p className="font-semibold text-lg">{syncResult.errors.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('hrSync.syncTime')}</span>
                <p className="font-semibold text-sm">{syncResult.syncedAt}</p>
              </div>
            </div>
            {syncResult.errors.length > 0 && (
              <div className="mt-3 p-3 bg-destructive/10 rounded text-sm text-destructive">
                {syncResult.errors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 이벤트 요약 카드 */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{t('hrSync.eventType.newHire')}</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{newHires.length}{t('hrSync.count')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <UserMinus className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">{t('hrSync.eventType.resignation')}</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{resignations.length}{t('hrSync.count')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">{t('hrSync.eventType.departmentChange')}</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{deptChanges.length}{t('hrSync.count')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">{t('hrSync.eventType.buildingChange')}</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{bldgChanges.length}{t('hrSync.count')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 이벤트 상세 테이블 */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('hrSync.eventList')}</CardTitle>
            <CardDescription>
              {t('hrSync.eventListDesc', { count: events.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>{t('hrSync.table.type')}</TableHead>
                  <TableHead>{t('hrSync.table.employeeId')}</TableHead>
                  <TableHead>{t('hrSync.table.employeeName')}</TableHead>
                  <TableHead>{t('hrSync.table.details')}</TableHead>
                  <TableHead className="text-right">{t('hrSync.table.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event, idx) => (
                  <TableRow key={`${event.type}-${event.employeeId}-${idx}`}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EventIcon type={event.type} />
                        <EventBadge type={event.type} t={t} />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{event.employeeId}</TableCell>
                    <TableCell className="font-medium">{event.employeeName}</TableCell>
                    <TableCell>
                      <EventDetails event={event} t={t} />
                    </TableCell>
                    <TableCell className="text-right">
                      {event.type === 'NEW_HIRE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/new-tqc/trainees')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {t('hrSync.action.goTQC')}
                        </Button>
                      )}
                      {event.type === 'RESIGNATION' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deactivatingIds.has(event.employeeId)}
                          onClick={() => handleDeactivate(event.employeeId)}
                        >
                          {deactivatingIds.has(event.employeeId) ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <UserMinus className="h-3 w-3 mr-1" />
                          )}
                          {t('hrSync.action.deactivate')}
                        </Button>
                      )}
                      {(event.type === 'DEPARTMENT_CHANGE' || event.type === 'BUILDING_CHANGE') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/programs')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {t('hrSync.action.checkPrograms')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 빈 상태 */}
      {!isLoading && !isSyncing && events.length === 0 && !error && !syncResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">{t('hrSync.empty.title')}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {t('hrSync.empty.description')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
