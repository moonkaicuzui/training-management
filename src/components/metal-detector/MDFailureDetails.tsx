/**
 * FAIL 시 상세 사유 입력 섹션
 * - 빠른 입력 / 상세 입력 모드 양쪽에서 재사용
 */
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MDFailureDetailsProps {
  failureType: string;
  failureDescription: string;
  onTypeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  /** compact 모드: 빠른 입력에서 grid-cols-2 레이아웃 */
  compact?: boolean;
}

export default function MDFailureDetails({
  failureType,
  failureDescription,
  onTypeChange,
  onDescriptionChange,
  compact = false,
}: MDFailureDetailsProps) {
  const { t } = useTranslation();

  const typeSelect = (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <Label className={compact ? 'text-xs' : undefined}>{t('metalDetector.input.failureType')}</Label>
      <Select value={failureType} onValueChange={onTypeChange}>
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
  );

  const descTextarea = (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <Label className={compact ? 'text-xs' : undefined}>{t('metalDetector.input.failureDesc')}</Label>
      <Textarea
        value={failureDescription}
        onChange={(e) => onDescriptionChange(e.target.value)}
        rows={compact ? 2 : 3}
      />
    </div>
  );

  return (
    <div className="space-y-3 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
      <h4 className="font-medium text-red-700 dark:text-red-400 text-sm">
        {t('metalDetector.input.failureDetails')}
      </h4>
      {compact ? (
        <div className="grid grid-cols-2 gap-3">
          {typeSelect}
          {descTextarea}
        </div>
      ) : (
        <>
          {typeSelect}
          {descTextarea}
        </>
      )}
    </div>
  );
}
