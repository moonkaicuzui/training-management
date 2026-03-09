import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { NewTQCState } from './types';
import { createTeamActions } from './teamSlice';
import { createTraineeActions } from './traineeSlice';
import { createMeetingActions } from './meetingSlice';
import { createResignationActions } from './resignationSlice';
import { createDashboardActions } from './dashboardSlice';

export type { NewTQCState } from './types';

export const useNewTQCStore = create<NewTQCState>()(
  devtools(
    (set, get) => ({
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
      hrType3Employees: [],
      loading: {
        teams: false,
        trainees: false,
        traineeDetail: false,
        meetings: false,
        resignations: false,
        dashboard: false,
        analysis: false,
        saving: false,
        hrEmployees: false,
      },
      error: null,

      ...createTeamActions(set, get),
      ...createTraineeActions(set, get),
      ...createMeetingActions(set, get),
      ...createResignationActions(set, get),
      ...createDashboardActions(set, get),

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'new-tqc-store' }
  )
);

export const useNewTQCTeams = () => useNewTQCStore(state => state.teams);
export const useNewTQCTrainees = () => useNewTQCStore(state => state.trainees);
export const useNewTQCSelectedTrainee = () => useNewTQCStore(state => state.selectedTrainee);
export const useNewTQCMeetings = () => useNewTQCStore(state => state.meetings);
export const useNewTQCUpcomingMeetings = () => useNewTQCStore(state => state.upcomingMeetings);
export const useNewTQCResignations = () => useNewTQCStore(state => state.resignations);
export const useNewTQCResignationAnalysis = () => useNewTQCStore(state => state.resignationAnalysis);
export const useNewTQCDashboardStats = () => useNewTQCStore(state => state.dashboardStats);
export const useNewTQCHrType3Employees = () => useNewTQCStore(state => state.hrType3Employees);
export const useNewTQCLoading = () => useNewTQCStore(state => state.loading);
export const useNewTQCError = () => useNewTQCStore(state => state.error);

export const useNewTQCTraineeFilters = () => useNewTQCStore(state => state.traineeFilters);
export const useNewTQCMeetingFilters = () => useNewTQCStore(state => state.meetingFilters);
export const useNewTQCResignationFilters = () => useNewTQCStore(state => state.resignationFilters);

export const useNewTQCActions = () =>
  useNewTQCStore(
    useShallow(state => ({
      fetchTeams: state.fetchTeams,
      createTeam: state.createTeam,
      updateTeam: state.updateTeam,
      deleteTeam: state.deleteTeam,
      fetchTrainees: state.fetchTrainees,
      fetchTraineeDetail: state.fetchTraineeDetail,
      setTraineeFilters: state.setTraineeFilters,
      createTrainee: state.createTrainee,
      updateTrainee: state.updateTrainee,
      clearSelectedTrainee: state.clearSelectedTrainee,
      createColorBlindTest: state.createColorBlindTest,
      updateTrainingStage: state.updateTrainingStage,
      fetchMeetings: state.fetchMeetings,
      fetchUpcomingMeetings: state.fetchUpcomingMeetings,
      setMeetingFilters: state.setMeetingFilters,
      createMeeting: state.createMeeting,
      updateMeeting: state.updateMeeting,
      fetchResignations: state.fetchResignations,
      fetchResignationAnalysis: state.fetchResignationAnalysis,
      setResignationFilters: state.setResignationFilters,
      createResignation: state.createResignation,
      fetchDashboardStats: state.fetchDashboardStats,
      fetchHrType3Employees: state.fetchHrType3Employees,
      clearError: state.clearError,
    }))
  );
