/**
 * 5 PRS Store
 *
 * Zustand store for 5PRS inspection data management.
 * Handles API calls, data processing, and AI briefing generation.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  MonthOption,
  FivePrsRawRow,
  ProcessedData,
} from '@/types/fivePrs';
import * as fivePrsService from '@/services/fivePrsService';
import { processRawData, extractBriefingPayload } from '@/utils/fivePrsDataProcessor';

interface FivePrsState {
  // Data
  months: MonthOption[];
  selectedMonth: string;
  rawData: FivePrsRawRow[];
  processedData: ProcessedData | null;
  aiBriefing: string | null;

  // UI State
  isLoadingMonths: boolean;
  isLoadingData: boolean;
  isLoadingBriefing: boolean;
  error: string | null;

  // Actions
  fetchMonths: () => Promise<void>;
  fetchData: (yearMonth?: string) => Promise<void>;
  generateBriefing: (lang: string) => Promise<void>;
  setSelectedMonth: (yearMonth: string) => void;
  clearError: () => void;
}

export const useFivePrsStore = create<FivePrsState>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      months: [],
      selectedMonth: '',
      rawData: [],
      processedData: null,
      aiBriefing: null,
      isLoadingMonths: false,
      isLoadingData: false,
      isLoadingBriefing: false,
      error: null,

      fetchMonths: async () => {
        set((state) => {
          state.isLoadingMonths = true;
          state.error = null;
        });

        try {
          const res = await fivePrsService.fetchMonths();
          set((state) => {
            state.months = res.months;
            state.isLoadingMonths = false;
            // Auto-select first (latest) month if none selected
            if (!state.selectedMonth && res.months.length > 0) {
              state.selectedMonth = res.months[0].year_month;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch months';
            state.isLoadingMonths = false;
          });
        }
      },

      fetchData: async (yearMonth?: string) => {
        const month = yearMonth || get().selectedMonth;
        if (!month) return;

        set((state) => {
          state.isLoadingData = true;
          state.error = null;
          state.aiBriefing = null;
          if (yearMonth) {
            state.selectedMonth = yearMonth;
          }
        });

        try {
          const res = await fivePrsService.fetchMonthData(month);
          const processed = processRawData(res.data);

          set((state) => {
            state.rawData = res.data;
            state.processedData = processed;
            state.isLoadingData = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch data';
            state.isLoadingData = false;
          });
        }
      },

      generateBriefing: async (lang: string) => {
        const { processedData, selectedMonth } = get();
        if (!processedData) return;

        set((state) => {
          state.isLoadingBriefing = true;
          state.error = null;
        });

        try {
          const payload = extractBriefingPayload(processedData, selectedMonth, lang);
          const res = await fivePrsService.generateAiBriefing(payload);

          set((state) => {
            state.aiBriefing = res.briefing;
            state.isLoadingBriefing = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'AI briefing failed';
            state.isLoadingBriefing = false;
          });
        }
      },

      setSelectedMonth: (yearMonth: string) => {
        set((state) => {
          state.selectedMonth = yearMonth;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    { name: 'FivePrsStore' }
  )
);
