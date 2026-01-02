/**
 * Curriculum Types
 * 역량 기반 커리큘럼 및 학습 경로 타입 정의
 */

import type { Position, Department } from './index';

// ========== 역량 레벨 정의 ==========

/**
 * 역량 숙달 레벨 (Dreyfus 모델 기반)
 */
export type CompetencyLevel =
  | 'NOVICE'        // 초보: 규칙 기반 행동
  | 'BEGINNER'      // 초급: 상황 인식 시작
  | 'COMPETENT'     // 중급: 목표 지향적 행동
  | 'PROFICIENT'    // 숙련: 직관적 상황 파악
  | 'EXPERT';       // 전문가: 무의식적 역량 발휘

/**
 * 역량 레벨 숫자 매핑 (계산용)
 */
export const COMPETENCY_LEVEL_VALUES: Record<CompetencyLevel, number> = {
  NOVICE: 1,
  BEGINNER: 2,
  COMPETENT: 3,
  PROFICIENT: 4,
  EXPERT: 5,
};

// ========== 핵심 역량 정의 ==========

/**
 * 역량 카테고리
 */
export type CompetencyCategory =
  | 'TECHNICAL'     // 기술 역량
  | 'QUALITY'       // 품질 역량
  | 'SAFETY'        // 안전 역량
  | 'LEADERSHIP'    // 리더십 역량
  | 'COMMUNICATION' // 커뮤니케이션 역량
  | 'PROCESS';      // 프로세스 역량

/**
 * 역량 정의
 */
export interface Competency {
  competency_id: string;
  competency_code: string;
  name: string;
  name_vn: string;
  name_kr: string;
  description: string;
  category: CompetencyCategory;
  is_core: boolean; // 핵심 역량 여부
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 역량-교육 프로그램 매핑
 */
export interface CompetencyProgramMapping {
  competency_id: string;
  program_code: string;
  target_level: CompetencyLevel; // 이 프로그램 이수 후 도달 가능 레벨
  weight: number; // 역량 기여도 (0-1)
}

// ========== 학습 경로 정의 ==========

/**
 * 학습 경로 타입
 */
export type LearningPathType =
  | 'ONBOARDING'    // 신입 온보딩
  | 'POSITION'      // 직급별 필수
  | 'PROMOTION'     // 승진 준비
  | 'SPECIALIZATION'// 전문화 과정
  | 'REMEDIAL';     // 보충 교육

/**
 * 학습 경로 상태
 */
export type LearningPathStatus =
  | 'NOT_STARTED'   // 미시작
  | 'IN_PROGRESS'   // 진행 중
  | 'COMPLETED'     // 완료
  | 'EXPIRED';      // 만료 (재이수 필요)

/**
 * 학습 경로 정의
 */
export interface LearningPath {
  path_id: string;
  path_code: string;
  name: string;
  name_vn: string;
  name_kr: string;
  description: string;
  type: LearningPathType;
  target_positions: Position[];
  target_departments: Department[];
  required_competencies: RequiredCompetency[];
  programs: LearningPathProgram[];
  estimated_duration_hours: number;
  validity_months: number | null;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 학습 경로 내 필수 역량
 */
export interface RequiredCompetency {
  competency_id: string;
  minimum_level: CompetencyLevel;
}

/**
 * 학습 경로 내 프로그램 (순서 포함)
 */
export interface LearningPathProgram {
  program_code: string;
  sequence: number; // 순서
  is_mandatory: boolean;
  prerequisites: string[]; // 선행 프로그램 코드들
  alternative_programs?: string[]; // 대체 가능 프로그램
}

// ========== 직원 역량 프로필 ==========

/**
 * 직원별 역량 상태
 */
export interface EmployeeCompetency {
  employee_id: string;
  competency_id: string;
  current_level: CompetencyLevel;
  target_level: CompetencyLevel;
  last_assessed_at: string;
  assessed_by: string;
  evidence: CompetencyEvidence[];
}

/**
 * 역량 증거 (교육 이수, 평가 결과 등)
 */
export interface CompetencyEvidence {
  evidence_id: string;
  evidence_type: 'TRAINING' | 'ASSESSMENT' | 'OBSERVATION' | 'CERTIFICATION';
  reference_id: string; // result_id, assessment_id 등
  date: string;
  level_achieved: CompetencyLevel;
  notes?: string;
}

/**
 * 직원 학습 경로 진행 상황
 */
export interface EmployeeLearningPath {
  employee_id: string;
  path_id: string;
  status: LearningPathStatus;
  started_at: string;
  completed_at?: string;
  expires_at?: string;
  program_progress: ProgramProgress[];
  overall_progress_percent: number;
}

/**
 * 프로그램별 진행 상황
 */
export interface ProgramProgress {
  program_code: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  completed_at?: string;
  result_id?: string;
  attempts: number;
}

// ========== 스킬 매트릭스 ==========

/**
 * 스킬 매트릭스 셀
 */
export interface SkillMatrixCell {
  employee_id: string;
  competency_id: string;
  current_level: CompetencyLevel;
  target_level: CompetencyLevel;
  gap: number; // target_level - current_level
  recommended_programs: string[];
}

/**
 * 팀/부서 스킬 갭 분석
 */
export interface TeamSkillGap {
  department: Department;
  competency_id: string;
  average_level: number;
  target_level: CompetencyLevel;
  gap_percent: number;
  employees_below_target: number;
  total_employees: number;
}

// ========== 커리큘럼 대시보드 ==========

/**
 * 커리큘럼 통계
 */
export interface CurriculumStats {
  total_learning_paths: number;
  active_paths: number;
  total_competencies: number;
  core_competencies: number;

  // 직원 진행 현황
  employees_in_progress: number;
  employees_completed_path: number;
  average_completion_rate: number;

  // 역량 현황
  team_average_competency_level: number;
  competency_gap_count: number; // 목표 미달 역량 수
}

/**
 * 역량 갭 요약
 */
export interface CompetencyGapSummary {
  competency: Competency;
  total_employees: number;
  at_target: number;
  below_target: number;
  gap_percentage: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * 개인 개발 계획 (IDP)
 */
export interface IndividualDevelopmentPlan {
  plan_id: string;
  employee_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;

  // 목표
  target_position?: Position;
  target_date?: string;

  // 역량 목표
  competency_goals: CompetencyGoal[];

  // 할당된 학습 경로
  assigned_paths: string[];

  // 진행 상황
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  progress_percent: number;

  // 피드백
  manager_notes?: string;
  employee_notes?: string;
}

/**
 * 역량 목표
 */
export interface CompetencyGoal {
  competency_id: string;
  current_level: CompetencyLevel;
  target_level: CompetencyLevel;
  target_date: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED';
}

// ========== 필터 및 검색 ==========

export interface LearningPathFilters {
  type?: LearningPathType;
  position?: Position;
  department?: Department;
  is_mandatory?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface CompetencyFilters {
  category?: CompetencyCategory;
  is_core?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface SkillGapFilters {
  department?: Department;
  position?: Position;
  competency_category?: CompetencyCategory;
  min_gap?: number;
}
