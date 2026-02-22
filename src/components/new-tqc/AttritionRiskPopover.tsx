import { memo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AttritionRiskResult, RiskLevel } from '@/utils/attritionRiskCalculator';
import { AttritionRiskBadge } from './AttritionRiskBadge';

interface AttritionRiskPopoverProps {
  risk: AttritionRiskResult;
  traineeName: string;
  className?: string;
}

const riskLevelLabel: Record<RiskLevel, string> = {
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
  CRITICAL: 'Critical Risk',
};

const progressColorClass: Record<RiskLevel, string> = {
  LOW: '[&>div]:bg-green-500',
  MEDIUM: '[&>div]:bg-yellow-500',
  HIGH: '[&>div]:bg-orange-500',
  CRITICAL: '[&>div]:bg-red-500',
};

function getFactorProgressColor(score: number, maxScore: number): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio === 0) return '[&>div]:bg-green-500';
  if (ratio < 0.5) return '[&>div]:bg-yellow-500';
  if (ratio < 0.8) return '[&>div]:bg-orange-500';
  return '[&>div]:bg-red-500';
}

export const AttritionRiskPopover = memo(function AttritionRiskPopover({
  risk,
  traineeName,
  className,
}: AttritionRiskPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn('cursor-pointer', className)}
          aria-label={`View attrition risk details for ${traineeName}`}
        >
          <AttritionRiskBadge level={risk.level} score={risk.totalScore} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{traineeName}</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Attrition Risk Assessment
              </span>
              <span className="text-sm font-medium">
                {risk.totalScore}/100
              </span>
            </div>
            {/* Overall progress bar */}
            <Progress
              value={risk.totalScore}
              className={cn('h-2', progressColorClass[risk.level])}
            />
            <p className="text-xs font-medium">
              {riskLevelLabel[risk.level]}
            </p>
          </div>

          {/* Separator */}
          <div className="border-t" />

          {/* Factor Breakdown */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Risk Factors
            </p>
            {risk.factors.map((factor) => (
              <div key={factor.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate mr-2">
                    {factor.name}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {factor.score}/{factor.maxScore}
                  </span>
                </div>
                <Progress
                  value={
                    factor.maxScore > 0
                      ? (factor.score / factor.maxScore) * 100
                      : 0
                  }
                  className={cn(
                    'h-1.5',
                    getFactorProgressColor(factor.score, factor.maxScore)
                  )}
                />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
