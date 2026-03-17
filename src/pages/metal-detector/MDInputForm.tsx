/**
 * Metal Detector Input Form
 * 두 가지 모드: 빠른 입력 (Quick) + 상세 입력 (Detailed 3-Step Wizard)
 *
 * 빠른 입력: 한 화면에 모든 필드, 기본값 PASS, 연속 입력 최적화
 * 상세 입력: FAIL 시 상세 사유 입력을 위한 3단계 마법사
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, AlertCircle, Zap, ClipboardList } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMDInspectionStore } from '@/stores/mdInspectionStore';
import { useAuthStore } from '@/stores/authStore';
import { fetchHREmployees } from '@/services/hrIntegrationService';
import type { HREmployeeRecord } from '@/services/hrIntegrationService';
import type { FactoryCode, InspectionResult } from '@/types/metalDetector';
import { logger } from '@/utils/logger';

const FACTORIES: FactoryCode[] = ['A', 'B', 'C', 'D'];
const STEPS = ['factory', 'info', 'result'] as const;
const SESSION_KEY = 'md_quick_entry_session';

interface FormData {
  factory: FactoryCode | '';
  line: string;
  machineId: string;
  inspectionDate: string;
  inspectorId: string;
  inspectorName: string;
  productName: string;
  result: InspectionResult | '';
  remarks: string;
  failureType: string;
  failureDescription: string;
}

/** localStorage에서 세션 데이터 복원 (공장, 날짜, 검사자) */
function loadSession(): Partial<FormData> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    // 날짜가 오늘인 경우만 복원
    if (data.inspectionDate === new Date().toISOString().split('T')[0]) {
      return data;
    }
    return {};
  } catch {
    return {};
  }
}

function saveSession(data: Partial<FormData>) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      factory: data.factory,
      inspectionDate: data.inspectionDate,
      inspectorId: data.inspectorId,
      inspectorName: data.inspectorName,
    }));
  } catch { /* ignore */ }
}

