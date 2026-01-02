// ============================================================
// New TQC (신입 TQC 교육) Store
// Zustand store for managing new trainee data
// ============================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
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

import * as api from '@/services/api';

// ============================================================
// State Interface
// ============================================================

interface NewTQCState {
  // Teams
  teams: NewTQCTeam[];

  // Trainees
  trainees: NewTQCTrainee[];
  selectedTrainee: NewTQCTraineeWithDetails | null;
  traineeFilters: NewTQCTraineeFilters;

  // Meetings
  meetings: NewTQCMeeting[];
  upcomingMeetings: NewTQCMeeting[];
  meetingFilters: NewTQCMeetingFilters;

  // Resignations
  resignations: NewTQCResignation[];
  resignationFilters: NewTQCResignationFilters;
  resignationAnalysis: NewTQCResignationAnalysis | null;

  // Dashboard
  dashboardStats: NewTQCDashboardStats | null;

  // Loading states
  loading: {
    teams: boolean;
    trainees: boolean;
    traineeDetail: boolean;
    meetings: boolean;
    resignations: boolean;
    dashboard: boolean;
    analysis: boolean;
    saving: boolean;
  };

  // Error state
  error: string | null;

  // Actions - Teams
  fetchTeams: (includeInactive?: boolean) => Promise<void>;
  createTeam: (input: NewTQCTeamInput) => Promise<NewTQCTeam>;
  updateTeam: (input: NewTQCTeamUpdate) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;

  // Actions - Trainees
  fetchTrainees: (filters?: NewTQCTraineeFilters) => Promise<void>;
  fetchTraineeDetail: (traineeId: string) => Promise<void>;
  setTraineeFilters: (filters: NewTQCTraineeFilters) => void;
  createTrainee: (input: NewTQCTraineeInput) => Promise<NewTQCTrainee>;
  updateTrainee: (input: NewTQCTraineeUpdate) => Promise<void>;
  clearSelectedTrainee: () => void;

  // Actions - Color Blind Tests
  createColorBlindTest: (input: NewTQCColorBlindTestInput) => Promise<NewTQCColorBlindTest>;

  // Actions - Training Stages
  updateTrainingStage: (input: NewTQCStageUpdate) => Promise<void>;

  // Actions - Meetings
  fetchMeetings: (filters?: NewTQCMeetingFilters) => Promise<void>;
  fetchUpcomingMeetings: (days?: number) => Promise<void>;
  setMeetingFilters: (filters: NewTQCMeetingFilters) => void;
  createMeeting: (input: NewTQCMeetingInput) => Promise<NewTQCMeeting>;
  updateMeeting: (input: NewTQCMeetingUpdate) => Promise<void>;

  // Actions - Resignations
  fetchResignations: (filters?: NewTQCResignationFilters) => Promise<void>;
  fetchResignationAnalysis: () => Promise<void>;
  setResignationFilters: (filters: NewTQCResignationFilters) => void;
  createResignation: (input: NewTQCResignationInput) => Promise<NewTQCResignation>;

  // Actions - Dashboard
  fetchDashboardStats: () => Promise<void>;

  // Actions - Error handling
  clearError: () => void;
}

// ============================================================
// Store Implementation
// ============================================================

