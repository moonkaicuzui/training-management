import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { AqlMonthOption } from '@/types/aql';

interface Props {
  months: AqlMonthOption[];
  selectedMonth: string;
  onSelect: (ym: string) => void;
  isLoading: boolean;
}

export function AqlMonthSelector({ months, selectedMonth, onSelect, isLoading }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Select
        value={selectedMonth}
        onValueChange={onSelect}
        disabled={isLoading || months.length === 0}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('aql.dashboard.selectMonth', 'Select Month')} />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.year_month} value={m.year_month}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