export default function MDInputForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { inspections, createInspection, createFailure, isLoading, error, fetchInspections } =
    useMDInspectionStore(useShallow((state) => ({
      inspections: state.inspections,
      createInspection: state.createInspection,
      createFailure: state.createFailure,
      isLoading: state.isLoading,
      error: state.error,
      fetchInspections: state.fetchInspections,
    })));
  const user = useAuthStore((s) => s.user);

  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [currentStep, setCurrentStep] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [lastSubmitted, setLastSubmitted] = useState<{ line: string; machineId: string; result: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HR V2 직원 목록
  const [hrEmployees, setHrEmployees] = useState<HREmployeeRecord[]>([]);
  const [hrLoading, setHrLoading] = useState(false);

  // 세션 복원
  const session = useMemo(() => loadSession(), []);

  const [formData, setFormData] = useState<FormData>({
    factory: (session.factory as FactoryCode) || '',
    line: '',
    machineId: '',
    inspectionDate: session.inspectionDate || new Date().toISOString().split('T')[0],
    inspectorId: session.inspectorId || '',
    inspectorName: session.inspectorName || user?.name || '',
    productName: '',
    result: 'PASS', // 빠른 입력 기본값: PASS
    remarks: '',
    failureType: '',
    failureDescription: '',
  });

  // HR V2 직원 데이터 로드
  useEffect(() => {
    const loadHREmployees = async () => {
      setHrLoading(true);
      try {
        const now = new Date();
        const monthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december',
        ];
        const employees = await fetchHREmployees(monthNames[now.getMonth()], now.getFullYear());
        // 재직 중인 직원만 필터
        setHrEmployees(employees.filter((e) => e.is_active));
      } catch (err) {
        logger.warn('[MDInputForm] HR 직원 데이터 로드 실패:', err);
      } finally {
        setHrLoading(false);
      }
    };
    loadHREmployees();
  }, []);

  // 검사자 검색 필터
  const [inspectorSearch, setInspectorSearch] = useState('');

  const filteredEmployees = useMemo(() => {
    if (!inspectorSearch.trim()) return hrEmployees.slice(0, 50); // 초기 50명
    const query = inspectorSearch.toLowerCase();
    return hrEmployees.filter(
      (e) =>
        e.employee_id.toLowerCase().includes(query) ||
        e.employee_name.toLowerCase().includes(query) ||
        e.team.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [hrEmployees, inspectorSearch]);

  // 최근 장비 ID 목록 (자동완성용)
  const recentMachineIds = useMemo(() => {
    const ids = new Set<string>();
    inspections.forEach((i) => {
      if (i.machineId) ids.add(i.machineId);
    });
    return Array.from(ids).sort();
  }, [inspections]);

  // 해당 공장의 최근 라인 목록
  const recentLines = useMemo(() => {
    const lines = new Set<string>();
    inspections
      .filter((i) => i.factory === formData.factory)
      .forEach((i) => lines.add(i.line));
    return Array.from(lines).sort();
  }, [inspections, formData.factory]);

  // 오늘 입력 건수 계산
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const count = inspections.filter((i) => i.inspectionDate === today).length;
    setTodayCount(count);
  }, [inspections]);

  // 초기 데이터 로드 (최근 장비 목록용)
  useEffect(() => {
    fetchInspections({ year: new Date().getFullYear() });
  }, [fetchInspections]);

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 검사자 선택 핸들러
  const handleInspectorSelect = useCallback((employeeId: string) => {
    const employee = hrEmployees.find((e) => e.employee_id === employeeId);
    if (employee) {
      setFormData((prev) => ({
        ...prev,
        inspectorId: employee.employee_id,
        inspectorName: employee.employee_name,
      }));
    }
  }, [hrEmployees]);

  // ============ 제출 로직 ============

  const canSubmitQuick = () => {
    if (!formData.factory || !formData.line.trim() || !formData.result) return false;
    // HR 데이터 있으면 inspectorId 필수, 없으면 inspectorName으로 폴백
    if (hrEmployees.length > 0 && !formData.inspectorId) return false;
    if (hrEmployees.length === 0 && !formData.inspectorName.trim()) return false;
    if (formData.result === 'FAIL' && (!formData.failureType || !formData.failureDescription.trim())) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.factory || !formData.result || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const inspection = await createInspection({
        factory: formData.factory as FactoryCode,
        line: formData.line,
        machineId: formData.machineId.trim() || undefined,
        inspectionDate: formData.inspectionDate,
        result: formData.result as InspectionResult,
        inspectorName: formData.inspectorName,
        inspectorId: formData.inspectorId || user?.id,
        productName: formData.productName || undefined,
        remarks: formData.remarks || undefined,
      });

      if (formData.result === 'FAIL') {
        await createFailure({
          inspectionId: inspection.id,
          factory: formData.factory as FactoryCode,
          line: formData.line,
          failureDate: formData.inspectionDate,
          failureType: formData.failureType,
          description: formData.failureDescription,
          caStatus: 'pending',
        });
      }

      // 세션 저장 (공장, 날짜, 검사자 유지)
      saveSession(formData);

      // 결과 표시
      setLastSubmitted({
        line: formData.line,
        machineId: formData.machineId,
        result: formData.result as string,
      });
      setTodayCount((c) => c + 1);

      if (mode === 'quick') {
        // 빠른 입력: 장비별 필드만 초기화, 공장/날짜/검사자 유지
        setFormData((prev) => ({
          ...prev,
          line: '',
          machineId: '',
          result: 'PASS',
          remarks: '',
          failureType: '',
          failureDescription: '',
        }));

        // 3초 후 성공 메시지 숨기기
        setTimeout(() => setLastSubmitted(null), 3000);
      } else {
        // 상세 입력: 기존 동작
        setFormData((prev) => ({
          ...prev,
          line: '',
          machineId: '',
          result: '',
          remarks: '',
          failureType: '',
          failureDescription: '',
        }));
        setCurrentStep(0);
      }
    } catch {
      // Error handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ 상세 입력 네비게이션 ============

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return formData.factory !== '' && formData.line.trim() !== '';
      case 1:
        if (formData.inspectionDate === '') return false;
        if (hrEmployees.length > 0) return formData.inspectorId !== '';
        return formData.inspectorName.trim() !== '';
      case 2:
        if (formData.result === '') return false;
        if (formData.result === 'FAIL') {
          return formData.failureType.trim() !== '' && formData.failureDescription.trim() !== '';
        }
        return true;
      default:
        return false;
    }
  };

  // ============ 검사자 선택 UI ============

  const renderInspectorSelector = (id: string) => (
    <div className="space-y-2">
      <Label>{t('metalDetector.input.inspectorId')}</Label>
      {hrLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : hrEmployees.length > 0 ? (
        <>
          <Input
            placeholder={t('metalDetector.input.inspectorSearch')}
            value={inspectorSearch}
            onChange={(e) => setInspectorSearch(e.target.value)}
            className="mb-1"
          />
          <Select
            value={formData.inspectorId}
            onValueChange={handleInspectorSelect}
          >
            <SelectTrigger id={id}>
              <SelectValue placeholder={t('metalDetector.input.selectInspector')} />
            </SelectTrigger>
            <SelectContent>
              {filteredEmployees.map((emp) => (
                <SelectItem key={emp.employee_id} value={emp.employee_id}>
                  {emp.employee_id} - {emp.employee_name} ({emp.team})
                </SelectItem>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {t('common.noResults')}
                </div>
              )}
            </SelectContent>
          </Select>
          {formData.inspectorId && (
            <p className="text-xs text-muted-foreground">
              {t('metalDetector.input.selectedInspector')}: {formData.inspectorId} - {formData.inspectorName}
            </p>
          )}
        </>
      ) : (
        <Input
          value={formData.inspectorName}
          onChange={(e) => updateField('inspectorName', e.target.value)}
          placeholder={t('metalDetector.input.inspectorNameFallback')}
        />
      )}
    </div>
  );

  // ============ 렌더링 ============

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header + 오늘 입력 카운터 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('metalDetector.input.title')}</h1>
          <p className="text-muted-foreground">{t('metalDetector.input.description')}</p>
        </div>
        <Badge variant="secondary" className="text-base px-3 py-1">
          {t('metalDetector.quickEntry.todayCount', { count: todayCount })}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 성공 토스트 (빠른 입력 모드) */}
      {lastSubmitted && mode === 'quick' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {lastSubmitted.machineId || lastSubmitted.line} — {lastSubmitted.result === 'PASS' ? t('metalDetector.result.pass') : t('metalDetector.result.fail')} {t('metalDetector.quickEntry.saved')}
          </AlertDescription>
        </Alert>
      )}

      {/* 모드 선택 탭 */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'quick' | 'detailed')}>
        <TabsList className="w-full">
          <TabsTrigger value="quick" className="flex-1 gap-2">
            <Zap className="h-4 w-4" />
            {t('metalDetector.quickEntry.title')}
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex-1 gap-2">
            <ClipboardList className="h-4 w-4" />
            {t('metalDetector.quickEntry.detailedTitle')}
          </TabsTrigger>
        </TabsList>

        {/* ===== 빠른 입력 모드 ===== */}
        <TabsContent value="quick" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Row 1: 공장 + 날짜 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('metalDetector.factory.label')}</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {FACTORIES.map((f) => (
                      <Button
                        key={f}
                        variant={formData.factory === f ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => updateField('factory', f)}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('metalDetector.input.date')}</Label>
                  <Input
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => updateField('inspectionDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: 라인 + 장비 ID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('metalDetector.line')}</Label>
                  <Input
                    placeholder={formData.factory ? `${formData.factory}-1` : 'A-1'}
                    value={formData.line}
                    onChange={(e) => updateField('line', e.target.value)}
                    list="recent-lines"
                  />
                  {recentLines.length > 0 && (
                    <datalist id="recent-lines">
                      {recentLines.map((l) => <option key={l} value={l} />)}
                    </datalist>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t('metalDetector.machineId')}</Label>
                  <Input
                    placeholder="D210103"
                    value={formData.machineId}
                    onChange={(e) => updateField('machineId', e.target.value)}
                    list="recent-machines"
                  />
                  {recentMachineIds.length > 0 && (
                    <datalist id="recent-machines">
                      {recentMachineIds.map((id) => <option key={id} value={id} />)}
                    </datalist>
                  )}
                </div>
              </div>

              {/* Row 3: 검사자 ID (HR V2 연동) */}
              {renderInspectorSelector('quick-inspector')}

              {/* Row 4: 결과 (크게) + 제출 */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="mb-2 block">{t('metalDetector.input.resultLabel')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={formData.result === 'PASS' ? 'default' : 'outline'}
                      className={formData.result === 'PASS' ? 'bg-green-600 hover:bg-green-700 h-12 text-lg' : 'h-12 text-lg'}
                      onClick={() => updateField('result', 'PASS')}
                    >
                      PASS
                    </Button>
                    <Button
                      type="button"
                      variant={formData.result === 'FAIL' ? 'default' : 'outline'}
                      className={formData.result === 'FAIL' ? 'bg-red-600 hover:bg-red-700 h-12 text-lg' : 'h-12 text-lg'}
                      onClick={() => updateField('result', 'FAIL')}
                    >
                      FAIL
                    </Button>
                  </div>
                </div>
                <Button
                  className="h-12 px-8 text-lg"
                  disabled={!canSubmitQuick() || isLoading || isSubmitting}
                  onClick={handleSubmit}
                >
                  {(isLoading || isSubmitting) ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </div>

              {/* FAIL 상세 (빠른 입력에서도) */}
              {formData.result === 'FAIL' && (
                <div className="space-y-3 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <h4 className="font-medium text-red-700 dark:text-red-400 text-sm">
                    {t('metalDetector.input.failureDetails')}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('metalDetector.input.failureType')}</Label>
                      <Select value={formData.failureType} onValueChange={(v) => updateField('failureType', v)}>
                        <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sensitivity_drift">{t('metalDetector.failureTypes.sensitivityDrift')}</SelectItem>
                          <SelectItem value="equipment_malfunction">{t('metalDetector.failureTypes.equipmentMalfunction')}</SelectItem>
                          <SelectItem value="calibration_error">{t('metalDetector.failureTypes.calibrationError')}</SelectItem>
                          <SelectItem value="foreign_object">{t('metalDetector.failureTypes.foreignObject')}</SelectItem>
                          <SelectItem value="other">{t('metalDetector.failureTypes.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('metalDetector.input.failureDesc')}</Label>
                      <Textarea
                        value={formData.failureDescription}
                        onChange={(e) => updateField('failureDescription', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 빠른 입력 팁 */}
          <p className="text-xs text-muted-foreground text-center">
            {t('metalDetector.quickEntry.tip')}
          </p>
        </TabsContent>

        {/* ===== 상세 입력 모드 (3단계 마법사) ===== */}
        <TabsContent value="detailed" className="space-y-4 mt-4">
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                  idx === currentStep ? 'bg-primary text-primary-foreground'
                    : idx < currentStep ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {idx < currentStep ? '\u2713' : idx + 1}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 mx-1 ${idx < currentStep ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t(`metalDetector.input.step${currentStep + 1}Title`)}</CardTitle>
              <CardDescription>{t(`metalDetector.input.step${currentStep + 1}Desc`)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Factory & Line */}
              {currentStep === 0 && (
                <>
                  <div className="space-y-2">
                    <Label>{t('metalDetector.factory.label')}</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {FACTORIES.map((f) => (
                        <Button key={f} variant={formData.factory === f ? 'default' : 'outline'} className="w-full" onClick={() => updateField('factory', f)}>
                          Factory {f}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('metalDetector.line')}</Label>
                    <Input placeholder={`e.g. ${formData.factory || 'A'}-1`} value={formData.line} onChange={(e) => updateField('line', e.target.value)} list="recent-lines-d" />
                    {recentLines.length > 0 && <datalist id="recent-lines-d">{recentLines.map((l) => <option key={l} value={l} />)}</datalist>}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('metalDetector.machineId')} <span className="text-muted-foreground ml-1">({t('common.optional')})</span></Label>
                    <Input placeholder="e.g. D210103" value={formData.machineId} onChange={(e) => updateField('machineId', e.target.value)} list="recent-machines-d" />
                    {recentMachineIds.length > 0 && <datalist id="recent-machines-d">{recentMachineIds.map((id) => <option key={id} value={id} />)}</datalist>}
                  </div>
                </>
              )}

              {/* Step 2: Inspection Info */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>{t('metalDetector.input.date')}</Label>
                    <Input type="date" value={formData.inspectionDate} onChange={(e) => updateField('inspectionDate', e.target.value)} />
                  </div>
                  {renderInspectorSelector('detailed-inspector')}
                  <div className="space-y-2">
                    <Label>{t('metalDetector.input.productName')} <span className="text-muted-foreground ml-1">({t('common.optional')})</span></Label>
                    <Input value={formData.productName} onChange={(e) => updateField('productName', e.target.value)} />
                  </div>
                </>
              )}

              {/* Step 3: Result */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>{t('metalDetector.input.resultLabel')}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant={formData.result === 'PASS' ? 'default' : 'outline'} className={formData.result === 'PASS' ? 'bg-green-600 hover:bg-green-700' : ''} size="lg" onClick={() => updateField('result', 'PASS')}>
                        {t('metalDetector.result.pass')}
                      </Button>
                      <Button variant={formData.result === 'FAIL' ? 'default' : 'outline'} className={formData.result === 'FAIL' ? 'bg-red-600 hover:bg-red-700' : ''} size="lg" onClick={() => updateField('result', 'FAIL')}>
                        {t('metalDetector.result.fail')}
                      </Button>
                    </div>
                  </div>

                  {formData.result === 'FAIL' && (
                    <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
                      <h4 className="font-medium text-red-700 dark:text-red-400">{t('metalDetector.input.failureDetails')}</h4>
                      <div className="space-y-2">
                        <Label>{t('metalDetector.input.failureType')}</Label>
                        <Select value={formData.failureType} onValueChange={(v) => updateField('failureType', v)}>
                          <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sensitivity_drift">{t('metalDetector.failureTypes.sensitivityDrift')}</SelectItem>
                            <SelectItem value="equipment_malfunction">{t('metalDetector.failureTypes.equipmentMalfunction')}</SelectItem>
                            <SelectItem value="calibration_error">{t('metalDetector.failureTypes.calibrationError')}</SelectItem>
                            <SelectItem value="foreign_object">{t('metalDetector.failureTypes.foreignObject')}</SelectItem>
                            <SelectItem value="other">{t('metalDetector.failureTypes.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('metalDetector.input.failureDesc')}</Label>
                        <Textarea value={formData.failureDescription} onChange={(e) => updateField('failureDescription', e.target.value)} rows={3} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t('metalDetector.input.remarks')} <span className="text-muted-foreground ml-1">({t('common.optional')})</span></Label>
                    <Textarea value={formData.remarks} onChange={(e) => updateField('remarks', e.target.value)} rows={2} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />{t('common.back')}
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button disabled={!canGoNext()} onClick={() => setCurrentStep((s) => s + 1)}>
                {t('common.next')}<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button disabled={!canGoNext() || isLoading || isSubmitting} onClick={handleSubmit}>
                {(isLoading || isSubmitting) ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('common.saving')}</> : t('common.save')}
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 하단 바로가기 */}
      <div className="flex justify-center gap-4 pt-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/equipment/metal-detector/history')}>
          {t('metalDetector.input.viewHistory')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/equipment/metal-detector')}>
          {t('metalDetector.dashboard.title')}
        </Button>
      </div>
    </div>
  );
}
