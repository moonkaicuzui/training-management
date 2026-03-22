import { useTranslation } from 'react-i18next';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTH_OPTIONS = [
  { value: 'january', labelKey: 'hrSync.months.january' },
  { value: 'february', labelKey: 'hrSync.months.february' },
  { value: 'march', labelKey: 'hrSync.months.march' },
  { value: 'april', labelKey: 'hrSync.months.april' },
  { value: 'may', labelKey: 'hrSync.months.may' },
  { value: 'june', labelKey: 'hrSync.months.june' },
  { value: 'july', labelKey: 'hrSync.months.july' },
  { value: 'august', labelKey: 'hrSync.months.august' },
  { value: 'september', labelKey: 'hrSync.months.september' },
  { value: 'october', labelKey: 'hrSync.months.october' },
  { value: 'november', labelKey: 'hrSync.months.november' },
  { value: 'december', labelKey: 'hrSync.months.december' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

interface HRSyncPeriodSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  isLoading: boolean;
  isSyncing: boolean;
  onDetect: () => void;
  onSync: () => void;
}

export default function HRSyncPeriodSelector({
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  isLoading,
  isSyncing,
  onDetect,
  onSync,
}: HRSyncPeriodSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('hrSync.selectPeriod')}</CardTitle>
        <CardDescription>{t('hrSync.selectPeriodDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('hrSync.year')}</label>
            <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('hrSync.month')}</label>
            <Select value={selectedMonth} onValueChange={onMonthChange}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{t(m.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onDetect} disabled={isLoading || isSyncing} variant="outline">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            {t('hrSync.detectChanges')}
          </Button>
          <Button onClick={onSync} disabled={isLoading || isSyncing}>
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            {t('hrSync.runSync')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
