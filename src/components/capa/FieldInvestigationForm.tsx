/**
 * FieldInvestigationForm — QA 직원 현장 조사 결과 입력 폼
 *
 * CAPA Action 단계에서 각 액션 아이템에 대한 현장 조사 결과를 기록합니다.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardCheck, ImagePlus } from 'lucide-react';
import type { FieldInvestigation } from '@/types/capa';

interface FieldInvestigationInput {
  findings: string;
  quantity?: number;
  defectRate?: number;
  photos?: File[];
  notes?: string;
}

interface FieldInvestigationFormProps {
  actionItemId: string;
  actionDescription: string;
  onSubmit: (data: FieldInvestigationInput) => Promise<void>;
  onCancel: () => void;
  existingData?: FieldInvestigation;
}

export function FieldInvestigationForm({
  actionItemId,
  actionDescription,
  onSubmit,
  onCancel,
  existingData,
}: FieldInvestigationFormProps) {
  const { t } = useTranslation();

  const [findings, setFindings] = useState(existingData?.findings ?? '');
  const [quantity, setQuantity] = useState<string>(
    existingData?.quantity != null ? String(existingData.quantity) : ''
  );
  const [defectRate, setDefectRate] = useState<string>(
    existingData?.defectRate != null ? String(existingData.defectRate) : ''
  );
  const [notes, setNotes] = useState(existingData?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        findings: findings.trim(),
        quantity: quantity ? Number(quantity) : undefined,
        defectRate: defectRate ? Number(defectRate) : undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {t('capa.fieldInvestigation.title', '현장 조사 결과 입력')}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {t('capa.fieldInvestigation.relatedAction', '관련 액션')}: {actionDescription}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 조사 결과 (필수) */}
          <div className="space-y-2">
            <Label htmlFor={`findings-${actionItemId}`}>
              {t('capa.fieldInvestigation.findings', '조사 결과')} *
            </Label>
            <Textarea
              id={`findings-${actionItemId}`}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder={t(
                'capa.fieldInvestigation.findingsPlaceholder',
                '현장 조사에서 확인된 내용을 상세히 기록하세요'
              )}
              rows={4}
              required
            />
          </div>

          {/* 수량 + 불량률 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`quantity-${actionItemId}`}>
                {t('capa.fieldInvestigation.quantity', '검사/불량 수량')}
              </Label>
              <Input
                id={`quantity-${actionItemId}`}
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t('capa.fieldInvestigation.quantityPlaceholder', '수량 입력')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`defectRate-${actionItemId}`}>
                {t('capa.fieldInvestigation.defectRate', '불량률 (%)')}
              </Label>
              <Input
                id={`defectRate-${actionItemId}`}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={defectRate}
                onChange={(e) => setDefectRate(e.target.value)}
                placeholder={t('capa.fieldInvestigation.defectRatePlaceholder', '불량률 입력')}
              />
            </div>
          </div>

          {/* 사진 업로드 (placeholder) */}
          <div className="space-y-2">
            <Label>{t('capa.fieldInvestigation.photos', '사진 첨부')}</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center text-muted-foreground">
              <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {t(
                  'capa.fieldInvestigation.photosPlaceholder',
                  '사진 업로드 기능은 추후 연동 예정입니다 (MultiImageUpload)'
                )}
              </p>
            </div>
          </div>

          {/* 추가 메모 */}
          <div className="space-y-2">
            <Label htmlFor={`notes-${actionItemId}`}>
              {t('capa.fieldInvestigation.notes', '추가 메모')}
            </Label>
            <Textarea
              id={`notes-${actionItemId}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(
                'capa.fieldInvestigation.notesPlaceholder',
                '기타 특이사항이나 추가 메모를 입력하세요'
              )}
              rows={2}
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              {t('common.cancel', '취소')}
            </Button>
            <Button type="submit" disabled={submitting || !findings.trim()}>
              {submitting
                ? t('common.saving', '저장 중...')
                : t('common.save', '저장')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default FieldInvestigationForm;
