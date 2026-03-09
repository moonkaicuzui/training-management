import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CompetencyCategory } from '@/types/curriculum';
import type { SkillGapFiltersProps } from './types';

const CATEGORIES: CompetencyCategory[] = [
  'TECHNICAL',
  'QUALITY',
  'SAFETY',
  'LEADERSHIP',
  'COMMUNICATION',
  'PROCESS',
];

export function SkillGapFilters({
  deptFilter,
  setDeptFilter,
  categoryFilter,
  setCategoryFilter,
  departments,
}: SkillGapFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <Select value={deptFilter} onValueChange={setDeptFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('skillGap.allDepartments')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('skillGap.allDepartments')}</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {t(`department.${dept}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[200px]">
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
    </div>
  );
}
