import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RecommendationFilters,
  type FilterSelectConfig,
} from '@/components/common/recommendations';
import type { AqlFilters, AqlPriority, AqlEnrollmentReason } from '@/types/aql';

interface Props {
  filters: AqlFilters;
  onFilterChange: (filters: AqlFilters) => void;
  buildings: string[];
}

export function AqlRecommendationFilters({
  filters,
  onFilterChange,
  buildings,
}: Props) {
  const { t } = useTranslation();

  const selects = useMemo<FilterSelectConfig[]>(() => [
    {
      key: 'priority',
      value: filters.priority,
      placeholder: t('aql.recommendations.filterPriority', 'Priority'),
      allLabel: t('aql.recommendations.allPriorities', 'All Priorities'),
      options: [
        { value: 'CRITICAL', label: t('aql.recommendations.critical', 'Critical') },
        { value: 'HIGH', label: t('aql.recommendations.high', 'High') },
        { value: 'MEDIUM', label: t('aql.recommendations.medium', 'Medium') },
      ],
      onChange: (value) =>
        onFilterChange({ ...filters, priority: value as AqlPriority | undefined }),
      width: 'w-[150px]',
    },
    {
      key: 'building',
      value: filters.building,
      placeholder: t('aql.recommendations.filterBuilding', 'Building'),
      allLabel: t('aql.recommendations.allBuildings', 'All Buildings'),
      options: buildings.map((b) => ({ value: b, label: b })),
      onChange: (value) =>
        onFilterChange({ ...filters, building: value }),
      width: 'w-[170px]',
    },
    {
      key: 'reason',
      value: filters.reason === 'all' ? undefined : filters.reason,
      placeholder: t('aql.recommendations.filterReason', 'Reason'),
      allLabel: t('aql.recommendations.allReasons', 'All Reasons'),
      options: [
        { value: 'INSPECTOR_FAIL', label: t('aql.recommendations.inspectorFail', 'Inspector Fail') },
        { value: 'SUPERVISOR_ESCALATION', label: t('aql.recommendations.supervisorEscalation', 'Supervisor Escalation') },
      ],
      onChange: (value) =>
        onFilterChange({
          ...filters,
          reason: (value ?? 'all') as AqlEnrollmentReason | 'all',
        }),
      width: 'w-[190px]',
    },
    {
      key: 'linkStatus',
      value: filters.linkStatus === 'all' ? undefined : filters.linkStatus,
      placeholder: t('aql.recommendations.filterLinkStatus', 'Link Status'),
      allLabel: t('aql.recommendations.allLinkStatus', 'All'),
      options: [
        { value: 'linked', label: t('aql.recommendations.linked', 'Linked') },
        { value: 'unlinked', label: t('aql.recommendations.unlinked', 'Unlinked') },
      ],
      onChange: (value) =>
        onFilterChange({
          ...filters,
          linkStatus: (value ?? 'all') as 'linked' | 'unlinked' | 'all',
        }),
      width: 'w-[150px]',
    },
  ], [filters, buildings, onFilterChange, t]);

  return (
    <RecommendationFilters
      selects={selects}
      searchValue={filters.search}
      searchPlaceholder={t('aql.recommendations.searchPlaceholder', 'Search name / employee no...')}
      onSearchChange={(value) =>
        onFilterChange({ ...filters, search: value || undefined })
      }
    />
  );
}
