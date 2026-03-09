/**
 * Inspection Store Tests
 * 검사 교육 스토어 기능 테스트 (enrollEmployee, 에러 핸들링, 중복 등록)
 *
 * [TAE] Test Automation Engineer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  InspectionEnrollment,
  InspectionEnrollmentInput,
} from '@/types/inspection';

// ========== Mock Setup ==========

// Mock i18next before importing the store
vi.mock('i18next', () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        'inspection.errors.permission': '접근 권한이 없습니다.',
        'inspection.errors.notFound': '데이터를 찾을 수 없습니다.',
        'inspection.errors.network': '네트워크 오류가 발생했습니다.',
        'inspection.errors.generic': '오류가 발생했습니다.',
      };
      return translations[key] || key;
    },
  },
}));

// Mock api module
const mockCreateInspectionEnrollment = vi.fn();

vi.mock('@/services/api', () => ({
  getInspectionResults: vi.fn().mockResolvedValue([]),
  getInspectionResultsByEmployee: vi.fn().mockResolvedValue([]),
  getInspectionDetail: vi.fn().mockResolvedValue(null),
  createInspectionResult: vi.fn().mockResolvedValue({ resultId: 'R1', inspectionId: 'I1', matchRate: 90 }),
  getInspectionEnrollments: vi.fn().mockResolvedValue([]),
  createInspectionEnrollment: (...args: unknown[]) => mockCreateInspectionEnrollment(...args),
  updateInspectionEnrollmentStatus: vi.fn().mockResolvedValue(undefined),
  getInspectionConsecutiveFailures: vi.fn().mockResolvedValue({
    employee_id: 'EMP001',
    consecutive_failures: 0,
    last_attempts: [],
    requires_reassignment: false,
  }),
  autoEnrollInspectionFromLogs: vi.fn().mockResolvedValue({ enrolled: 0, skipped: 0, errors: 0 }),
}));

// Import store AFTER mocks are set up
import { useInspectionStore } from './inspectionStore';

// ========== Test Data ==========

const mockEnrollmentInput: InspectionEnrollmentInput = {
  employee_id: 'EMP001',
  employee_name: 'Test Employee',
  program_code: 'INS-001',
  source: 'MANUAL',
  enrolled_by: 'ADMIN001',
};

const mockEnrollment: InspectionEnrollment = {
  enrollment_id: 'ENR-123',
  employee_id: 'EMP001',
  employee_name: 'Test Employee',
  program_code: 'INS-001',
  source: 'MANUAL',
  enrolled_by: 'ADMIN001',
  enrolled_at: '2024-01-15',
  status: 'PENDING',
};

// ========== Tests ==========

describe('InspectionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useInspectionStore.setState({
      results: [],
      selectedResult: null,
      enrollments: [],
      strikeMap: {},
      isLoadingResults: false,
      isLoadingEnrollments: false,
      isSubmitting: false,
      error: null,
    });
  });

  describe('enrollEmployee', () => {
    it('직원을 교육에 등록하고 enrollments 목록에 추가한다', async () => {
      mockCreateInspectionEnrollment.mockResolvedValueOnce(mockEnrollment);

      const result = await useInspectionStore.getState().enrollEmployee(mockEnrollmentInput);

      expect(result).toEqual(mockEnrollment);
      expect(mockCreateInspectionEnrollment).toHaveBeenCalledWith(mockEnrollmentInput);

      const state = useInspectionStore.getState();
      expect(state.enrollments).toHaveLength(1);
      expect(state.enrollments[0]).toEqual(mockEnrollment);
      expect(state.isSubmitting).toBe(false);
      expect(state.error).toBeNull();
    });

    it('등록 중 isSubmitting이 true로 설정된다', async () => {
      let resolvePromise: (value: InspectionEnrollment) => void;
      const pendingPromise = new Promise<InspectionEnrollment>((resolve) => {
        resolvePromise = resolve;
      });
      mockCreateInspectionEnrollment.mockReturnValueOnce(pendingPromise);

      const enrollPromise = useInspectionStore.getState().enrollEmployee(mockEnrollmentInput);

      // isSubmitting should be true while waiting
      expect(useInspectionStore.getState().isSubmitting).toBe(true);

      resolvePromise!(mockEnrollment);
      await enrollPromise;

      expect(useInspectionStore.getState().isSubmitting).toBe(false);
    });

    it('기존 enrollments에 새 등록을 추가한다 (기존 데이터 유지)', async () => {
      const existingEnrollment: InspectionEnrollment = {
        ...mockEnrollment,
        enrollment_id: 'ENR-EXISTING',
        employee_id: 'EMP999',
        employee_name: 'Existing Employee',
      };

      useInspectionStore.setState({ enrollments: [existingEnrollment] });

      const newEnrollment: InspectionEnrollment = {
        ...mockEnrollment,
        enrollment_id: 'ENR-NEW',
      };
      mockCreateInspectionEnrollment.mockResolvedValueOnce(newEnrollment);

      await useInspectionStore.getState().enrollEmployee(mockEnrollmentInput);

      const state = useInspectionStore.getState();
      expect(state.enrollments).toHaveLength(2);
      expect(state.enrollments[0].enrollment_id).toBe('ENR-EXISTING');
      expect(state.enrollments[1].enrollment_id).toBe('ENR-NEW');
    });
  });

  describe('에러 핸들링', () => {
    it('permission 에러를 i18n 키로 변환한다', async () => {
      mockCreateInspectionEnrollment.mockRejectedValueOnce(
        new Error('Permission denied')
      );

      await expect(
        useInspectionStore.getState().enrollEmployee(mockEnrollmentInput)
      ).rejects.toThrow();

      const state = useInspectionStore.getState();
      expect(state.error).toBe('접근 권한이 없습니다.');
      expect(state.isSubmitting).toBe(false);
    });

    it('network 에러를 i18n 키로 변환한다', async () => {
      mockCreateInspectionEnrollment.mockRejectedValueOnce(
        new Error('Failed to fetch')
      );

      await expect(
        useInspectionStore.getState().enrollEmployee(mockEnrollmentInput)
      ).rejects.toThrow();

      const state = useInspectionStore.getState();
      expect(state.error).toBe('네트워크 오류가 발생했습니다.');
    });

    it('not-found 에러를 i18n 키로 변환한다', async () => {
      mockCreateInspectionEnrollment.mockRejectedValueOnce(
        new Error('Resource not-found')
      );

      await expect(
        useInspectionStore.getState().enrollEmployee(mockEnrollmentInput)
      ).rejects.toThrow();

      const state = useInspectionStore.getState();
      expect(state.error).toBe('데이터를 찾을 수 없습니다.');
    });

    it('알 수 없는 에러를 generic 메시지로 변환한다', async () => {
      mockCreateInspectionEnrollment.mockRejectedValueOnce(
        new Error('Something unexpected happened')
      );

      await expect(
        useInspectionStore.getState().enrollEmployee(mockEnrollmentInput)
      ).rejects.toThrow();

      const state = useInspectionStore.getState();
      expect(state.error).toBe('오류가 발생했습니다.');
    });

    it('에러 발생 시 isSubmitting이 false로 복구된다', async () => {
      mockCreateInspectionEnrollment.mockRejectedValueOnce(
        new Error('Some error')
      );

      await expect(
        useInspectionStore.getState().enrollEmployee(mockEnrollmentInput)
      ).rejects.toThrow();

      expect(useInspectionStore.getState().isSubmitting).toBe(false);
    });

    it('에러 발생 후에도 에러를 throw한다 (호출자가 catch 가능)', async () => {
      const originalError = new Error('Test error');
      mockCreateInspectionEnrollment.mockRejectedValueOnce(originalError);

      await expect(
        useInspectionStore.getState().enrollEmployee(mockEnrollmentInput)
      ).rejects.toThrow('Test error');
    });
  });

  describe('중복 등록 에러 처리', () => {
    it('Duplicate enrollment 에러 메시지를 그대로 표시한다', async () => {
      const duplicateError = new Error(
        'Duplicate enrollment: Employee EMP001 already has a PENDING enrollment for INS-001'
      );
      mockCreateInspectionEnrollment.mockRejectedValueOnce(duplicateError);

      await expect(
        useInspectionStore.getState().enrollEmployee(mockEnrollmentInput)
      ).rejects.toThrow();

      const state = useInspectionStore.getState();
      // 중복 에러는 원본 메시지 사용 (getErrorMessage가 아님)
      expect(state.error).toContain('Duplicate enrollment');
      expect(state.error).toContain('EMP001');
      expect(state.isSubmitting).toBe(false);
    });

    it('중복이 아닌 에러는 getErrorMessage로 변환한다', async () => {
      mockCreateInspectionEnrollment.mockRejectedValueOnce(
        new Error('Some other error')
      );

      await expect(
        useInspectionStore.getState().enrollEmployee(mockEnrollmentInput)
      ).rejects.toThrow();

      const state = useInspectionStore.getState();
      expect(state.error).toBe('오류가 발생했습니다.');
    });
  });

  describe('clearError', () => {
    it('에러 상태를 초기화한다', () => {
      useInspectionStore.setState({ error: '이전 에러' });

      useInspectionStore.getState().clearError();

      expect(useInspectionStore.getState().error).toBeNull();
    });
  });
});
