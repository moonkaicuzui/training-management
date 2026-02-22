import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InspectionStrikeIndicatorProps {
  consecutiveFailures: number;
  showLabel?: boolean;
  className?: string;
}

export function InspectionStrikeIndicator({
  consecutiveFailures,
  showLabel = true,
  className,
}: InspectionStrikeIndicatorProps) {
  const { t } = useTranslation();

  if (consecutiveFailures === 0) return null;

  const getVariant = () => {
    if (consecutiveFailures >= 3) return 'destructive' as const;
    if (consecutiveFailures === 2) return 'secondary' as const;
    return 'outline' as const;
  };

  const getColor = () => {
    if (consecutiveFailures >= 3) return 'text-red-600';
    if (consecutiveFailures === 2) return 'text-yellow-600';
    return 'text-orange-500';
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <AlertTriangle className={cn('h-4 w-4', getColor())} />
      <Badge variant={getVariant()}>
        {t('inspection.strike.label')} {consecutiveFailures}
      </Badge>
      {showLabel && consecutiveFailures >= 3 && (
        <span className="text-xs text-red-600 font-medium">
          {t('inspection.strike.reassignmentRequired')}
        </span>
      )}
    </div>
  );
}
