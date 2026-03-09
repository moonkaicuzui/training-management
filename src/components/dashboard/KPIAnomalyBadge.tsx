/**
 * KPI Anomaly Badge
 *
 * Small badge component that appears on KPI cards when an anomaly
 * is detected for that metric. Shows severity-colored icon with
 * a tooltip explaining the deviation.
 *
 * - WARNING: amber/yellow styling
 * - CRITICAL: red styling
 * - Positive deviations (good anomalies) use green accent
 */

import { memo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { KPIAnomaly } from '@/utils/kpiAnomalyDetector';

interface KPIAnomalyBadgeProps {
  anomaly?: KPIAnomaly;
}

export const KPIAnomalyBadge = memo(function KPIAnomalyBadge({ anomaly }: KPIAnomalyBadgeProps) {
  if (!anomaly) return null;

  const { severity, direction, isPositive, deviation, fieldLabel, currentValue, mean } = anomaly;

  // Determine styling based on severity and positivity
  const isCritical = severity === 'CRITICAL';

  // For positive anomalies (good deviations), use green-ish styling
  // For negative anomalies (bad deviations), use warning/destructive styling
  const colorClasses = isPositive
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : isCritical
      ? 'text-destructive bg-destructive/10 border-destructive/30'
      : 'text-amber-600 bg-amber-50 border-amber-200';

  const DirectionIcon = direction === 'UP' ? TrendingUp : TrendingDown;

  // Build tooltip content
  const deviationText = Number.isFinite(deviation)
    ? `${deviation.toFixed(1)} std dev`
    : 'significant change';

  const tooltipText = [
    `${fieldLabel}: ${severity}`,
    `Current: ${typeof currentValue === 'number' && currentValue % 1 === 0 ? currentValue : currentValue.toFixed(1)}`,
    `Average: ${typeof mean === 'number' && mean % 1 === 0 ? mean : mean.toFixed(1)}`,
    `Deviation: ${deviationText} ${direction.toLowerCase()}`,
    isPositive ? 'Positive trend' : 'Needs attention',
  ].join('\n');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`
              inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5
              text-xs font-medium cursor-help transition-colors
              ${colorClasses}
            `}
            role="status"
            aria-label={`${severity} anomaly detected for ${fieldLabel}`}
          >
            {!isPositive && (
              <AlertTriangle className="h-3 w-3 shrink-0" />
            )}
            <DirectionIcon className="h-3 w-3 shrink-0" />
            <span className="sr-only">
              {severity} anomaly: {fieldLabel}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
