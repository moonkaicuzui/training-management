import { Timestamp } from '@/services/firebase';

export const RESULTS_COLLECTION = 'inspection_results';
export const ENROLLMENTS_COLLECTION = 'inspection_enrollments';
export const TRAINING_RESULTS_COLLECTION = 'training_results';

export const convertTimestamp = (
  ts: Timestamp | string | null | undefined
): string => {
  if (!ts) return '';
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  return ts;
};
