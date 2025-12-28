/**
 * Evaluation Types
 * 교육 효과성 평가 타입 정의
 */

import type { EmployeeId, SessionId, ProgramCode } from './branded';

export type EvaluationType = 'PRE_TEST' | 'POST_TEST' | 'SATISFACTION' | 'FOLLOW_UP';

export interface Evaluation {
  evaluation_id: string;
  type: EvaluationType;
  session_id: SessionId;
  program_code: ProgramCode;
  employee_id: EmployeeId;
  responses: EvaluationResponse[];
  total_score?: number;
  max_score?: number;
  percentage?: number;
  submitted_at: string;
  created_at: string;
}

export interface EvaluationResponse {
  question_id: string;
  question_text: string;
  response_type: 'RATING' | 'TEXT' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  response_value: string | number;
  score?: number;
  max_score?: number;
}

export interface EvaluationTemplate {
  template_id: string;
  template_name: string;
  type: EvaluationType;
  program_codes: ProgramCode[]; // 적용 프로그램
  questions: EvaluationQuestion[];
  is_required: boolean;
  time_limit_minutes?: number;
  passing_score?: number; // 합격 점수 (사전/사후 테스트용)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvaluationQuestion {
  question_id: string;
  question_text: string;
  question_type: 'RATING' | 'TEXT' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options?: string[]; // 객관식 선택지
  correct_answer?: string; // 테스트용 정답
  points?: number; // 배점
  is_required: boolean;
  order: number;
}

// 만족도 조사 기본 질문
export const DEFAULT_SATISFACTION_QUESTIONS: Omit<EvaluationQuestion, 'question_id'>[] = [
  {
    question_text: '교육 내용이 업무에 도움이 되었습니까?',
    question_type: 'RATING',
    is_required: true,
    points: 5,
    order: 1,
  },
  {
    question_text: '강사의 전달력은 어떠했습니까?',
    question_type: 'RATING',
    is_required: true,
    points: 5,
    order: 2,
  },
  {
    question_text: '교육 자료는 이해하기 쉬웠습니까?',
    question_type: 'RATING',
    is_required: true,
    points: 5,
    order: 3,
  },
  {
    question_text: '교육 시간은 적절했습니까?',
    question_type: 'RATING',
    is_required: true,
    points: 5,
    order: 4,
  },
  {
    question_text: '전반적으로 이 교육에 만족하십니까?',
    question_type: 'RATING',
    is_required: true,
    points: 5,
    order: 5,
  },
  {
    question_text: '개선이 필요한 점이나 의견이 있으시면 작성해주세요.',
    question_type: 'TEXT',
    is_required: false,
    order: 6,
  },
];

export interface EffectivenessReport {
  program_code: ProgramCode;
  program_name: string;
  period: { start: string; end: string };
  metrics: {
    total_sessions: number;
    total_trainees: number;
    average_pre_test_score?: number;
    average_post_test_score?: number;
    improvement_rate?: number; // (post - pre) / pre * 100
    average_satisfaction: number;
    pass_rate: number;
    retraining_rate: number;
  };
  satisfaction_breakdown: {
    category: string;
    average_score: number;
    response_count: number;
  }[];
  comments: string[];
}
