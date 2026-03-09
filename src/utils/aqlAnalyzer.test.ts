/**
 * AQL Analyzer Tests
 * aqlAnalyzer.ts 의 핵심 비즈니스 로직 단위 테스트
 *
 * 테스트 대상:
 * - classifyPriority: 불합격률 기반 우선순위 분류
 *   - CRITICAL: >50%, HIGH: >30%, MEDIUM: >10%, null: ≤10%
 * - calculatePriorityScore: 우선순위 점수 계산
 * - analyzeAqlRecommendations: 전체 분석 + 추천 생성
 * - deduplicateRecommendations: 중복 제거 로직
 */

import { describe, it, expect } from 'vitest';

import { analyzeAqlRecommendations } from '@/utils/aqlAnalyzer';

import type {
  AqlProcessedData,
  AqlInspectorRecord,
  AqlEmployeeLink,
  AqlSupervisorLink,
} from '@/types/aql';
import type { DefectTrainingMapping } from '@/types/recommendation';
import type { Employee, TrainingProgram } from '@/types';

// ============================================================
// Test Helpers
// ============================================================

const createInspectorRecord = (
  overrides: Partial<AqlInspectorRecord> = {}
): AqlInspectorRecord => ({
  employee_no: 'INS-001',
  employee_name: 'Inspector A',
  buildings: ['A'],
  total_inspections: 100,
  pass_count: 50,
  fail_count: 50,
  fail_rate: 50,
  parsed_defects: { 'Stitch': 30, 'Glue': 20 },
  ...overrides,
});

const createProcessedData = (
  records: AqlInspectorRecord[]
): AqlProcessedData => ({
  yearMonth: '2024-06',
  inspectorRecords: records,
  totalInspections: records.reduce((sum, r) => sum + r.total_inspections, 0),
  overallFailRate: 0,
  buildingSummary: {},
  lastUpdated: '2024-06-30',
});

const defaultMappings: DefectTrainingMapping[] = [
  {
    id: 'map-001',
    defect_type: 'Stitch',
    program_codes: ['QIP-001', 'QIP-002'],
    description: 'Stitching defect training',
    is_active: true,
    created_at: '2024-01-01',
  },
  {
    id: 'map-002',
    defect_type: 'Glue',
    program_codes: ['QIP-003'],
    description: 'Glue defect training',
    is_active: true,
    created_at: '2024-01-01',
  },
  {
    id: 'map-003',
    defect_type: 'Inactive Defect',
    program_codes: ['QIP-099'],
    description: 'Inactive mapping',
    is_active: false,
    created_at: '2024-01-01',
  },
];

const defaultEmployees: Employee[] = [
  {
    employee_id: 'EMP-001',
    employee_name: 'Employee A',
    department: 'QA',
    position: 'INSPECTOR',
    building: 'A',
    line: '1',
    hire_date: '2023-01-01',
    status: 'ACTIVE',
    updated_at: '2024-06-01',
  },
  {
    employee_id: 'EMP-SUP',
    employee_name: 'Supervisor A',
    department: 'QA',
    position: 'SUPERVISOR',
    building: 'A',
    line: '1',
    hire_date: '2022-01-01',
    status: 'ACTIVE',
    updated_at: '2024-06-01',
  },
];

