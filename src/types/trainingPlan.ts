/**
 * Training Plan Types
 * 연간 교육 계획 관리 타입 정의
 */

import type { ProgramCode } from './branded';

export type PlanStatus = 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PlanPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface TrainingPlan {
  plan_id: string;
  plan_name: string;
  year: number;
  period: PlanPeriod;
  period_number?: number; // 월(1-12) 또는 분기(1-4)
  status: PlanStatus;
  target_departments: string[];
  target_positions: string[];
  planned_programs: PlannedProgram[];
  total_budget?: number;
  actual_spent?: number;
  notes?: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PlannedProgram {
  program_code: ProgramCode;
  program_name: string;
  target_count: number; // 목표 인원
  completed_count: number; // 완료 인원
  planned_sessions: number; // 계획 세션 수
  completed_sessions: number; // 완료 세션 수
  planned_date_range: {
    start: string;
    end: string;
  };
  budget?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PlanProgress {
  plan_id: string;
  overall_progress: number; // 0-100
  programs_completed: number;
  programs_total: number;
  trainees_completed: number;
  trainees_target: number;
  budget_used_percentage: number;
  on_track: boolean;
  risk_items: string[];
}

export interface TrainingMaterial {
  material_id: string;
  program_code: ProgramCode;
  title: string;
  type: 'PDF' | 'VIDEO' | 'PPT' | 'DOCUMENT' | 'LINK' | 'OTHER';
  file_url?: string;
  external_link?: string;
  description?: string;
  version: string;
  language: 'ko' | 'en' | 'vi';
  is_required: boolean;
  duration_minutes?: number; // 영상/학습 시간
  created_at: string;
  updated_at: string;
}

export interface MaterialInput {
  program_code: ProgramCode;
  title: string;
  type: TrainingMaterial['type'];
  file_url?: string;
  external_link?: string;
  description?: string;
  version?: string;
  language?: 'ko' | 'en' | 'vi';
  is_required?: boolean;
  duration_minutes?: number;
}
