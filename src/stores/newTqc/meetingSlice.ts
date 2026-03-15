import type {
  NewTQCMeetingFilters,
  NewTQCMeetingInput,
  NewTQCMeetingUpdate,
} from '@/types';
import * as api from '@/services/api';
import type { StoreSet, StoreGet } from './types';

export const createMeetingActions = (set: StoreSet, get: StoreGet) => ({
  fetchMeetings: async (filters?: NewTQCMeetingFilters) => {
    set(state => ({
      loading: { ...state.loading, meetings: true },
      error: null,
      meetingFilters: filters || state.meetingFilters,
    }));

    try {
      const meetings = await api.getNewTQCMeetings(filters || get().meetingFilters);
      set(state => ({ meetings, loading: { ...state.loading, meetings: false } }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch meetings';
      set(state => ({
        error: message,
        loading: { ...state.loading, meetings: false },
      }));
    }
  },

  fetchUpcomingMeetings: async (days = 7) => {
    set(state => ({
      loading: { ...state.loading, meetings: true },
      error: null,
    }));

    try {
      const upcomingMeetings = await api.getNewTQCUpcomingMeetings(days);
      set(state => ({ upcomingMeetings, loading: { ...state.loading, meetings: false } }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch upcoming meetings';
      set(state => ({
        error: message,
        loading: { ...state.loading, meetings: false },
      }));
    }
  },

  setMeetingFilters: (filters: NewTQCMeetingFilters) => {
    set({ meetingFilters: filters });
  },

  createMeeting: async (input: NewTQCMeetingInput) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      const newMeeting = await api.createNewTQCMeeting(input);
      set(state => ({
        meetings: [...state.meetings, newMeeting],
        loading: { ...state.loading, saving: false },
      }));
      return newMeeting;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create meeting';
      set(state => ({
        error: message,
        loading: { ...state.loading, saving: false },
      }));
      throw error;
    }
  },

  updateMeeting: async (input: NewTQCMeetingUpdate) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      const updatedMeeting = await api.updateNewTQCMeeting(input);
      if (updatedMeeting) {
        set(state => ({
          meetings: state.meetings.map(m =>
            m.meeting_id === input.meeting_id ? updatedMeeting : m
          ),
          upcomingMeetings: state.upcomingMeetings.filter(m =>
            m.meeting_id !== input.meeting_id || updatedMeeting.status === 'SCHEDULED'
          ),
          selectedTrainee:
            state.selectedTrainee &&
            state.selectedTrainee.meetings.some(m => m.meeting_id === input.meeting_id)
              ? {
                  ...state.selectedTrainee,
                  meetings: state.selectedTrainee.meetings.map(m =>
                    m.meeting_id === input.meeting_id ? updatedMeeting : m
                  ),
                }
              : state.selectedTrainee,
          loading: { ...state.loading, saving: false },
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update meeting';
      set(state => ({
        error: message,
        loading: { ...state.loading, saving: false },
      }));
      throw error;
    }
  },
});
