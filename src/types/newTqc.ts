// ============================================================
// New TQC (신입 TQC 교육) Type Definitions
// Training Management System for HWK Vietnam
// ============================================================

// ========== Enums & Status Types ==========

export type NewTQCTraineeStatus = 'IN_TRAINING' | 'COMPLETED' | 'RESIGNED';

export type ColorBlindTestResult = 'PASS' | 'FAIL';

export type NewTQCTrainingStageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type NewTQCMeetingType = '1WEEK' | '1MONTH' | '3MONTH';

export type NewTQCMeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED';

export type ResignationReason =
  | 'HEALTH_ISSUE'
  | 'FAMILY_MATTERS'
  | 'DISTANCE'
  | 'LOW_SALARY'
  | 'JOB_CHANGE'
  | 'ABSENCE'
  | 'ACCIDENT'
  | 'OTHER';

// ========== Trainer Constants ==========

export const NEW_TQC_TRAINERS = [
  'KIM ANH',
  'NGUYÊN',
  'TRÚC',
  'HẰNG',
  'THÀNH',
  'CƯỜNG',
  'LINH',
  'THÙY LINH',
  'HUYỀN',
] as const;

export type NewTQCTrainer = (typeof NEW_TQC_TRAINERS)[number];

// ========== Default Training Stages ==========

export const DEFAULT_TRAINING_STAGES = [
  'Orientation',
  'Basic Training',
  'Line Assignment',
  'Field Evaluation',
] as const;

// ========== Entity Types ==========

/**
 * NewTQCTeam - 배치예정팀 (관리자 설정 가능)
 */
