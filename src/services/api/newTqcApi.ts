// ============================================================
// Q-TRAIN New TQC API
// 신입 TQC 교육 관리 (Teams, Trainees, Stages, Meetings, Resignations)
// ============================================================

import * as tqcService from '../tqcService';

import type {
  NewTQCTeam,
  NewTQCTrainee,
  NewTQCTraineeFilters,
  NewTQCColorBlindTest,
  NewTQCColorBlindTestInput,
  NewTQCTrainingStage,
  NewTQCStageUpdate,
  NewTQCMeeting,
  NewTQCMeetingFilters,
  NewTQCMeetingInput,
  NewTQCMeetingUpdate,
  NewTQCResignation,
  NewTQCResignationFilters,
  NewTQCResignationInput,
  NewTQCTraineeInput,
  NewTQCTraineeUpdate,
  NewTQCTeamInput,
  NewTQCTeamUpdate,
  NewTQCDashboardStats,
  NewTQCResignationAnalysis,
  NewTQCTraineeWithDetails,
} from '@/types';

import { NotFoundError } from './common';

// ========== New TQC Team API ==========

export async function getNewTQCTeams(includeInactive = false): Promise<NewTQCTeam[]> {
  return tqcService.getTeams(includeInactive);
}

export async function getNewTQCTeamById(teamId: string): Promise<NewTQCTeam | null> {
  return tqcService.getTeamById(teamId);
}

export async function createNewTQCTeam(input: NewTQCTeamInput): Promise<NewTQCTeam> {
  return tqcService.createTeam(input);
}

export async function updateNewTQCTeam(input: NewTQCTeamUpdate): Promise<NewTQCTeam | null> {
  return tqcService.updateTeam(input);
}

export async function deleteNewTQCTeam(teamId: string): Promise<boolean> {
  return tqcService.deleteTeam(teamId);
}

// ========== New TQC Trainee API ==========

export async function getNewTQCTrainees(
  filters?: NewTQCTraineeFilters
): Promise<NewTQCTrainee[]> {
  return tqcService.getTrainees(filters);
}

export async function getNewTQCTraineeById(traineeId: string): Promise<NewTQCTrainee | null> {
  return tqcService.getTraineeById(traineeId);
}

export async function getNewTQCTraineeWithDetails(
  traineeId: string
): Promise<NewTQCTraineeWithDetails | null> {
  const trainee = await tqcService.getTraineeById(traineeId);
  if (!trainee) return null;

  const [team, stages, colorBlindTests, meetings, resignations] = await Promise.all([
    tqcService.getTeamById(trainee.team_id),
    tqcService.getStagesByTrainee(traineeId),
    tqcService.getColorBlindTests(traineeId),
    tqcService.getMeetings({ traineeId }),
    tqcService.getResignations(),
  ]);

  const resignation = resignations.find(r => r.trainee_id === traineeId);

  return {
    ...trainee,
    team: team || undefined,
    stages: stages.sort((a, b) => a.stage_order - b.stage_order),
    colorBlindTests: colorBlindTests.sort((a, b) => b.test_date.localeCompare(a.test_date)),
    meetings: meetings.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
    resignation,
  };
}

