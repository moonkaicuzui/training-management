import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AqlState } from './types';
import { createDataActions } from './dataSlice';
import { createConfigActions } from './configSlice';
import { createAnalysisActions } from './analysisSlice';
import { createEnrollmentActions } from './enrollmentSlice';
import { createLinkActions } from './linkSlice';

export type { AqlState } from './types';

export const useAqlStore = create<AqlState>()(
  devtools(
    immer((set, get) => ({
      months: [],
      selectedMonth: '',
      rawData: [],
      processedData: null,
      mappings: [],
      aqlLinks: [],
      supervisorLinks: [],
      recommendations: [],
      enrollmentLogs: [],
      employees: [],
      programs: [],
      filters: {},
      selectedIds: [],
      isLoadingMonths: false,
      isLoadingData: false,
      isLoadingConfig: false,
      isAnalyzing: false,
      isEnrolling: false,
      isImporting: false,
      isLoadingLogs: false,
      error: null,

      ...createDataActions(set, get),
      ...createConfigActions(set, get),
      ...createAnalysisActions(set, get),
      ...createEnrollmentActions(set, get),
      ...createLinkActions(set, get),

      setFilters: (filters) => {
        set((state) => {
          state.filters = filters;
        });
      },

      setSelectedIds: (ids) => {
        set((state) => {
          state.selectedIds = ids;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    { name: 'AqlStore' }
  )
);
