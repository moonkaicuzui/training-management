import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InspectionPairResult, PairJudgment } from '@/types/inspection';

interface InspectionPairGridProps {
  pairs: InspectionPairResult[];
  readOnly?: boolean;
  onPairChange?: (pairNumber: number, field: 'trainee_judgment' | 'inspector_judgment', value: PairJudgment) => void;
}

export function InspectionPairGrid({ pairs, readOnly = false, onPairChange }: InspectionPairGridProps) {
  const { t } = useTranslation();

  const matchedCount = pairs.filter((p) => p.is_match).length;
  const totalPairs = pairs.length;
  const matchRate = totalPairs > 0 ? Math.round((matchedCount / totalPairs) * 100) : 0;

  const getResultColor = () => {
    if (matchRate >= 100) return 'text-green-700 bg-green-50';
    if (matchRate >= 95) return 'text-green-600 bg-green-50';
    if (matchRate >= 85) return 'text-blue-600 bg-blue-50';
    if (matchRate >= 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <p className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          {t('inspection.result.pairGuide')}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-center w-16">{t('inspection.result.pairNumber')}</th>
              <th className="px-3 py-2 text-center">{t('inspection.result.traineeJudgment')}</th>
              <th className="px-3 py-2 text-center">{t('inspection.result.inspectorJudgment')}</th>
              <th className="px-3 py-2 text-center w-20">{t('inspection.result.match')}</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair) => (
              <tr key={pair.pair_number} className="border-b hover:bg-muted/30">
                <td className="px-3 py-2 text-center font-medium">{pair.pair_number}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-center gap-2">
                    {readOnly ? (
                      <JudgmentBadge value={pair.trainee_judgment} />
                    ) : (
                      <JudgmentButtons
                        value={pair.trainee_judgment}
                        onChange={(v) => onPairChange?.(pair.pair_number, 'trainee_judgment', v)}
                      />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-center gap-2">
                    {readOnly ? (
                      <JudgmentBadge value={pair.inspector_judgment} />
                    ) : (
                      <JudgmentButtons
                        value={pair.inspector_judgment}
                        onChange={(v) => onPairChange?.(pair.pair_number, 'inspector_judgment', v)}
                      />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  {pair.is_match ? (
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Bar */}
      <div className={cn('rounded-lg px-4 py-3 flex items-center justify-between', getResultColor())}>
        <span className="font-semibold">
          {t('inspection.result.matchResult', {
            matched: matchedCount,
            total: totalPairs,
            rate: matchRate,
          })}
        </span>
        <span className="font-bold text-lg">
          {matchRate >= 80 ? t('inspection.common.pass') : t('inspection.common.fail')}
        </span>
      </div>
    </div>
  );
}

function JudgmentButtons({
  value,
  onChange,
}: {
  value: PairJudgment;
  onChange: (v: PairJudgment) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button
        type="button"
        size="sm"
        variant={value === 'PASS' ? 'default' : 'outline'}
        className={cn('h-7 px-3 text-xs', value === 'PASS' && 'bg-green-600 hover:bg-green-700')}
        onClick={() => onChange('PASS')}
      >
        PASS
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === 'FAIL' ? 'default' : 'outline'}
        className={cn('h-7 px-3 text-xs', value === 'FAIL' && 'bg-red-600 hover:bg-red-700')}
        onClick={() => onChange('FAIL')}
      >
        FAIL
      </Button>
    </div>
  );
}

function JudgmentBadge({ value }: { value: PairJudgment }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        value === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      )}
    >
      {value}
    </span>
  );
}
