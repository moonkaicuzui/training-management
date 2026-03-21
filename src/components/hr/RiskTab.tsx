import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
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
import { RiskBadge, TqcStatusBadge, EmptyMessage } from './HRHelperComponents';
import type { RiskBasedRecommendation } from '@/services/hrAnalyticsService';

interface RiskTabProps {
  data: RiskBasedRecommendation[];
  loading: boolean;
  onLoad: () => void;
}

export default function RiskTab({ data, loading, onLoad }: RiskTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardDescription>{t('hrAnalytics.risk.description')}</CardDescription>
        <Button onClick={onLoad} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
          {t('hrAnalytics.loadData')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : data.length === 0 ? (
        <EmptyMessage message={t('hrAnalytics.empty.risk')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('hrAnalytics.table.employee')}</TableHead>
                  <TableHead>{t('hrAnalytics.table.team')}</TableHead>
                  <TableHead>{t('hrAnalytics.table.building')}</TableHead>
                  <TableHead className="text-center">{t('hrAnalytics.risk.score')}</TableHead>
                  <TableHead>{t('hrAnalytics.risk.level')}</TableHead>
                  <TableHead>{t('hrAnalytics.risk.factors')}</TableHead>
                  <TableHead>{t('hrAnalytics.risk.recommended')}</TableHead>
                  <TableHead>{t('hrAnalytics.risk.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow
                    key={row.employeeId}
                    className={
                      row.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-950/20'
                        : row.riskLevel === 'medium' ? 'bg-orange-50 dark:bg-orange-950/20'
                          : ''
                    }
                  >
                    <TableCell className="font-medium">
                      <Link to={`/employees/${row.employeeId}`} className="hover:underline text-blue-600">
                        {row.employeeName}
                      </Link>
                    </TableCell>
                    <TableCell>{row.team}</TableCell>
                    <TableCell>{row.building}</TableCell>
                    <TableCell className="text-center font-bold">{row.riskScore}</TableCell>
                    <TableCell><RiskBadge level={row.riskLevel} /></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.riskFactors.map((f, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.recommendedPrograms.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TqcStatusBadge status={row.currentTrainingStatus === 'none' ? 'not_enrolled' : row.currentTrainingStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
