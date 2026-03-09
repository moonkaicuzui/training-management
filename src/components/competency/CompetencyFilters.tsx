/**
 * CompetencyFilters - Filter/search controls for competency list tab
 */

import { useTranslation } from 'react-i18next';
import { Search, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CompetencyCategory } from '@/types/curriculum';

const CATEGORIES: CompetencyCategory[] = [
  'TECHNICAL',
  'QUALITY',
  'SAFETY',
  'LEADERSHIP',
  'COMMUNICATION',
  'PROCESS',
];

interface CompetencyFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  onOpenBulkDialog: () => void;
  onOpenCompetencyDialog: () => void;
}

export function CompetencyFilters({
  searchTerm,
  onSearchTermChange,
  categoryFilter,
  onCategoryFilterChange,
  onOpenBulkDialog,
  onOpenCompetencyDialog,
}: CompetencyFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('competency.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('competency.allCategories')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.all')}</SelectItem>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {t(`competency.category.${cat}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onOpenBulkDialog}>
        <Users className="h-4 w-4 mr-2" />
        {t('competency.bulk.assign', { defaultValue: 'Bulk Assign' })}
      </Button>
      <Button onClick={onOpenCompetencyDialog}>
        <Plus className="h-4 w-4 mr-2" />
        {t('competency.addCompetency')}
      </Button>
    </div>
  );
}
