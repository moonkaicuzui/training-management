/**
 * AQL 분석 슬라이스.
 *
 * processedData의 inspectorRecords를 분석하여 교육 추천을 생성.
 * EMPLOYEE NO = TQC/RQC 검사원 (교육 대상), OFFICIAL INSPECTOR = CFA 검사관 (참고용).
 */
import { analyzeAqlRecommendations } from '@/utils/aqlAnalyzer';
import type { StoreSet, StoreGet } from './types';

export const createAnalysisActions = (set: StoreSet, get: StoreGet) => ({
  analyzeRecommendations: async () => {
    const { processedData, mappings, aqlLinks, employees, programs } = get();

    if (!processedData) {
      set((state) => {
        state.error = 'Missing data. Load AQL data first.';
      });
      return;
    }

    set((state) => {
      state.isAnalyzing = true;
      state.error = null;
    });

    try {
      let supervisorLinks = get().supervisorLinks;
      if (supervisorLinks.length === 0) {
        try {
          await get().autoImportSupervisorLinks();
          supervisorLinks = get().supervisorLinks;
        } catch {
          // Continue without supervisor links - inspector recommendations still work
        }
        set((state) => {
          state.error = null;
        });
      }

      const results = analyzeAqlRecommendations(
        processedData,
        mappings,
        aqlLinks,
        supervisorLinks,
        employees,
        programs
      );

      set((state) => {
        state.recommendations = results;
        state.isAnalyzing = false;
        state.selectedIds = [];
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Analysis failed';
        state.isAnalyzing = false;
      });
    }
  },
});
