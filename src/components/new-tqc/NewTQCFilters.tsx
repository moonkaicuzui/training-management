import { Search, X } from 'lucide-react';
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
import { newTQCTraineeStatuses, newTQCMeetingTypes, newTQCResignationReasons } from '@/data/mockData';

interface TraineeFiltersProps {
  filters: NewTQCTraineeFilters;
  teams: NewTQCTeam[];
  trainers: string[];
  onFiltersChange: (filters: NewTQCTraineeFilters) => void;
  onClear: () => void;
}

export function TraineeFilters({
  filters,
  teams,
  trainers,
  onFiltersChange,
  onClear,
}: TraineeFiltersProps) {
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
            placeholder="이름 또는 사번으로 검색..."
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
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
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
            <SelectValue placeholder="배치예정팀" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 팀</SelectItem>
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
            <SelectValue placeholder="트레이너" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 트레이너</SelectItem>
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
            <SelectValue placeholder="주차" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 주차</SelectItem>
            {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
              <SelectItem key={week} value={week.toString()}>
                {week}주차
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              상태: {newTQCTraineeStatuses.find((s) => s.value === filters.status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, status: 'all' })}
              />
            </Badge>
          )}
          {filters.team && filters.team !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              팀: {teams.find((t) => t.team_id === filters.team)?.team_name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, team: 'all' })}
              />
            </Badge>
          )}
          {filters.trainer && filters.trainer !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              트레이너: {filters.trainer}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, trainer: 'all' })}
              />
            </Badge>
          )}
          {filters.startWeek && (
            <Badge variant="secondary" className="gap-1">
              {filters.startWeek}주차
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
}

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
          <SelectValue placeholder="미팅 유형" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 유형</SelectItem>
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
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="SCHEDULED">예정</SelectItem>
          <SelectItem value="COMPLETED">완료</SelectItem>
          <SelectItem value="MISSED">미실시</SelectItem>
          <SelectItem value="RESCHEDULED">재조정</SelectItem>
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
          초기화
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
          <SelectValue placeholder="퇴사 사유" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 사유</SelectItem>
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
          <SelectValue placeholder="팀" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 팀</SelectItem>
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
          초기화
        </Button>
      )}
    </div>
  );
}
