/**
 * 상세 입력 모드 - FAIL 시 상세 사유 입력을 위한 3단계 마법사
 */
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Employee } from '@/types';
import type { MDFormData } from './md-input-constants';
import { FACTORIES, STEPS } from './md-input-constants';
import MDLineSelector from './MDLineSelector';
import MDInspectorSelector from './MDInspectorSelector';
import MDFailureDetails from './MDFailureDetails';

interface MDDetailedWizardProps {
  formData: MDFormData;
  updateField: <K extends keyof MDFormData>(key: K, value: MDFormData[K]) => void;
  currentStep: number;
  setCurrentStep: (step: number | ((s: number) => number)) => void;
  availableLines: string[];
  employees: Employee[];
  employeesLoading: boolean;
  recentMachineIds: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function MDDetailedWizard({
  formData,
  updateField,
  currentStep,
  setCurrentStep,
  availableLines,
  employees,
  employeesLoading,
  recentMachineIds,
  isLoading,
  isSubmitting,
  onSubmit,
}: MDDetailedWizardProps) {
  const { t } = useTranslation();

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return formData.factory !== '' && formData.line.trim() !== '';
      case 1:
        if (formData.inspectionDate === '') return false;
        if (employees.length > 0) return formData.inspectorId !== '';
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

  return (
    <div className="space-y-4">
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
                <div className="grid grid-cols-5 gap-2">
                  {FACTORIES.map((f) => (
                    <Button
                      key={f.code}
                      variant={formData.factory === f.code ? 'default' : 'outline'}
                      className="w-full text-xs"
                      onClick={() => { updateField('factory', f.code); updateField('line', ''); }}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>
              <MDLineSelector
                factory={formData.factory}
                line={formData.line}
                availableLines={availableLines}
                placeholder="e.g. 1-1"
                onSelect={(line) => updateField('line', line)}
              />
              <div className="space-y-2">
                <Label>{t('metalDetector.machineId')} <span className="text-muted-foreground ml-1">({t('common.optional')})</span></Label>
                <Input
                  placeholder="e.g. D210103"
                  value={formData.machineId}
                  onChange={(e) => updateField('machineId', e.target.value)}
                  list="recent-machines-d"
                />
                {recentMachineIds.length > 0 && (
                  <datalist id="recent-machines-d">
                    {recentMachineIds.map((id) => <option key={id} value={id} />)}
                  </datalist>
                )}
              </div>
            </>
          )}

          {/* Step 2: Inspection Info */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label>{t('metalDetector.input.date')}</Label>
                <Input
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => updateField('inspectionDate', e.target.value)}
                />
              </div>
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
              <div className="space-y-2">
                <Label>{t('metalDetector.input.productName')} <span className="text-muted-foreground ml-1">({t('common.optional')})</span></Label>
                <Input
                  value={formData.productName}
                  onChange={(e) => updateField('productName', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 3: Result */}
          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label>{t('metalDetector.input.resultLabel')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={formData.result === 'PASS' ? 'default' : 'outline'}
                    className={formData.result === 'PASS' ? 'bg-green-600 hover:bg-green-700' : ''}
                    size="lg"
                    onClick={() => updateField('result', 'PASS')}
                  >
                    {t('metalDetector.result.pass')}
                  </Button>
                  <Button
                    variant={formData.result === 'FAIL' ? 'default' : 'outline'}
                    className={formData.result === 'FAIL' ? 'bg-red-600 hover:bg-red-700' : ''}
                    size="lg"
                    onClick={() => updateField('result', 'FAIL')}
                  >
                    {t('metalDetector.result.fail')}
                  </Button>
                </div>
              </div>

              {formData.result === 'FAIL' && (
                <MDFailureDetails
                  failureType={formData.failureType}
                  failureDescription={formData.failureDescription}
                  onTypeChange={(v) => updateField('failureType', v)}
                  onDescriptionChange={(v) => updateField('failureDescription', v)}
                />
              )}

              <div className="space-y-2">
                <Label>{t('metalDetector.input.remarks')} <span className="text-muted-foreground ml-1">({t('common.optional')})</span></Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => updateField('remarks', e.target.value)}
                  rows={2}
                />
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
          <Button disabled={!canGoNext() || isLoading || isSubmitting} onClick={onSubmit}>
            {(isLoading || isSubmitting) ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('common.saving')}</> : t('common.save')}
          </Button>
        )}
      </div>
    </div>
  );
}
