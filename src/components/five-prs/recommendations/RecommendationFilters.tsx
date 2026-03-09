import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RecommendationFilters as CommonFilters,
  type FilterSelectConfig,
} from '@/components/common/recommendations';
import type { RecommendationFilters as RecommendationFiltersType } from '@/types/recommendation';

interface Props {
  filters: RecommendationFiltersType;
  onFiltersChange: (filters: RecommendationFiltersType) => void;
  buildings: string[];
}

export function RecommendationFilters({
  filters,
  onFiltersChange,
  buildings,
}: Props) {
  const { t } = useTranslation();

  const selects = useMemo<FilterSelectConfig[]>(() => [
    {
      key: 'priority',
      value: filters.priority,
      placeholder: t('recommendation.filterPriority'),
      allLabel: t('recommendation.allPriorities'),
      options: [
        { value: 'IMMEDIATE', label: t('recommendation.immediate') },
        { value: 'PREVENTIVE', label: t('recommendation.preventive') },
        { value: 'SURGE', label: t('recommendation.surge') },
      ],
      onChange: (value) =>
        onFiltersChange({
          ...filters,
          priority: value as RecommendationFiltersType['priority'],
        }),
      width: 'w-[160px]',
    },
    {
      key: 'building',
      value: filters.building,
      placeholder: t('recommendation.filterBuilding'),
      allLabel: t('recommendation.allBuildings'),
      options: buildings.map((b) => ({ value: b, label: b })),
      onChange: (value) =>
        onFiltersChange({ ...filters, building: value }),
      width: 'w-[180px]',
    },
    {
      key: 'linkStatus',
      value: filters.linkStatus === 'all' ? undefined : filters.linkStatus,
      placeholder: t('recommendation.filterLinkStatus'),
      allLabel: t('recommendation.allLinkStatus'),
      options: [
        { value: 'linked', label: t('recommendation.linked') },
        { value: 'unlinked', label: t('recommendation.unlinked') },
      ],
      onChange: (value) =>
        onFiltersChange({
          ...filters,
          linkStatus: value as 'linked' | 'unlinked' | undefined,
        }),
      width: 'w-[160px]',
    },
  ], [filters, buildings, onFiltersChange, t]);

  return (
    <CommonFilters
      selects={selects}
      searchValue={filters.search}
      searchPlaceholder={t('recommendation.searchPlaceholder')}
      onSearchChange={(value) =>
        onFiltersChange({ ...filters, search: value || undefined })
      }
      gap="gap-3"
    />
  );
}
