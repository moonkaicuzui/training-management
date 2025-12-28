/**
 * Trainer Types
 * 강사 관리 타입 정의
 */

export type TrainerType = 'INTERNAL' | 'EXTERNAL';
export type TrainerStatus = 'ACTIVE' | 'INACTIVE';

export interface Trainer {
  trainer_id: string;
  trainer_name: string;
  trainer_type: TrainerType;
  department?: string; // 내부 강사의 경우 소속 부서
  company?: string; // 외부 강사의 경우 소속 회사
  email?: string;
  phone?: string;
  specializations: string[]; // 전문 분야 (program_code 목록)
  certifications?: string[]; // 자격증
  status: TrainerStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainerInput {
  trainer_name: string;
  trainer_type: TrainerType;
  department?: string;
  company?: string;
  email?: string;
  phone?: string;
  specializations?: string[];
  certifications?: string[];
  notes?: string;
}

export interface TrainerSession {
  trainer_id: string;
  session_id: string;
  session_date: string;
  program_code: string;
  program_name: string;
  attendee_count: number;
}

export interface TrainerStats {
  trainer_id: string;
  total_sessions: number;
  total_trainees: number;
  average_pass_rate: number;
  programs_taught: string[];
}
