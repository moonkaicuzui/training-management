import type { Trainer } from '@/types/trainer';

export interface TrainerWithStats extends Trainer {
  total_sessions: number;
  average_rating: number;
}
