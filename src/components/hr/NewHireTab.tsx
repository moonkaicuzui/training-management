import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Loader2,
} from 'lucide-react';
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
import { KPICard, TqcStatusBadge, EmptyMessage } from './HRHelperComponents';
import type { NewHireTrainingStatus } from '@/services/hrAnalyticsService';

interface NewHireTabProps {
  data: NewHireTrainingStatus[];
  loading: boolean;
  onLoad: () => void;
}

export default function NewHireTab({ data, loading, onLoad }: NewHireTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardDescription>{t('hrAnalytics.newHire.description')}</CardDescription>
        <Button onClick={onLoad} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
          {t('hrAnalytics.loadData')}
        </Button>
      </div>

      {data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <KPICard
            title={t('hrAnalytics.newHire.totalNewHires')}
            value={data.length}
            icon={UserPlus}
          />
          <KPICard
            title={t('hrAnalytics.newHire.tqcEnrolled')}
            value={data.filter((d) => d.tqcStatus !== 'not_enrolled').length}
            icon={BarChart3}
          />
          <KPICard
            title={t('hrAnalytics.newHire.tqcCompleted')}
            value={data.filter((d) => d.tqcStatus === 'completed').length}
            icon={TrendingUp}
          />
          <KPICard
            title={t('hrAnalytics.newHire.avgCompletion')}
            value={`${data.length > 0
              ? Math.round(data.reduce((s, d) => s + d.completionRate, 0) / data.length)
              : 0}%`}
            icon={BarChart3}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : data.length === 0 ? (
        <EmptyMessage message={t('hrAnalytics.empty.newHire')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('hrAnalytics.table.employee')}</TableHead>
                  <TableHead>{t('hrAnalytics.newHire.hireDate')}</TableHead>
                  <TableHead>{t('hrAnalytics.table.team')}</TableHead>
                  <TableHead className="text-center">{t('hrAnalytics.newHire.daysEmployed')}</TableHead>
                  <TableHead>{t('hrAnalytics.newHire.tqcStatusLabel')}</TableHead>
                  <TableHead className="text-right">{t('hrAnalytics.newHire.completionRate')}</TableHead>
                  <TableHead>{t('hrAnalytics.newHire.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow
                    key={row.employeeId}
                    className={row.daysEmployed < 30 ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                  >
                    <TableCell className="font-medium">{row.employeeName}</TableCell>
                    <TableCell>{row.hireDate}</TableCell>
                    <TableCell>{row.team}</TableCell>
                    <TableCell className="text-center">
                      {row.daysEmployed}
                      {row.daysEmployed < 60 && (
                        <Badge variant="outline" className="ml-1 text-xs">&lt;60</Badge>
                      )}
                    </TableCell>
                    <TableCell><TqcStatusBadge status={row.tqcStatus} /></TableCell>
                    <TableCell className="text-right">
                      <span className={row.completionRate >= 80 ? 'text-green-600' : row.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                        {row.completionRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.tqcStatus === 'not_enrolled' && (
                        <Link to="/new-tqc/trainees">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {t('hrAnalytics.newHire.enrollTqc')}
                          </Button>
                        </Link>
                      )}
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
