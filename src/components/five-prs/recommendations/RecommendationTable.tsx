import { useState, useMemo } from 'react';
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
import { ArrowUpDown, ChevronDown, ChevronRight, UserCheck, UserX } from 'lucide-react';
import type {
  TrainingRecommendation,
  RecommendationFilters,
  RecommendationPriority,
} from '@/types/recommendation';

interface Props {
  recommendations: TrainingRecommendation[];
  filters: RecommendationFilters;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onEnroll: (rec: TrainingRecommendation) => void;
}

type SortKey = 'priorityScore' | 'rejectRate';

const PRIORITY_BADGE_VARIANT: Record<
  RecommendationPriority,
  'destructive' | 'warning' | 'secondary'
> = {
  IMMEDIATE: 'destructive',
  PREVENTIVE: 'secondary',
  SURGE: 'warning',
};

export function RecommendationTable({
  recommendations,
  filters,
  selectedIds,
  onSelectedIdsChange,
  onEnroll,
}: Props) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('priorityScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Client-side filtering
  const filtered = useMemo(() => {
    return recommendations.filter((rec) => {
      if (filters.priority && rec.priority !== filters.priority) return false;
      if (
        filters.building &&
        !rec.buildings.includes(filters.building)
      )
        return false;
      if (filters.linkStatus === 'linked' && !rec.linkedEmployee) return false;
      if (filters.linkStatus === 'unlinked' && rec.linkedEmployee) return false;
      if (
        filters.enrollmentStatus &&
        filters.enrollmentStatus !== 'all' &&
        rec.enrollmentStatus !== filters.enrollmentStatus
      )
        return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesId = rec.tqc_id.toLowerCase().includes(q);
        const matchesName = rec.tqc_name.toLowerCase().includes(q);
        const matchesEmployee =
          rec.linkedEmployee?.employee_name.toLowerCase().includes(q) ?? false;
        if (!matchesId && !matchesName && !matchesEmployee) return false;
      }
      return true;
    });
  }, [recommendations, filters]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortAsc ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const toggleExpand = (tqcId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tqcId)) {
        next.delete(tqcId);
      } else {
        next.add(tqcId);
      }
      return next;
    });
  };

  const allFilteredIds = sorted.map((r) => r.tqc_id);
  const allSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedIds.includes(id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const merged = new Set([...selectedIds, ...allFilteredIds]);
      onSelectedIdsChange(Array.from(merged));
    } else {
      onSelectedIdsChange(
        selectedIds.filter((id) => !allFilteredIds.includes(id))
      );
    }
  };

  const handleSelectOne = (tqcId: string, checked: boolean) => {
    if (checked) {
      onSelectedIdsChange([...selectedIds, tqcId]);
    } else {
      onSelectedIdsChange(selectedIds.filter((id) => id !== tqcId));
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
                aria-label={t('recommendation.selectAll')}
              />
            </TableHead>
            <TableHead className="w-8" />
            <TableHead>{t('recommendation.tqcId')}</TableHead>
            <TableHead>{t('recommendation.tqcName')}</TableHead>
            <TableHead>{t('recommendation.building')}</TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('rejectRate')}
              >
                {t('recommendation.rejectRate')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>{t('recommendation.priority')}</TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('priorityScore')}
              >
                {t('recommendation.score')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>{t('recommendation.linkedEmployee')}</TableHead>
            <TableHead>{t('recommendation.programs')}</TableHead>
            <TableHead>{t('recommendation.action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((rec) => {
            const isExpanded = expandedIds.has(rec.tqc_id);
            const isSelected = selectedIds.includes(rec.tqc_id);

            return (
              <>
                <TableRow
                  key={rec.tqc_id}
                  data-state={isSelected ? 'selected' : undefined}
                  className={isSelected ? 'bg-muted/50' : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleSelectOne(rec.tqc_id, checked === true)
                      }
                      aria-label={t('recommendation.selectRow', {
                        name: rec.tqc_name,
                      })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleExpand(rec.tqc_id)}
                      aria-label={
                        isExpanded
                          ? t('recommendation.collapse')
                          : t('recommendation.expand')
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {rec.tqc_id}
                  </TableCell>
                  <TableCell className="font-medium">{rec.tqc_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rec.buildings.join(', ')}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {rec.rejectRate.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={PRIORITY_BADGE_VARIANT[rec.priority]}>
                      {t(`recommendation.${rec.priority.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {rec.priorityScore}
                  </TableCell>
                  <TableCell>
                    {rec.linkedEmployee ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <UserCheck className="h-3.5 w-3.5 text-green-600" />
                        {rec.linkedEmployee.employee_name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <UserX className="h-3.5 w-3.5" />
                        {t('recommendation.unlinked')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {rec.recommendedPrograms.length > 0
                      ? rec.recommendedPrograms
                          .map((p) => p.program_code)
                          .join(', ')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        !rec.linkedEmployee ||
                        rec.enrollmentStatus === 'ENROLLED' ||
                        rec.recommendedPrograms.length === 0
                      }
                      onClick={() => onEnroll(rec)}
                    >
                      {rec.enrollmentStatus === 'ENROLLED'
                        ? t('recommendation.enrolled')
                        : t('recommendation.enroll')}
                    </Button>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow key={`${rec.tqc_id}-expanded`}>
                    <TableCell colSpan={11} className="bg-muted/30 px-8 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Top Defects */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">
                            {t('recommendation.topDefects')}
                          </h4>
                          {rec.topDefects.length > 0 ? (
                            <ul className="space-y-1">
                              {rec.topDefects.map((defect) => (
                                <li
                                  key={defect.type}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span>{defect.type}</span>
                                  <Badge variant="outline">
                                    {defect.count}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {t('common.noData')}
                            </p>
                          )}
                        </div>

                        {/* Recommended Programs */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">
                            {t('recommendation.recommendedPrograms')}
                          </h4>
                          {rec.recommendedPrograms.length > 0 ? (
                            <ul className="space-y-1">
                              {rec.recommendedPrograms.map((prog) => (
                                <li
                                  key={prog.program_code}
                                  className="text-sm"
                                >
                                  <Badge variant="default" className="mr-2">
                                    {prog.program_code}
                                  </Badge>
                                  <span>{prog.program_name}</span>
                                  <span className="text-muted-foreground ml-1">
                                    ({prog.match_reason})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {t('recommendation.noPrograms')}
                            </p>
                          )}
                        </div>

                        {/* Surge Info */}
                        {rec.surgeInfo && (
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-semibold mb-2">
                              {t('recommendation.surgeInfo')}
                            </h4>
                            <p className="text-sm">
                              {t('recommendation.surgeDetail', {
                                building: rec.surgeInfo.building,
                                defect: rec.surgeInfo.defect,
                                recent: rec.surgeInfo.recentRate.toFixed(2),
                                past: rec.surgeInfo.pastRate.toFixed(2),
                                increase:
                                  rec.surgeInfo.increasePercent.toFixed(0),
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}

          {sorted.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={11}
                className="text-center text-muted-foreground py-8"
              >
                {t('common.noData')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