export async function createNewTQCTrainee(input: NewTQCTraineeInput): Promise<NewTQCTrainee> {
  const now = new Date().toISOString();
  const startDate = new Date(input.start_date);
  const startOfYear = new Date(startDate.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((startDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + 1) / 7
  );

  // Generate trainee ID
  const existingTrainees = await tqcService.getTrainees();
  const traineeCount = existingTrainees.length + 1;
  const traineeId = `TRN-${new Date().getFullYear()}-${String(traineeCount).padStart(3, '0')}`;

  const expectedEndDate = new Date(startDate);
  expectedEndDate.setMonth(expectedEndDate.getMonth() + 3);

  const newTrainee: NewTQCTrainee = {
    trainee_id: traineeId,
    employee_id: input.employee_id,
    name: input.name,
    team_id: input.team_id,
    trainer_id: input.trainer_id,
    start_week: weekNum,
    start_date: input.start_date,
    expected_end_date: expectedEndDate.toISOString().split('T')[0],
    introducer: input.introducer,
    building: input.building,
    working_area: input.working_area,
    status: 'IN_TRAINING',
    color_blind_status: null,
    progress_percentage: 0,
    notes: input.notes,
    created_at: now,
    updated_at: now,
    created_by: 'admin',
  };

  // Create default training stages
  const defaultStages = ['Orientation', 'Basic Training', 'Line Assignment', 'Field Evaluation'];
  const stages: NewTQCTrainingStage[] = defaultStages.map((stageName, index) => ({
    stage_id: `STG-${traineeId.split('-').slice(1).join('-')}-${index + 1}`,
    trainee_id: traineeId,
    stage_name: stageName,
    stage_order: index + 1,
    status: 'PENDING' as const,
    updated_at: now,
  }));

  // Auto-create scheduled meetings (1WEEK, 1MONTH, 3MONTH)
  const meetingTypes: Array<'1WEEK' | '1MONTH' | '3MONTH'> = ['1WEEK', '1MONTH', '3MONTH'];
  const meetings: NewTQCMeeting[] = meetingTypes.map((type) => {
    const meetingDate = new Date(startDate);
    if (type === '1WEEK') {
      meetingDate.setDate(meetingDate.getDate() + 7);
    } else if (type === '1MONTH') {
      meetingDate.setMonth(meetingDate.getMonth() + 1);
    } else {
      meetingDate.setMonth(meetingDate.getMonth() + 3);
    }

    return {
      meeting_id: `MTG-${traineeId.split('-').slice(1).join('-')}-${type}`,
      trainee_id: traineeId,
      meeting_type: type,
      scheduled_date: meetingDate.toISOString().split('T')[0],
      status: 'SCHEDULED' as const,
      attendees: [input.trainer_id],
      notes: undefined,
      created_at: now,
      updated_at: now,
    };
  });

  // Write all to Firestore atomically
  await tqcService.createTrainee(newTrainee);
  await tqcService.batchCreateStagesAndMeetings(stages, meetings);

  return newTrainee;
}

export async function updateNewTQCTrainee(
  input: NewTQCTraineeUpdate
): Promise<NewTQCTrainee | null> {
  const existing = await tqcService.getTraineeById(input.trainee_id);
  if (!existing) return null;

  await tqcService.updateTrainee(input.trainee_id, {
    ...input,
    updated_at: new Date().toISOString(),
  });

  return tqcService.getTraineeById(input.trainee_id);
}

// ========== New TQC Color Blind Test API ==========

export async function getNewTQCColorBlindTests(traineeId?: string): Promise<NewTQCColorBlindTest[]> {
  return tqcService.getColorBlindTests(traineeId);
}

export async function createNewTQCColorBlindTest(
  input: NewTQCColorBlindTestInput
): Promise<NewTQCColorBlindTest> {
  const now = new Date().toISOString();
  const existingTests = await tqcService.getColorBlindTests();
  const testCount = existingTests.length + 1;

  const newTest: NewTQCColorBlindTest = {
    test_id: `CBT-${new Date().getFullYear()}-${String(testCount).padStart(3, '0')}`,
    trainee_id: input.trainee_id,
    test_date: input.test_date,
    result: input.result,
    notes: input.notes,
    tested_by: 'admin',
    created_at: now,
  };

  await tqcService.createColorBlindTest(newTest);

  // Update trainee's color_blind_status
  await tqcService.updateTrainee(input.trainee_id, {
    color_blind_status: input.result,
    updated_at: now,
  });

  return newTest;
}

// ========== New TQC Training Stage API ==========

export async function getNewTQCTrainingStages(traineeId: string): Promise<NewTQCTrainingStage[]> {
  return tqcService.getStagesByTrainee(traineeId);
}

export async function updateNewTQCTrainingStage(
  input: NewTQCStageUpdate
): Promise<NewTQCTrainingStage | null> {
  const stages = await tqcService.getStagesByTrainee('');
  const existingStage = stages.find(s => s.stage_id === input.stage_id);
  if (!existingStage) {
    // Fallback: try fetching all stages to find this one
    // We need the trainee_id to update progress
  }

  const now = new Date().toISOString();
  await tqcService.updateStage(input.stage_id, {
    ...input,
    updated_at: now,
    updated_by: 'admin',
  });

  // Find the trainee_id by querying stages that match this stage_id
  const allTrainees = await tqcService.getTrainees();
  for (const trainee of allTrainees) {
    const traineeStages = await tqcService.getStagesByTrainee(trainee.trainee_id);
    const matchingStage = traineeStages.find(s => s.stage_id === input.stage_id);
    if (matchingStage) {
      // Update trainee progress
      const completedCount = traineeStages.filter(s =>
        s.stage_id === input.stage_id
          ? (input.status || s.status) === 'COMPLETED'
          : s.status === 'COMPLETED'
      ).length;
      const progress = Math.round((completedCount / traineeStages.length) * 100);

      const traineeUpdates: Partial<NewTQCTrainee> = {
        progress_percentage: progress,
        updated_at: now,
      };

      if (progress === 100) {
        traineeUpdates.status = 'COMPLETED';
      }

      await tqcService.updateTrainee(trainee.trainee_id, traineeUpdates);

      // Return updated stage
      const updatedStages = await tqcService.getStagesByTrainee(trainee.trainee_id);
      return updatedStages.find(s => s.stage_id === input.stage_id) || null;
    }
  }

  return null;
}

// ========== New TQC Meeting API ==========

export async function getNewTQCMeetings(filters?: NewTQCMeetingFilters): Promise<NewTQCMeeting[]> {
  return tqcService.getMeetings(filters);
}

export async function createNewTQCMeeting(input: NewTQCMeetingInput): Promise<NewTQCMeeting> {
  const now = new Date().toISOString();
  const existingMeetings = await tqcService.getMeetings();
  const meetingCount = existingMeetings.length + 1;

  const newMeeting: NewTQCMeeting = {
    meeting_id: `MTG-${String(meetingCount).padStart(3, '0')}-${input.meeting_type}`,
    trainee_id: input.trainee_id,
    meeting_type: input.meeting_type,
    scheduled_date: input.scheduled_date,
    status: 'SCHEDULED',
    attendees: input.attendees || [],
    notes: input.notes,
    created_at: now,
    updated_at: now,
  };

  await tqcService.createMeeting(newMeeting);
  return newMeeting;
}

export async function updateNewTQCMeeting(
  input: NewTQCMeetingUpdate
): Promise<NewTQCMeeting | null> {
  const now = new Date().toISOString();
  await tqcService.updateMeeting(input.meeting_id, {
    ...input,
    updated_at: now,
  });

  // Update trainee's meeting date if completed
  if (input.status === 'COMPLETED' && input.completed_date) {
    const meetings = await tqcService.getMeetings();
    const meeting = meetings.find(m => m.meeting_id === input.meeting_id);
    if (meeting) {
      const traineeUpdates: Partial<NewTQCTrainee> = { updated_at: now };
      if (meeting.meeting_type === '1WEEK') {
        traineeUpdates.meeting_1week_date = input.completed_date;
      } else if (meeting.meeting_type === '1MONTH') {
        traineeUpdates.meeting_1month_date = input.completed_date;
      } else if (meeting.meeting_type === '3MONTH') {
        traineeUpdates.meeting_3month_date = input.completed_date;
      }
      await tqcService.updateTrainee(meeting.trainee_id, traineeUpdates);
    }
  }

  // Return updated meeting
  const updatedMeetings = await tqcService.getMeetings();
  return updatedMeetings.find(m => m.meeting_id === input.meeting_id) || null;
}

// ========== New TQC Resignation API ==========

export async function getNewTQCResignations(
  filters?: NewTQCResignationFilters
): Promise<NewTQCResignation[]> {
  let result = await tqcService.getResignations(filters);

  // Additional filters that require trainee data
  if (filters?.trainer && filters.trainer !== 'all') {
    const trainees = await tqcService.getTrainees();
    const traineeIds = trainees
      .filter(t => t.trainer_id === filters.trainer)
      .map(t => t.trainee_id);
    result = result.filter(r => traineeIds.includes(r.trainee_id));
  }

  if (filters?.team && filters.team !== 'all') {
    const trainees = await tqcService.getTrainees();
    const traineeIds = trainees
      .filter(t => t.team_id === filters.team)
      .map(t => t.trainee_id);
    result = result.filter(r => traineeIds.includes(r.trainee_id));
  }

  return result;
}

export async function createNewTQCResignation(
  input: NewTQCResignationInput
): Promise<NewTQCResignation> {
  const now = new Date().toISOString();
  const trainee = await tqcService.getTraineeById(input.trainee_id);
  if (!trainee) throw new NotFoundError('Trainee not found');

  const startDate = new Date(trainee.start_date);
  const resignDate = new Date(input.resign_date);
  const trainingDays = Math.ceil(
    (resignDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const stages = await tqcService.getStagesByTrainee(input.trainee_id);
  const completedStages = stages.filter(s => s.status === 'COMPLETED');
  const lastCompletedStage =
    completedStages.length > 0
      ? completedStages.sort((a, b) => b.stage_order - a.stage_order)[0].stage_name
      : undefined;

  const existingResignations = await tqcService.getResignations();
  const resignationCount = existingResignations.length + 1;

  const newResignation: NewTQCResignation = {
    resignation_id: `RSG-${new Date().getFullYear()}-${String(resignationCount).padStart(3, '0')}`,
    trainee_id: input.trainee_id,
    resign_date: input.resign_date,
    reason_category: input.reason_category,
    reason_detail: input.reason_detail,
    training_duration_days: trainingDays,
    last_completed_stage: lastCompletedStage,
    created_at: now,
    created_by: 'admin',
  };

  await tqcService.createResignation(newResignation);

  // Update trainee status
  await tqcService.updateTrainee(input.trainee_id, {
    status: 'RESIGNED',
    updated_at: now,
  });

  return newResignation;
}

// ========== New TQC Dashboard Stats API ==========

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

// ========== New TQC Resignation Analysis API ==========

export async function getNewTQCResignationAnalysis(): Promise<NewTQCResignationAnalysis> {
  const [resignations, trainees] = await Promise.all([
    tqcService.getResignations(),
    tqcService.getTrainees(),
  ]);

  // By Reason
  const reasonCounts: Record<string, number> = {};
  resignations.forEach(r => {
    reasonCounts[r.reason_category] = (reasonCounts[r.reason_category] || 0) + 1;
  });
  const byReason = Object.entries(reasonCounts).map(([reason, count]) => ({
    reason: reason as NewTQCResignation['reason_category'],
    count,
    percentage: resignations.length > 0 ? Math.round((count / resignations.length) * 100) : 0,
  }));

  // By Month
  const monthCounts: Record<string, number> = {};
  resignations.forEach(r => {
    const month = r.resign_date.substring(0, 7);
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });
  const byMonth = Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // By Trainer
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

  // By Team
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

  // By Week
  const weekCounts: Record<number, number> = {};
  trainees
    .filter(t => t.status === 'RESIGNED')
    .forEach(t => {
      weekCounts[t.start_week] = (weekCounts[t.start_week] || 0) + 1;
    });
  const byWeek = Object.entries(weekCounts)
    .map(([week, count]) => ({ week: parseInt(week, 10), count }))
    .sort((a, b) => a.week - b.week);

  // Average Training Days
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

// ========== New TQC Upcoming Meetings API ==========

export async function getNewTQCUpcomingMeetings(days: number = 7): Promise<NewTQCMeeting[]> {
  const meetings = await tqcService.getMeetings();

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + days);

  return meetings
    .filter(m => {
      const meetingDate = new Date(m.scheduled_date);
      return m.status === 'SCHEDULED' && meetingDate >= now && meetingDate <= endDate;
    })
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
}
