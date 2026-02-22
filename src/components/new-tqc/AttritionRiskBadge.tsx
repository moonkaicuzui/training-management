import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/utils/attritionRiskCalculator';

interface AttritionRiskBadgeProps {
  level: RiskLevel;
  score: number;
  size?: 'sm' | 'md';
  className?: string;
}

const riskColorClasses: Record<RiskLevel, string> = {
  LOW: 'border-transparent bg-green-100 text-green-800 hover:bg-green-100/80',
  MEDIUM: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80',
  HIGH: 'border-transparent bg-orange-100 text-orange-800 hover:bg-orange-100/80',
  CRITICAL: 'border-transparent bg-red-100 text-red-800 hover:bg-red-100/80',
};

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'text-[10px] px-1.5 py-0',
  md: 'text-xs px-2.5 py-0.5',
};

export const AttritionRiskBadge = memo(function AttritionRiskBadge({
  level,
  score,
  size = 'md',
  className,
}: AttritionRiskBadgeProps) {
  return (
    <Badge
      className={cn(
        riskColorClasses[level],
        sizeClasses[size],
        className
      )}
      title={`Attrition Risk: ${level} (${score}/100)`}
    >
      {level} ({score})
    </Badge>
  );
});