const defaultPrograms: TrainingProgram[] = [
  {
    program_code: 'QIP-001',
    program_name: 'Stitching Quality',
    program_name_vn: 'Chất lượng may',
    program_name_kr: '스티칭 품질',
    category: 'QIP',
    tags: [],
    target_positions: [],
    evaluation_type: 'SCORE',
    passing_score: 80,
    grade_aa: 100,
    grade_a: 90,
    grade_b: 80,
    duration_hours: 4,
    validity_months: 12,
    training_level: 'LEVEL_1',
    training_type: 'REGULAR',
    is_active: true,
  },
  {
    program_code: 'QIP-002',
    program_name: 'Stitching Advanced',
    program_name_vn: 'May nâng cao',
    program_name_kr: '스티칭 고급',
    category: 'QIP',
    tags: [],
    target_positions: [],
    evaluation_type: 'SCORE',
    passing_score: 80,
    grade_aa: 100,
    grade_a: 90,
    grade_b: 80,
    duration_hours: 8,
    validity_months: 12,
    training_level: 'LEVEL_2',
    training_type: 'REGULAR',
    is_active: true,
  },
  {
    program_code: 'QIP-003',
    program_name: 'Glue Application',
    program_name_vn: 'Keo dán',
    program_name_kr: '접착',
    category: 'QIP',
    tags: [],
    target_positions: [],
    evaluation_type: 'SCORE',
    passing_score: 80,
    grade_aa: 100,
    grade_a: 90,
    grade_b: 80,
    duration_hours: 4,
    validity_months: 12,
    training_level: 'LEVEL_1',
    training_type: 'REGULAR',
    is_active: true,
  },
] as TrainingProgram[];

const defaultAqlLinks: AqlEmployeeLink[] = [
  {
    id: 'link-001',
    aql_employee_no: 'INS-001',
    employee_id: 'EMP-001',
    employee_name: 'Employee A',
    created_at: '2024-01-01',
    created_by: 'admin',
  },
];

const defaultSupervisorLinks: AqlSupervisorLink[] = [
  {
    id: 'sup-link-001',
    employee_no: 'INS-001',
    employee_name: 'Inspector A',
    supervisor_no: 'EMP-SUP',
    supervisor_name: 'Supervisor A',
    department: 'QA',
    building: 'A',
    line: '1',
    created_at: '2024-01-01',
  },
];

// ============================================================
// Tests
// ============================================================

