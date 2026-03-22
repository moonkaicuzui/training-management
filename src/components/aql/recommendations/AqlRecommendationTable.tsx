import { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, UserCheck, UserX } from 'lucide-react';
import type { AqlTrainingRecommendation, AqlPriority, AqlEnrollmentReason } from '@/types/aql';

interface Props {
  recommendations: AqlTrainingRecommendation[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onEnroll: (rec: AqlTrainingRecommendation) => void;
  filteredRecommendations: AqlTrainingRecommendation[];
}

type SortKey =
  | 'aql_employee_no'
  | 'name'
  | 'aql_inspector'
  | 'supervisor'
  | 'building'
  | 'fail_rate'
  | 'priority_score'
  | 'reason'
  | 'programs'
  | 'linked'
  | 'status';

const PRIORITY_BADGE_VARIANT: Record<
  AqlPriority,
  'destructive' | 'warning' | 'secondary'
> = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'secondary',
};

const REASON_COLORS: Record<AqlEnrollmentReason, string> = {
  INSPECTOR_FAIL: 'bg-blue-100 text-blue-800 border-blue-200',
  SUPERVISOR_ESCALATION: 'bg-purple-100 text-purple-800 border-purple-200',
};

function SortIcon({ columnKey, sortKey, sortAsc }: { columnKey: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  if (sortKey !== columnKey) {
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
  }
  return sortAsc ? (
    <ArrowUp className="ml-1 h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3" />
  );
}

function SortableHeader({
  columnKey,
  label,
  className,
  sortKey,
  sortAsc,
  onSort,
}: {
  columnKey: SortKey;
  label: string;
  className?: string;
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
}) {
  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => onSort(columnKey)}
      >
        {label}
        <SortIcon columnKey={columnKey} sortKey={sortKey} sortAsc={sortAsc} />
      </Button>
    </TableHead>
  );
}

function getSortValue(rec: AqlTrainingRecommendation, key: SortKey): string | number {
  switch (key) {
    case 'aql_employee_no':
      return rec.aql_employee_no;
    case 'name':
      return rec.linked_employee?.employee_name ?? '';
    case 'aql_inspector':
      return rec.aql_employee_name;
    case 'supervisor':
      return rec.supervisor?.employee_name ?? '';
    case 'building':
      return rec.buildings.join(', ');
    case 'fail_rate':
      return rec.fail_rate;
    case 'priority_score':
      return rec.priority_score;
    case 'reason':
      return rec.enrollment_reason;
    case 'programs':
      return rec.recommended_programs.map((p) => p.program_code).join(', ');
    case 'linked':
      return rec.linked_employee ? 1 : 0;
    case 'status':
      return rec.enrollment_status;
    default:
      return 0;
  }
}

