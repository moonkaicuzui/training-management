import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TrainingState } from './types';
import { createEmployeeActions } from './employeeSlice';
import { createProgramActions } from './programSlice';
import { createSessionActions } from './sessionSlice';
import { createResultActions } from './resultSlice';
import { createViewActions } from './viewSlice';

export type { TrainingState } from './types';

export const useTrainingStore = create<TrainingState>()(
  devtools((set, get) => ({
    employees: [],
    selectedEmployee: null,
    employeeFilters: {},
    employeeHistory: [],

    programs: [],
    selectedProgram: null,
    programFilters: {},

    sessions: [],
    selectedSession: null,
    sessionFilters: {},

    results: [],
    resultFilters: {},

    dashboardStats: null,
    monthlyData: [],
    gradeDistribution: [],

    progressMatrix: null,
    progressFilters: {},

    retrainingTargets: [],
    expiringTrainings: [],
    expiredTrainings: [],

    error: null,

    loading: {
      employees: false,
      programs: false,
      sessions: false,
      results: false,
      dashboard: false,
      progressMatrix: false,
      progress: false,
      retraining: false,
    },

    clearError: () => set({ error: null }),

    clearAllData: () => set({
      employees: [],
      selectedEmployee: null,
      employeeFilters: {},
      employeeHistory: [],
      programs: [],
      selectedProgram: null,
      programFilters: {},
      sessions: [],
      selectedSession: null,
      sessionFilters: {},
      results: [],
      resultFilters: {},
      dashboardStats: null,
      monthlyData: [],
      gradeDistribution: [],
      progressMatrix: null,
      progressFilters: {},
      retrainingTargets: [],
      expiringTrainings: [],
      expiredTrainings: [],
      error: null,
    }),

    ...createEmployeeActions(set, get),
    ...createProgramActions(set, get),
    ...createSessionActions(set, get),
    ...createResultActions(set, get),
    ...createViewActions(set, get),
  }), { name: 'TrainingStore' })
);
