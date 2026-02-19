import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { RecommendationFilters as RecommendationFiltersType } from '@/types/recommendation';

interface Props {
  filters: RecommendationFiltersType;
  onFiltersChange: (filters: RecommendationFiltersType) => void;
  buildings: string[];
}

const ALL_VALUE = '__all__';

export function RecommendationFilters({
  filters,
  onFiltersChange,
  buildings,
}: Props) {
  const { t } = useTranslation();

  const handlePriorityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      priority: value === ALL_VALUE ? undefined : (value as RecommendationFiltersType['priority']),
    });
  };

  const handleBuildingChange = (value: string) => {
    onFiltersChange({
      ...filters,
      building: value === ALL_VALUE ? undefined : value,
    });
  };

  const handleLinkStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      linkStatus: value === 'all' ? undefined : (value as 'linked' | 'unlinked'),
    });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.priority ?? ALL_VALUE}
        onValueChange={handlePriorityChange}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('recommendation.filterPriority')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>
            {t('recommendation.allPriorities')}
          </SelectItem>
          <SelectItem value="IMMEDIATE">
            {t('recommendation.immediate')}
          </SelectItem>
          <SelectItem value="PREVENTIVE">
            {t('recommendation.preventive')}
          </SelectItem>
          <SelectItem value="SURGE">
            {t('recommendation.surge')}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.building ?? ALL_VALUE}
        onValueChange={handleBuildingChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('recommendation.filterBuilding')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>
            {t('recommendation.allBuildings')}
          </SelectItem>
          {buildings.map((building) => (
            <SelectItem key={building} value={building}>
              {building}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.linkStatus ?? 'all'}
        onValueChange={handleLinkStatusChange}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('recommendation.filterLinkStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('recommendation.allLinkStatus')}
          </SelectItem>
          <SelectItem value="linked">
            {t('recommendation.linked')}
          </SelectItem>
          <SelectItem value="unlinked">
            {t('recommendation.unlinked')}
          </SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder={t('recommendation.searchPlaceholder')}
        value={filters.search ?? ''}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-[220px]"
      />
    </div>
  );
}
