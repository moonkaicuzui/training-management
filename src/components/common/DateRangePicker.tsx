import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const presets = [
    {
      label: t('dateRange.thisMonth'),
      range: { from: startOfMonth(new Date()), to: new Date() },
    },
    {
      label: t('dateRange.last30Days'),
      range: { from: subDays(new Date(), 30), to: new Date() },
    },
    {
      label: t('dateRange.last90Days'),
      range: { from: subDays(new Date(), 90), to: new Date() },
    },
    {
      label: t('dateRange.thisYear'),
      range: { from: startOfYear(new Date()), to: new Date() },
    },
  ];

  const handlePreset = (range: DateRange) => {
    onChange(range);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value
            ? `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d, yyyy')}`
            : t('dateRange.selectRange')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t('dateRange.presets')}
          </p>
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left"
              onClick={() => handlePreset(preset.range)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
