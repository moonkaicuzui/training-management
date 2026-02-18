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
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TqcRecord } from '@/types/fivePrs';

interface Props {
  records: TqcRecord[];
}

type SortKey = 'name' | 'totalValidation' | 'totalReject' | 'rejectRate';

export function TqcAnalysisTable({ records }: Props) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('rejectRate');
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

  const getRateColor = (rate: number) => {
    if (rate > 5) return 'text-red-600 font-bold';
    if (rate > 3) return 'text-orange-500 font-semibold';
    if (rate > 1.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('fivePrs.tqcAnalysis')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-background">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('name')}>
                    {t('fivePrs.tqcName')} <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('totalValidation')}>
                    {t('fivePrs.validation')} <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('totalReject')}>
                    {t('fivePrs.reject')} <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('rejectRate')}>
                    {t('fivePrs.rejectRate')} <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background">
                  {t('fivePrs.mainDefect')}
                </TableHead>
                <TableHead className="sticky top-0 bg-background">
                  {t('fivePrs.building')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((tqc) => (
                <TableRow key={`${tqc.id}-${tqc.name}`}>
                  <TableCell className="font-medium">
                    <span className="text-xs text-muted-foreground mr-1">{tqc.id}</span>
                    {tqc.name}
                  </TableCell>
                  <TableCell className="text-right">{tqc.totalValidation.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{tqc.totalReject.toLocaleString()}</TableCell>
                  <TableCell className={`text-right ${getRateColor(tqc.rejectRate)}`}>
                    {tqc.rejectRate}%
                  </TableCell>
                  <TableCell className="text-sm">{tqc.mainDefect}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tqc.buildings.join(', ')}
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
