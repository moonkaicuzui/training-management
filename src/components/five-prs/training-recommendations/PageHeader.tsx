import { useTranslation } from 'react-i18next';
import { Loader2, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PageHeaderProps } from './types';

export function PageHeader({
  selectedMonth,
  months,
  isLoadingMonths,
  isLoading,
  isProcessing,
  isAnalyzing,
  onMonthChange,
  onRunAnalysis,
  onOpenSettings,
}: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('recommendation.pageTitle')}
        </h1>
        <p className="text-muted-foreground">
          {t('recommendation.pageDescription')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={selectedMonth}
          onValueChange={onMonthChange}
          disabled={isLoadingMonths || months.length === 0}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('fivePrs.monthSelect')} />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.year_month} value={m.year_month}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={onRunAnalysis}
          disabled={!selectedMonth || isProcessing || isLoading}
        >
          {isAnalyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {t('recommendation.runAnalysis')}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onOpenSettings}
          aria-label={t('recommendation.settings.title')}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
