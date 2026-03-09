import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { GapPriorityTableProps } from './types';

export function GapPriorityTable({
  gapSummaries,
  getRelatedPrograms,
  onViewActionPlan,
}: GapPriorityTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('skillGap.priorityTable.title')}</CardTitle>
        <CardDescription>{t('skillGap.priorityTable.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('skillGap.priorityTable.priority')}</TableHead>
              <TableHead>{t('competency.code')}</TableHead>
              <TableHead>{t('competency.name')}</TableHead>
              <TableHead>{t('competency.categoryLabel')}</TableHead>
              <TableHead className="text-right">{t('skillGap.priorityTable.gapPercent')}</TableHead>
              <TableHead className="text-right">{t('skillGap.priorityTable.belowTarget')}</TableHead>
              <TableHead className="text-right">{t('skillGap.priorityTable.total')}</TableHead>
              <TableHead>{t('skillGap.recommendedPrograms', { defaultValue: 'Recommended' })}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gapSummaries.map((gap) => {
              const relatedProgs = getRelatedPrograms(gap.competency.competency_id);
              return (
                <TableRow key={gap.competency.competency_id}>
                  <TableCell>
                    <Badge
                      variant={
                        gap.priority === 'HIGH'
                          ? 'destructive'
                          : gap.priority === 'MEDIUM'
                          ? 'default'
                          : 'secondary'
                      }
                      className={cn(
                        gap.priority === 'MEDIUM' && 'bg-yellow-500 hover:bg-yellow-600'
                      )}
                    >
                      {t(`skillGap.priority.${gap.priority}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {gap.competency.competency_code}
                  </TableCell>
                  <TableCell>{gap.competency.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`competency.category.${gap.competency.category}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span
                      className={cn(
                        gap.gap_percentage >= 60
                          ? 'text-destructive'
                          : gap.gap_percentage >= 30
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      )}
                    >
                      {gap.gap_percentage}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{gap.below_target}</TableCell>
                  <TableCell className="text-right">{gap.total_employees}</TableCell>
                  <TableCell>
                    {relatedProgs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {relatedProgs.slice(0, 2).map((p) => (
                          <Badge key={p.program_code} variant="outline" className="text-[10px]">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {p.program_code}
                          </Badge>
                        ))}
                        {relatedProgs.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{relatedProgs.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewActionPlan(gap)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {gapSummaries.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
