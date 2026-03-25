import * as tqcService from '../tqcService';

import type {
  NewTQCTrainee,
  NewTQCTraineeFilters,
  NewTQCTraineeInput,
  NewTQCTraineeUpdate,
  NewTQCTraineeWithDetails,
  NewTQCTrainingStage,
  NewTQCMeeting,
} from '@/types';

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

  // H-3: timestamp + random으로 고유 ID 생성 (충돌 방지)
  const traineeId = `TRN-${new Date().getFullYear()}-${Date.now().toString(36).slice(-4)}${Math.random().toString(36).substring(2, 5)}`;

  const expectedEndDate = new Date(startDate);
  expectedEndDate.setMonth(expectedEndDate.getMonth() + 3);

  // Firestore 쓰기용 데이터 (created_at/updated_at는 tqcService에서 serverTimestamp() 적용)
  const traineeData: NewTQCTrainee = {
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

  const defaultStages = ['Orientation', 'Basic Training', 'Line Assignment', 'Field Evaluation'];
  const stages: NewTQCTrainingStage[] = defaultStages.map((stageName, index) => ({
    stage_id: `STG-${traineeId.split('-').slice(1).join('-')}-${index + 1}`,
    trainee_id: traineeId,
    stage_name: stageName,
    stage_order: index + 1,
    status: 'PENDING' as const,
    updated_at: now,
  }));

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

  await tqcService.createTrainee(traineeData);
  await tqcService.batchCreateStagesAndMeetings(stages, meetings);

  // 반환 객체에는 클라이언트 시간 유지 (Firestore에는 serverTimestamp() 적용됨)
  return traineeData;
}

export async function updateNewTQCTrainee(
  input: NewTQCTraineeUpdate
): Promise<NewTQCTrainee | null> {
  const existing = await tqcService.getTraineeById(input.trainee_id);
  if (!existing) return null;

  // updated_at는 tqcService.updateTrainee 내부에서 serverTimestamp() 적용
  await tqcService.updateTrainee(input.trainee_id, input);

  return tqcService.getTraineeById(input.trainee_id);
}
