import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { AqlFilters, AqlPriority, AqlEnrollmentReason } from '@/types/aql';

interface Props {
  filters: AqlFilters;
  onFilterChange: (filters: AqlFilters) => void;
  buildings: string[];
}

const ALL_VALUE = '__all__';

export function AqlRecommendationFilters({
  filters,
  onFilterChange,
  buildings,
}: Props) {
  const { t } = useTranslation();

  const handlePriorityChange = (value: string) => {
    onFilterChange({
      ...filters,
      priority: value === ALL_VALUE ? undefined : (value as AqlPriority),
    });
  };

  const handleBuildingChange = (value: string) => {
    onFilterChange({
      ...filters,
      building: value === ALL_VALUE ? undefined : value,
    });
  };

  const handleReasonChange = (value: string) => {
    onFilterChange({
      ...filters,
      reason: value === 'all' ? 'all' : (value as AqlEnrollmentReason),
    });
  };

  const handleLinkStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      linkStatus: value === 'all' ? 'all' : (value as 'linked' | 'unlinked'),
    });
  };

  const handleSearchChange = (value: string) => {
    onFilterChange({
      ...filters,
      search: value || undefined,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Priority Filter */}
      <Select
        value={filters.priority ?? ALL_VALUE}
        onValueChange={handlePriorityChange}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t('aql.recommendations.filterPriority', 'Priority')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>
            {t('aql.recommendations.allPriorities', 'All Priorities')}
          </SelectItem>
          <SelectItem value="CRITICAL">
            {t('aql.recommendations.critical', 'Critical')}
          </SelectItem>
          <SelectItem value="HIGH">
            {t('aql.recommendations.high', 'High')}
          </SelectItem>
          <SelectItem value="MEDIUM">
            {t('aql.recommendations.medium', 'Medium')}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Building Filter */}
      <Select
        value={filters.building ?? ALL_VALUE}
        onValueChange={handleBuildingChange}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder={t('aql.recommendations.filterBuilding', 'Building')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>
            {t('aql.recommendations.allBuildings', 'All Buildings')}
          </SelectItem>
          {buildings.map((building) => (
            <SelectItem key={building} value={building}>
              {building}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reason Filter */}
      <Select
        value={filters.reason ?? 'all'}
        onValueChange={handleReasonChange}
      >
        <SelectTrigger className="w-[190px]">
          <SelectValue placeholder={t('aql.recommendations.filterReason', 'Reason')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('aql.recommendations.allReasons', 'All Reasons')}
          </SelectItem>
          <SelectItem value="INSPECTOR_FAIL">
            {t('aql.recommendations.inspectorFail', 'Inspector Fail')}
          </SelectItem>
          <SelectItem value="SUPERVISOR_ESCALATION">
            {t('aql.recommendations.supervisorEscalation', 'Supervisor Escalation')}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Link Status Filter */}
      <Select
        value={filters.linkStatus ?? 'all'}
        onValueChange={handleLinkStatusChange}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t('aql.recommendations.filterLinkStatus', 'Link Status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('aql.recommendations.allLinkStatus', 'All')}
          </SelectItem>
          <SelectItem value="linked">
            {t('aql.recommendations.linked', 'Linked')}
          </SelectItem>
          <SelectItem value="unlinked">
            {t('aql.recommendations.unlinked', 'Unlinked')}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Search Input */}
      <Input
        placeholder={t('aql.recommendations.searchPlaceholder', 'Search name / employee no...')}
        value={filters.search ?? ''}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-[220px]"
      />
    </div>
  );
}
