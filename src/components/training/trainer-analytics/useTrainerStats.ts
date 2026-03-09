import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrainingSession, TrainingResultRecord } from '@/types';
import type {
  TrainerWithStats,
  TrainerStats,
  KPIData,
  ComparisonRow,
} from './types';

export function useTrainerStatsMap(
  trainers: TrainerWithStats[],
  sessions: TrainingSession[],
  results: TrainingResultRecord[]
): Map<string, TrainerStats> {
  return useMemo(() => {
    const statsMap = new Map<string, TrainerStats>();

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

    for (const session of sessions) {
      const trainerName = session.trainer_name || session.trainer;
      if (!trainerName) continue;

      const stats = statsMap.get(trainerName);
      if (!stats) continue;

      stats.sessionCount += 1;
      stats.programs.add(session.program_code);
      stats.traineeCount += session.attendees?.length || 0;

      const monthKey = session.session_date?.substring(0, 7);
      if (monthKey) {
        stats.monthlySessions.set(
          monthKey,
          (stats.monthlySessions.get(monthKey) || 0) + 1
        );
      }
    }

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
}

export function useKPIs(trainerStatsMap: Map<string, TrainerStats>): KPIData {
  return useMemo(() => {
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
}

export function useMonthlyChartData(
  selectedTrainerId: string,
  trainers: TrainerWithStats[],
  trainerStatsMap: Map<string, TrainerStats>
): Record<string, string | number>[] {
  const { t } = useTranslation();

  return useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      );
    }

    if (selectedTrainerId === 'all') {
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
}

interface BarConfig {
  dataKey: string;
  name: string;
  fill: string;
  radius: [number, number, number, number];
}

export function useMonthlyBars(
  selectedTrainerId: string,
  trainers: TrainerWithStats[],
  trainerStatsMap: Map<string, TrainerStats>
): BarConfig[] {
  const { t } = useTranslation();

  return useMemo(() => {
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
}

export function usePassRateByProgramData(
  results: TrainingResultRecord[],
  selectedTrainerId: string,
  trainers: TrainerWithStats[]
): Record<string, string | number>[] {
  const { t } = useTranslation();

  return useMemo(() => {
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
}

export function useComparisonData(
  trainers: TrainerWithStats[],
  trainerStatsMap: Map<string, TrainerStats>
): ComparisonRow[] {
  return useMemo(() => {
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
}
