/**
 * Metal Detector Input Form
 * 4-Step Wizard: Factory/Line → Inspection Info → Sensitivity → Result
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useMDInspectionStore } from '@/stores/mdInspectionStore';
import { useAuthStore } from '@/stores/authStore';
import type { FactoryCode, InspectionResult } from '@/types/metalDetector';

const FACTORIES: FactoryCode[] = ['A', 'B', 'C', 'D'];
const STEPS = ['factory', 'info', 'sensitivity', 'result'] as const;

interface FormData {
  factory: FactoryCode | '';
  line: string;
  inspectionDate: string;
  inspectorName: string;
  productName: string;
  fe: string;
  sus: string;
  nonFe: string;
  result: InspectionResult | '';
  remarks: string;
  // Failure fields
  failureType: string;
  failureDescription: string;
}

export default function MDInputForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createInspection, createFailure, isLoading, error } = useMDInspectionStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    factory: '',
    line: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectorName: user?.name || '',
    productName: '',
    fe: '',
    sus: '',
    nonFe: '',
    result: '',
    remarks: '',
    failureType: '',
    failureDescription: '',
  });

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return formData.factory !== '' && formData.line.trim() !== '';
      case 1:
        return formData.inspectionDate !== '' && formData.inspectorName.trim() !== '';
      case 2:
        return formData.fe !== '' && formData.sus !== '' && formData.nonFe !== '';
      case 3:
        if (formData.result === '') return false;
        if (formData.result === 'FAIL') {
          return formData.failureType.trim() !== '' && formData.failureDescription.trim() !== '';
        }
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!formData.factory || !formData.result) return;

    try {
      const inspection = await createInspection({
        factory: formData.factory as FactoryCode,
        line: formData.line,
        inspectionDate: formData.inspectionDate,
        result: formData.result as InspectionResult,
        inspectorName: formData.inspectorName,
        inspectorId: user?.id,
        sensitivity: {
          fe: parseFloat(formData.fe),
          sus: parseFloat(formData.sus),
          nonFe: parseFloat(formData.nonFe),
        },
        productName: formData.productName || undefined,
        remarks: formData.remarks || undefined,
      });

      // FAIL → 자동 MDFailure 생성
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

      setSubmitted(true);
    } catch {
      // Error handled by store
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">{t('metalDetector.input.success')}</h2>
            <p className="text-muted-foreground">{t('metalDetector.input.successDesc')}</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setCurrentStep(0);
                  setFormData({
                    ...formData,
                    line: '',
                    fe: '',
                    sus: '',
                    nonFe: '',
                    result: '',
                    remarks: '',
                    failureType: '',
                    failureDescription: '',
                  });
                }}
              >
                {t('metalDetector.input.addAnother')}
              </Button>
              <Button onClick={() => navigate('/equipment/metal-detector/history')}>
                {t('metalDetector.input.viewHistory')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('metalDetector.input.title')}</h1>
        <p className="text-muted-foreground">{t('metalDetector.input.description')}</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, idx) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                idx === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : idx < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx < currentStep ? '✓' : idx + 1}
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 mx-1 ${
                  idx < currentStep ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
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
                    <Button
                      key={f}
                      variant={formData.factory === f ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => updateField('factory', f)}
                    >
                      Factory {f}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="line">{t('metalDetector.line')}</Label>
                <Input
                  id="line"
                  placeholder={`e.g. ${formData.factory || 'A'}-1`}
                  value={formData.line}
                  onChange={(e) => updateField('line', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 2: Inspection Info */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="date">{t('metalDetector.input.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => updateField('inspectionDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspector">{t('metalDetector.input.inspector')}</Label>
                <Input
                  id="inspector"
                  value={formData.inspectorName}
                  onChange={(e) => updateField('inspectorName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product">
                  {t('metalDetector.input.productName')}
                  <span className="text-muted-foreground ml-1">({t('common.optional')})</span>
                </Label>
                <Input
                  id="product"
                  value={formData.productName}
                  onChange={(e) => updateField('productName', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 3: Sensitivity */}
          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fe">{t('metalDetector.sensitivity.fe')} (mm)</Label>
                <Input
                  id="fe"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.fe}
                  onChange={(e) => updateField('fe', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sus">{t('metalDetector.sensitivity.sus')} (mm)</Label>
                <Input
                  id="sus"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.sus}
                  onChange={(e) => updateField('sus', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nonFe">{t('metalDetector.sensitivity.nonFe')} (mm)</Label>
                <Input
                  id="nonFe"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.nonFe}
                  onChange={(e) => updateField('nonFe', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 4: Result */}
          {currentStep === 3 && (
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
                <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <h4 className="font-medium text-red-700 dark:text-red-400">
                    {t('metalDetector.input.failureDetails')}
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="failureType">{t('metalDetector.input.failureType')}</Label>
                    <Select
                      value={formData.failureType}
                      onValueChange={(v) => updateField('failureType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
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
                    <Label htmlFor="failureDesc">{t('metalDetector.input.failureDesc')}</Label>
                    <Textarea
                      id="failureDesc"
                      value={formData.failureDescription}
                      onChange={(e) => updateField('failureDescription', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="remarks">
                  {t('metalDetector.input.remarks')}
                  <span className="text-muted-foreground ml-1">({t('common.optional')})</span>
                </Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => updateField('remarks', e.target.value)}
                  rows={2}
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <h4 className="font-medium">{t('metalDetector.input.summary')}</h4>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">{t('metalDetector.factory.label')}:</span>
                  <span>Factory {formData.factory}</span>
                  <span className="text-muted-foreground">{t('metalDetector.line')}:</span>
                  <span>{formData.line}</span>
                  <span className="text-muted-foreground">{t('metalDetector.input.date')}:</span>
                  <span>{formData.inspectionDate}</span>
                  <span className="text-muted-foreground">{t('metalDetector.sensitivity.fe')}:</span>
                  <span>{formData.fe} mm</span>
                  <span className="text-muted-foreground">{t('metalDetector.sensitivity.sus')}:</span>
                  <span>{formData.sus} mm</span>
                  <span className="text-muted-foreground">{t('metalDetector.sensitivity.nonFe')}:</span>
                  <span>{formData.nonFe} mm</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => s - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back')}
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button disabled={!canGoNext()} onClick={() => setCurrentStep((s) => s + 1)}>
            {t('common.next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button disabled={!canGoNext() || isLoading} onClick={handleSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
