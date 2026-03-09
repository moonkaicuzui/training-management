import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CheckCircle, X } from 'lucide-react';

interface Props {
  selectedCount: number;
  onBatchEnroll: () => void;
  onClearSelection: () => void;
  isEnrolling: boolean;
  /** i18n namespace prefix for labels (e.g. "aql.recommendations" or "recommendation") */
  i18nPrefix?: string;
}

export function BatchActionBar({
  selectedCount,
  onBatchEnroll,
  onClearSelection,
  isEnrolling,
  i18nPrefix = 'recommendation',
}: Props) {
  const { t } = useTranslation();

  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
        <span className="text-sm font-medium">
          {t(`${i18nPrefix}.itemsSelected`, {
            count: selectedCount,
            defaultValue: '{{count}} selected',
          })}
        </span>

        <Button
          size="sm"
          onClick={onBatchEnroll}
          disabled={isEnrolling}
        >
          <CheckCircle className="mr-1.5 h-4 w-4" />
          {isEnrolling
            ? t(`${i18nPrefix}.enrolling`, 'Enrolling...')
            : t(`${i18nPrefix}.enrollSelected`, 'Enroll Selected')}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isEnrolling}
        >
          <X className="mr-1.5 h-4 w-4" />
          {t(`${i18nPrefix}.clearSelection`, 'Clear Selection')}
        </Button>
      </div>
    </div>
  );
}