describe('aqlAnalyzer', () => {
  // ----------------------------------------------------------
  // Priority Classification (classifyPriority)
  // ----------------------------------------------------------

  describe('우선순위 분류', () => {
    it('불합격률 >50%: CRITICAL 우선순위를 부여한다', () => {
      const data = createProcessedData([
        createInspectorRecord({ fail_rate: 55 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec).toBeDefined();
      expect(inspectorRec!.priority).toBe('CRITICAL');
    });

    it('불합격률 >30% (≤50%): HIGH 우선순위를 부여한다', () => {
      const data = createProcessedData([
        createInspectorRecord({ fail_rate: 35, fail_count: 35, pass_count: 65 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec).toBeDefined();
      expect(inspectorRec!.priority).toBe('HIGH');
    });

    it('불합격률 >10% (≤30%): MEDIUM 우선순위를 부여한다', () => {
      const data = createProcessedData([
        createInspectorRecord({ fail_rate: 15, fail_count: 15, pass_count: 85 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec).toBeDefined();
      expect(inspectorRec!.priority).toBe('MEDIUM');
    });

    it('불합격률 ≤10%: 추천을 생성하지 않는다', () => {
      const data = createProcessedData([
        createInspectorRecord({ fail_rate: 10, fail_count: 10, pass_count: 90 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      expect(results).toHaveLength(0);
    });

    it('불합격률 정확히 50%: HIGH (>50이 아니므로)', () => {
      const data = createProcessedData([
        createInspectorRecord({ fail_rate: 50, fail_count: 50, pass_count: 50 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec!.priority).toBe('HIGH');
    });

    it('불합격률 정확히 30%: MEDIUM (>30이 아니므로)', () => {
      const data = createProcessedData([
        createInspectorRecord({ fail_rate: 30, fail_count: 30, pass_count: 70 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec!.priority).toBe('MEDIUM');
    });

    it('fail_count가 0이면 추천을 생성하지 않는다', () => {
      const data = createProcessedData([
        createInspectorRecord({ fail_rate: 0, fail_count: 0, pass_count: 100 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      expect(results).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------
  // Priority Score Calculation
  // ----------------------------------------------------------

  describe('우선순위 점수 계산', () => {
    it('CRITICAL 기본 점수는 70이다', () => {
      const data = createProcessedData([
        createInspectorRecord({
          fail_rate: 60,
          fail_count: 60,
          total_inspections: 100,
        }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      // base(70) + fail_rate/2 capped(15) + inspections/10 capped(10) + fail_count capped(5) = 100
      expect(inspectorRec!.priority_score).toBeGreaterThanOrEqual(70);
      expect(inspectorRec!.priority_score).toBeLessThanOrEqual(100);
    });

    it('HIGH 기본 점수는 50이다', () => {
      const data = createProcessedData([
        createInspectorRecord({
          fail_rate: 35,
          fail_count: 7,
          total_inspections: 20,
          pass_count: 13,
        }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec!.priority_score).toBeGreaterThanOrEqual(50);
    });

    it('MEDIUM 기본 점수는 30이다', () => {
      const data = createProcessedData([
        createInspectorRecord({
          fail_rate: 15,
          fail_count: 3,
          total_inspections: 20,
          pass_count: 17,
        }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec!.priority_score).toBeGreaterThanOrEqual(30);
    });

    it('최대 점수는 100을 초과하지 않는다', () => {
      const data = createProcessedData([
        createInspectorRecord({
          fail_rate: 100,
          fail_count: 500,
          total_inspections: 500,
          pass_count: 0,
        }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec!.priority_score).toBeLessThanOrEqual(100);
    });
  });

  // ----------------------------------------------------------
  // Program Matching
  // ----------------------------------------------------------

  describe('프로그램 매칭', () => {
    it('불량 유형에 맞는 교육 프로그램을 추천한다', () => {
      const data = createProcessedData([
        createInspectorRecord({
          fail_rate: 55,
          parsed_defects: { 'Stitch': 30, 'Glue': 20 },
        }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec!.recommended_programs).toHaveLength(3); // QIP-001, QIP-002, QIP-003
      expect(inspectorRec!.recommended_programs.map((p) => p.program_code)).toContain('QIP-001');
      expect(inspectorRec!.recommended_programs.map((p) => p.program_code)).toContain('QIP-003');
    });

    it('비활성 매핑의 프로그램은 추천하지 않는다', () => {
      const data = createProcessedData([
        createInspectorRecord({
          fail_rate: 55,
          parsed_defects: { 'Inactive Defect': 50 },
        }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      const programCodes = inspectorRec!.recommended_programs.map((p) => p.program_code);
      expect(programCodes).not.toContain('QIP-099');
    });

    it('매핑되지 않은 불량 유형은 프로그램을 추천하지 않는다', () => {
      const data = createProcessedData([
        createInspectorRecord({
          fail_rate: 55,
          parsed_defects: { 'Unknown Defect': 50 },
        }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec!.recommended_programs).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------
  // Employee Matching
  // ----------------------------------------------------------

  describe('직원 매핑', () => {
    it('AQL 링크가 있으면 linked_employee를 설정한다', () => {
      const data = createProcessedData([
        createInspectorRecord({ employee_no: 'INS-001', fail_rate: 55 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec!.linked_employee).toBeDefined();
      expect(inspectorRec!.linked_employee!.employee_id).toBe('EMP-001');
    });

    it('AQL 링크가 없으면 linked_employee가 undefined이다', () => {
      const data = createProcessedData([
        createInspectorRecord({ employee_no: 'INS-999', fail_rate: 55 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, [], defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      expect(inspectorRec!.linked_employee).toBeUndefined();
    });
  });

  // ----------------------------------------------------------
  // Supervisor Escalation
  // ----------------------------------------------------------

  describe('감독자 에스컬레이션', () => {
    it('감독자 링크가 있으면 감독자 추천도 생성한다', () => {
      const data = createProcessedData([
        createInspectorRecord({ employee_no: 'INS-001', fail_rate: 55 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const supervisorRec = results.find(
        (r) => r.enrollment_reason === 'SUPERVISOR_ESCALATION'
      );
      expect(supervisorRec).toBeDefined();
      expect(supervisorRec!.aql_employee_no).toBe('EMP-SUP');
    });

    it('감독자 추천의 점수는 검사관보다 10점 낮다', () => {
      const data = createProcessedData([
        createInspectorRecord({ employee_no: 'INS-001', fail_rate: 55 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, defaultSupervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const inspectorRec = results.find((r) => r.enrollment_reason === 'INSPECTOR_FAIL');
      const supervisorRec = results.find((r) => r.enrollment_reason === 'SUPERVISOR_ESCALATION');
      expect(supervisorRec!.priority_score).toBe(
        Math.max(0, inspectorRec!.priority_score - 10)
      );
    });

    it('감독자 링크가 없으면 감독자 추천을 생성하지 않는다', () => {
      const data = createProcessedData([
        createInspectorRecord({ employee_no: 'INS-001', fail_rate: 55 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, [], // 빈 감독자 링크
        defaultEmployees, defaultPrograms
      );

      const supervisorRec = results.find(
        (r) => r.enrollment_reason === 'SUPERVISOR_ESCALATION'
      );
      expect(supervisorRec).toBeUndefined();
    });
  });

  // ----------------------------------------------------------
  // Deduplication
  // ----------------------------------------------------------

  describe('중복 제거', () => {
    it('같은 사람이 검사관/감독자 둘 다인 경우 검사관 항목만 유지한다', () => {
      // INS-001이 자기 자신의 감독자인 경우
      const supervisorLinks: AqlSupervisorLink[] = [
        {
          id: 'sup-link-self',
          employee_no: 'INS-001',
          employee_name: 'Inspector A',
          supervisor_no: 'INS-001', // 자기 자신
          supervisor_name: 'Inspector A',
          department: 'QA',
          building: 'A',
          line: '1',
          created_at: '2024-01-01',
        },
      ];

      const data = createProcessedData([
        createInspectorRecord({ employee_no: 'INS-001', fail_rate: 55 }),
      ]);

      const results = analyzeAqlRecommendations(
        data, defaultMappings, defaultAqlLinks, supervisorLinks,
        defaultEmployees, defaultPrograms
      );

      const insRecords = results.filter((r) => r.aql_employee_no === 'INS-001');
      // 검사관 항목만 남아야 함 (SUPERVISOR_ESCALATION 제거)
      expect(insRecords).toHaveLength(1);
      expect(insRecords[0].enrollment_reason).toBe('INSPECTOR_FAIL');
    });

    it('결과는 priority_score 내림차순으로 정렬된다', () => {
      const data = createProcessedData([
        createInspectorRecord({
          employee_no: 'INS-001',
          fail_rate: 55,
          fail_count: 55,
        }),
        createInspectorRecord({
          employee_no: 'INS-002',
          employee_name: 'Inspector B',
          fail_rate: 15,
          fail_count: 15,
          pass_count: 85,
        }),
      ]);

      const aqlLinks: AqlEmployeeLink[] = [
        ...defaultAqlLinks,
        {
          id: 'link-002',
          aql_employee_no: 'INS-002',
          employee_id: 'EMP-002',
          employee_name: 'Employee B',
          created_at: '2024-01-01',
          created_by: 'admin',
        },
      ];

      const employees: Employee[] = [
        ...defaultEmployees,
        {
          employee_id: 'EMP-002',
          employee_name: 'Employee B',
          department: 'QA',
          position: 'INSPECTOR',
          building: 'A',
          line: '2',
          hire_date: '2023-01-01',
          status: 'ACTIVE',
          updated_at: '2024-06-01',
        },
      ];

      const results = analyzeAqlRecommendations(
        data, defaultMappings, aqlLinks, [],
        employees, defaultPrograms
      );

      // priority_score 내림차순 정렬 확인
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].priority_score).toBeGreaterThanOrEqual(
          results[i].priority_score
        );
      }
    });
  });
});
