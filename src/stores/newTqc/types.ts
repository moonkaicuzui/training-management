import type {
  NewTQCTeam,
  NewTQCTrainee,
  NewTQCTraineeFilters,
  NewTQCTraineeWithDetails,
  NewTQCColorBlindTest,
  NewTQCColorBlindTestInput,
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
} from '@/types';
import type { ManpowerApiRow } from '@/services/aqlService';

export interface NewTQCLoadingState {
  teams: boolean;
  trainees: boolean;
  traineeDetail: boolean;
  meetings: boolean;
  resignations: boolean;
  dashboard: boolean;
  analysis: boolean;
  saving: boolean;
  hrEmployees: boolean;
}

export interface NewTQCState {
  teams: NewTQCTeam[];
  trainees: NewTQCTrainee[];
  selectedTrainee: NewTQCTraineeWithDetails | null;
  traineeFilters: NewTQCTraineeFilters;
  meetings: NewTQCMeeting[];
  upcomingMeetings: NewTQCMeeting[];
  meetingFilters: NewTQCMeetingFilters;
  resignations: NewTQCResignation[];
  resignationFilters: NewTQCResignationFilters;
  resignationAnalysis: NewTQCResignationAnalysis | null;
  dashboardStats: NewTQCDashboardStats | null;
  hrType3Employees: ManpowerApiRow[];
  loading: NewTQCLoadingState;
  error: string | null;

  fetchTeams: (includeInactive?: boolean) => Promise<void>;
  createTeam: (input: NewTQCTeamInput) => Promise<NewTQCTeam>;
  updateTeam: (input: NewTQCTeamUpdate) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;

  fetchTrainees: (filters?: NewTQCTraineeFilters) => Promise<void>;
  fetchTraineeDetail: (traineeId: string) => Promise<void>;
  setTraineeFilters: (filters: NewTQCTraineeFilters) => void;
  createTrainee: (input: NewTQCTraineeInput) => Promise<NewTQCTrainee>;
  updateTrainee: (input: NewTQCTraineeUpdate) => Promise<void>;
  clearSelectedTrainee: () => void;

  createColorBlindTest: (input: NewTQCColorBlindTestInput) => Promise<NewTQCColorBlindTest>;

  updateTrainingStage: (input: NewTQCStageUpdate) => Promise<void>;

  fetchMeetings: (filters?: NewTQCMeetingFilters) => Promise<void>;
  fetchUpcomingMeetings: (days?: number) => Promise<void>;
  setMeetingFilters: (filters: NewTQCMeetingFilters) => void;
  createMeeting: (input: NewTQCMeetingInput) => Promise<NewTQCMeeting>;
  updateMeeting: (input: NewTQCMeetingUpdate) => Promise<void>;

  fetchResignations: (filters?: NewTQCResignationFilters) => Promise<void>;
  fetchResignationAnalysis: () => Promise<void>;
  setResignationFilters: (filters: NewTQCResignationFilters) => void;
  createResignation: (input: NewTQCResignationInput) => Promise<NewTQCResignation>;

  fetchDashboardStats: () => Promise<void>;

  fetchHrType3Employees: () => Promise<void>;

  clearError: () => void;
}

export type StoreSet = {
  (partial: NewTQCState | Partial<NewTQCState> | ((state: NewTQCState) => NewTQCState | Partial<NewTQCState>), replace?: false): void;
  (state: NewTQCState | ((state: NewTQCState) => NewTQCState), replace: true): void;
};

export type StoreGet = () => NewTQCState;
