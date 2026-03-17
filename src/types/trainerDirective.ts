/**
 * Trainer Directive Types
 * 트레이너 일일 업무 지시 시스템 타입 정의
 */

export interface DirectiveAction {
  employee_id: string;
  employee_name: string;
  building: string;
  line: string;
  issue: string;
  reject_rate: number;
  threshold: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  instruction: string;
  program_code: string;
  deadline: string;
}

export interface OngoingSessions {
  planned: number;
  overdue: number;
  completed_this_week: number;
  avg_score: number;
}

export type DirectiveStatus = 'generated' | 'sent' | 'read' | 'acknowledged';

export interface TrainerDirective {
  directive_id: string;
  date: string; // YYYY-MM-DD
  generated_at: string;
  immediate_actions: DirectiveAction[];
  preventive_actions: DirectiveAction[];
  ongoing_sessions: OngoingSessions;
  ai_recommendations: string[];
  status: DirectiveStatus;
  read_at: string | null;
  acknowledged_at: string | null;
}

export interface TrainingEffectiveness {
  effectiveness_id: string;
  year_month: string;
  generated_at: string;
  total_trained_employees: number;
  average_improvement_rate: number;
  improved_count: number;
  unchanged_count: number;
  employee_metrics: EmployeeEffectivenessMetric[];
}

export interface EmployeeEffectivenessMetric {
  employee_id: string;
  employee_name: string;
  programs_completed: string[];
  pre_training_rate: number;
  post_training_rate: number;
  improvement_rate: number;
}
