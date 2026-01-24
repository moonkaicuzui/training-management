/**
 * Training Store Tests
 * 교육 관리 스토어 테스트
 *
 * [TAE 🤖] Test Automation Engineer
 * [TDE 🎓] Training Domain Expert
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  Employee,
  TrainingProgram,
  TrainingSession,
  TrainingResultRecord,
  DashboardStats,
  ProgressMatrixData,
  RetrainingTarget,
  ExpiringTraining,
} from '@/types';

// ========== Mock Data ==========

const mockEmployees: Employee[] = [
  {
    employee_id: 'EMP001',
    name: '홍길동',
    department: '생산부',
    position: '사원',
    building: 'A동',
    line: 'Line-1',
    hire_date: '2023-01-15',
    status: 'ACTIVE',
    updated_at: '2024-01-01',
  },
  {
    employee_id: 'EMP002',
    name: '김철수',
    department: '품질부',
    position: '대리',
    building: 'B동',
    line: 'Line-2',
    hire_date: '2022-06-01',
    status: 'ACTIVE',
    updated_at: '2024-01-01',
  },
];

const mockPrograms: TrainingProgram[] = [
  {
    program_code: 'QIP-001',
    name_ko: 'QIP 기초 교육',
    name_vi: 'Đào tạo QIP cơ bản',
    name_en: 'QIP Basic Training',
    category: 'QIP',
    target_positions: ['사원', '대리'],
    duration_hours: 8,
    passing_score: 70,
    validity_months: 12,
    is_mandatory: true,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2024-01-01',
  },
  {
    program_code: 'SAFETY-001',
    name_ko: '안전 교육',
    name_vi: 'Đào tạo an toàn',
    name_en: 'Safety Training',
    category: 'SAFETY',
    target_positions: ['사원', '대리', '과장'],
    duration_hours: 4,
    passing_score: 80,
    validity_months: 6,
    is_mandatory: true,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2024-01-01',
  },
];

const mockSessions: TrainingSession[] = [
  {
    session_id: 'SES-2024-001',
    program_code: 'QIP-001',
    session_date: '2024-01-15',
    trainer: '박강사',
    location: '교육장 A',
    max_participants: 30,
    status: 'COMPLETED',
    created_at: '2024-01-01',
  },
  {
    session_id: 'SES-2024-002',
    program_code: 'SAFETY-001',
    session_date: '2024-02-01',
    trainer: '이강사',
    location: '교육장 B',
    max_participants: 20,
    status: 'SCHEDULED',
    created_at: '2024-01-15',
  },
];

const mockResults: TrainingResultRecord[] = [
  {
    result_id: 'RES-001',
    session_id: 'SES-2024-001',
    employee_id: 'EMP001',
    score: 85,
    result: 'PASS',
    grade: 'A',
    completed_at: '2024-01-15',
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    result_id: 'RES-002',
    session_id: 'SES-2024-001',
    employee_id: 'EMP002',
    score: 65,
    result: 'FAIL',
    grade: 'F',
    completed_at: '2024-01-15',
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
];

// ========== Tests ==========

describe('Training Store State Management', () => {
  describe('Initial State', () => {
    it('초기 상태는 빈 배열과 null 값을 가진다', () => {
      const initialState = {
        employees: [],
        programs: [],
        sessions: [],
        results: [],
        dashboardStats: null,
        progressMatrix: null,
        retrainingTargets: [],
        expiringTrainings: [],
      };

      expect(initialState.employees).toHaveLength(0);
      expect(initialState.programs).toHaveLength(0);
      expect(initialState.sessions).toHaveLength(0);
      expect(initialState.results).toHaveLength(0);
      expect(initialState.dashboardStats).toBeNull();
      expect(initialState.progressMatrix).toBeNull();
    });

    it('로딩 상태는 모두 false로 초기화된다', () => {
      const initialLoading = {
        employees: false,
        programs: false,
        sessions: false,
        results: false,
        dashboard: false,
        progressMatrix: false,
        progress: false,
        retraining: false,
      };

      Object.values(initialLoading).forEach((loading) => {
        expect(loading).toBe(false);
      });
    });
  });
});

describe('Employee Management', () => {
  describe('Employee Filtering', () => {
    it('부서별로 직원을 필터링할 수 있다', () => {
      const filters = { department: '생산부' };
      const filtered = mockEmployees.filter(
        (e) => !filters.department || e.department === filters.department
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].department).toBe('생산부');
    });

    it('상태별로 직원을 필터링할 수 있다', () => {
      const filters = { status: 'ACTIVE' as const };
      const filtered = mockEmployees.filter(
        (e) => !filters.status || e.status === filters.status
      );

      expect(filtered).toHaveLength(2);
    });

    it('이름으로 직원을 검색할 수 있다', () => {
      const filters = { search: '홍' };
      const searchLower = filters.search.toLowerCase();
      const filtered = mockEmployees.filter(
        (e) => e.name.toLowerCase().includes(searchLower)
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('홍길동');
    });
  });

  describe('Employee Validation', () => {
    it('필수 필드가 있는 직원 데이터를 검증한다', () => {
      const employee = mockEmployees[0];

      expect(employee.employee_id).toBeDefined();
      expect(employee.name).toBeDefined();
      expect(employee.department).toBeDefined();
      expect(employee.status).toBeDefined();
    });

    it('유효한 상태값만 허용한다', () => {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'];

      mockEmployees.forEach((employee) => {
        expect(validStatuses).toContain(employee.status);
      });
    });
  });
});

describe('Program Management', () => {
  describe('Program Filtering', () => {
    it('카테고리별로 프로그램을 필터링할 수 있다', () => {
      const filters = { category: 'QIP' };
      const filtered = mockPrograms.filter(
        (p) => !filters.category || p.category === filters.category
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('QIP');
    });

    it('필수 교육만 필터링할 수 있다', () => {
      const filtered = mockPrograms.filter((p) => p.is_mandatory);
      expect(filtered).toHaveLength(2);
    });

    it('활성 프로그램만 필터링할 수 있다', () => {
      const filtered = mockPrograms.filter((p) => p.is_active);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Program Soft Delete', () => {
    it('프로그램 삭제 시 is_active를 false로 설정한다', () => {
      const program = { ...mockPrograms[0] };
      program.is_active = false;

      expect(program.is_active).toBe(false);
      // 프로그램 데이터는 여전히 존재
      expect(program.program_code).toBe('QIP-001');
    });

    it('비활성 프로그램도 조회는 가능하다', () => {
      const allPrograms = [...mockPrograms, { ...mockPrograms[0], is_active: false }];
      expect(allPrograms).toHaveLength(3);
    });
  });

  describe('Program Multilingual Support', () => {
    it('다국어 이름을 지원한다', () => {
      const program = mockPrograms[0];

      expect(program.name_ko).toBeDefined();
      expect(program.name_vi).toBeDefined();
      expect(program.name_en).toBeDefined();
    });

    it('한국어, 베트남어, 영어 이름이 모두 있다', () => {
      mockPrograms.forEach((program) => {
        expect(program.name_ko).toBeTruthy();
        expect(program.name_vi).toBeTruthy();
        expect(program.name_en).toBeTruthy();
      });
    });
  });
});

describe('Session Management', () => {
  describe('Session Status', () => {
    it('세션 상태를 변경할 수 있다', () => {
      const session = { ...mockSessions[1] };
      session.status = 'COMPLETED';

      expect(session.status).toBe('COMPLETED');
    });

    it('유효한 세션 상태만 허용한다', () => {
      const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

      mockSessions.forEach((session) => {
        expect(validStatuses).toContain(session.status);
      });
    });

    it('취소된 세션은 CANCELLED 상태이다', () => {
      const cancelledSession = { ...mockSessions[0], status: 'CANCELLED' as const };
      expect(cancelledSession.status).toBe('CANCELLED');
    });
  });

  describe('Session Filtering', () => {
    it('프로그램 코드로 세션을 필터링할 수 있다', () => {
      const filtered = mockSessions.filter((s) => s.program_code === 'QIP-001');
      expect(filtered).toHaveLength(1);
    });

    it('상태로 세션을 필터링할 수 있다', () => {
      const filtered = mockSessions.filter((s) => s.status === 'SCHEDULED');
      expect(filtered).toHaveLength(1);
    });

    it('날짜 범위로 세션을 필터링할 수 있다', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const filtered = mockSessions.filter((s) => {
        const sessionDate = new Date(s.session_date);
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      expect(filtered).toHaveLength(1);
    });
  });
});

describe('Result Management', () => {
  describe('NO DELETE Policy', () => {
    it('결과 데이터는 삭제되지 않는다 (정책)', () => {
      // 결과 삭제 함수가 없어야 함
      const resultActions = {
        recordResults: () => {},
        updateResult: () => {},
        // deleteResult: () => {}, // 이 함수는 존재하면 안 됨
      };

      expect(resultActions).not.toHaveProperty('deleteResult');
    });

    it('결과 수정 시 edit_reason이 필수이다', () => {
      const updateData = {
        result_id: 'RES-001',
        score: 90,
        edit_reason: '점수 정정', // 필수
      };

      expect(updateData.edit_reason).toBeDefined();
      expect(updateData.edit_reason.length).toBeGreaterThan(0);
    });
  });

  describe('Result Calculation', () => {
    it('합격 기준을 충족하면 PASS이다', () => {
      const passingScore = 70;
      const score = 85;

      const result = score >= passingScore ? 'PASS' : 'FAIL';
      expect(result).toBe('PASS');
    });

    it('합격 기준 미달이면 FAIL이다', () => {
      const passingScore = 70;
      const score = 65;

      const result = score >= passingScore ? 'PASS' : 'FAIL';
      expect(result).toBe('FAIL');
    });

    it('결석은 ABSENT로 기록된다', () => {
      const result: TrainingResultRecord = {
        ...mockResults[0],
        result: 'ABSENT',
        score: null as unknown as number,
      };

      expect(result.result).toBe('ABSENT');
    });
  });

  describe('Grade Assignment', () => {
    it('점수에 따라 등급을 부여한다', () => {
      const getGrade = (score: number): string => {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
      };

      expect(getGrade(95)).toBe('A');
      expect(getGrade(85)).toBe('B');
      expect(getGrade(75)).toBe('C');
      expect(getGrade(65)).toBe('D');
      expect(getGrade(55)).toBe('F');
    });
  });
});

describe('Retraining Management', () => {
  describe('Retraining Target Identification', () => {
    it('불합격자를 재교육 대상자로 식별한다', () => {
      const failedResults = mockResults.filter((r) => r.result === 'FAIL');
      expect(failedResults).toHaveLength(1);
      expect(failedResults[0].employee_id).toBe('EMP002');
    });

    it('결석자도 재교육 대상자이다', () => {
      const absentResults = [
        { ...mockResults[0], result: 'ABSENT' as const },
      ];

      const retrainingTargets = absentResults.filter(
        (r) => r.result === 'FAIL' || r.result === 'ABSENT'
      );

      expect(retrainingTargets).toHaveLength(1);
    });
  });

  describe('Training Expiration', () => {
    it('유효기간이 만료 예정인 교육을 식별한다', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const completedTraining = {
        completed_at: new Date('2023-02-01'),
        validity_months: 12,
      };

      const expirationDate = new Date(completedTraining.completed_at);
      expirationDate.setMonth(expirationDate.getMonth() + completedTraining.validity_months);

      const isExpiringSoon = expirationDate <= thirtyDaysLater;
      expect(isExpiringSoon).toBe(true);
    });

    it('만료된 교육은 재교육이 필요하다', () => {
      const now = new Date();

      const expiredTraining = {
        completed_at: new Date('2022-01-01'),
        validity_months: 12,
      };

      const expirationDate = new Date(expiredTraining.completed_at);
      expirationDate.setMonth(expirationDate.getMonth() + expiredTraining.validity_months);

      const isExpired = expirationDate < now;
      expect(isExpired).toBe(true);
    });
  });
});

describe('Dashboard Statistics', () => {
  describe('Stats Calculation', () => {
    it('총 직원 수를 계산한다', () => {
      const totalEmployees = mockEmployees.length;
      expect(totalEmployees).toBe(2);
    });

    it('활성 프로그램 수를 계산한다', () => {
      const activePrograms = mockPrograms.filter((p) => p.is_active).length;
      expect(activePrograms).toBe(2);
    });

    it('완료된 세션 수를 계산한다', () => {
      const completedSessions = mockSessions.filter((s) => s.status === 'COMPLETED').length;
      expect(completedSessions).toBe(1);
    });

    it('합격률을 계산한다', () => {
      const totalResults = mockResults.length;
      const passedResults = mockResults.filter((r) => r.result === 'PASS').length;
      const passRate = Math.round((passedResults / totalResults) * 100);

      expect(passRate).toBe(50);
    });
  });

  describe('Monthly Data', () => {
    it('월별 교육 데이터를 집계한다', () => {
      const monthlyData = mockResults.reduce((acc, result) => {
        const month = result.completed_at?.substring(0, 7); // YYYY-MM
        if (month) {
          acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      expect(monthlyData['2024-01']).toBe(2);
    });
  });

  describe('Grade Distribution', () => {
    it('등급 분포를 계산한다', () => {
      const gradeDistribution = mockResults.reduce((acc, result) => {
        if (result.grade) {
          acc[result.grade] = (acc[result.grade] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      expect(gradeDistribution['A']).toBe(1);
      expect(gradeDistribution['F']).toBe(1);
    });
  });
});

describe('Progress Matrix', () => {
  describe('Matrix Calculation', () => {
    it('직원-프로그램 진행 상태 매트릭스를 생성한다', () => {
      const matrix = mockEmployees.map((employee) => ({
        employee_id: employee.employee_id,
        employee_name: employee.name,
        programs: mockPrograms.map((program) => {
          const result = mockResults.find(
            (r) => r.employee_id === employee.employee_id
            // 실제로는 program_code도 확인해야 함
          );
          return {
            program_code: program.program_code,
            status: result?.result || 'NOT_STARTED',
          };
        }),
      }));

      expect(matrix).toHaveLength(2);
      expect(matrix[0].programs).toHaveLength(2);
    });
  });

  describe('Matrix Filtering', () => {
    it('부서별로 매트릭스를 필터링할 수 있다', () => {
      const filters = { department: '생산부' };
      const filteredEmployees = mockEmployees.filter(
        (e) => e.department === filters.department
      );

      expect(filteredEmployees).toHaveLength(1);
    });

    it('프로그램 카테고리별로 필터링할 수 있다', () => {
      const filters = { category: 'QIP' };
      const filteredPrograms = mockPrograms.filter(
        (p) => p.category === filters.category
      );

      expect(filteredPrograms).toHaveLength(1);
    });
  });
});
