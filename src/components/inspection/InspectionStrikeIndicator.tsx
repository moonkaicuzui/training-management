import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { AlertTriangle, ShieldAlert, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InspectionStrikeIndicatorProps {
  consecutiveFailures: number;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export const InspectionStrikeIndicator = memo(function InspectionStrikeIndicator({
  consecutiveFailures,
  showLabel = true,
  compact = false,
  className,
}: InspectionStrikeIndicatorProps) {
  const { t } = useTranslation();

  if (consecutiveFailures === 0) return null;

  const isThreeStrikeOut = consecutiveFailures >= 3;

  const getVariant = () => {
    if (isThreeStrikeOut) return 'destructive' as const;
    if (consecutiveFailures === 2) return 'secondary' as const;
    return 'outline' as const;
  };

  const getColor = () => {
    if (isThreeStrikeOut) return 'text-red-600';
    if (consecutiveFailures === 2) return 'text-yellow-600';
    return 'text-orange-500';
  };

  const Icon = isThreeStrikeOut ? ShieldAlert : AlertTriangle;

  // Compact mode for dashboard list items
  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        <Icon className={cn('h-3.5 w-3.5', getColor())} />
        <Badge variant={getVariant()} className="text-xs px-1.5 py-0">
          {consecutiveFailures}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <Icon className={cn('h-4 w-4', getColor())} />
      <Badge variant={getVariant()}>
        {t('inspection.strike.label')} {consecutiveFailures}
      </Badge>
      {showLabel && isThreeStrikeOut && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 border border-red-300">
          <UserX className="h-3.5 w-3.5 text-red-700" />
          <span className="text-xs text-red-700 font-bold">
            {t('inspection.strike.reassignmentRequired')}
          </span>
        </div>
      )}
    </div>
  );
});
