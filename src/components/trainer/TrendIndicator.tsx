import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { DirectiveAction } from '@/types/trainerDirective';

export default function TrendIndicator({ trend }: { trend: DirectiveAction['trend'] }) {
  const { t } = useTranslation();
  if (trend === 'increasing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <ArrowUpRight className="h-3 w-3" />
        {t('trainerDirectives.trendIncreasing', 'Worsening')}
      </span>
    );
  }
  if (trend === 'decreasing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <ArrowDownRight className="h-3 w-3" />
        {t('trainerDirectives.trendDecreasing', 'Improving')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
      <Minus className="h-3 w-3" />
      {t('trainerDirectives.trendStable', 'Stable')}
    </span>
  );
}
