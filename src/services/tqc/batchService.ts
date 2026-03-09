import {
  db,
  doc,
  writeBatch,
  serverTimestamp,
} from '@/services/firebase';
import type {
  NewTQCTrainingStage,
  NewTQCMeeting,
} from '@/types';
import { logger } from '@/utils/logger';
import { COLLECTIONS } from './constants';

export const batchCreateStagesAndMeetings = async (
  stages: NewTQCTrainingStage[],
  meetings: NewTQCMeeting[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const now = serverTimestamp();

    for (const stage of stages) {
      const docRef = doc(db, COLLECTIONS.STAGES, stage.stage_id);
      batch.set(docRef, {
        ...stage,
        updated_at: now,
      });
    }

    for (const meeting of meetings) {
      const docRef = doc(db, COLLECTIONS.MEETINGS, meeting.meeting_id);
      batch.set(docRef, {
        ...meeting,
        created_at: now,
        updated_at: now,
      });
    }

    await batch.commit();
  } catch (error) {
    logger.error(`[tqcService] batchCreateStagesAndMeetings failed (${stages.length} stages, ${meetings.length} meetings):`, error);
    throw error;
  }
};
