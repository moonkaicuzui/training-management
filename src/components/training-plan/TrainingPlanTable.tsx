import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// --- Types ---

export interface ProgramQualityStat {
  code: string;
  name: string;
  sessions: number;
  passRate: number;
  retrainingNeeded: number;
}

interface RetrainingTarget {
  employee?: { employee_name?: string; department?: string };
  program?: { program_name?: string; program_code?: string };
  lastResult?: { score?: number | null };
}

interface ExpiringTraining {
  employee?: { employee_name?: string; department?: string };
  program?: { program_name?: string; program_code?: string };
  expirationDate?: string;
  daysUntilExpiry: number;
}

// --- QualityMetricsSummary ---

export function QualityMetricsSummary({
  retrainingCount,
  expiringCount,
  passRate,
  onViewRetraining,
}: {
  retrainingCount: number;
  expiringCount: number;
  passRate: number;
  onViewRetraining: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          {t('trainingPlan.qualityManagementStatus')}
        </CardTitle>
        <CardDescription>
          {t('trainingPlan.qualityMetricsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{retrainingCount}</p>
              <p className="text-xs text-muted-foreground">{t('trainingPlan.retrainingNeeded')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{expiringCount}</p>
              <p className="text-xs text-muted-foreground">{t('trainingPlan.expiringWithin30Days')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{passRate}%</p>
              <p className="text-xs text-muted-foreground">{t('trainingPlan.overallPassRate')}</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Button variant="outline" size="sm" onClick={onViewRetraining} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('trainingPlan.linkRetrainingPlan')}
            </Button>
          </div>
        </div>

        {retrainingCount > 0 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{t('trainingPlan.caution')}:</span>
              {t('trainingPlan.retrainingWarning', { count: retrainingCount })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- ProgramQualityStatus ---

export function ProgramQualityStatus({ programs }: { programs: ProgramQualityStat[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('trainingPlan.programQualityStatus')}
        </CardTitle>
        <CardDescription>
          {t('trainingPlan.programQualityDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('trainingPlan.program')}</TableHead>
              <TableHead className="text-center">{t('trainingPlan.sessions')}</TableHead>
              <TableHead className="text-center">{t('trainingPlan.passRate')}</TableHead>
              <TableHead className="text-center">{t('trainingPlan.retrainingNeeded')}</TableHead>
              <TableHead className="text-center">{t('common.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((prog) => (
              <TableRow key={prog.code}>
                <TableCell>
                  <div>
                    <p className="font-medium">{prog.name}</p>
                    <p className="text-xs text-muted-foreground">{prog.code}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">{prog.sessions}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={prog.passRate >= 90 ? 'success' : prog.passRate >= 70 ? 'warning' : 'destructive'}>
                    {prog.passRate}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {prog.retrainingNeeded > 0 ? (
                    <Badge variant="destructive">{prog.retrainingNeeded}{t('trainingPlan.personUnit')}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {prog.passRate >= 90 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                  ) : prog.passRate >= 70 ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- QualityTabContent ---

export function QualityTabContent({
  programQualityStats,
  retrainingTargets,
  expiringTrainings,
}: {
  programQualityStats: ProgramQualityStat[];
  retrainingTargets: RetrainingTarget[] | null;
  expiringTrainings: ExpiringTraining[] | null;
}) {
  const { t } = useTranslation();

  return (
    <>
      <ProgramQualityStatus programs={programQualityStats} />

      {/* 재교육 필요 인원 상세 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            {t('trainingPlan.retrainingDetailTitle')}
          </CardTitle>
          <CardDescription>
            {t('trainingPlan.retrainingDetailDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {retrainingTargets && retrainingTargets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('trainingPlan.employeeName')}</TableHead>
                  <TableHead>{t('trainingPlan.department')}</TableHead>
                  <TableHead>{t('trainingPlan.program')}</TableHead>
                  <TableHead>{t('common.score')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retrainingTargets.slice(0, 10).map((target, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {target.employee?.employee_name ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{target.employee?.department ?? '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{target.program?.program_name ?? '-'}</p>
                        <p className="text-xs text-muted-foreground">{target.program?.program_code ?? '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {target.lastResult?.score ?? 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        {t('trainingPlan.retrainingNeeded')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">{t('trainingPlan.noRetrainingTargets')}</p>
              <p className="text-sm">{t('trainingPlan.allEmployeesCompleted')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 만료 임박 교육 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            {t('trainingPlan.expiringTrainingTitle')}
          </CardTitle>
          <CardDescription>
            {t('trainingPlan.expiringTrainingDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expiringTrainings && expiringTrainings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('trainingPlan.employeeName')}</TableHead>
                  <TableHead>{t('trainingPlan.department')}</TableHead>
                  <TableHead>{t('trainingPlan.program')}</TableHead>
                  <TableHead>{t('trainingPlan.expirationDate')}</TableHead>
                  <TableHead>{t('trainingPlan.daysRemaining')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringTrainings.slice(0, 10).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {item.employee?.employee_name ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.employee?.department ?? '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{item.program?.program_name ?? '-'}</p>
                        <p className="text-xs text-muted-foreground">{item.program?.program_code ?? '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.daysUntilExpiry <= 7 ? 'destructive' : 'warning'}>
                        D-{item.daysUntilExpiry ?? '?'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">{t('trainingPlan.noExpiringTraining')}</p>
              <p className="text-sm">{t('trainingPlan.noExpiringTrainingDesc')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
