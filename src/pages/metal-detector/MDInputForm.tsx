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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Zap, ClipboardList } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMDInspectionStore } from '@/stores/mdInspectionStore';
import { useAuthStore } from '@/stores/authStore';
import { getEmployees } from '@/services/api/employeeApi';
import type { Employee } from '@/types';
import type { FactoryCode, InspectionResult } from '@/types/metalDetector';
import { logger } from '@/utils/logger';
import { getFactoryLines, extractMDFactoryLines } from '@/services/factoryLineService';

import { LOCAL_FACTORY_LINES, loadSession, saveSession } from '@/components/metal-detector/md-input-constants';
import type { MDFormData } from '@/components/metal-detector/md-input-constants';
import MDQuickEntryForm from '@/components/metal-detector/MDQuickEntryForm';
import MDDetailedWizard from '@/components/metal-detector/MDDetailedWizard';

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

  // Dynamic factory lines from Quality OS (fallback to local constants)
  const [factoryLines, setFactoryLines] = useState<Record<FactoryCode, string[]>>(LOCAL_FACTORY_LINES);

  // 직원 목록 (Q-TRAIN employees 컬렉션)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // 세션 복원
  const session = useMemo(() => loadSession(), []);

  const [formData, setFormData] = useState<MDFormData>({
    factory: (session.factory as FactoryCode) || '',
    line: '',
    machineId: '',
    inspectionDate: session.inspectionDate || new Date().toISOString().split('T')[0],
    inspectorId: session.inspectorId || '',
    inspectorName: session.inspectorName || user?.name || '',
    productName: '',
    result: 'PASS',
    remarks: '',
    failureType: '',
    failureDescription: '',
  });

  // Quality OS에서 공장/라인 동적 로드
  useEffect(() => {
    getFactoryLines().then((data) => {
      if (data) {
        const extracted = extractMDFactoryLines(data);
        if (extracted) {
          setFactoryLines((prev) => ({ ...prev, ...extracted }));
        }
      }
    }).catch((e) => {
      logger.warn('[MDInputForm] Dynamic factory lines skipped:', e);
    });
  }, []);

  // 직원 데이터 로드
  useEffect(() => {
    const loadEmployeesData = async () => {
      setEmployeesLoading(true);
      try {
        const result = await getEmployees({ status: 'ACTIVE' as Employee['status'] });
        setEmployees(result);
      } catch (err) {
        logger.warn('[MDInputForm] 직원 데이터 로드 실패:', err);
      } finally {
        setEmployeesLoading(false);
      }
    };
    loadEmployeesData();
  }, []);

  // 공장별 라인 목록
  const availableLines = useMemo(() => {
    if (!formData.factory) return [];
    return factoryLines[formData.factory as FactoryCode] || [];
  }, [formData.factory, factoryLines]);

  // 최근 장비 ID 목록 (자동완성용)
  const recentMachineIds = useMemo(() => {
    const ids = new Set<string>();
    inspections.forEach((i) => {
      if (i.machineId) ids.add(i.machineId);
    });
    return Array.from(ids).sort();
  }, [inspections]);

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

  const updateField = useCallback(<K extends keyof MDFormData>(key: K, value: MDFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── 제출 검증 ───
  const canSubmitQuick = () => {
    if (!formData.factory || !formData.line.trim() || !formData.result) return false;
    if (employees.length > 0 && !formData.inspectorId) return false;
    if (employees.length === 0 && !formData.inspectorName.trim()) return false;
    if (formData.result === 'FAIL' && (!formData.failureType || !formData.failureDescription.trim())) return false;
    return true;
  };

  // ─── 제출 로직 ───
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

      saveSession(formData);
      setLastSubmitted({ line: formData.line, machineId: formData.machineId, result: formData.result as string });
      setTodayCount((c) => c + 1);

      if (mode === 'quick') {
        setFormData((prev) => ({ ...prev, line: '', machineId: '', result: 'PASS', remarks: '', failureType: '', failureDescription: '' }));
        setTimeout(() => setLastSubmitted(null), 3000);
      } else {
        setFormData((prev) => ({ ...prev, line: '', machineId: '', result: '', remarks: '', failureType: '', failureDescription: '' }));
        setCurrentStep(0);
      }
    } catch {
      // Error handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 렌더링 ───
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

        <TabsContent value="quick" className="mt-4">
          <MDQuickEntryForm
            formData={formData}
            updateField={updateField}
            availableLines={availableLines}
            employees={employees}
            employeesLoading={employeesLoading}
            recentMachineIds={recentMachineIds}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            canSubmit={canSubmitQuick()}
            onSubmit={handleSubmit}
          />
        </TabsContent>

        <TabsContent value="detailed" className="mt-4">
          <MDDetailedWizard
            formData={formData}
            updateField={updateField}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            availableLines={availableLines}
            employees={employees}
            employeesLoading={employeesLoading}
            recentMachineIds={recentMachineIds}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
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
