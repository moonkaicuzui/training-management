import { memo } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type {
  NewTQCTraineeFilters,
  NewTQCMeetingFilters,
  NewTQCResignationFilters,
  NewTQCTeam,
  NewTQCTraineeStatus,
  NewTQCMeetingType,
  NewTQCMeetingStatus,
  ResignationReason,
} from '@/types/newTqc';
import { newTQCTraineeStatuses, newTQCMeetingTypes, newTQCResignationReasons } from '@/data/constants';

interface TraineeFiltersProps {
  filters: NewTQCTraineeFilters;
  teams: NewTQCTeam[];
  trainers: string[];
  onFiltersChange: (filters: NewTQCTraineeFilters) => void;
  onClear: () => void;
}

export const TraineeFilters = memo(function TraineeFilters({
  filters,
  teams,
  trainers,
  onFiltersChange,
  onClear,
}: TraineeFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== '' && v !== 'all'
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('newTqc.filters.searchPlaceholder')}
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value || undefined })
            }
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value === 'all' ? 'all' : (value as NewTQCTraineeStatus),
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('newTqc.filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('newTqc.filters.allStatus')}</SelectItem>
            {newTQCTraineeStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Team Filter */}
        <Select
          value={filters.team || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              team: value === 'all' ? 'all' : value,
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('newTqc.filters.team')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('newTqc.filters.allTeams')}</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.team_id} value={team.team_id}>
                {team.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Trainer Filter */}
        <Select
          value={filters.trainer || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              trainer: value === 'all' ? 'all' : value,
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('newTqc.filters.trainer')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('newTqc.filters.allTrainers')}</SelectItem>
            {trainers.map((trainer) => (
              <SelectItem key={trainer} value={trainer}>
                {trainer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Week Filter */}
        <Select
          value={filters.startWeek || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              startWeek: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t('newTqc.filters.week')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('newTqc.filters.allWeeks')}</SelectItem>
            {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
              <SelectItem key={week} value={week.toString()}>
                {t('newTqc.filters.weekLabel', { week })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            {t('newTqc.filters.reset')}
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {t('newTqc.filters.statusLabel')} {newTQCTraineeStatuses.find((s) => s.value === filters.status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, status: 'all' })}
              />
            </Badge>
          )}
          {filters.team && filters.team !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {t('newTqc.filters.teamLabel')} {teams.find((t) => t.team_id === filters.team)?.team_name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, team: 'all' })}
              />
            </Badge>
          )}
          {filters.trainer && filters.trainer !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {t('newTqc.filters.trainerLabel')} {filters.trainer}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, trainer: 'all' })}
              />
            </Badge>
          )}
          {filters.startWeek && (
            <Badge variant="secondary" className="gap-1">
              {t('newTqc.filters.weekLabel', { week: filters.startWeek })}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, startWeek: undefined })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

// Meeting Filters
interface MeetingFiltersProps {
  filters: NewTQCMeetingFilters;
  onFiltersChange: (filters: NewTQCMeetingFilters) => void;
  onClear: () => void;
}

export function MeetingFilters({
  filters,
  onFiltersChange,
  onClear,
}: MeetingFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== '' && v !== 'all'
  );

  return (
    <div className="flex flex-wrap gap-3">
      {/* Meeting Type */}
      <Select
        value={filters.meetingType || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            meetingType: value === 'all' ? 'all' : (value as NewTQCMeetingType),
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t('newTqc.filters.meetingType')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('newTqc.filters.allTypes')}</SelectItem>
          {newTQCMeetingTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value === 'all' ? 'all' : (value as NewTQCMeetingStatus),
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t('newTqc.filters.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('newTqc.filters.allStatus')}</SelectItem>
          <SelectItem value="SCHEDULED">{t('newTqc.filters.scheduled')}</SelectItem>
          <SelectItem value="COMPLETED">{t('newTqc.filters.completed')}</SelectItem>
          <SelectItem value="MISSED">{t('newTqc.filters.missed')}</SelectItem>
          <SelectItem value="RESCHEDULED">{t('newTqc.filters.rescheduled')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Input
        type="date"
        value={filters.dateFrom || ''}
        onChange={(e) =>
          onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
        }
        className="w-[160px]"
      />
      <span className="flex items-center text-muted-foreground">~</span>
      <Input
        type="date"
        value={filters.dateTo || ''}
        onChange={(e) =>
          onFiltersChange({ ...filters, dateTo: e.target.value || undefined })
        }
        className="w-[160px]"
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          {t('newTqc.filters.reset')}
        </Button>
      )}
    </div>
  );
}

// Resignation Filters
interface ResignationFiltersProps {
  filters: NewTQCResignationFilters;
  teams: NewTQCTeam[];
  onFiltersChange: (filters: NewTQCResignationFilters) => void;
  onClear: () => void;
}

export function ResignationFilters({
  filters,
  teams,
  onFiltersChange,
  onClear,
}: ResignationFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== '' && v !== 'all'
  );

  return (
    <div className="flex flex-wrap gap-3">
      {/* Reason */}
      <Select
        value={filters.reasonCategory || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            reasonCategory: value === 'all' ? 'all' : (value as ResignationReason),
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('newTqc.filters.resignReason')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('newTqc.filters.allReasons')}</SelectItem>
          {newTQCResignationReasons.map((reason) => (
            <SelectItem key={reason.value} value={reason.value}>
              {reason.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Team */}
      <Select
        value={filters.team || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            team: value === 'all' ? 'all' : value,
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('newTqc.filters.team')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('newTqc.filters.allTeams')}</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.team_id} value={team.team_id}>
              {team.team_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Input
        type="date"
        value={filters.dateFrom || ''}
        onChange={(e) =>
          onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
        }
        className="w-[160px]"
      />
      <span className="flex items-center text-muted-foreground">~</span>
      <Input
        type="date"
        value={filters.dateTo || ''}
        onChange={(e) =>
          onFiltersChange({ ...filters, dateTo: e.target.value || undefined })
        }
        className="w-[160px]"
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          {t('newTqc.filters.reset')}
        </Button>
      )}
    </div>
  );
}
