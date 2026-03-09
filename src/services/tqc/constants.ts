import { Timestamp } from '@/services/firebase';

export const COLLECTIONS = {
  TEAMS: 'tqc_teams',
  TRAINEES: 'tqc_trainees',
  STAGES: 'tqc_training_stages',
  COLOR_BLIND: 'tqc_color_blind_tests',
  MEETINGS: 'tqc_meetings',
  RESIGNATIONS: 'tqc_resignations',
} as const;

export const convertTimestamp = (
  timestamp: Timestamp | string | undefined | null
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};
