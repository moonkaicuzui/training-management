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
  // H-3: timestamp + random으로 고유 ID 생성 (충돌 방지)
  // Firestore 쓰기용 데이터 (created_at/updated_at는 tqcService에서 serverTimestamp() 적용)
  const meetingData: NewTQCMeeting = {
    meeting_id: `MTG-${Date.now().toString(36).slice(-4)}${Math.random().toString(36).substring(2, 5)}-${input.meeting_type}`,
    trainee_id: input.trainee_id,
    meeting_type: input.meeting_type,
    scheduled_date: input.scheduled_date,
    status: 'SCHEDULED',
    attendees: input.attendees || [],
    notes: input.notes,
    created_at: now,
    updated_at: now,
  };

  await tqcService.createMeeting(meetingData);
  // 반환 객체에는 클라이언트 시간 유지 (Firestore에는 serverTimestamp() 적용됨)
  return meetingData;
}

export async function updateNewTQCMeeting(
  input: NewTQCMeetingUpdate
): Promise<NewTQCMeeting | null> {
  // updated_at는 tqcService.updateMeeting/updateTrainee 내부에서 serverTimestamp() 적용
  await tqcService.updateMeeting(input.meeting_id, input);

  if (input.status === 'COMPLETED' && input.completed_date) {
    const meetings = await tqcService.getMeetings();
    const meeting = meetings.find(m => m.meeting_id === input.meeting_id);
    if (meeting) {
      const traineeUpdates: Partial<NewTQCTrainee> = {};
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
