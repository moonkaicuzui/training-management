import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  InspectionResultDetail,
  InspectionEnrollment,
  InspectionStrikeInfo,
  InspectionResultInput,
  InspectionEnrollmentInput,
  InspectionEnrollmentFilters,
} from '@/types/inspection';
import * as api from '@/services/api';
import i18next from 'i18next';

const getErrorMessage = (error: unknown): string => {
  const msg = (error as Error).message || '';
  if (msg.includes('permission') || msg.includes('Permission')) {
    return i18next.t('inspection.errors.permission');
  }
  if (msg.includes('not-found') || msg.includes('NOT_FOUND')) {
    return i18next.t('inspection.errors.notFound');
  }
  if (msg.includes('network') || msg.includes('unavailable') || msg.includes('Failed to fetch')) {
    return i18next.t('inspection.errors.network');
  }
  return i18next.t('inspection.errors.generic');
};

interface InspectionState {
  // Results
  results: InspectionResultDetail[];
  selectedResult: InspectionResultDetail | null;

  // Enrollments
  enrollments: InspectionEnrollment[];

  // Strike info
  strikeMap: Record<string, InspectionStrikeInfo>;

  // Loading states
  isLoadingResults: boolean;
  isLoadingEnrollments: boolean;
  isSubmitting: boolean;

  // Error
  error: string | null;

  // Actions - Results
  fetchResults: () => Promise<void>;
  fetchResultsByEmployee: (employeeId: string) => Promise<void>;
  fetchResultDetail: (resultId: string) => Promise<void>;
  submitResult: (input: InspectionResultInput, createdBy: string) => Promise<{
    resultId: string;
    inspectionId: string;
    matchRate: number;
  }>;

  // Actions - Enrollments
  fetchEnrollments: (filters?: InspectionEnrollmentFilters) => Promise<void>;
  enrollEmployee: (input: InspectionEnrollmentInput) => Promise<InspectionEnrollment>;
  updateEnrollmentStatus: (
    enrollmentId: string,
    status: InspectionEnrollment['status']
  ) => Promise<void>;

  // Actions - Strikes
  checkStrikes: (employeeId: string) => Promise<InspectionStrikeInfo>;

  // Actions - Auto-enrollment
  autoEnrollFromSource: (
    source: 'FIVE_PRS_RECOMMENDATION' | 'AQL_RECOMMENDATION',
    enrolledBy: string
  ) => Promise<{ enrolled: number; skipped: number; errors: number }>;

  // Utility
  clearError: () => void;
}

export const useInspectionStore = create<InspectionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      results: [],
      selectedResult: null,
      enrollments: [],
      strikeMap: {},
      isLoadingResults: false,
      isLoadingEnrollments: false,
      isSubmitting: false,
      error: null,

      // ========== Results ==========

      fetchResults: async () => {
        set({ isLoadingResults: true, error: null });
        try {
          const results = await api.getInspectionResults();
          set({ results, isLoadingResults: false });
        } catch (error) {
          set({
            error: getErrorMessage(error),
            isLoadingResults: false,
          });
        }
      },

      fetchResultsByEmployee: async (employeeId: string) => {
        set({ isLoadingResults: true, error: null });
        try {
          const results = await api.getInspectionResultsByEmployee(employeeId);
          set({ results, isLoadingResults: false });
        } catch (error) {
          set({
            error: getErrorMessage(error),
            isLoadingResults: false,
          });
        }
      },

      fetchResultDetail: async (resultId: string) => {
        set({ isLoadingResults: true, error: null });
        try {
          const detail = await api.getInspectionDetail(resultId);
          set({ selectedResult: detail, isLoadingResults: false });
        } catch (error) {
          set({
            error: getErrorMessage(error),
            isLoadingResults: false,
          });
        }
      },

      submitResult: async (input, createdBy) => {
        set({ isSubmitting: true, error: null });
        try {
          const result = await api.createInspectionResult(input, createdBy);
          // Refresh results list
          const results = await api.getInspectionResults();
          set({ results, isSubmitting: false });
          return result;
        } catch (error) {
          set({
            error: getErrorMessage(error),
            isSubmitting: false,
          });
          throw error;
        }
      },

      // ========== Enrollments ==========

      fetchEnrollments: async (filters?) => {
        set({ isLoadingEnrollments: true, error: null });
        try {
          const enrollments = await api.getInspectionEnrollments(filters);
          set({ enrollments, isLoadingEnrollments: false });
        } catch (error) {
          set({
            error: getErrorMessage(error),
            isLoadingEnrollments: false,
          });
        }
      },

      enrollEmployee: async (input) => {
        set({ isSubmitting: true, error: null });
        try {
          const enrollment = await api.createInspectionEnrollment(input);
          const enrollments = [...get().enrollments, enrollment];
          set({ enrollments, isSubmitting: false });
          return enrollment;
        } catch (error) {
          set({
            error: getErrorMessage(error),
            isSubmitting: false,
          });
          throw error;
        }
      },

      updateEnrollmentStatus: async (enrollmentId, status) => {
        set({ isSubmitting: true, error: null });
        try {
          await api.updateInspectionEnrollmentStatus(enrollmentId, status);
          const enrollments = get().enrollments.map((e) =>
            e.enrollment_id === enrollmentId ? { ...e, status } : e
          );
          set({ enrollments, isSubmitting: false });
        } catch (error) {
          set({
            error: getErrorMessage(error),
            isSubmitting: false,
          });
        }
      },

      // ========== Strikes ==========

      checkStrikes: async (employeeId) => {
        try {
          const info = await api.getInspectionConsecutiveFailures(employeeId);
          set({
            strikeMap: { ...get().strikeMap, [employeeId]: info },
          });
          return info;
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // ========== Auto-enrollment ==========

      autoEnrollFromSource: async (source, enrolledBy) => {
        set({ isSubmitting: true, error: null });
        try {
          const result = await api.autoEnrollInspectionFromLogs(source, enrolledBy);
          // Refresh enrollments list
          const enrollments = await api.getInspectionEnrollments();
          set({ enrollments, isSubmitting: false });
          return result;
        } catch (error) {
          set({
            error: getErrorMessage(error),
            isSubmitting: false,
          });
          throw error;
        }
      },

      // ========== Utility ==========

      clearError: () => set({ error: null }),
    }),
    { name: 'InspectionStore' }
  )
);
