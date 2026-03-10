import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { NormalizedRetrainingTarget } from '@/types/normalized';
import { format } from 'date-fns';

function getAttemptLabel(attempt: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (attempt <= 3) {
    return t(`extendedDashboard.attempt_${attempt}`);
  }
  return t('extendedDashboard.attempt_n', { n: attempt });
}

interface DashboardRetrainingTableProps {
  targets: readonly NormalizedRetrainingTarget[];
}

export function DashboardRetrainingTable({ targets }: DashboardRetrainingTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('retraining.title')}</CardTitle>
          <CardDescription>{t('dashboard.retrainingList')} {t('dashboard.recent10')}</CardDescription>
        </div>
        {targets.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => navigate('/retraining')}>
            {t('common.viewAll')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {targets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="rounded-full bg-status-pass/10 p-6 mb-4">
              <ClipboardCheck className="h-12 w-12 text-status-pass" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.noRetrainingNeeded')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('dashboard.allEmployeesCompliant')}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table aria-label={t('common.aria.retrainingTable')}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('employee.name')}</TableHead>
                    <TableHead>{t('employee.position')}</TableHead>
                    <TableHead>{t('employee.building')}</TableHead>
                    <TableHead>{t('common.program')}</TableHead>
                    <TableHead>{t('extendedDashboard.failCount')}</TableHead>
                    <TableHead>{t('common.failDate')}</TableHead>
                    <TableHead>{t('common.score')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.slice(0, 10).map((target, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {target.employee.employee_name}
                      </TableCell>
                      <TableCell>{target.employee.position}</TableCell>
                      <TableCell>
                        {t(`building.${target.employee.building}`)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {target.program.program_code}
                        </Badge>
                        <span className="ml-2 text-sm">
                          {target.program.program_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (target.last_result.test_attempt ?? 1) >= 3
                              ? 'destructive'
                              : (target.last_result.test_attempt ?? 1) >= 2
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {getAttemptLabel(target.last_result.test_attempt ?? 1, t)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(target.last_result.training_date), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {target.last_result.score ?? 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/employees/${target.employee.employee_id}`)}
                        >
                          {t('common.detail')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {targets.slice(0, 10).map((target, index) => (
                <Card key={index} className="p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-base">{target.employee.employee_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {target.employee.position}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {target.last_result.score ?? 'N/A'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('employee.building')}:</span>
                      <span className="font-medium">
                        {t(`building.${target.employee.building}`)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('common.program')}:</span>
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className="mb-1">
                          {target.program.program_code}
                        </Badge>
                        <span className="text-xs">{target.program.program_name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('extendedDashboard.failCount')}:</span>
                      <Badge
                        variant={
                          (target.last_result.test_attempt ?? 1) >= 3
                            ? 'destructive'
                            : (target.last_result.test_attempt ?? 1) >= 2
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {getAttemptLabel(target.last_result.test_attempt ?? 1, t)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('common.failDate')}:</span>
                      <span className="font-medium">
                        {format(new Date(target.last_result.training_date), 'yyyy-MM-dd')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => navigate(`/employees/${target.employee.employee_id}`)}
                  >
                    {t('common.detail')}
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