export const AqlRecommendationTable = memo(function AqlRecommendationTable({
  filteredRecommendations,
  selectedIds,
  onSelectChange,
  onEnroll,
}: Props) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('priority_score');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortAsc(!sortAsc);
      } else {
        setSortKey(key);
        setSortAsc(false);
      }
    },
    [sortKey, sortAsc]
  );

  const sorted = useMemo(() => {
    return [...filteredRecommendations].sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      let cmp: number;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv), 'vi');
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredRecommendations, sortKey, sortAsc]);

  // Only items that can be selected: linked + PENDING
  const selectableIds = sorted
    .filter((r) => r.linked_employee && r.enrollment_status === 'PENDING')
    .map((r) => r.aql_employee_no);

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const merged = new Set([...selectedIds, ...selectableIds]);
      onSelectChange(Array.from(merged));
    } else {
      onSelectChange(
        selectedIds.filter((id) => !selectableIds.includes(id))
      );
    }
  };

  const handleSelectOne = (empNo: string, checked: boolean) => {
    if (checked) {
      onSelectChange([...selectedIds, empNo]);
    } else {
      onSelectChange(selectedIds.filter((id) => id !== empNo));
    }
  };

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) =>
                  handleSelectAll(checked === true)
                }
                aria-label={t('aql.recommendations.selectAll', 'Select all')}
              />
            </TableHead>
            <SortableHeader
              columnKey="aql_employee_no"
              label={t('aql.recommendations.employeeNo')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="name"
              label={t('aql.recommendations.name', 'Name')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="aql_inspector"
              label={t('aql.recommendations.aqlInspector', 'AQL Inspector')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="supervisor"
              label={t('aql.recommendations.supervisor')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="building"
              label={t('aql.recommendations.building', 'Building')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="fail_rate"
              label={t('aql.recommendations.failRate', 'Fail Rate')}
              className="text-right"
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="priority_score"
              label={t('aql.recommendations.priority', 'Priority')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="reason"
              label={t('aql.recommendations.reason', 'Reason')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="programs"
              label={t('aql.recommendations.programs', 'Programs')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="linked"
              label={t('aql.recommendations.linkStatus', 'Link')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
            <SortableHeader
              columnKey="status"
              label={t('aql.recommendations.actions', 'Actions')}
              sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((rec) => {
            const isSelectable =
              !!rec.linked_employee && rec.enrollment_status === 'PENDING';
            const isSelected = selectedIds.includes(rec.aql_employee_no);
            const isSupervisorEscalation =
              rec.enrollment_reason === 'SUPERVISOR_ESCALATION';

            return (
              <TableRow
                key={rec.aql_employee_no}
                data-state={isSelected ? 'selected' : undefined}
                className={isSelected ? 'bg-muted/50' : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    disabled={!isSelectable}
                    onCheckedChange={(checked) =>
                      handleSelectOne(rec.aql_employee_no, checked === true)
                    }
                    aria-label={t('aql.recommendations.selectRow', {
                      name: rec.aql_employee_name,
                      defaultValue: `Select ${rec.aql_employee_name}`,
                    })}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {rec.aql_employee_no}
                </TableCell>
                <TableCell className="font-medium">
                  {rec.linked_employee ? (
                    rec.linked_employee.employee_name
                  ) : (
                    <span className="text-muted-foreground italic">
                      {t('aql.recommendations.unlinked', 'Unlinked')}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {rec.aql_employee_name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {rec.supervisor ? rec.supervisor.employee_name : '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {rec.buildings.join(', ')}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {isSupervisorEscalation ? (
                    <span className="text-muted-foreground font-normal text-sm" title={t('aql.recommendations.supervisorFailRateNote')}>
                      ({rec.fail_rate.toFixed(1)}%)
                    </span>
                  ) : (
                    <>{rec.fail_rate.toFixed(2)}%</>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_BADGE_VARIANT[rec.priority]}>
                    {t(`aql.recommendations.${rec.priority.toLowerCase()}`, rec.priority)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={REASON_COLORS[rec.enrollment_reason]}
                  >
                    {rec.enrollment_reason === 'INSPECTOR_FAIL'
                      ? t('aql.recommendations.inspectorFail', 'Inspector Fail')
                      : t('aql.recommendations.supervisorEscalation', 'Supervisor Escalation')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {rec.recommended_programs.length > 0
                    ? rec.recommended_programs
                        .map((p) => p.program_code)
                        .join(', ')
                    : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {rec.linked_employee ? (
                    <UserCheck className="h-4 w-4 text-green-600 inline-block" />
                  ) : (
                    <UserX className="h-4 w-4 text-muted-foreground inline-block" />
                  )}
                </TableCell>
                <TableCell>
                  {rec.enrollment_status === 'ENROLLED' ? (
                    <Badge variant="success">
                      {t('aql.recommendations.enrolled', 'Enrolled')}
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        !rec.linked_employee ||
                        rec.enrollment_status !== 'PENDING'
                      }
                      onClick={() => onEnroll(rec)}
                    >
                      {t('aql.recommendations.enroll', 'Enroll')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}

          {sorted.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={12}
                className="text-center text-muted-foreground py-8"
              >
                {t('common.noData', 'No data')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
});