export const useNewTQCStore = create<NewTQCState>()(
  devtools(
    (set, get) => ({
      // Initial state
      teams: [],
      trainees: [],
      selectedTrainee: null,
      traineeFilters: {},
      meetings: [],
      upcomingMeetings: [],
      meetingFilters: {},
      resignations: [],
      resignationFilters: {},
      resignationAnalysis: null,
      dashboardStats: null,
      loading: {
        teams: false,
        trainees: false,
        traineeDetail: false,
        meetings: false,
        resignations: false,
        dashboard: false,
        analysis: false,
        saving: false,
      },
      error: null,

      // ========== Team Actions ==========

      fetchTeams: async (includeInactive = false) => {
        set(state => ({
          loading: { ...state.loading, teams: true },
          error: null,
        }));

        try {
          const teams = await api.getNewTQCTeams(includeInactive);
          set({ teams, loading: { ...get().loading, teams: false } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch teams';
          set({
            error: message,
            loading: { ...get().loading, teams: false },
          });
        }
      },

      createTeam: async (input: NewTQCTeamInput) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          const newTeam = await api.createNewTQCTeam(input);
          set(state => ({
            teams: [...state.teams, newTeam],
            loading: { ...state.loading, saving: false },
          }));
          return newTeam;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create team';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      updateTeam: async (input: NewTQCTeamUpdate) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          const updatedTeam = await api.updateNewTQCTeam(input);
          if (updatedTeam) {
            set(state => ({
              teams: state.teams.map(t =>
                t.team_id === input.team_id ? updatedTeam : t
              ),
              loading: { ...state.loading, saving: false },
            }));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update team';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      deleteTeam: async (teamId: string) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          await api.deleteNewTQCTeam(teamId);
          // NO DELETE POLICY: Soft delete only - set is_active to false
          set(state => ({
            teams: state.teams.map(t =>
              t.team_id === teamId
                ? { ...t, is_active: false, updated_at: new Date().toISOString() }
                : t
            ),
            loading: { ...state.loading, saving: false },
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to deactivate team';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      // ========== Trainee Actions ==========

      fetchTrainees: async (filters?: NewTQCTraineeFilters) => {
        set(state => ({
          loading: { ...state.loading, trainees: true },
          error: null,
          traineeFilters: filters || state.traineeFilters,
        }));

        try {
          const trainees = await api.getNewTQCTrainees(filters || get().traineeFilters);
          set({ trainees, loading: { ...get().loading, trainees: false } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch trainees';
          set({
            error: message,
            loading: { ...get().loading, trainees: false },
          });
        }
      },

      fetchTraineeDetail: async (traineeId: string) => {
        set(state => ({
          loading: { ...state.loading, traineeDetail: true },
          error: null,
        }));

        try {
          const trainee = await api.getNewTQCTraineeWithDetails(traineeId);
          set({
            selectedTrainee: trainee,
            loading: { ...get().loading, traineeDetail: false },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch trainee detail';
          set({
            error: message,
            loading: { ...get().loading, traineeDetail: false },
          });
        }
      },

      setTraineeFilters: (filters: NewTQCTraineeFilters) => {
        set({ traineeFilters: filters });
      },

      createTrainee: async (input: NewTQCTraineeInput) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          const newTrainee = await api.createNewTQCTrainee(input);
          set(state => ({
            trainees: [newTrainee, ...state.trainees],
            loading: { ...state.loading, saving: false },
          }));
          return newTrainee;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create trainee';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      updateTrainee: async (input: NewTQCTraineeUpdate) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          const updatedTrainee = await api.updateNewTQCTrainee(input);
          if (updatedTrainee) {
            set(state => ({
              trainees: state.trainees.map(t =>
                t.trainee_id === input.trainee_id ? updatedTrainee : t
              ),
              selectedTrainee:
                state.selectedTrainee?.trainee_id === input.trainee_id
                  ? { ...state.selectedTrainee, ...updatedTrainee }
                  : state.selectedTrainee,
              loading: { ...state.loading, saving: false },
            }));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update trainee';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      clearSelectedTrainee: () => {
        set({ selectedTrainee: null });
      },

      // ========== Color Blind Test Actions ==========

      createColorBlindTest: async (input: NewTQCColorBlindTestInput) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          const newTest = await api.createNewTQCColorBlindTest(input);

          // Update selected trainee if viewing detail
          const state = get();
          if (state.selectedTrainee?.trainee_id === input.trainee_id) {
            set(state => ({
              selectedTrainee: state.selectedTrainee
                ? {
                    ...state.selectedTrainee,
                    color_blind_status: input.result,
                    colorBlindTests: [newTest, ...state.selectedTrainee.colorBlindTests],
                  }
                : null,
              loading: { ...state.loading, saving: false },
            }));
          }

          // Update trainee in list
          set(state => ({
            trainees: state.trainees.map(t =>
              t.trainee_id === input.trainee_id
                ? { ...t, color_blind_status: input.result }
                : t
            ),
            loading: { ...state.loading, saving: false },
          }));

          return newTest;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create color blind test';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      // ========== Training Stage Actions ==========

      updateTrainingStage: async (input: NewTQCStageUpdate) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          const updatedStage = await api.updateNewTQCTrainingStage(input);

          if (updatedStage) {
            // Update selected trainee if viewing detail
            const state = get();
            if (state.selectedTrainee) {
              const updatedStages = state.selectedTrainee.stages.map(s =>
                s.stage_id === input.stage_id ? updatedStage : s
              );

              // Recalculate progress
              const completedCount = updatedStages.filter(s => s.status === 'COMPLETED').length;
              const progress = Math.round((completedCount / updatedStages.length) * 100);

              set(state => ({
                selectedTrainee: state.selectedTrainee
                  ? {
                      ...state.selectedTrainee,
                      stages: updatedStages,
                      progress_percentage: progress,
                      status: progress === 100 ? 'COMPLETED' : state.selectedTrainee.status,
                    }
                  : null,
                loading: { ...state.loading, saving: false },
              }));
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update training stage';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      // ========== Meeting Actions ==========

      fetchMeetings: async (filters?: NewTQCMeetingFilters) => {
        set(state => ({
          loading: { ...state.loading, meetings: true },
          error: null,
          meetingFilters: filters || state.meetingFilters,
        }));

        try {
          const meetings = await api.getNewTQCMeetings(filters || get().meetingFilters);
          set({ meetings, loading: { ...get().loading, meetings: false } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch meetings';
          set({
            error: message,
            loading: { ...get().loading, meetings: false },
          });
        }
      },

      fetchUpcomingMeetings: async (days = 7) => {
        set(state => ({
          loading: { ...state.loading, meetings: true },
          error: null,
        }));

        try {
          const upcomingMeetings = await api.getNewTQCUpcomingMeetings(days);
          set({ upcomingMeetings, loading: { ...get().loading, meetings: false } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch upcoming meetings';
          set({
            error: message,
            loading: { ...get().loading, meetings: false },
          });
        }
      },

      setMeetingFilters: (filters: NewTQCMeetingFilters) => {
        set({ meetingFilters: filters });
      },

      createMeeting: async (input: NewTQCMeetingInput) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          const newMeeting = await api.createNewTQCMeeting(input);
          set(state => ({
            meetings: [...state.meetings, newMeeting],
            loading: { ...state.loading, saving: false },
          }));
          return newMeeting;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create meeting';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      updateMeeting: async (input: NewTQCMeetingUpdate) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          const updatedMeeting = await api.updateNewTQCMeeting(input);
          if (updatedMeeting) {
            set(state => ({
              meetings: state.meetings.map(m =>
                m.meeting_id === input.meeting_id ? updatedMeeting : m
              ),
              upcomingMeetings: state.upcomingMeetings.filter(m =>
                m.meeting_id !== input.meeting_id || updatedMeeting.status === 'SCHEDULED'
              ),
              // Update selected trainee meetings if applicable
              selectedTrainee:
                state.selectedTrainee &&
                state.selectedTrainee.meetings.some(m => m.meeting_id === input.meeting_id)
                  ? {
                      ...state.selectedTrainee,
                      meetings: state.selectedTrainee.meetings.map(m =>
                        m.meeting_id === input.meeting_id ? updatedMeeting : m
                      ),
                    }
                  : state.selectedTrainee,
              loading: { ...state.loading, saving: false },
            }));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update meeting';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      // ========== Resignation Actions ==========

      fetchResignations: async (filters?: NewTQCResignationFilters) => {
        set(state => ({
          loading: { ...state.loading, resignations: true },
          error: null,
          resignationFilters: filters || state.resignationFilters,
        }));

        try {
          const resignations = await api.getNewTQCResignations(
            filters || get().resignationFilters
          );
          set({ resignations, loading: { ...get().loading, resignations: false } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch resignations';
          set({
            error: message,
            loading: { ...get().loading, resignations: false },
          });
        }
      },

      fetchResignationAnalysis: async () => {
        set(state => ({
          loading: { ...state.loading, analysis: true },
          error: null,
        }));

        try {
          const resignationAnalysis = await api.getNewTQCResignationAnalysis();
          set({ resignationAnalysis, loading: { ...get().loading, analysis: false } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch resignation analysis';
          set({
            error: message,
            loading: { ...get().loading, analysis: false },
          });
        }
      },

      setResignationFilters: (filters: NewTQCResignationFilters) => {
        set({ resignationFilters: filters });
      },

      createResignation: async (input: NewTQCResignationInput) => {
        set(state => ({
          loading: { ...state.loading, saving: true },
          error: null,
        }));

        try {
          const newResignation = await api.createNewTQCResignation(input);

          // Update trainee status in list
          set(state => ({
            trainees: state.trainees.map(t =>
              t.trainee_id === input.trainee_id ? { ...t, status: 'RESIGNED' as const } : t
            ),
            resignations: [newResignation, ...state.resignations],
            loading: { ...state.loading, saving: false },
          }));

          return newResignation;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create resignation';
          set({
            error: message,
            loading: { ...get().loading, saving: false },
          });
          throw error;
        }
      },

      // ========== Dashboard Actions ==========

      fetchDashboardStats: async () => {
        set(state => ({
          loading: { ...state.loading, dashboard: true },
          error: null,
        }));

        try {
          const dashboardStats = await api.getNewTQCDashboardStats();
          set({ dashboardStats, loading: { ...get().loading, dashboard: false } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
          set({
            error: message,
            loading: { ...get().loading, dashboard: false },
          });
        }
      },

      // ========== Error Actions ==========

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'new-tqc-store' }
  )
);

// ============================================================
// Selector Hooks (for optimized re-renders)
// ============================================================

export const useNewTQCTeams = () => useNewTQCStore(state => state.teams);
export const useNewTQCTrainees = () => useNewTQCStore(state => state.trainees);
export const useNewTQCSelectedTrainee = () => useNewTQCStore(state => state.selectedTrainee);
export const useNewTQCMeetings = () => useNewTQCStore(state => state.meetings);
export const useNewTQCUpcomingMeetings = () => useNewTQCStore(state => state.upcomingMeetings);
export const useNewTQCResignations = () => useNewTQCStore(state => state.resignations);
export const useNewTQCResignationAnalysis = () => useNewTQCStore(state => state.resignationAnalysis);
export const useNewTQCDashboardStats = () => useNewTQCStore(state => state.dashboardStats);
export const useNewTQCLoading = () => useNewTQCStore(state => state.loading);
export const useNewTQCError = () => useNewTQCStore(state => state.error);

// Filter selectors
export const useNewTQCTraineeFilters = () => useNewTQCStore(state => state.traineeFilters);
export const useNewTQCMeetingFilters = () => useNewTQCStore(state => state.meetingFilters);
export const useNewTQCResignationFilters = () => useNewTQCStore(state => state.resignationFilters);

// Actions selectors (to avoid re-renders on state changes)
export const useNewTQCActions = () =>
  useNewTQCStore(state => ({
    // Teams
    fetchTeams: state.fetchTeams,
    createTeam: state.createTeam,
    updateTeam: state.updateTeam,
    deleteTeam: state.deleteTeam,
    // Trainees
    fetchTrainees: state.fetchTrainees,
    fetchTraineeDetail: state.fetchTraineeDetail,
    setTraineeFilters: state.setTraineeFilters,
    createTrainee: state.createTrainee,
    updateTrainee: state.updateTrainee,
    clearSelectedTrainee: state.clearSelectedTrainee,
    // Color Blind
    createColorBlindTest: state.createColorBlindTest,
    // Stages
    updateTrainingStage: state.updateTrainingStage,
    // Meetings
    fetchMeetings: state.fetchMeetings,
    fetchUpcomingMeetings: state.fetchUpcomingMeetings,
    setMeetingFilters: state.setMeetingFilters,
    createMeeting: state.createMeeting,
    updateMeeting: state.updateMeeting,
    // Resignations
    fetchResignations: state.fetchResignations,
    fetchResignationAnalysis: state.fetchResignationAnalysis,
    setResignationFilters: state.setResignationFilters,
    createResignation: state.createResignation,
    // Dashboard
    fetchDashboardStats: state.fetchDashboardStats,
    // Error
    clearError: state.clearError,
  }));
