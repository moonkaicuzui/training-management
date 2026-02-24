/**
 * AQL Store
 *
 * Zustand store for AQL training recommendation system.
 * Manages AQL data, links, analysis results, and enrollment.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  AqlMonthOption,
  AqlRawRow,
  AqlProcessedData,
  AqlEmployeeLink,
  AqlSupervisorLink,
  AqlTrainingRecommendation,
  AqlEnrollmentLog,
  AqlFilters,
} from '@/types/aql';
import type { DefectTrainingMapping } from '@/types/recommendation';
import type { Employee, TrainingProgram } from '@/types';
import * as aqlService from '@/services/aqlService';
import * as inspectionService from '@/services/inspectionService';
import * as recommendationService from '@/services/recommendationService';
import * as api from '@/services/api';
import { processAqlRawData } from '@/utils/aqlDataProcessor';
import { analyzeAqlRecommendations } from '@/utils/aqlAnalyzer';
import { parseManpowerCsv } from '@/utils/manpowerCsvParser';

// Cache guard: skip Cloud Function calls if data was fetched recently
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const _cache = { monthsAt: 0, dataAt: 0, dataMonth: '', configAt: 0 };
const isFresh = (ts: number) => ts > 0 && Date.now() - ts < CACHE_TTL_MS;

interface AqlState {
  // Data
  months: AqlMonthOption[];
  selectedMonth: string;
  rawData: AqlRawRow[];
  processedData: AqlProcessedData | null;

  // Config (defect_training_mappings shared with 5PRS)
  mappings: DefectTrainingMapping[];
  aqlLinks: AqlEmployeeLink[];
  supervisorLinks: AqlSupervisorLink[];

  // Analysis results
  recommendations: AqlTrainingRecommendation[];
  enrollmentLogs: AqlEnrollmentLog[];

  // Reference data
  employees: Employee[];
  programs: TrainingProgram[];

  // UI State
  filters: AqlFilters;
  selectedIds: string[];
  isLoadingMonths: boolean;
  isLoadingData: boolean;
  isLoadingConfig: boolean;
  isAnalyzing: boolean;
  isEnrolling: boolean;
  isImporting: boolean;
  isLoadingLogs: boolean;
  error: string | null;

  // Actions - Data
  fetchMonths: () => Promise<void>;
  fetchData: (yearMonth?: string) => Promise<void>;
  setSelectedMonth: (yearMonth: string) => void;

  // Actions - Config
  fetchConfig: () => Promise<void>;

  // Actions - Analysis
  analyzeRecommendations: () => Promise<void>;

  // Actions - Enrollment
  enrollRecommendation: (rec: AqlTrainingRecommendation, programCode: string, yearMonth: string) => Promise<void>;
  batchEnroll: (recs: AqlTrainingRecommendation[], programCode: string, yearMonth: string) => Promise<void>;

  // Actions - Links
  createAqlLink: (input: Omit<AqlEmployeeLink, 'link_id' | 'created_at'>) => Promise<void>;
  deleteAqlLink: (linkId: string) => Promise<void>;

  // Actions - Supervisor Import
  importSupervisorLinks: (csvText: string, fileName: string) => Promise<{ success: number; errors: Array<{ row: number; message: string }> }>;
  autoImportSupervisorLinks: () => Promise<{ success: number; errors: Array<{ row: number; message: string }> }>;

  // Actions - Logs
  fetchLogs: () => Promise<void>;

  // Actions - UI
  setFilters: (filters: AqlFilters) => void;
  setSelectedIds: (ids: string[]) => void;
  clearError: () => void;
}

export const useAqlStore = create<AqlState>()(
  devtools(
    immer((set, get) => ({
      // Initial State
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

      // ========== Data ==========

      fetchMonths: async () => {
        if (get().months.length > 0 && isFresh(_cache.monthsAt)) return;

        set((state) => {
          state.isLoadingMonths = true;
          state.error = null;
        });

        try {
          const res = await aqlService.fetchAqlMonths();
          _cache.monthsAt = Date.now();
          set((state) => {
            state.months = res.months;
            state.isLoadingMonths = false;
            if (!state.selectedMonth && res.months.length > 0) {
              state.selectedMonth = res.months[0].year_month;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch AQL months';
            state.isLoadingMonths = false;
          });
        }
      },

      fetchData: async (yearMonth?: string) => {
        const month = yearMonth || get().selectedMonth;
        if (!month) return;

        // Cache guard: skip if same month data is fresh
        if (get().processedData && month === _cache.dataMonth && isFresh(_cache.dataAt)) {
          if (yearMonth) set((state) => { state.selectedMonth = yearMonth; });
          return;
        }

        set((state) => {
          state.isLoadingData = true;
          state.error = null;
          state.recommendations = [];
          if (yearMonth) {
            state.selectedMonth = yearMonth;
          }
        });

        try {
          // Fetch AQL data and employees in parallel
          const [res, employees] = await Promise.all([
            aqlService.fetchAqlMonthData(month),
            get().employees.length > 0
              ? Promise.resolve(get().employees)
              : api.getEmployees(),
          ]);

          // Build employee lookup map: employee_id → employee_name
          const employeeMap = new Map<string, string>();
          for (const emp of employees) {
            employeeMap.set(emp.employee_id, emp.employee_name);
          }

          const processed = processAqlRawData(res.data, employeeMap);
          _cache.dataAt = Date.now();
          _cache.dataMonth = month;

          set((state) => {
            state.rawData = res.data;
            state.processedData = processed;
            state.isLoadingData = false;
            if (state.employees.length === 0) {
              state.employees = employees;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch AQL data';
            state.isLoadingData = false;
          });
        }
      },

      setSelectedMonth: (yearMonth: string) => {
        set((state) => {
          state.selectedMonth = yearMonth;
        });
      },

      // ========== Config ==========

      fetchConfig: async () => {
        if (get().employees.length > 0 && isFresh(_cache.configAt)) return;

        set((state) => {
          state.isLoadingConfig = true;
          state.error = null;
        });

        try {
          const [mappings, aqlLinks, supervisorLinks, employees, programs] = await Promise.all([
            recommendationService.getMappings(),
            aqlService.getAqlEmployeeLinks(),
            aqlService.getSupervisorLinks(),
            api.getEmployees(),
            api.getPrograms(),
          ]);
          _cache.configAt = Date.now();

          set((state) => {
            state.mappings = mappings;
            state.aqlLinks = aqlLinks;
            state.supervisorLinks = supervisorLinks;
            state.employees = employees;
            state.programs = programs;
            state.isLoadingConfig = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to load AQL config';
            state.isLoadingConfig = false;
          });
        }
      },

      // ========== Analysis ==========

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
          // Auto-import supervisor links from Drive if none exist
          let supervisorLinks = get().supervisorLinks;
          if (supervisorLinks.length === 0) {
            try {
              await get().autoImportSupervisorLinks();
              supervisorLinks = get().supervisorLinks;
            } catch {
              // Continue without supervisor links - inspector recommendations still work
            }
            // Clear any error from auto-import so analysis result is clean
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

      // ========== Enrollment ==========

      enrollRecommendation: async (rec, programCode, yearMonth) => {
        if (!rec.linked_employee) {
          set((state) => {
            state.error = 'No linked employee for this AQL inspector';
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

          const enrollmentLog = await aqlService.createAqlEnrollmentLog({
            aql_employee_no: rec.aql_employee_no,
            aql_employee_name: rec.aql_employee_name,
            employee_id: rec.linked_employee.employee_id,
            employee_name: rec.linked_employee.employee_name,
            program_code: programCode,
            program_name: program.program_name,
            reason: rec.enrollment_reason,
            defect_types: rec.top_defects.map((d) => d.type),
            fail_rate: rec.fail_rate,
            fail_po_numbers: [],
            supervisor_no: rec.supervisor?.employee_no,
            supervisor_name: rec.supervisor?.employee_name,
            enrolled_by: 'admin',
            year_month: yearMonth,
          });

          // Also create inspection_enrollments record for INS-001
          if (programCode === 'INS-001') {
            await inspectionService.createEnrollment({
              employee_id: rec.linked_employee.employee_id,
              employee_name: rec.linked_employee.employee_name,
              program_code: 'INS-001',
              source: 'AQL_RECOMMENDATION',
              source_log_id: enrollmentLog.log_id,
              enrolled_by: 'admin',
            });
          }

          set((state) => {
            const idx = state.recommendations.findIndex(
              (r) => r.aql_employee_no === rec.aql_employee_no && r.enrollment_reason === rec.enrollment_reason
            );
            if (idx >= 0) {
              state.recommendations[idx].enrollment_status = 'ENROLLED';
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

        try {
          const program = get().programs.find((p) => p.program_code === programCode);
          if (!program) throw new Error('Program not found');

          for (const rec of recs) {
            if (!rec.linked_employee) continue;

            const enrollmentLog = await aqlService.createAqlEnrollmentLog({
              aql_employee_no: rec.aql_employee_no,
              aql_employee_name: rec.aql_employee_name,
              employee_id: rec.linked_employee.employee_id,
              employee_name: rec.linked_employee.employee_name,
              program_code: programCode,
              program_name: program.program_name,
              reason: rec.enrollment_reason,
              defect_types: rec.top_defects.map((d) => d.type),
              fail_rate: rec.fail_rate,
              fail_po_numbers: [],
              supervisor_no: rec.supervisor?.employee_no,
              supervisor_name: rec.supervisor?.employee_name,
              enrolled_by: 'admin',
              year_month: yearMonth,
            });

            // Also create inspection_enrollments record for INS-001
            if (programCode === 'INS-001') {
              await inspectionService.createEnrollment({
                employee_id: rec.linked_employee.employee_id,
                employee_name: rec.linked_employee.employee_name,
                program_code: 'INS-001',
                source: 'AQL_RECOMMENDATION',
                source_log_id: enrollmentLog.log_id,
                enrolled_by: 'admin',
              });
            }

            set((state) => {
              const idx = state.recommendations.findIndex(
                (r) => r.aql_employee_no === rec.aql_employee_no && r.enrollment_reason === rec.enrollment_reason
              );
              if (idx >= 0) {
                state.recommendations[idx].enrollment_status = 'ENROLLED';
              }
            });
          }

          set((state) => {
            state.isEnrolling = false;
            state.selectedIds = [];
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Batch enrollment failed';
            state.isEnrolling = false;
          });
        }
      },

      // ========== Links ==========

      createAqlLink: async (input) => {
        try {
          const created = await aqlService.createAqlEmployeeLink(input);
          set((state) => {
            state.aqlLinks.push(created);
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to create AQL link';
          });
        }
      },

      deleteAqlLink: async (linkId) => {
        try {
          await aqlService.deleteAqlEmployeeLink(linkId);
          set((state) => {
            state.aqlLinks = state.aqlLinks.filter((l) => l.link_id !== linkId);
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to delete AQL link';
          });
        }
      },

      // ========== Supervisor Import ==========

      importSupervisorLinks: async (csvText, fileName) => {
        set((state) => {
          state.isImporting = true;
          state.error = null;
        });

        try {
          const result = parseManpowerCsv(csvText);

          if (result.links.length === 0) {
            set((state) => {
              state.isImporting = false;
              state.error = 'No valid supervisor links found in CSV';
            });
            return { success: 0, errors: result.errors };
          }

          // Clear existing and re-import
          await aqlService.clearSupervisorLinks();
          const imported = await aqlService.batchImportSupervisorLinks(result.links, fileName);

          // Refresh from Firestore
          const refreshed = await aqlService.getSupervisorLinks();

          set((state) => {
            state.supervisorLinks = refreshed;
            state.isImporting = false;
          });

          return { success: imported, errors: result.errors };
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Import failed';
            state.isImporting = false;
          });
          return { success: 0, errors: [{ row: 0, message: error instanceof Error ? error.message : 'Import failed' }] };
        }
      },

      // ========== Auto-Import Supervisor Links from Drive ==========

      autoImportSupervisorLinks: async () => {
        set((state) => {
          state.isImporting = true;
          state.error = null;
        });

        try {
          // Fetch manpower data from GAS via Cloud Functions proxy
          const response = await aqlService.fetchAqlManpower();

          if (!response.data || response.data.length === 0) {
            set((state) => {
              state.isImporting = false;
              state.error = 'No manpower data found in Google Drive';
            });
            return { success: 0, errors: [{ row: 0, message: 'No manpower data found' }] };
          }

          // Build name → employee_no lookup for supervisor resolution
          const nameToEmpNo = new Map<string, string>();
          for (const row of response.data) {
            const normalizedName = row.full_name.toLowerCase().trim();
            if (!nameToEmpNo.has(normalizedName)) {
              nameToEmpNo.set(normalizedName, row.employee_no);
            }
          }

          // Build supervisor links
          const links: Omit<AqlSupervisorLink, 'link_id' | 'imported_at' | 'source_file'>[] = [];
          const errors: Array<{ row: number; message: string }> = [];

          for (let i = 0; i < response.data.length; i++) {
            const row = response.data[i];
            if (!row.direct_boss_name) continue;

            const supervisorNo = nameToEmpNo.get(row.direct_boss_name.toLowerCase().trim());

            if (!supervisorNo) {
              errors.push({
                row: i + 2,
                message: `Supervisor "${row.direct_boss_name}" not found for ${row.employee_no}`,
              });
              continue;
            }

            links.push({
              employee_no: row.employee_no,
              employee_name: row.full_name,
              supervisor_no: supervisorNo,
              supervisor_name: row.direct_boss_name,
              building: row.building || '',
            });
          }

          if (links.length === 0) {
            set((state) => {
              state.isImporting = false;
              state.error = 'No valid supervisor links resolved from manpower data';
            });
            return { success: 0, errors };
          }

          // Clear existing and re-import
          await aqlService.clearSupervisorLinks();
          const imported = await aqlService.batchImportSupervisorLinks(links, 'auto-import-from-drive');

          // Refresh from Firestore
          const refreshed = await aqlService.getSupervisorLinks();

          set((state) => {
            state.supervisorLinks = refreshed;
            state.isImporting = false;
          });

          return { success: imported, errors };
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Auto-import failed';
            state.isImporting = false;
          });
          return { success: 0, errors: [{ row: 0, message: error instanceof Error ? error.message : 'Auto-import failed' }] };
        }
      },

      // ========== Logs ==========

      fetchLogs: async () => {
        set((state) => {
          state.isLoadingLogs = true;
          state.error = null;
        });

        try {
          const logs = await aqlService.getAqlEnrollmentLogs();
          set((state) => {
            state.enrollmentLogs = logs;
            state.isLoadingLogs = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to load enrollment logs';
            state.isLoadingLogs = false;
          });
        }
      },

      // ========== UI ==========

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
