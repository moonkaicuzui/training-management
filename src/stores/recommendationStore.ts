/**
 * Recommendation Store
 *
 * Zustand store for 5PRS training recommendation system.
 * Manages thresholds, mappings, links, analysis results, and enrollment.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  RecommendationThreshold,
  DefectTrainingMapping,
  TqcEmployeeLink,
  TrainingRecommendation,
  FivePrsEnrollmentLog,
  RecommendationFilters,
} from '@/types/recommendation';
import * as recommendationService from '@/services/recommendationService';
import * as inspectionService from '@/services/inspectionService';
import { analyzeRecommendations } from '@/utils/recommendationAnalyzer';
import { useFivePrsStore } from '@/stores/fivePrsStore';
import * as api from '@/services/api';
import type { Employee, TrainingProgram } from '@/types';

interface RecommendationState {
  // Config data
  thresholds: RecommendationThreshold | null;
  mappings: DefectTrainingMapping[];
  tqcLinks: TqcEmployeeLink[];

  // Analysis results
  recommendations: TrainingRecommendation[];
  enrollmentLogs: FivePrsEnrollmentLog[];

  // Reference data
  employees: Employee[];
  programs: TrainingProgram[];

  // UI State
  filters: RecommendationFilters;
  selectedIds: string[];
  isLoadingConfig: boolean;
  isAnalyzing: boolean;
  isEnrolling: boolean;
  isLoadingLogs: boolean;
  error: string | null;

  // Actions - Config
  fetchConfig: () => Promise<void>;
  updateThresholds: (updates: Partial<RecommendationThreshold>) => Promise<void>;
  createMapping: (input: Omit<DefectTrainingMapping, 'mapping_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateMapping: (mappingId: string, updates: Partial<DefectTrainingMapping>) => Promise<void>;
  deleteMapping: (mappingId: string) => Promise<void>;
  createLink: (input: Omit<TqcEmployeeLink, 'link_id' | 'created_at'>) => Promise<void>;
  deleteLink: (linkId: string) => Promise<void>;

  // Actions - Analysis
  analyzeRecommendations: () => Promise<void>;

  // Actions - Enrollment
  enrollRecommendation: (rec: TrainingRecommendation, programCode: string, yearMonth: string) => Promise<void>;
  batchEnroll: (recs: TrainingRecommendation[], programCode: string, yearMonth: string) => Promise<void>;

  // Actions - Logs
  fetchLogs: () => Promise<void>;

  // Actions - UI
  setFilters: (filters: RecommendationFilters) => void;
  setSelectedIds: (ids: string[]) => void;
  clearError: () => void;
}

export const useRecommendationStore = create<RecommendationState>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      thresholds: null,
      mappings: [],
      tqcLinks: [],
      recommendations: [],
      enrollmentLogs: [],
      employees: [],
      programs: [],
      filters: {},
      selectedIds: [],
      isLoadingConfig: false,
      isAnalyzing: false,
      isEnrolling: false,
      isLoadingLogs: false,
      error: null,

      fetchConfig: async () => {
        set((state) => {
          state.isLoadingConfig = true;
          state.error = null;
        });

        try {
          const [thresholds, mappings, links, employees, programs] = await Promise.all([
            recommendationService.getThresholds(),
            recommendationService.getMappings(),
            recommendationService.getLinks(),
            api.getEmployees(),
            api.getPrograms(),
          ]);

          set((state) => {
            state.thresholds = thresholds;
            state.mappings = mappings;
            state.tqcLinks = links;
            state.employees = employees;
            state.programs = programs;
            state.isLoadingConfig = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to load config';
            state.isLoadingConfig = false;
          });
        }
      },

      updateThresholds: async (updates) => {
        try {
          await recommendationService.updateThresholds(updates);
          const refreshed = await recommendationService.getThresholds();
          set((state) => {
            state.thresholds = refreshed;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to update thresholds';
          });
        }
      },

      createMapping: async (input) => {
        try {
          const created = await recommendationService.createMapping(input);
          set((state) => {
            state.mappings.push(created);
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to create mapping';
          });
        }
      },

      updateMapping: async (mappingId, updates) => {
        try {
          await recommendationService.updateMapping(mappingId, updates);
          const refreshed = await recommendationService.getMappings();
          set((state) => {
            state.mappings = refreshed;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to update mapping';
          });
        }
      },

      deleteMapping: async (mappingId) => {
        try {
          await recommendationService.deleteMapping(mappingId);
          set((state) => {
            state.mappings = state.mappings.filter((m) => m.mapping_id !== mappingId);
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to delete mapping';
          });
        }
      },

      createLink: async (input) => {
        try {
          const created = await recommendationService.createLink(input);
          set((state) => {
            state.tqcLinks.push(created);
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to create link';
          });
        }
      },

      deleteLink: async (linkId) => {
        try {
          await recommendationService.deleteLink(linkId);
          set((state) => {
            state.tqcLinks = state.tqcLinks.filter((l) => l.link_id !== linkId);
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to delete link';
          });
        }
      },

      analyzeRecommendations: async () => {
        const { thresholds, mappings, tqcLinks, employees, programs } = get();
        const { processedData, rawData } = useFivePrsStore.getState();

        if (!processedData || !thresholds) {
          set((state) => {
            state.error = 'Missing data. Load 5PRS data and config first.';
          });
          return;
        }

        set((state) => {
          state.isAnalyzing = true;
          state.error = null;
        });

        try {
          const results = analyzeRecommendations(
            processedData,
            rawData,
            thresholds,
            mappings,
            tqcLinks,
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

      enrollRecommendation: async (rec, programCode, yearMonth) => {
        if (!rec.linkedEmployee) {
          set((state) => {
            state.error = 'No linked employee for this TQC';
          });
          return;
        }

        set((state) => {
          state.isEnrolling = true;
          state.error = null;
        });

        try {
          const program = get().programs.find((p) => p.program_code === programCode);
          if (!program) throw new Error('Program not found');

          // Check for duplicate enrollment before proceeding
          if (programCode === 'INS-001') {
            const existing = await inspectionService.checkDuplicateEnrollment(
              rec.linkedEmployee.employee_id,
              programCode,
            );
            if (existing) {
              set((state) => {
                state.error = `${rec.linkedEmployee!.employee_name} already has a ${existing.status} enrollment for ${programCode}`;
                state.isEnrolling = false;
              });
              return;
            }
          }

          // Create enrollment log (APPEND-ONLY)
          const enrollmentLog = await recommendationService.createEnrollmentLog({
            tqc_id: rec.tqc_id,
            tqc_name: rec.tqc_name,
            employee_id: rec.linkedEmployee.employee_id,
            employee_name: rec.linkedEmployee.employee_name,
            program_code: programCode,
            program_name: program.program_name,
            priority: rec.priority,
            priority_score: rec.priorityScore,
            defect_types: rec.topDefects.map((d) => d.type),
            reject_rate: rec.rejectRate,
            enrolled_by: 'admin',
            year_month: yearMonth,
          });

          // Also create inspection_enrollments record for INS-001
          if (programCode === 'INS-001') {
            await inspectionService.createEnrollment({
              employee_id: rec.linkedEmployee.employee_id,
              employee_name: rec.linkedEmployee.employee_name,
              program_code: 'INS-001',
              source: 'FIVE_PRS_RECOMMENDATION',
              source_log_id: enrollmentLog.log_id,
              enrolled_by: 'admin',
            });
          }

          // Update recommendation status
          set((state) => {
            const idx = state.recommendations.findIndex((r) => r.tqc_id === rec.tqc_id);
            if (idx >= 0) {
              state.recommendations[idx].enrollmentStatus = 'ENROLLED';
            }
            state.isEnrolling = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Enrollment failed';
            state.isEnrolling = false;
          });
        }
      },

      batchEnroll: async (recs, programCode, yearMonth) => {
        set((state) => {
          state.isEnrolling = true;
          state.error = null;
        });

        let skippedCount = 0;

        try {
          const program = get().programs.find((p) => p.program_code === programCode);
          if (!program) throw new Error('Program not found');

          for (const rec of recs) {
            if (!rec.linkedEmployee) continue;

            // Check for duplicate enrollment before proceeding
            if (programCode === 'INS-001') {
              const existing = await inspectionService.checkDuplicateEnrollment(
                rec.linkedEmployee.employee_id,
                programCode,
              );
              if (existing) {
                skippedCount++;
                set((state) => {
                  const idx = state.recommendations.findIndex((r) => r.tqc_id === rec.tqc_id);
                  if (idx >= 0) {
                    state.recommendations[idx].enrollmentStatus = 'ENROLLED';
                  }
                });
                continue;
              }
            }

            const enrollmentLog = await recommendationService.createEnrollmentLog({
              tqc_id: rec.tqc_id,
              tqc_name: rec.tqc_name,
              employee_id: rec.linkedEmployee.employee_id,
              employee_name: rec.linkedEmployee.employee_name,
              program_code: programCode,
              program_name: program.program_name,
              priority: rec.priority,
              priority_score: rec.priorityScore,
              defect_types: rec.topDefects.map((d) => d.type),
              reject_rate: rec.rejectRate,
              enrolled_by: 'admin',
              year_month: yearMonth,
            });

            // Also create inspection_enrollments record for INS-001
            if (programCode === 'INS-001') {
              await inspectionService.createEnrollment({
                employee_id: rec.linkedEmployee.employee_id,
                employee_name: rec.linkedEmployee.employee_name,
                program_code: 'INS-001',
                source: 'FIVE_PRS_RECOMMENDATION',
                source_log_id: enrollmentLog.log_id,
                enrolled_by: 'admin',
              });
            }

            set((state) => {
              const idx = state.recommendations.findIndex((r) => r.tqc_id === rec.tqc_id);
              if (idx >= 0) {
                state.recommendations[idx].enrollmentStatus = 'ENROLLED';
              }
            });
          }

          set((state) => {
            state.isEnrolling = false;
            state.selectedIds = [];
            if (skippedCount > 0) {
              state.error = `${skippedCount} enrollment(s) skipped (already registered)`;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Batch enrollment failed';
            state.isEnrolling = false;
          });
        }
      },

      fetchLogs: async () => {
        set((state) => {
          state.isLoadingLogs = true;
          state.error = null;
        });

        try {
          const logs = await recommendationService.getEnrollmentLogs();
          set((state) => {
            state.enrollmentLogs = logs;
            state.isLoadingLogs = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to load logs';
            state.isLoadingLogs = false;
          });
        }
      },

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
    { name: 'RecommendationStore' }
  )
);
