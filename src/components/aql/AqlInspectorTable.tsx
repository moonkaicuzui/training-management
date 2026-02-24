import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import type { AqlInspectorRecord } from '@/types/aql';

interface Props {
  records: AqlInspectorRecord[];
  isLoading: boolean;
}

type SortKey = 'employee_no' | 'employee_name' | 'tqc_num' | 'total_inspections' | 'fail_count' | 'fail_rate';

function getFailRateColor(rate: number): string {
  if (rate > 30) return 'text-red-600 font-bold';
  if (rate >= 10) return 'text-orange-500 font-semibold';
  if (rate > 0) return 'text-yellow-600';
  return 'text-green-600';
}

function getDefectBadgeVariant(index: number): 'destructive' | 'warning' | 'secondary' {
  if (index === 0) return 'destructive';
  if (index === 1) return 'warning';
  return 'secondary';
}

function getTopDefects(parsed: Record<string, number>, limit = 3): Array<{ type: string; count: number }> {
  return Object.entries(parsed)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([type, count]) => ({ type, count }));
}

export function AqlInspectorTable({ records, isLoading }: Props) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('fail_rate');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...records].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {t('aql.dashboard.inspectorStats', 'Inspector Statistics')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 bg-background">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('employee_no')}>
                      {t('aql.dashboard.employeeNo', 'Employee No')}
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('tqc_num')}>
                      {t('aql.dashboard.tqcNum', 'TQC NUM')}
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('employee_name')}>
                      {t('aql.dashboard.name', 'Name')}
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background">
                    {t('aql.dashboard.building', 'Building')}
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('total_inspections')}>
                      {t('aql.dashboard.total', 'Total')}
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background text-right">
                    {t('aql.dashboard.pass', 'Pass')}
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('fail_count')}>
                      {t('aql.dashboard.fail', 'Fail')}
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('fail_rate')}>
                      {t('aql.dashboard.failRatePercent', 'Fail Rate%')}
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background">
                    {t('aql.dashboard.topDefects', 'Top Defects')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((rec) => {
                  const topDefects = getTopDefects(rec.parsed_defects);
                  return (
                    <TableRow key={rec.employee_no}>
                      <TableCell className="font-mono text-sm">{rec.employee_no}</TableCell>
                      <TableCell className="font-mono text-sm">{rec.tqc_num || '-'}</TableCell>
                      <TableCell className="font-medium">{rec.employee_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rec.buildings.join(', ')}
                      </TableCell>
                      <TableCell className="text-right">{rec.total_inspections.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">{rec.pass_count.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">{rec.fail_count.toLocaleString()}</TableCell>
                      <TableCell className={`text-right ${getFailRateColor(rec.fail_rate)}`}>
                        {rec.fail_rate}%
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {topDefects.map((d, idx) => (
                            <Badge
                              key={d.type}
                              variant={getDefectBadgeVariant(idx)}
                              className="text-xs"
                            >
                              {d.type} ({d.count})
                            </Badge>
                          ))}
                          {topDefects.length === 0 && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {t('common.noData', 'No data')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
