import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Users,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import type { TrainingSession, TrainingResultRecord } from '@/types';
import type { Trainer } from '@/types';

// Extended trainer type matching Trainers.tsx
interface TrainerWithStats extends Trainer {
  total_sessions?: number;
  average_rating?: number;
}

interface TrainerAnalyticsProps {
  trainers: TrainerWithStats[];
  sessions: TrainingSession[];
  results: TrainingResultRecord[];
  isLoading: boolean;
}

export default function TrainerAnalytics({
  trainers,
  sessions,
  results,
  isLoading,
}: TrainerAnalyticsProps) {
  const { t } = useTranslation();
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('all');

  // Compute trainer stats from sessions and results
  const trainerStatsMap = useMemo(() => {
    const statsMap = new Map<string, {
      sessionCount: number;
      traineeCount: number;
      passCount: number;
      totalResultCount: number;
      programs: Set<string>;
      monthlySessions: Map<string, number>;
    }>();

    // Initialize stats for all trainers
    for (const trainer of trainers) {
      statsMap.set(trainer.trainer_name, {
        sessionCount: 0,
        traineeCount: 0,
        passCount: 0,
        totalResultCount: 0,
        programs: new Set(),
        monthlySessions: new Map(),
      });
    }

    // Count sessions per trainer
    for (const session of sessions) {
      const trainerName = session.trainer_name || session.trainer;
      if (!trainerName) continue;

      const stats = statsMap.get(trainerName);
      if (!stats) continue;

      stats.sessionCount += 1;
      stats.programs.add(session.program_code);
      stats.traineeCount += session.attendees?.length || 0;

      // Monthly grouping (YYYY-MM)
      const monthKey = session.session_date?.substring(0, 7);
      if (monthKey) {
        stats.monthlySessions.set(
          monthKey,
          (stats.monthlySessions.get(monthKey) || 0) + 1
        );
      }
    }

    // Count pass/fail from results
    for (const result of results) {
      const trainerName = result.trainer_name;
      if (!trainerName) continue;

      const stats = statsMap.get(trainerName);
      if (!stats) continue;

      stats.totalResultCount += 1;
      if (result.result === 'PASS') {
        stats.passCount += 1;
      }
    }

    return statsMap;
  }, [trainers, sessions, results]);

  // KPI aggregates
  const kpis = useMemo(() => {
    let totalSessions = 0;
    let totalTrainees = 0;
    let totalPass = 0;
    let totalResults = 0;
    const allPrograms = new Set<string>();

    for (const [, stats] of trainerStatsMap) {
      totalSessions += stats.sessionCount;
      totalTrainees += stats.traineeCount;
      totalPass += stats.passCount;
      totalResults += stats.totalResultCount;
      for (const p of stats.programs) allPrograms.add(p);
    }

    const avgPassRate = totalResults > 0
      ? Math.round((totalPass / totalResults) * 100)
      : 0;

    return {
      totalSessions,
      totalTrainees,
      avgPassRate,
      uniquePrograms: allPrograms.size,
    };
  }, [trainerStatsMap]);

  // Monthly sessions chart data (last 6 months)
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      );
    }

    if (selectedTrainerId === 'all') {
      // Show top trainers (those with sessions)
      const trainerNames = trainers
        .filter((tr) => {
          const stats = trainerStatsMap.get(tr.trainer_name);
          return stats && stats.sessionCount > 0;
        })
        .slice(0, 5)
        .map((tr) => tr.trainer_name);

      return months.map((month) => {
        const entry: Record<string, string | number> = {
          name: month.substring(5) + '/' + month.substring(0, 4),
        };
        for (const name of trainerNames) {
          const stats = trainerStatsMap.get(name);
          entry[name] = stats?.monthlySessions.get(month) || 0;
        }
        return entry;
      });
    } else {
      const trainer = trainers.find((tr) => tr.trainer_id === selectedTrainerId);
      if (!trainer) return [];
      const stats = trainerStatsMap.get(trainer.trainer_name);
      return months.map((month) => ({
        name: month.substring(5) + '/' + month.substring(0, 4),
        [t('trainers.sessions')]: stats?.monthlySessions.get(month) || 0,
      }));
    }
  }, [selectedTrainerId, trainers, trainerStatsMap, t]);

  // Bar configs for monthly chart
  const monthlyBars = useMemo(() => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    if (selectedTrainerId === 'all') {
      const trainerNames = trainers
        .filter((tr) => {
          const stats = trainerStatsMap.get(tr.trainer_name);
          return stats && stats.sessionCount > 0;
        })
        .slice(0, 5)
        .map((tr) => tr.trainer_name);

      return trainerNames.map((name, i) => ({
        dataKey: name,
        name: name,
        fill: colors[i % colors.length],
        radius: [4, 4, 0, 0] as [number, number, number, number],
      }));
    } else {
      return [
        {
          dataKey: t('trainers.sessions'),
          name: t('trainers.sessions'),
          fill: '#3b82f6',
          radius: [4, 4, 0, 0] as [number, number, number, number],
        },
      ];
    }
  }, [selectedTrainerId, trainers, trainerStatsMap, t]);

  // Pass rate by program chart data (for selected trainer or all)
  const passRateByProgramData = useMemo(() => {
    const programStats = new Map<string, { pass: number; total: number }>();

    for (const result of results) {
      if (selectedTrainerId !== 'all') {
        const trainer = trainers.find((tr) => tr.trainer_id === selectedTrainerId);
        if (!trainer || result.trainer_name !== trainer.trainer_name) continue;
      }

      const code = result.program_code;
      if (!code) continue;

      const existing = programStats.get(code) || { pass: 0, total: 0 };
      existing.total += 1;
      if (result.result === 'PASS') existing.pass += 1;
      programStats.set(code, existing);
    }

    return Array.from(programStats.entries())
      .map(([code, stats]) => ({
        name: code,
        [t('trainers.passRate')]: stats.total > 0
          ? Math.round((stats.pass / stats.total) * 100)
          : 0,
      }))
      .sort((a, b) =>
        (b[t('trainers.passRate')] as number) - (a[t('trainers.passRate')] as number)
      )
      .slice(0, 10);
  }, [results, selectedTrainerId, trainers, t]);

  // Trainer comparison table data
  const comparisonData = useMemo(() => {
    return trainers
      .map((trainer) => {
        const stats = trainerStatsMap.get(trainer.trainer_name);
        const passRate = stats && stats.totalResultCount > 0
          ? Math.round((stats.passCount / stats.totalResultCount) * 100)
          : 0;
        return {
          trainer_id: trainer.trainer_id,
          trainer_name: trainer.trainer_name,
          trainer_type: trainer.trainer_type,
          sessionCount: stats?.sessionCount || 0,
          traineeCount: stats?.traineeCount || 0,
          passRate,
          programCount: stats?.programs.size || 0,
        };
      })
      .sort((a, b) => b.passRate - a.passRate || b.sessionCount - a.sessionCount);
  }, [trainers, trainerStatsMap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (trainers.length === 0 || (sessions.length === 0 && results.length === 0)) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{t('trainers.noAnalyticsData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.totalSessions}</p>
                <p className="text-xs text-muted-foreground">
                  {t('trainers.totalSessionsTaught')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.totalTrainees}</p>
                <p className="text-xs text-muted-foreground">
                  {t('trainers.totalTraineesTaught')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.avgPassRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {t('trainers.avgPassRate')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.uniquePrograms}</p>
                <p className="text-xs text-muted-foreground">
                  {t('trainers.programsTaught')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainer selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{t('trainers.selectTrainer')}:</span>
            <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('trainers.allTrainers')}</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.trainer_id} value={trainer.trainer_id}>
                    {trainer.trainer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly sessions chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('trainers.monthlySessionChart')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyChartData.length > 0 && monthlyBars.length > 0 ? (
              <LazyBarChart
                data={monthlyChartData}
                bars={monthlyBars}
                height={280}
                xAxisKey="name"
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                {t('trainers.noAnalyticsData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pass rate by program chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('trainers.passRateByProgram')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {passRateByProgramData.length > 0 ? (
              <LazyBarChart
                data={passRateByProgramData}
                bars={[
                  {
                    dataKey: t('trainers.passRate'),
                    name: t('trainers.passRate'),
                    fill: '#10b981',
                    radius: [4, 4, 0, 0],
                  },
                ]}
                height={280}
                xAxisKey="name"
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                {t('trainers.noAnalyticsData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trainer comparison table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('trainers.trainerComparison')}</CardTitle>
          <CardDescription>
            {t('trainers.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('trainers.trainerName')}</TableHead>
                <TableHead>{t('trainers.type')}</TableHead>
                <TableHead className="text-center">{t('trainers.sessions')}</TableHead>
                <TableHead className="text-center">{t('trainers.trainees')}</TableHead>
                <TableHead className="text-center">{t('trainers.passRate')}</TableHead>
                <TableHead className="text-center">{t('trainers.programsTaught')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('trainers.noAnalyticsData')}
                  </TableCell>
                </TableRow>
              ) : (
                comparisonData.map((row, idx) => (
                  <TableRow key={row.trainer_id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{row.trainer_name}</TableCell>
                    <TableCell>
                      <Badge variant={row.trainer_type === 'INTERNAL' ? 'default' : 'secondary'}>
                        {row.trainer_type === 'INTERNAL'
                          ? t('trainers.internalShort')
                          : t('trainers.externalShort')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{row.sessionCount}</TableCell>
                    <TableCell className="text-center">{row.traineeCount}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          row.passRate >= 80
                            ? 'text-green-600 font-medium'
                            : row.passRate >= 60
                              ? 'text-yellow-600 font-medium'
                              : 'text-red-600 font-medium'
                        }
                      >
                        {row.passRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{row.programCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
