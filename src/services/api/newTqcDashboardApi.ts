import * as tqcService from '../tqcService';

import type {
  NewTQCResignation,
  NewTQCDashboardStats,
  NewTQCResignationAnalysis,
} from '@/types';

export async function getNewTQCDashboardStats(): Promise<NewTQCDashboardStats> {
  const [trainees, meetings] = await Promise.all([
    tqcService.getTrainees(),
    tqcService.getMeetings(),
  ]);

  const inTraining = trainees.filter(t => t.status === 'IN_TRAINING');
  const completed = trainees.filter(t => t.status === 'COMPLETED');
  const resigned = trainees.filter(t => t.status === 'RESIGNED');

  const colorBlindPending = trainees.filter(
    t => t.status === 'IN_TRAINING' && t.color_blind_status === null
  );
  const colorBlindFailed = trainees.filter(t => t.color_blind_status === 'FAIL');

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const meetingsThisWeek = meetings.filter(m => {
    const meetingDate = new Date(m.scheduled_date);
    return meetingDate >= weekStart && meetingDate <= weekEnd;
  });

  const meetingsPending = meetings.filter(
    m => m.status === 'SCHEDULED' && new Date(m.scheduled_date) <= now
  );

  const avgProgress =
    inTraining.length > 0
      ? Math.round(
          inTraining.reduce((sum, t) => sum + t.progress_percentage, 0) / inTraining.length
        )
      : 0;

  const resignationRate =
    trainees.length > 0 ? Math.round((resigned.length / trainees.length) * 100) : 0;

  return {
    totalTrainees: trainees.length,
    inTraining: inTraining.length,
    completed: completed.length,
    resigned: resigned.length,
    colorBlindPending: colorBlindPending.length,
    colorBlindFailed: colorBlindFailed.length,
    meetingsThisWeek: meetingsThisWeek.length,
    meetingsPending: meetingsPending.length,
    averageProgress: avgProgress,
    resignationRate,
  };
}

export async function getNewTQCResignationAnalysis(): Promise<NewTQCResignationAnalysis> {
  const [resignations, trainees] = await Promise.all([
    tqcService.getResignations(),
    tqcService.getTrainees(),
  ]);

  const reasonCounts: Record<string, number> = {};
  resignations.forEach(r => {
    reasonCounts[r.reason_category] = (reasonCounts[r.reason_category] || 0) + 1;
  });
  const byReason = Object.entries(reasonCounts).map(([reason, count]) => ({
    reason: reason as NewTQCResignation['reason_category'],
    count,
    percentage: resignations.length > 0 ? Math.round((count / resignations.length) * 100) : 0,
  }));

  const monthCounts: Record<string, number> = {};
  resignations.forEach(r => {
    const month = r.resign_date.substring(0, 7);
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });
  const byMonth = Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const trainerStats: Record<string, { count: number; total: number }> = {};
  trainees.forEach(t => {
    if (!trainerStats[t.trainer_id]) {
      trainerStats[t.trainer_id] = { count: 0, total: 0 };
    }
    trainerStats[t.trainer_id].total++;
    if (t.status === 'RESIGNED') {
      trainerStats[t.trainer_id].count++;
    }
  });
  const byTrainer = Object.entries(trainerStats).map(([trainer, stats]) => ({
    trainer,
    count: stats.count,
    total: stats.total,
    rate: stats.total > 0 ? Math.round((stats.count / stats.total) * 100) : 0,
  }));

  const teamStats: Record<string, { count: number; total: number }> = {};
  trainees.forEach(t => {
    if (!teamStats[t.team_id]) {
      teamStats[t.team_id] = { count: 0, total: 0 };
    }
    teamStats[t.team_id].total++;
    if (t.status === 'RESIGNED') {
      teamStats[t.team_id].count++;
    }
  });
  const byTeam = Object.entries(teamStats).map(([team, stats]) => ({
    team,
    count: stats.count,
    total: stats.total,
    rate: stats.total > 0 ? Math.round((stats.count / stats.total) * 100) : 0,
  }));

  const weekCounts: Record<number, number> = {};
  trainees
    .filter(t => t.status === 'RESIGNED')
    .forEach(t => {
      weekCounts[t.start_week] = (weekCounts[t.start_week] || 0) + 1;
    });
  const byWeek = Object.entries(weekCounts)
    .map(([week, count]) => ({ week: parseInt(week, 10), count }))
    .sort((a, b) => a.week - b.week);

  const avgTrainingDays =
    resignations.length > 0
      ? Math.round(
          resignations.reduce((sum, r) => sum + r.training_duration_days, 0) / resignations.length
        )
      : 0;

  return {
    byReason,
    byMonth,
    byTrainer,
    byTeam,
    byWeek,
    averageTrainingDays: avgTrainingDays,
  };
}
