import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type EffectivenessResult,
  type ProgramEffectivenessSummary,
  type EffectivenessChartData,
  getRatingBadgeVariant,
  summarizeByProgram,
  toChartData,
} from '@/utils/trainingEffectiveness';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  ThumbsDown,
  Award,
  Users,
  Activity,
} from 'lucide-react';

interface EffectivenessTabProps {
  isLoading: boolean;
  effectivenessResults: EffectivenessResult[];
  overallStats: {
    totalEmployees: number;
    avgImprovement: number;
    significantCount: number;
    noneCount: number;
  };
}

export function EffectivenessTab({
  isLoading,
  effectivenessResults,
  overallStats,
}: EffectivenessTabProps) {
  const { t } = useTranslation();

  const programEffectivenessSummaries = useMemo((): ProgramEffectivenessSummary[] => {
    return summarizeByProgram(effectivenessResults);
  }, [effectivenessResults]);

  const effectivenessChartData = useMemo((): EffectivenessChartData[] => {
    return toChartData(programEffectivenessSummaries);
  }, [programEffectivenessSummaries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (effectivenessResults.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('evaluation.effectiveness.noData')}</p>
            <p className="text-sm mt-1">{t('evaluation.effectiveness.noDataDesc')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Effectiveness Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.effectiveness.measuredEmployees')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.effectiveness.measuredDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.effectiveness.avgImprovement')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallStats.avgImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallStats.avgImprovement > 0 ? '+' : ''}
              {overallStats.avgImprovement}%
            </div>
            <Progress
              value={Math.min(Math.max(overallStats.avgImprovement, 0), 100)}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.effectiveness.significantImprovement')}
            </CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallStats.significantCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.effectiveness.significantDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.effectiveness.noImprovement')}
            </CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overallStats.noneCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.effectiveness.noImprovementDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Program Effectiveness Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('evaluation.effectiveness.programSummaryTitle')}
          </CardTitle>
          <CardDescription>
            {t('evaluation.effectiveness.programSummaryDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {effectivenessChartData.length > 0 && (
            <div className="mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('evaluation.effectiveness.programCol')}</TableHead>
                    <TableHead className="text-right">{t('evaluation.effectiveness.employeeCountCol')}</TableHead>
                    <TableHead className="text-right">{t('evaluation.effectiveness.beforeCol')}</TableHead>
                    <TableHead className="text-right">{t('evaluation.effectiveness.afterCol')}</TableHead>
                    <TableHead className="text-right">{t('evaluation.effectiveness.improvementCol')}</TableHead>
                    <TableHead>{t('evaluation.effectiveness.ratingCol')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programEffectivenessSummaries.map((summary) => (
                    <TableRow key={summary.programCode}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{summary.programName}</p>
                          <p className="text-sm text-muted-foreground">{summary.programCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{summary.employeeCount}</TableCell>
                      <TableCell className="text-right">{summary.avgBeforeFailRate}%</TableCell>
                      <TableCell className="text-right">{summary.avgAfterFailRate}%</TableCell>
                      <TableCell className="text-right">
                        <span className={summary.avgImprovementPercent > 0 ? 'text-green-600' : 'text-red-600'}>
                          {summary.avgImprovementPercent > 0 ? '+' : ''}
                          {summary.avgImprovementPercent}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRatingBadgeVariant(summary.rating)}>
                          {t(`evaluation.effectiveness.rating_${summary.rating}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Employee Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('evaluation.effectiveness.individualTitle')}
          </CardTitle>
          <CardDescription>
            {t('evaluation.effectiveness.individualDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('evaluation.effectiveness.employeeCol')}</TableHead>
                <TableHead>{t('evaluation.effectiveness.programCol')}</TableHead>
                <TableHead className="text-right">{t('evaluation.effectiveness.beforeCol')}</TableHead>
                <TableHead className="text-right">{t('evaluation.effectiveness.afterCol')}</TableHead>
                <TableHead className="text-right">{t('evaluation.effectiveness.improvementCol')}</TableHead>
                <TableHead>{t('evaluation.effectiveness.ratingCol')}</TableHead>
                <TableHead>{t('evaluation.effectiveness.enrolledDateCol')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {effectivenessResults.slice(0, 50).map((result, idx) => (
                <TableRow key={`${result.employeeId}-${result.programCode}-${idx}`}>
                  <TableCell className="font-medium">{result.employeeName}</TableCell>
                  <TableCell>
                    <div>
                      <p>{result.programName}</p>
                      <p className="text-xs text-muted-foreground">{result.programCode}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{result.beforeFailRate}%</TableCell>
                  <TableCell className="text-right">{result.afterFailRate}%</TableCell>
                  <TableCell className="text-right">
                    <span className={result.improvementPercent > 0 ? 'text-green-600' : 'text-red-600'}>
                      {result.improvementPercent > 0 ? '+' : ''}
                      {result.improvementPercent}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRatingBadgeVariant(result.rating)}>
                      {t(`evaluation.effectiveness.rating_${result.rating}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {result.enrolledAt.split('T')[0]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
