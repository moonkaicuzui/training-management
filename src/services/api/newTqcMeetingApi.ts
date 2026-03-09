import * as tqcService from '../tqcService';

import type {
  NewTQCTrainee,
  NewTQCMeeting,
  NewTQCMeetingFilters,
  NewTQCMeetingInput,
  NewTQCMeetingUpdate,
} from '@/types';

export async function getNewTQCMeetings(filters?: NewTQCMeetingFilters): Promise<NewTQCMeeting[]> {
  return tqcService.getMeetings(filters);
}

export async function createNewTQCMeeting(input: NewTQCMeetingInput): Promise<NewTQCMeeting> {
  const now = new Date().toISOString();
  const existingMeetings = await tqcService.getMeetings();
  const meetingCount = existingMeetings.length + 1;

  const newMeeting: NewTQCMeeting = {
    meeting_id: `MTG-${String(meetingCount).padStart(3, '0')}-${input.meeting_type}`,
    trainee_id: input.trainee_id,
    meeting_type: input.meeting_type,
    scheduled_date: input.scheduled_date,
    status: 'SCHEDULED',
    attendees: input.attendees || [],
    notes: input.notes,
    created_at: now,
    updated_at: now,
  };

  await tqcService.createMeeting(newMeeting);
  return newMeeting;
}

export async function updateNewTQCMeeting(
  input: NewTQCMeetingUpdate
): Promise<NewTQCMeeting | null> {
  const now = new Date().toISOString();
  await tqcService.updateMeeting(input.meeting_id, {
    ...input,
    updated_at: now,
  });

  if (input.status === 'COMPLETED' && input.completed_date) {
    const meetings = await tqcService.getMeetings();
    const meeting = meetings.find(m => m.meeting_id === input.meeting_id);
    if (meeting) {
      const traineeUpdates: Partial<NewTQCTrainee> = { updated_at: now };
      if (meeting.meeting_type === '1WEEK') {
        traineeUpdates.meeting_1week_date = input.completed_date;
      } else if (meeting.meeting_type === '1MONTH') {
        traineeUpdates.meeting_1month_date = input.completed_date;
      } else if (meeting.meeting_type === '3MONTH') {
        traineeUpdates.meeting_3month_date = input.completed_date;
      }
      await tqcService.updateTrainee(meeting.trainee_id, traineeUpdates);
    }
  }

  const updatedMeetings = await tqcService.getMeetings();
  return updatedMeetings.find(m => m.meeting_id === input.meeting_id) || null;
}

export async function getNewTQCUpcomingMeetings(days: number = 7): Promise<NewTQCMeeting[]> {
  const meetings = await tqcService.getMeetings();

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + days);

  return meetings
    .filter(m => {
      const meetingDate = new Date(m.scheduled_date);
      return m.status === 'SCHEDULED' && meetingDate >= now && meetingDate <= endDate;
    })
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
}
