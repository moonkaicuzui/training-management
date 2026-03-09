import {
  db,
  doc,
  collection,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  limit,
  Timestamp,
} from '@/services/firebase';
import type {
  NewTQCMeeting,
  NewTQCMeetingFilters,
} from '@/types';
import { logger } from '@/utils/logger';
import { COLLECTIONS, convertTimestamp } from './constants';

const docToMeeting = (docId: string, data: Record<string, unknown>): NewTQCMeeting => ({
  meeting_id: (data.meeting_id as string) || docId,
  trainee_id: (data.trainee_id as string) || '',
  meeting_type: (data.meeting_type as NewTQCMeeting['meeting_type']) || '1WEEK',
  scheduled_date: (data.scheduled_date as string) || '',
  completed_date: data.completed_date as string | undefined,
  status: (data.status as NewTQCMeeting['status']) || 'SCHEDULED',
  attendees: (data.attendees as string[]) || [],
  notes: data.notes as string | undefined,
  created_at: convertTimestamp(data.created_at as Timestamp | string | undefined),
  updated_at: convertTimestamp(data.updated_at as Timestamp | string | undefined),
});

export const getMeetings = async (
  filters?: NewTQCMeetingFilters
): Promise<NewTQCMeeting[]> => {
  const constraints = [];

  if (filters?.traineeId) {
    constraints.push(where('trainee_id', '==', filters.traineeId));
  }

  constraints.push(limit(500));

  const q = query(collection(db, COLLECTIONS.MEETINGS), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToMeeting(d.id, d.data() as Record<string, unknown>)
  );

  if (filters?.meetingType && filters.meetingType !== 'all') {
    results = results.filter((m) => m.meeting_type === filters.meetingType);
  }

  if (filters?.status && filters.status !== 'all') {
    results = results.filter((m) => m.status === filters.status);
  }

  if (filters?.dateFrom) {
    results = results.filter((m) => m.scheduled_date >= filters.dateFrom!);
  }

  if (filters?.dateTo) {
    results = results.filter((m) => m.scheduled_date <= filters.dateTo!);
  }

  return results;
};

export const createMeeting = async (
  data: NewTQCMeeting
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MEETINGS, data.meeting_id);
    await setDoc(docRef, {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] createMeeting failed for ${data.meeting_id}:`, error);
    throw error;
  }
};

export const updateMeeting = async (
  meetingId: string,
  updates: Partial<NewTQCMeeting>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MEETINGS, meetingId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] updateMeeting failed for ${meetingId}:`, error);
    throw error;
  }
};
