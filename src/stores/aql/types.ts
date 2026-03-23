/**
 * AQL Store 타입 정의.
 *
 * EMPLOYEE NO = TQC/RQC 검사원 (교육 대상)
 * aqlLinks: EMPLOYEE NO ↔ Q-TRAIN employee_id 매핑 (@deprecated - 직접 매칭 가능)
 * supervisorLinks: 감독자 조직 구조 (Manpower CSV 가져오기)
 */
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

export interface AqlState {
  months: AqlMonthOption[];
  selectedMonth: string;
  rawData: AqlRawRow[];
  processedData: AqlProcessedData | null;

  mappings: DefectTrainingMapping[];
  aqlLinks: AqlEmployeeLink[];
  supervisorLinks: AqlSupervisorLink[];

  recommendations: AqlTrainingRecommendation[];
  enrollmentLogs: AqlEnrollmentLog[];

  employees: Employee[];
  programs: TrainingProgram[];

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

  fetchMonths: () => Promise<void>;
  fetchData: (yearMonth?: string) => Promise<void>;
  setSelectedMonth: (yearMonth: string) => void;

  fetchConfig: () => Promise<void>;

  analyzeRecommendations: () => Promise<void>;

  enrollRecommendation: (rec: AqlTrainingRecommendation, programCode: string, yearMonth: string) => Promise<void>;
  batchEnroll: (recs: AqlTrainingRecommendation[], programCode: string, yearMonth: string) => Promise<void>;

  createAqlLink: (input: Omit<AqlEmployeeLink, 'link_id' | 'created_at'>) => Promise<void>;
  deleteAqlLink: (linkId: string) => Promise<void>;

  importSupervisorLinks: (csvText: string, fileName: string) => Promise<{ success: number; errors: Array<{ row: number; message: string }> }>;
  autoImportSupervisorLinks: () => Promise<{ success: number; errors: Array<{ row: number; message: string }> }>;

  fetchLogs: () => Promise<void>;

  setFilters: (filters: AqlFilters) => void;
  setSelectedIds: (ids: string[]) => void;
  clearError: () => void;
}

export type StoreSet = {
  (partial: AqlState | Partial<AqlState> | ((state: AqlState) => AqlState | Partial<AqlState> | void), replace?: false): void;
  (state: AqlState | ((state: AqlState) => AqlState), replace: true): void;
};

export type StoreGet = () => AqlState;