export interface NewTQCTeam {
  team_id: string;
  team_name: string;
  team_name_vn?: string;
  team_name_kr?: string;
  factory?: string;
  line?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * NewTQCTrainee - 신입 교육생
 */
export interface NewTQCTrainee {
  trainee_id: string;
  employee_id?: string;
  name: string;
  team_id: string;
  trainer_id: string;
  start_week: number;
  start_date: string;
  expected_end_date?: string;
  introducer?: string;
  status: NewTQCTraineeStatus;
  color_blind_status: ColorBlindTestResult | null;
  progress_percentage: number;
  meeting_1week_date?: string;
  meeting_1month_date?: string;
  meeting_3month_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * NewTQCColorBlindTest - Color Blind 검사
 */
export interface NewTQCColorBlindTest {
  test_id: string;
  trainee_id: string;
  test_date: string;
  result: ColorBlindTestResult;
  notes?: string;
  tested_by: string;
  created_at: string;
}

/**
 * NewTQCTrainingStage - 교육 단계
 */
export interface NewTQCTrainingStage {
  stage_id: string;
  trainee_id: string;
  stage_name: string;
  stage_order: number;
  start_date?: string;
  end_date?: string;
  status: NewTQCTrainingStageStatus;
  notes?: string;
  updated_at: string;
  updated_by?: string;
}

/**
 * NewTQCMeeting - 미팅
 */
export interface NewTQCMeeting {
  meeting_id: string;
  trainee_id: string;
  meeting_type: NewTQCMeetingType;
  scheduled_date: string;
  completed_date?: string;
  status: NewTQCMeetingStatus;
  attendees: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * NewTQCResignation - 퇴사 정보
 */
export interface NewTQCResignation {
  resignation_id: string;
  trainee_id: string;
  resign_date: string;
  reason_category: ResignationReason;
  reason_detail?: string;
  training_duration_days: number;
  last_completed_stage?: string;
  created_at: string;
  created_by?: string;
}

// ========== Filter Types ==========

export interface NewTQCTraineeFilters {
  search?: string;
  status?: NewTQCTraineeStatus | 'all';
  trainer?: string | 'all';
  team?: string | 'all';
  startWeek?: string;
  colorBlindStatus?: ColorBlindTestResult | 'pending' | 'all';
}

export interface NewTQCMeetingFilters {
  traineeId?: string;
  meetingType?: NewTQCMeetingType | 'all';
  status?: NewTQCMeetingStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface NewTQCResignationFilters {
  reasonCategory?: ResignationReason | 'all';
  trainer?: string | 'all';
  team?: string | 'all';
  dateFrom?: string;
  dateTo?: string;
}

// ========== Dashboard Stats ==========

export interface NewTQCDashboardStats {
  totalTrainees: number;
  inTraining: number;
  completed: number;
  resigned: number;
  colorBlindPending: number;
  colorBlindFailed: number;
  meetingsThisWeek: number;
  meetingsPending: number;
  averageProgress: number;
  resignationRate: number;
}

export interface NewTQCMonthlyStats {
  month: string;
  newTrainees: number;
  completed: number;
  resigned: number;
}

export interface NewTQCResignationAnalysis {
  byReason: { reason: ResignationReason; count: number; percentage: number }[];
  byMonth: { month: string; count: number }[];
  byTrainer: { trainer: string; count: number; total: number; rate: number }[];
  byTeam: { team: string; count: number; total: number; rate: number }[];
  byWeek: { week: number; count: number }[];
  averageTrainingDays: number;
}

// ========== Input/Form Types ==========

export interface NewTQCTraineeInput {
  employee_id?: string;
  name: string;
  team_id: string;
  trainer_id: string;
  start_date: string;
  introducer?: string;
  notes?: string;
}

export interface NewTQCTraineeUpdate {
  trainee_id: string;
  employee_id?: string;
  name?: string;
  team_id?: string;
  trainer_id?: string;
  status?: NewTQCTraineeStatus;
  notes?: string;
}

export interface NewTQCColorBlindTestInput {
  trainee_id: string;
  test_date: string;
  result: ColorBlindTestResult;
  notes?: string;
}

export interface NewTQCMeetingInput {
  trainee_id: string;
  meeting_type: NewTQCMeetingType;
  scheduled_date: string;
  attendees?: string[];
  notes?: string;
}

export interface NewTQCMeetingUpdate {
  meeting_id: string;
  scheduled_date?: string;
  completed_date?: string;
  status?: NewTQCMeetingStatus;
  attendees?: string[];
  notes?: string;
}

export interface NewTQCStageUpdate {
  stage_id: string;
  start_date?: string;
  end_date?: string;
  status?: NewTQCTrainingStageStatus;
  notes?: string;
}

export interface NewTQCResignationInput {
  trainee_id: string;
  resign_date: string;
  reason_category: ResignationReason;
  reason_detail?: string;
}

export interface NewTQCTeamInput {
  team_name: string;
  team_name_vn?: string;
  team_name_kr?: string;
  factory?: string;
  line?: string;
}

export interface NewTQCTeamUpdate {
  team_id: string;
  team_name?: string;
  team_name_vn?: string;
  team_name_kr?: string;
  factory?: string;
  line?: string;
  is_active?: boolean;
}

// ========== Trainee with Relations ==========

export interface NewTQCTraineeWithDetails extends NewTQCTrainee {
  team?: NewTQCTeam;
  stages: NewTQCTrainingStage[];
  colorBlindTests: NewTQCColorBlindTest[];
  meetings: NewTQCMeeting[];
  resignation?: NewTQCResignation;
}

// ========== Helper Functions ==========

/**
 * Calculate meeting dates based on start date
 */
export function calculateMeetingDates(startDate: string): {
  oneWeek: string;
  oneMonth: string;
  threeMonths: string;
} {
  const start = new Date(startDate);

  const oneWeek = new Date(start);
  oneWeek.setDate(oneWeek.getDate() + 7);

  const oneMonth = new Date(start);
  oneMonth.setMonth(oneMonth.getMonth() + 1);

  const threeMonths = new Date(start);
  threeMonths.setMonth(threeMonths.getMonth() + 3);

  return {
    oneWeek: oneWeek.toISOString().split('T')[0],
    oneMonth: oneMonth.toISOString().split('T')[0],
    threeMonths: threeMonths.toISOString().split('T')[0],
  };
}

/**
 * Calculate week number from date
 */
export function getWeekNumber(date: string): number {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - startOfYear.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil((diff / oneWeek) + 1);
}

/**
 * Calculate training duration in days
 */
export function calculateTrainingDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate progress percentage based on completed stages
 */
export function calculateProgress(stages: NewTQCTrainingStage[]): number {
  if (stages.length === 0) return 0;
  const completedCount = stages.filter(s => s.status === 'COMPLETED').length;
  return Math.round((completedCount / stages.length) * 100);
}
