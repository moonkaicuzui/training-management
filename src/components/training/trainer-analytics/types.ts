import type { TrainingSession, TrainingResultRecord } from '@/types';
import type { Trainer } from '@/types';

export interface TrainerWithStats extends Trainer {
  total_sessions?: number;
  average_rating?: number;
}

export interface TrainerAnalyticsProps {
  trainers: TrainerWithStats[];
  sessions: TrainingSession[];
  results: TrainingResultRecord[];
  isLoading: boolean;
}

export interface TrainerStats {
  sessionCount: number;
  traineeCount: number;
  passCount: number;
  totalResultCount: number;
  programs: Set<string>;
  monthlySessions: Map<string, number>;
}

export interface KPIData {
  totalSessions: number;
  totalTrainees: number;
  avgPassRate: number;
  uniquePrograms: number;
}

export interface ComparisonRow {
  trainer_id: string;
  trainer_name: string;
  trainer_type: string;
  sessionCount: number;
  traineeCount: number;
  passRate: number;
  programCount: number;
}
