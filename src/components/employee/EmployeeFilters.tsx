import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { departments, positions, buildings } from '@/data/constants';

type FilterKey = 'search' | 'department' | 'position' | 'building' | 'status';

interface EmployeeFiltersProps {
  searchQuery: string;
  departmentFilter: string;
  positionFilter: string;
  buildingFilter: string;
  statusFilter: string;
  onFilterChange: (key: FilterKey, value: string) => void;
}

export function EmployeeFilters({
  searchQuery,
  departmentFilter,
  positionFilter,
  buildingFilter,
  statusFilter,
  onFilterChange,
}: EmployeeFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('employee.searchPlaceholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={(v) => onFilterChange('department', v)}>
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
          <Select value={positionFilter} onValueChange={(v) => onFilterChange('position', v)}>
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
          <Select value={buildingFilter} onValueChange={(v) => onFilterChange('building', v)}>
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
          <Select value={statusFilter} onValueChange={(v) => onFilterChange('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
              <SelectItem value="INACTIVE">{t('common.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
