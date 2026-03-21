/**
 * 빠른 입력 모드 - 한 화면에 모든 필드, 기본값 PASS, 연속 입력 최적화
 */
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Employee } from '@/types';
import type { MDFormData } from './md-input-constants';
import { FACTORIES } from './md-input-constants';
import MDLineSelector from './MDLineSelector';
import MDInspectorSelector from './MDInspectorSelector';
import MDFailureDetails from './MDFailureDetails';

interface MDQuickEntryFormProps {
  formData: MDFormData;
  updateField: <K extends keyof MDFormData>(key: K, value: MDFormData[K]) => void;
  availableLines: string[];
  employees: Employee[];
  employeesLoading: boolean;
  recentMachineIds: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

export default function MDQuickEntryForm({
  formData,
  updateField,
  availableLines,
  employees,
  employeesLoading,
  recentMachineIds,
  isLoading,
  isSubmitting,
  canSubmit,
  onSubmit,
}: MDQuickEntryFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Row 1: 구역 + 날짜 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('metalDetector.factory.label')}</Label>
              <div className="flex flex-wrap gap-1">
                {FACTORIES.map((f) => (
                  <Button
                    key={f.code}
                    variant={formData.factory === f.code ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs px-2"
                    onClick={() => { updateField('factory', f.code); updateField('line', ''); }}
                  >
                    {f.label}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MDLineSelector
              factory={formData.factory}
              line={formData.line}
              availableLines={availableLines}
              onSelect={(line) => updateField('line', line)}
            />
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

          {/* Row 3: 검사자 ID */}
          <MDInspectorSelector
            inspectorId={formData.inspectorId}
            inspectorName={formData.inspectorName}
            employees={employees}
            employeesLoading={employeesLoading}
            onSelect={(id, name) => {
              updateField('inspectorId', id);
              updateField('inspectorName', name);
            }}
          />

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
              disabled={!canSubmit || isLoading || isSubmitting}
              onClick={onSubmit}
            >
              {(isLoading || isSubmitting) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t('common.save')
              )}
            </Button>
          </div>

          {/* FAIL 상세 */}
          {formData.result === 'FAIL' && (
            <MDFailureDetails
              failureType={formData.failureType}
              failureDescription={formData.failureDescription}
              onTypeChange={(v) => updateField('failureType', v)}
              onDescriptionChange={(v) => updateField('failureDescription', v)}
              compact
            />
          )}
        </CardContent>
      </Card>

      {/* 빠른 입력 팁 */}
      <p className="text-xs text-muted-foreground text-center">
        {t('metalDetector.quickEntry.tip')}
      </p>
    </div>
  );
}
