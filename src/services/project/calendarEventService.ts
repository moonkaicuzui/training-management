import {
  db,
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import type { CalendarEvent } from '@/types/project';
import { COLLECTIONS, generateId, convertDocumentDates } from './common';
import { logger } from '@/utils/logger';

export const getEventsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.EVENTS),
      where('startDate', '>=', Timestamp.fromDate(startDate)),
      where('startDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('startDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as CalendarEvent
    );
  } catch (error) {
    logger.error('[calendarEventService] getEventsByDateRange failed:', error);
    throw error;
  }
};

export const createEvent = async (
  data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CalendarEvent> => {
  try {
    const eventId = generateId('event');
    const now = serverTimestamp();

    const eventData: Record<string, unknown> = {
      ...data,
      startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate,
      endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : data.endDate,
      createdAt: now,
      updatedAt: now,
    };

    if (data.recurrence?.endDate instanceof Date) {
      eventData.recurrence = {
        ...data.recurrence,
        endDate: Timestamp.fromDate(data.recurrence.endDate),
      };
    }

    await setDoc(doc(db, COLLECTIONS.EVENTS, eventId), eventData);

    return {
      id: eventId,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as CalendarEvent;
  } catch (error) {
    logger.error('[calendarEventService] createEvent failed:', error);
    throw error;
  }
};

export const updateEvent = async (
  eventId: string,
  data: Partial<CalendarEvent>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    if (data.startDate instanceof Date) {
      updateData.startDate = Timestamp.fromDate(data.startDate);
    }
    if (data.endDate instanceof Date) {
      updateData.endDate = Timestamp.fromDate(data.endDate);
    }

    if (data.recurrence?.endDate instanceof Date) {
      updateData.recurrence = {
        ...data.recurrence,
        endDate: Timestamp.fromDate(data.recurrence.endDate),
      };
    }

    if (data.recurrence === undefined && 'recurrence' in data) {
      updateData.recurrence = deleteField();
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    logger.error('[calendarEventService] updateEvent failed:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error('[calendarEventService] deleteEvent failed:', error);
    throw error;
  }
};
