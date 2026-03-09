/**
 * AQL Store Tests
 * AQL 교육 추천 시스템 스토어 기능 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  AqlMonthOption,
  AqlRawRow,
  AqlProcessedData,
  AqlEmployeeLink,
  AqlSupervisorLink,
  AqlTrainingRecommendation,
  AqlEnrollmentLog,
} from '@/types/aql';
import type { DefectTrainingMapping } from '@/types/recommendation';
import type { Employee, TrainingProgram } from '@/types';

// ========== Mock Setup ==========

const mockFetchAqlMonths = vi.fn();
const mockFetchAqlMonthData = vi.fn();
const mockGetMappings = vi.fn();
const mockGetAqlEmployeeLinks = vi.fn();
const mockGetSupervisorLinks = vi.fn();
const mockGetAqlEnrollmentLogs = vi.fn();
const mockCreateAqlEmployeeLink = vi.fn();
const mockDeleteAqlEmployeeLink = vi.fn();
const mockCreateAqlEnrollmentLog = vi.fn();
const mockClearSupervisorLinks = vi.fn();
const mockBatchImportSupervisorLinks = vi.fn();
const mockFetchAqlManpower = vi.fn();
const mockCheckDuplicateEnrollment = vi.fn();
const mockCreateEnrollment = vi.fn();
const mockGetEmployees = vi.fn();
const mockGetPrograms = vi.fn();
const mockProcessAqlRawData = vi.fn();
const mockAnalyzeAqlRecommendations = vi.fn();
const mockParseManpowerCsv = vi.fn();

vi.mock('@/services/aqlService', () => ({
  fetchAqlMonths: (...args: unknown[]) => mockFetchAqlMonths(...args),
  fetchAqlMonthData: (...args: unknown[]) => mockFetchAqlMonthData(...args),
  getAqlEmployeeLinks: (...args: unknown[]) => mockGetAqlEmployeeLinks(...args),
  getSupervisorLinks: (...args: unknown[]) => mockGetSupervisorLinks(...args),
  getAqlEnrollmentLogs: (...args: unknown[]) => mockGetAqlEnrollmentLogs(...args),
  createAqlEmployeeLink: (...args: unknown[]) => mockCreateAqlEmployeeLink(...args),
  deleteAqlEmployeeLink: (...args: unknown[]) => mockDeleteAqlEmployeeLink(...args),
  createAqlEnrollmentLog: (...args: unknown[]) => mockCreateAqlEnrollmentLog(...args),
  clearSupervisorLinks: (...args: unknown[]) => mockClearSupervisorLinks(...args),
  batchImportSupervisorLinks: (...args: unknown[]) => mockBatchImportSupervisorLinks(...args),
  fetchAqlManpower: (...args: unknown[]) => mockFetchAqlManpower(...args),
}));

vi.mock('@/services/inspectionService', () => ({
  checkDuplicateEnrollment: (...args: unknown[]) => mockCheckDuplicateEnrollment(...args),
  createEnrollment: (...args: unknown[]) => mockCreateEnrollment(...args),
}));

vi.mock('@/services/recommendationService', () => ({
  getMappings: (...args: unknown[]) => mockGetMappings(...args),
}));

vi.mock('@/services/api', () => ({
  getEmployees: (...args: unknown[]) => mockGetEmployees(...args),
  getPrograms: (...args: unknown[]) => mockGetPrograms(...args),
}));

vi.mock('@/utils/aqlDataProcessor', () => ({
  processAqlRawData: (...args: unknown[]) => mockProcessAqlRawData(...args),
}));

vi.mock('@/utils/aqlAnalyzer', () => ({
  analyzeAqlRecommendations: (...args: unknown[]) => mockAnalyzeAqlRecommendations(...args),
}));

vi.mock('@/utils/manpowerCsvParser', () => ({
  parseManpowerCsv: (...args: unknown[]) => mockParseManpowerCsv(...args),
}));

import { useAqlStore } from './aqlStore';

// ========== Test Data ==========

const mockMonths: AqlMonthOption[] = [
  { year_month: '2024-01', label: 'January 2024' },
  { year_month: '2023-12', label: 'December 2023' },
];

const mockRawData: AqlRawRow[] = [
  {
    employee_no: 'AQL-001',
    employee_name: 'Inspector A',
    po_number: 'PO-001',
    building: 'A',
    result: 'FAIL',
    defect_type: 'Stitch',
    inspection_date: '2024-01-15',
  } as AqlRawRow,
];

const mockProcessed: AqlProcessedData = {
  inspectors: [],
  summary: { totalInspections: 100, totalFails: 10, avgFailRate: 10 },
} as unknown as AqlProcessedData;

const mockEmployee: Employee = {
  id: 'emp-1',
  employee_id: 'EMP-001',
  employee_name: 'Nguyen Van A',
  department: 'QA',
  position: 'INSPECTOR',
} as Employee;

const mockProgram: TrainingProgram = {
  id: 'prog-1',
  program_code: 'INS-001',
  program_name: 'Inspection Training',
} as TrainingProgram;

const mockAqlLink: AqlEmployeeLink = {
  link_id: 'link-1',
  aql_employee_no: 'AQL-001',
  aql_employee_name: 'Inspector A',
  employee_id: 'EMP-001',
  employee_name: 'Nguyen Van A',
  created_at: '2024-01-01',
};

const mockMapping: DefectTrainingMapping = {
  mapping_id: 'map-1',
  defect_type: 'Stitch',
  program_code: 'INS-001',
  program_name: 'Inspection Training',
} as DefectTrainingMapping;

const mockSupervisorLink: AqlSupervisorLink = {
  link_id: 'sv-1',
  employee_no: 'AQL-001',
  employee_name: 'Inspector A',
  supervisor_no: 'SUP-001',
  supervisor_name: 'Supervisor Kim',
  building: 'A',
  imported_at: '2024-01-01',
  source_file: 'manpower.csv',
};

const mockRecommendation: AqlTrainingRecommendation = {
  aql_employee_no: 'AQL-001',
  aql_employee_name: 'Inspector A',
  fail_rate: 25,
  top_defects: [{ type: 'Stitch', count: 5 }],
  enrollment_reason: 'High fail rate',
  linked_employee: { employee_id: 'EMP-001', employee_name: 'Nguyen Van A' },
  enrollment_status: 'PENDING',
} as AqlTrainingRecommendation;

const mockEnrollmentLog: AqlEnrollmentLog = {
  log_id: 'log-1',
  aql_employee_no: 'AQL-001',
  employee_id: 'EMP-001',
  program_code: 'INS-001',
  year_month: '2024-01',
  created_at: '2024-01-15',
} as AqlEnrollmentLog;

// ========== Tests ==========

describe('AqlStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAqlStore.setState({
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
    });
  });

  // ========== Data Actions ==========

  describe('fetchMonths', () => {
    it('AQL 월 목록을 가져온다', async () => {
      mockFetchAqlMonths.mockResolvedValueOnce({ months: mockMonths });

      await useAqlStore.getState().fetchMonths();

      const state = useAqlStore.getState();
      expect(state.months).toHaveLength(2);
      expect(state.selectedMonth).toBe('2024-01');
      expect(state.isLoadingMonths).toBe(false);
      expect(state.error).toBeNull();
    });

    it('월 목록 조회 실패 시 에러를 저장한다', async () => {
      mockFetchAqlMonths.mockRejectedValueOnce(new Error('Network error'));

      await useAqlStore.getState().fetchMonths();

      expect(useAqlStore.getState().error).toBe('Network error');
      expect(useAqlStore.getState().isLoadingMonths).toBe(false);
    });

    it('Error가 아닌 객체가 throw되면 기본 메시지를 사용한다', async () => {
      mockFetchAqlMonths.mockRejectedValueOnce('string error');

      await useAqlStore.getState().fetchMonths();

      expect(useAqlStore.getState().error).toBe('Failed to fetch AQL months');
    });
  });

  describe('fetchData', () => {
    it('AQL 데이터를 가져오고 처리한다', async () => {
      useAqlStore.setState({ selectedMonth: '2024-01' });
      mockFetchAqlMonthData.mockResolvedValueOnce({ data: mockRawData });
      mockGetEmployees.mockResolvedValueOnce([mockEmployee]);
      mockProcessAqlRawData.mockReturnValueOnce(mockProcessed);

      await useAqlStore.getState().fetchData();

      const state = useAqlStore.getState();
      expect(state.rawData).toEqual(mockRawData);
      expect(state.processedData).toEqual(mockProcessed);
      expect(state.isLoadingData).toBe(false);
    });

    it('yearMonth 파라미터로 selectedMonth를 업데이트한다', async () => {
      useAqlStore.setState({ selectedMonth: '2023-12' });
      mockFetchAqlMonthData.mockResolvedValueOnce({ data: [] });
      mockGetEmployees.mockResolvedValueOnce([]);
      mockProcessAqlRawData.mockReturnValueOnce(mockProcessed);

      await useAqlStore.getState().fetchData('2024-01');

      expect(useAqlStore.getState().selectedMonth).toBe('2024-01');
    });

    it('selectedMonth가 없으면 아무것도 하지 않는다', async () => {
      await useAqlStore.getState().fetchData();

      expect(mockFetchAqlMonthData).not.toHaveBeenCalled();
    });

    it('데이터 조회 실패 시 에러를 저장한다', async () => {
      useAqlStore.setState({ selectedMonth: '2024-01' });
      mockFetchAqlMonthData.mockRejectedValueOnce(new Error('Fetch failed'));

      await useAqlStore.getState().fetchData();

      expect(useAqlStore.getState().error).toBe('Fetch failed');
      expect(useAqlStore.getState().isLoadingData).toBe(false);
    });
  });

  describe('setSelectedMonth', () => {
    it('선택된 월을 변경한다', () => {
      useAqlStore.getState().setSelectedMonth('2024-02');

      expect(useAqlStore.getState().selectedMonth).toBe('2024-02');
    });
  });

  // ========== Config Actions ==========

  describe('fetchConfig', () => {
    it('설정 데이터를 병렬로 가져온다', async () => {
      mockGetMappings.mockResolvedValueOnce([mockMapping]);
      mockGetAqlEmployeeLinks.mockResolvedValueOnce([mockAqlLink]);
      mockGetSupervisorLinks.mockResolvedValueOnce([mockSupervisorLink]);
      mockGetEmployees.mockResolvedValueOnce([mockEmployee]);
      mockGetPrograms.mockResolvedValueOnce([mockProgram]);

      await useAqlStore.getState().fetchConfig();

      const state = useAqlStore.getState();
      expect(state.mappings).toHaveLength(1);
      expect(state.aqlLinks).toHaveLength(1);
      expect(state.supervisorLinks).toHaveLength(1);
      expect(state.employees).toHaveLength(1);
      expect(state.programs).toHaveLength(1);
      expect(state.isLoadingConfig).toBe(false);
    });

    it('설정 조회 실패 시 에러를 저장한다', async () => {
      mockGetMappings.mockRejectedValueOnce(new Error('Config error'));

      await useAqlStore.getState().fetchConfig();

      expect(useAqlStore.getState().error).toBe('Config error');
      expect(useAqlStore.getState().isLoadingConfig).toBe(false);
    });
  });

  // ========== Analysis Actions ==========

  describe('analyzeRecommendations', () => {
    it('processedData가 없으면 에러를 표시한다', async () => {
      await useAqlStore.getState().analyzeRecommendations();

      expect(useAqlStore.getState().error).toBe('Missing data. Load AQL data first.');
    });

    it('추천 분석을 수행한다', async () => {
      useAqlStore.setState({
        processedData: mockProcessed,
        mappings: [mockMapping],
        aqlLinks: [mockAqlLink],
        supervisorLinks: [mockSupervisorLink],
        employees: [mockEmployee],
        programs: [mockProgram],
      });
      mockAnalyzeAqlRecommendations.mockReturnValueOnce([mockRecommendation]);

      await useAqlStore.getState().analyzeRecommendations();

      const state = useAqlStore.getState();
      expect(state.recommendations).toHaveLength(1);
      expect(state.isAnalyzing).toBe(false);
      expect(state.selectedIds).toEqual([]);
    });

    it('supervisorLinks가 없으면 자동 import를 시도한다', async () => {
      useAqlStore.setState({
        processedData: mockProcessed,
        mappings: [mockMapping],
        aqlLinks: [mockAqlLink],
        supervisorLinks: [],
        employees: [mockEmployee],
        programs: [mockProgram],
      });
      mockFetchAqlManpower.mockResolvedValueOnce({ data: [] });
      mockAnalyzeAqlRecommendations.mockReturnValueOnce([]);

      await useAqlStore.getState().analyzeRecommendations();

      expect(mockFetchAqlManpower).toHaveBeenCalled();
      expect(useAqlStore.getState().isAnalyzing).toBe(false);
    });

    it('분석 실패 시 에러를 저장한다', async () => {
      useAqlStore.setState({
        processedData: mockProcessed,
        mappings: [],
        aqlLinks: [],
        supervisorLinks: [mockSupervisorLink],
        employees: [],
        programs: [],
      });
      mockAnalyzeAqlRecommendations.mockImplementationOnce(() => {
        throw new Error('Analysis error');
      });

      await useAqlStore.getState().analyzeRecommendations();

      expect(useAqlStore.getState().error).toBe('Analysis error');
      expect(useAqlStore.getState().isAnalyzing).toBe(false);
    });
  });

  // ========== Enrollment Actions ==========

  describe('enrollRecommendation', () => {
    it('linked_employee가 없으면 에러를 표시한다', async () => {
      const recWithoutLink = { ...mockRecommendation, linked_employee: null };

      await useAqlStore.getState().enrollRecommendation(
        recWithoutLink as unknown as AqlTrainingRecommendation,
        'INS-001',
        '2024-01'
      );

      expect(useAqlStore.getState().error).toBe('No linked employee for this AQL inspector');
    });

    it('프로그램이 없으면 에러를 throw한다', async () => {
      useAqlStore.setState({ programs: [] });

      await useAqlStore.getState().enrollRecommendation(mockRecommendation, 'INS-001', '2024-01');

      expect(useAqlStore.getState().error).toBe('Program not found');
    });

    it('INS-001 중복 등록을 검사한다', async () => {
      useAqlStore.setState({
        programs: [mockProgram],
        recommendations: [mockRecommendation],
      });
      mockCheckDuplicateEnrollment.mockResolvedValueOnce({ status: 'PENDING' });

      await useAqlStore.getState().enrollRecommendation(mockRecommendation, 'INS-001', '2024-01');

      expect(mockCheckDuplicateEnrollment).toHaveBeenCalledWith('EMP-001', 'INS-001');
      expect(useAqlStore.getState().isEnrolling).toBe(false);
      expect(useAqlStore.getState().error).toContain('already has a');
    });

    it('성공적으로 등록하고 상태를 ENROLLED로 변경한다', async () => {
      useAqlStore.setState({
        programs: [mockProgram],
        recommendations: [mockRecommendation],
      });
      mockCheckDuplicateEnrollment.mockResolvedValueOnce(null);
      mockCreateAqlEnrollmentLog.mockResolvedValueOnce(mockEnrollmentLog);
      mockCreateEnrollment.mockResolvedValueOnce({});

      await useAqlStore.getState().enrollRecommendation(mockRecommendation, 'INS-001', '2024-01');

      const state = useAqlStore.getState();
      expect(state.recommendations[0].enrollment_status).toBe('ENROLLED');
      expect(state.isEnrolling).toBe(false);
      expect(mockCreateEnrollment).toHaveBeenCalled();
    });
  });

  describe('batchEnroll', () => {
    it('여러 추천을 일괄 등록한다', async () => {
      useAqlStore.setState({
        programs: [mockProgram],
        recommendations: [mockRecommendation],
      });
      mockCheckDuplicateEnrollment.mockResolvedValueOnce(null);
      mockCreateAqlEnrollmentLog.mockResolvedValueOnce(mockEnrollmentLog);
      mockCreateEnrollment.mockResolvedValueOnce({});

      await useAqlStore.getState().batchEnroll([mockRecommendation], 'INS-001', '2024-01');

      const state = useAqlStore.getState();
      expect(state.isEnrolling).toBe(false);
      expect(state.selectedIds).toEqual([]);
    });

    it('중복 등록 시 건너뛰고 카운트한다', async () => {
      useAqlStore.setState({
        programs: [mockProgram],
        recommendations: [mockRecommendation],
      });
      mockCheckDuplicateEnrollment.mockResolvedValueOnce({ status: 'PENDING' });

      await useAqlStore.getState().batchEnroll([mockRecommendation], 'INS-001', '2024-01');

      const state = useAqlStore.getState();
      expect(state.error).toContain('skipped');
    });

    it('일괄 등록 실패 시 에러를 저장한다', async () => {
      useAqlStore.setState({ programs: [] });

      await useAqlStore.getState().batchEnroll([mockRecommendation], 'INS-001', '2024-01');

      expect(useAqlStore.getState().error).toBe('Program not found');
      expect(useAqlStore.getState().isEnrolling).toBe(false);
    });
  });

  // ========== Link Actions ==========

  describe('createAqlLink', () => {
    it('AQL 직원 링크를 생성한다', async () => {
      const input = {
        aql_employee_no: 'AQL-002',
        aql_employee_name: 'Inspector B',
        employee_id: 'EMP-002',
        employee_name: 'Tran Thi B',
      };
      const created = { ...input, link_id: 'link-2', created_at: '2024-01-15' };
      mockCreateAqlEmployeeLink.mockResolvedValueOnce(created);

      await useAqlStore.getState().createAqlLink(input);

      expect(useAqlStore.getState().aqlLinks).toHaveLength(1);
      expect(useAqlStore.getState().aqlLinks[0].link_id).toBe('link-2');
    });

    it('링크 생성 실패 시 에러를 저장한다', async () => {
      mockCreateAqlEmployeeLink.mockRejectedValueOnce(new Error('Link error'));

      await useAqlStore.getState().createAqlLink({
        aql_employee_no: 'X',
        aql_employee_name: 'X',
        employee_id: 'X',
        employee_name: 'X',
      });

      expect(useAqlStore.getState().error).toBe('Link error');
    });
  });

  describe('deleteAqlLink', () => {
    it('AQL 직원 링크를 삭제한다', async () => {
      useAqlStore.setState({ aqlLinks: [mockAqlLink] });
      mockDeleteAqlEmployeeLink.mockResolvedValueOnce(undefined);

      await useAqlStore.getState().deleteAqlLink('link-1');

      expect(useAqlStore.getState().aqlLinks).toHaveLength(0);
    });

    it('링크 삭제 실패 시 에러를 저장한다', async () => {
      mockDeleteAqlEmployeeLink.mockRejectedValueOnce(new Error('Delete error'));

      await useAqlStore.getState().deleteAqlLink('link-1');

      expect(useAqlStore.getState().error).toBe('Delete error');
    });
  });

  // ========== Supervisor Import ==========

  describe('importSupervisorLinks', () => {
    it('CSV에서 감독자 링크를 가져온다', async () => {
      mockParseManpowerCsv.mockReturnValueOnce({
        links: [{ employee_no: 'AQL-001', supervisor_no: 'SUP-001' }],
        errors: [],
      });
      mockClearSupervisorLinks.mockResolvedValueOnce(undefined);
      mockBatchImportSupervisorLinks.mockResolvedValueOnce(1);
      mockGetSupervisorLinks.mockResolvedValueOnce([mockSupervisorLink]);

      const result = await useAqlStore.getState().importSupervisorLinks('csv-text', 'file.csv');

      expect(result.success).toBe(1);
      expect(useAqlStore.getState().supervisorLinks).toHaveLength(1);
      expect(useAqlStore.getState().isImporting).toBe(false);
    });

    it('유효한 링크가 없으면 에러를 표시한다', async () => {
      mockParseManpowerCsv.mockReturnValueOnce({ links: [], errors: [] });

      const result = await useAqlStore.getState().importSupervisorLinks('csv', 'f.csv');

      expect(result.success).toBe(0);
      expect(useAqlStore.getState().error).toBe('No valid supervisor links found in CSV');
    });

    it('import 실패 시 에러를 저장한다', async () => {
      mockParseManpowerCsv.mockImplementationOnce(() => {
        throw new Error('Parse error');
      });

      const result = await useAqlStore.getState().importSupervisorLinks('bad', 'f.csv');

      expect(result.success).toBe(0);
      expect(useAqlStore.getState().error).toBe('Parse error');
    });
  });

  // ========== Logs ==========

  describe('fetchLogs', () => {
    it('등록 로그를 가져온다', async () => {
      mockGetAqlEnrollmentLogs.mockResolvedValueOnce([mockEnrollmentLog]);

      await useAqlStore.getState().fetchLogs();

      expect(useAqlStore.getState().enrollmentLogs).toHaveLength(1);
      expect(useAqlStore.getState().isLoadingLogs).toBe(false);
    });

    it('로그 조회 실패 시 에러를 저장한다', async () => {
      mockGetAqlEnrollmentLogs.mockRejectedValueOnce(new Error('Log error'));

      await useAqlStore.getState().fetchLogs();

      expect(useAqlStore.getState().error).toBe('Log error');
      expect(useAqlStore.getState().isLoadingLogs).toBe(false);
    });
  });

  // ========== UI Actions ==========

  describe('setFilters', () => {
    it('필터를 설정한다', () => {
      useAqlStore.getState().setFilters({ building: 'A' });

      expect(useAqlStore.getState().filters).toEqual({ building: 'A' });
    });
  });

  describe('setSelectedIds', () => {
    it('선택된 ID를 설정한다', () => {
      useAqlStore.getState().setSelectedIds(['id-1', 'id-2']);

      expect(useAqlStore.getState().selectedIds).toEqual(['id-1', 'id-2']);
    });
  });

  describe('clearError', () => {
    it('에러를 초기화한다', () => {
      useAqlStore.setState({ error: '이전 에러' });

      useAqlStore.getState().clearError();

      expect(useAqlStore.getState().error).toBeNull();
    });
  });
});
