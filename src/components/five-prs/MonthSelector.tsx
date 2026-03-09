import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShallow } from 'zustand/react/shallow';
import { useFivePrsStore } from '@/stores/fivePrsStore';

export function MonthSelector() {
  const { t } = useTranslation();
  const { months, selectedMonth, isLoadingMonths } = useFivePrsStore(useShallow((state) => ({ months: state.months, selectedMonth: state.selectedMonth, isLoadingMonths: state.isLoadingMonths })));
  const fetchData = useFivePrsStore((s) => s.fetchData);

  const handleChange = (value: string) => {
    fetchData(value);
  };

  return (
    <Select
      value={selectedMonth}
      onValueChange={handleChange}
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
  );
}
