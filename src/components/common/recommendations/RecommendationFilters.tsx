import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectConfig {
  /** Unique key for React key prop */
  key: string;
  /** Current value (undefined/null treated as ALL) */
  value: string | undefined;
  /** Placeholder text */
  placeholder: string;
  /** "All" option label */
  allLabel: string;
  /** Available options */
  options: FilterSelectOption[];
  /** onChange handler - receives raw value, ALL_VALUE mapped to undefined */
  onChange: (value: string | undefined) => void;
  /** Width class (e.g. "w-[150px]") */
  width?: string;
}

interface Props {
  selects: FilterSelectConfig[];
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  /** Gap class between items (default: "gap-2") */
  gap?: string;
}

const ALL_VALUE = '__all__';

export function RecommendationFilters({
  selects,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  gap = 'gap-2',
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-wrap items-center ${gap}`}>
      {selects.map((select) => (
        <Select
          key={select.key}
          value={select.value ?? ALL_VALUE}
          onValueChange={(val) =>
            select.onChange(val === ALL_VALUE ? undefined : val)
          }
        >
          <SelectTrigger className={select.width ?? 'w-[150px]'}>
            <SelectValue placeholder={select.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{select.allLabel}</SelectItem>
            {select.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {onSearchChange && (
        <Input
          placeholder={
            searchPlaceholder ??
            t('common.search', 'Search...')
          }
          value={searchValue ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-[220px]"
        />
      )}
    </div>
  );
}
