import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buildings, departments, positions, categories } from '@/data/constants';

interface ProgressFiltersProps {
  buildingFilter: string;
  onBuildingFilterChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  positionFilter: string;
  onPositionFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
}

export default function ProgressFilters({
  buildingFilter,
  onBuildingFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  positionFilter,
  onPositionFilterChange,
  categoryFilter,
  onCategoryFilterChange,
}: ProgressFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Select value={buildingFilter} onValueChange={onBuildingFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('employee.building')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {buildings.map((bldg) => (
                <SelectItem key={bldg.value} value={bldg.value}>
                  {t(`building.${bldg.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={onDepartmentFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('employee.department')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={positionFilter} onValueChange={onPositionFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('employee.position')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {positions.map((pos) => (
                <SelectItem key={pos.value} value={pos.value}>
                  {t(`position.${pos.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('program.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {t(`category.${cat.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
