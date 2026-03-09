/**
 * New TQC Store Tests
 * 신입 TQC 스토어 기능 테스트 (teams, trainees, meetings, resignations, dashboard)
 *
 * [TAE] Test Automation Engineer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  NewTQCTeam,
  NewTQCTrainee,
  NewTQCTraineeWithDetails,
  NewTQCMeeting,
  NewTQCResignation,
  NewTQCDashboardStats,
  NewTQCResignationAnalysis,
  NewTQCTeamInput,
  NewTQCTeamUpdate,
  NewTQCTraineeInput,
  NewTQCTraineeUpdate,
  NewTQCMeetingInput,
  NewTQCResignationInput,
} from '@/types';

// ========== Mock Setup ==========

const mockGetNewTQCTeams = vi.fn();
const mockCreateNewTQCTeam = vi.fn();
const mockUpdateNewTQCTeam = vi.fn();
const mockDeleteNewTQCTeam = vi.fn();
const mockGetNewTQCTrainees = vi.fn();
const mockGetNewTQCTraineeWithDetails = vi.fn();
const mockCreateNewTQCTrainee = vi.fn();
const mockUpdateNewTQCTrainee = vi.fn();
const mockGetNewTQCMeetings = vi.fn();
const mockGetNewTQCUpcomingMeetings = vi.fn();
const mockCreateNewTQCMeeting = vi.fn();
const mockGetNewTQCResignations = vi.fn();
const mockGetNewTQCResignationAnalysis = vi.fn();
const mockCreateNewTQCResignation = vi.fn();
const mockGetNewTQCDashboardStats = vi.fn();

vi.mock('@/services/api', () => ({
  getNewTQCTeams: (...args: unknown[]) => mockGetNewTQCTeams(...args),
  createNewTQCTeam: (...args: unknown[]) => mockCreateNewTQCTeam(...args),
  updateNewTQCTeam: (...args: unknown[]) => mockUpdateNewTQCTeam(...args),
  deleteNewTQCTeam: (...args: unknown[]) => mockDeleteNewTQCTeam(...args),
  getNewTQCTrainees: (...args: unknown[]) => mockGetNewTQCTrainees(...args),
  getNewTQCTraineeWithDetails: (...args: unknown[]) => mockGetNewTQCTraineeWithDetails(...args),
  createNewTQCTrainee: (...args: unknown[]) => mockCreateNewTQCTrainee(...args),
  updateNewTQCTrainee: (...args: unknown[]) => mockUpdateNewTQCTrainee(...args),
  getNewTQCMeetings: (...args: unknown[]) => mockGetNewTQCMeetings(...args),
  getNewTQCUpcomingMeetings: (...args: unknown[]) => mockGetNewTQCUpcomingMeetings(...args),
  createNewTQCMeeting: (...args: unknown[]) => mockCreateNewTQCMeeting(...args),
  updateNewTQCMeeting: vi.fn().mockResolvedValue(null),
  getNewTQCResignations: (...args: unknown[]) => mockGetNewTQCResignations(...args),
  getNewTQCResignationAnalysis: (...args: unknown[]) => mockGetNewTQCResignationAnalysis(...args),
  createNewTQCResignation: (...args: unknown[]) => mockCreateNewTQCResignation(...args),
  getNewTQCDashboardStats: (...args: unknown[]) => mockGetNewTQCDashboardStats(...args),
  createNewTQCColorBlindTest: vi.fn().mockResolvedValue({
    test_id: 'test-1',
    trainee_id: 'trainee-1',
    test_date: '2024-01-15',
    result: 'PASS',
    tested_by: 'admin',
    created_at: '2024-01-15',
  }),
  updateNewTQCTrainingStage: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/services/aqlService', () => ({
  fetchActiveType3Employees: vi.fn().mockResolvedValue([]),
}));

// Import store AFTER mocks are set up
import { useNewTQCStore } from './newTqcStore';

// ========== Test Data ==========

const mockTeam: NewTQCTeam = {
  team_id: 'team-1',
  team_name: 'Team Alpha',
  team_name_vn: 'Nhom Alpha',
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockTeam2: NewTQCTeam = {
  team_id: 'team-2',
  team_name: 'Team Beta',
  is_active: true,
  created_at: '2024-01-02',
  updated_at: '2024-01-02',
};

const mockTrainee: NewTQCTrainee = {
  trainee_id: 'trainee-1',
  name: 'Nguyen Van A',
  team_id: 'team-1',
  trainer_id: 'KIM ANH',
  start_week: 1,
  start_date: '2024-01-15',
  status: 'IN_TRAINING',
  color_blind_status: null,
  progress_percentage: 25,
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
};

const mockTrainee2: NewTQCTrainee = {
  trainee_id: 'trainee-2',
  name: 'Tran Thi B',
  team_id: 'team-1',
  trainer_id: 'NGUYÊN',
  start_week: 2,
  start_date: '2024-01-22',
  status: 'COMPLETED',
  color_blind_status: 'PASS',
  progress_percentage: 100,
  created_at: '2024-01-22',
  updated_at: '2024-02-22',
};

const mockTraineeWithDetails: NewTQCTraineeWithDetails = {
  ...mockTrainee,
  team: mockTeam,
  stages: [
    {
      stage_id: 'stage-1',
      trainee_id: 'trainee-1',
      stage_name: 'Orientation',
      stage_order: 1,
      status: 'COMPLETED',
      updated_at: '2024-01-16',
    },
    {
      stage_id: 'stage-2',
      trainee_id: 'trainee-1',
      stage_name: 'Basic Training',
      stage_order: 2,
      status: 'IN_PROGRESS',
      updated_at: '2024-01-20',
    },
  ],
  colorBlindTests: [],
  meetings: [],
};

const mockMeeting: NewTQCMeeting = {
  meeting_id: 'meeting-1',
  trainee_id: 'trainee-1',
  meeting_type: '1WEEK',
  scheduled_date: '2024-01-22',
  status: 'SCHEDULED',
  attendees: ['KIM ANH'],
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
};

const mockResignation: NewTQCResignation = {
  resignation_id: 'resign-1',
  trainee_id: 'trainee-1',
  resign_date: '2024-01-20',
  reason_category: 'DISTANCE',
  training_duration_days: 5,
  created_at: '2024-01-20',
};

const mockDashboardStats: NewTQCDashboardStats = {
  totalTrainees: 20,
  inTraining: 12,
  completed: 5,
  resigned: 3,
  colorBlindPending: 2,
  colorBlindFailed: 1,
  meetingsThisWeek: 4,
  meetingsPending: 3,
  averageProgress: 45,
  resignationRate: 15,
};

const mockResignationAnalysis: NewTQCResignationAnalysis = {
  byReason: [{ reason: 'DISTANCE', count: 3, percentage: 50 }],
  byMonth: [{ month: '2024-01', count: 3 }],
  byTrainer: [{ trainer: 'KIM ANH', count: 1, total: 5, rate: 20 }],
  byTeam: [{ team: 'Team Alpha', count: 2, total: 10, rate: 20 }],
  byWeek: [{ week: 3, count: 2 }],
  averageTrainingDays: 8,
};

const defaultLoading = {
  teams: false,
  trainees: false,
  traineeDetail: false,
  meetings: false,
  resignations: false,
  dashboard: false,
  analysis: false,
  saving: false,
  hrEmployees: false,
};

// ========== Tests ==========

describe('NewTQCStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNewTQCStore.setState({
      teams: [],
      trainees: [],
      selectedTrainee: null,
      traineeFilters: {},
      meetings: [],
      upcomingMeetings: [],
      meetingFilters: {},
      resignations: [],
      resignationFilters: {},
      resignationAnalysis: null,
      dashboardStats: null,
      hrType3Employees: [],
      loading: { ...defaultLoading },
      error: null,
    });
  });

  // ========== Team Actions ==========

  describe('fetchTeams', () => {
    it('팀 목록을 가져온다', async () => {
      mockGetNewTQCTeams.mockResolvedValueOnce([mockTeam, mockTeam2]);

      await useNewTQCStore.getState().fetchTeams();

      const state = useNewTQCStore.getState();
      expect(state.teams).toHaveLength(2);
      expect(state.teams[0].team_name).toBe('Team Alpha');
      expect(state.loading.teams).toBe(false);
      expect(state.error).toBeNull();
    });

    it('includeInactive 파라미터를 전달한다', async () => {
      mockGetNewTQCTeams.mockResolvedValueOnce([]);

      await useNewTQCStore.getState().fetchTeams(true);

      expect(mockGetNewTQCTeams).toHaveBeenCalledWith(true);
    });

    it('팀 조회 실패 시 에러를 저장한다', async () => {
      mockGetNewTQCTeams.mockRejectedValueOnce(new Error('Network error'));

      await useNewTQCStore.getState().fetchTeams();

      const state = useNewTQCStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.loading.teams).toBe(false);
    });
  });

  describe('createTeam', () => {
    it('새 팀을 생성하고 목록에 추가한다', async () => {
      const input: NewTQCTeamInput = { team_name: 'Team Gamma' };
      mockCreateNewTQCTeam.mockResolvedValueOnce({ ...mockTeam, team_id: 'team-3', team_name: 'Team Gamma' });

      const result = await useNewTQCStore.getState().createTeam(input);

      expect(result.team_name).toBe('Team Gamma');
      const state = useNewTQCStore.getState();
      expect(state.teams).toHaveLength(1);
      expect(state.loading.saving).toBe(false);
    });

    it('팀 생성 실패 시 에러를 저장하고 throw한다', async () => {
      mockCreateNewTQCTeam.mockRejectedValueOnce(new Error('Duplicate team'));

      await expect(
        useNewTQCStore.getState().createTeam({ team_name: 'Dup' })
      ).rejects.toThrow('Duplicate team');

      const state = useNewTQCStore.getState();
      expect(state.error).toBe('Duplicate team');
      expect(state.loading.saving).toBe(false);
    });
  });

  describe('updateTeam', () => {
    it('기존 팀을 업데이트한다', async () => {
      useNewTQCStore.setState({ teams: [mockTeam] });
      const input: NewTQCTeamUpdate = { team_id: 'team-1', team_name: 'Team Alpha Updated' };
      const updatedTeam = { ...mockTeam, team_name: 'Team Alpha Updated' };
      mockUpdateNewTQCTeam.mockResolvedValueOnce(updatedTeam);

      await useNewTQCStore.getState().updateTeam(input);

      const state = useNewTQCStore.getState();
      expect(state.teams[0].team_name).toBe('Team Alpha Updated');
      expect(state.loading.saving).toBe(false);
    });

    it('팀 업데이트 실패 시 에러를 저장하고 throw한다', async () => {
      mockUpdateNewTQCTeam.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        useNewTQCStore.getState().updateTeam({ team_id: 'team-1' })
      ).rejects.toThrow('Update failed');

      expect(useNewTQCStore.getState().error).toBe('Update failed');
    });
  });

  describe('deleteTeam', () => {
    it('팀을 소프트 삭제한다 (is_active=false)', async () => {
      useNewTQCStore.setState({ teams: [mockTeam] });
      mockDeleteNewTQCTeam.mockResolvedValueOnce(true);

      await useNewTQCStore.getState().deleteTeam('team-1');

      const state = useNewTQCStore.getState();
      expect(state.teams[0].is_active).toBe(false);
      expect(state.loading.saving).toBe(false);
    });

    it('팀 삭제 실패 시 에러를 저장하고 throw한다', async () => {
      mockDeleteNewTQCTeam.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(
        useNewTQCStore.getState().deleteTeam('team-1')
      ).rejects.toThrow('Delete failed');

      expect(useNewTQCStore.getState().error).toBe('Delete failed');
    });
  });

  // ========== Trainee Actions ==========

  describe('fetchTrainees', () => {
    it('교육생 목록을 가져온다', async () => {
      mockGetNewTQCTrainees.mockResolvedValueOnce([mockTrainee, mockTrainee2]);

      await useNewTQCStore.getState().fetchTrainees();

      const state = useNewTQCStore.getState();
      expect(state.trainees).toHaveLength(2);
      expect(state.loading.trainees).toBe(false);
    });

    it('필터와 함께 교육생을 가져온다', async () => {
      mockGetNewTQCTrainees.mockResolvedValueOnce([mockTrainee]);
      const filters = { status: 'IN_TRAINING' as const };

      await useNewTQCStore.getState().fetchTrainees(filters);

      expect(mockGetNewTQCTrainees).toHaveBeenCalledWith(filters);
      const state = useNewTQCStore.getState();
      expect(state.traineeFilters).toEqual(filters);
    });

    it('교육생 조회 실패 시 에러를 저장한다', async () => {
      mockGetNewTQCTrainees.mockRejectedValueOnce(new Error('Fetch failed'));

      await useNewTQCStore.getState().fetchTrainees();

      const state = useNewTQCStore.getState();
      expect(state.error).toBe('Fetch failed');
      expect(state.loading.trainees).toBe(false);
    });
  });

  describe('fetchTraineeDetail', () => {
    it('교육생 상세 정보를 가져온다', async () => {
      mockGetNewTQCTraineeWithDetails.mockResolvedValueOnce(mockTraineeWithDetails);

      await useNewTQCStore.getState().fetchTraineeDetail('trainee-1');

      const state = useNewTQCStore.getState();
      expect(state.selectedTrainee).toEqual(mockTraineeWithDetails);
      expect(state.loading.traineeDetail).toBe(false);
    });

    it('상세 조회 실패 시 에러를 저장한다', async () => {
      mockGetNewTQCTraineeWithDetails.mockRejectedValueOnce(new Error('Not found'));

      await useNewTQCStore.getState().fetchTraineeDetail('trainee-999');

      expect(useNewTQCStore.getState().error).toBe('Not found');
      expect(useNewTQCStore.getState().loading.traineeDetail).toBe(false);
    });
  });

  describe('createTrainee', () => {
    it('새 교육생을 생성하고 목록 앞에 추가한다', async () => {
      useNewTQCStore.setState({ trainees: [mockTrainee2] });
      const input: NewTQCTraineeInput = {
        name: 'New Trainee',
        team_id: 'team-1',
        trainer_id: 'KIM ANH',
        start_date: '2024-02-01',
      };
      const newTrainee: NewTQCTrainee = {
        ...mockTrainee,
        trainee_id: 'trainee-3',
        name: 'New Trainee',
      };
      mockCreateNewTQCTrainee.mockResolvedValueOnce(newTrainee);

      const result = await useNewTQCStore.getState().createTrainee(input);

      expect(result.name).toBe('New Trainee');
      const state = useNewTQCStore.getState();
      expect(state.trainees).toHaveLength(2);
      expect(state.trainees[0].trainee_id).toBe('trainee-3'); // prepended
      expect(state.loading.saving).toBe(false);
    });

    it('교육생 생성 실패 시 에러를 저장하고 throw한다', async () => {
      mockCreateNewTQCTrainee.mockRejectedValueOnce(new Error('Create failed'));

      await expect(
        useNewTQCStore.getState().createTrainee({
          name: 'Test',
          team_id: 'team-1',
          trainer_id: 'KIM ANH',
          start_date: '2024-01-01',
        })
      ).rejects.toThrow('Create failed');

      expect(useNewTQCStore.getState().error).toBe('Create failed');
      expect(useNewTQCStore.getState().loading.saving).toBe(false);
    });
  });

  describe('updateTrainee', () => {
    it('교육생을 업데이트하고 목록에 반영한다', async () => {
      useNewTQCStore.setState({ trainees: [mockTrainee] });
      const input: NewTQCTraineeUpdate = { trainee_id: 'trainee-1', name: 'Updated Name' };
      const updatedTrainee = { ...mockTrainee, name: 'Updated Name' };
      mockUpdateNewTQCTrainee.mockResolvedValueOnce(updatedTrainee);

      await useNewTQCStore.getState().updateTrainee(input);

      const state = useNewTQCStore.getState();
      expect(state.trainees[0].name).toBe('Updated Name');
      expect(state.loading.saving).toBe(false);
    });

    it('selectedTrainee도 함께 업데이트한다', async () => {
      useNewTQCStore.setState({
        trainees: [mockTrainee],
        selectedTrainee: mockTraineeWithDetails,
      });
      const updatedTrainee = { ...mockTrainee, name: 'Updated Name' };
      mockUpdateNewTQCTrainee.mockResolvedValueOnce(updatedTrainee);

      await useNewTQCStore.getState().updateTrainee({ trainee_id: 'trainee-1', name: 'Updated Name' });

      const state = useNewTQCStore.getState();
      expect(state.selectedTrainee?.name).toBe('Updated Name');
    });

    it('교육생 업데이트 실패 시 에러를 저장하고 throw한다', async () => {
      mockUpdateNewTQCTrainee.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        useNewTQCStore.getState().updateTrainee({ trainee_id: 'trainee-1' })
      ).rejects.toThrow('Update failed');

      expect(useNewTQCStore.getState().error).toBe('Update failed');
    });
  });

  describe('clearSelectedTrainee', () => {
    it('선택된 교육생을 초기화한다', () => {
      useNewTQCStore.setState({ selectedTrainee: mockTraineeWithDetails });

      useNewTQCStore.getState().clearSelectedTrainee();

      expect(useNewTQCStore.getState().selectedTrainee).toBeNull();
    });
  });

  describe('setTraineeFilters', () => {
    it('교육생 필터를 설정한다', () => {
      const filters = { status: 'IN_TRAINING' as const, trainer: 'KIM ANH' };

      useNewTQCStore.getState().setTraineeFilters(filters);

      expect(useNewTQCStore.getState().traineeFilters).toEqual(filters);
    });
  });

  // ========== Meeting Actions ==========

  describe('fetchMeetings', () => {
    it('미팅 목록을 가져온다', async () => {
      mockGetNewTQCMeetings.mockResolvedValueOnce([mockMeeting]);

      await useNewTQCStore.getState().fetchMeetings();

      expect(useNewTQCStore.getState().meetings).toHaveLength(1);
      expect(useNewTQCStore.getState().loading.meetings).toBe(false);
    });

    it('미팅 조회 실패 시 에러를 저장한다', async () => {
      mockGetNewTQCMeetings.mockRejectedValueOnce(new Error('Meeting fetch error'));

      await useNewTQCStore.getState().fetchMeetings();

      expect(useNewTQCStore.getState().error).toBe('Meeting fetch error');
    });
  });

  describe('fetchUpcomingMeetings', () => {
    it('예정된 미팅을 가져온다', async () => {
      mockGetNewTQCUpcomingMeetings.mockResolvedValueOnce([mockMeeting]);

      await useNewTQCStore.getState().fetchUpcomingMeetings(7);

      expect(useNewTQCStore.getState().upcomingMeetings).toHaveLength(1);
      expect(mockGetNewTQCUpcomingMeetings).toHaveBeenCalledWith(7);
    });

    it('예정 미팅 조회 실패 시 에러를 저장한다', async () => {
      mockGetNewTQCUpcomingMeetings.mockRejectedValueOnce(new Error('Upcoming error'));

      await useNewTQCStore.getState().fetchUpcomingMeetings();

      expect(useNewTQCStore.getState().error).toBe('Upcoming error');
    });
  });

  describe('createMeeting', () => {
    it('미팅을 생성하고 목록에 추가한다', async () => {
      const input: NewTQCMeetingInput = {
        trainee_id: 'trainee-1',
        meeting_type: '1WEEK',
        scheduled_date: '2024-01-22',
      };
      mockCreateNewTQCMeeting.mockResolvedValueOnce(mockMeeting);

      const result = await useNewTQCStore.getState().createMeeting(input);

      expect(result.meeting_id).toBe('meeting-1');
      expect(useNewTQCStore.getState().meetings).toHaveLength(1);
    });

    it('미팅 생성 실패 시 에러를 저장하고 throw한다', async () => {
      mockCreateNewTQCMeeting.mockRejectedValueOnce(new Error('Create meeting failed'));

      await expect(
        useNewTQCStore.getState().createMeeting({
          trainee_id: 'trainee-1',
          meeting_type: '1WEEK',
          scheduled_date: '2024-01-22',
        })
      ).rejects.toThrow('Create meeting failed');

      expect(useNewTQCStore.getState().error).toBe('Create meeting failed');
    });
  });

  // ========== Resignation Actions ==========

  describe('fetchResignations', () => {
    it('퇴사 목록을 가져온다', async () => {
      mockGetNewTQCResignations.mockResolvedValueOnce([mockResignation]);

      await useNewTQCStore.getState().fetchResignations();

      expect(useNewTQCStore.getState().resignations).toHaveLength(1);
      expect(useNewTQCStore.getState().loading.resignations).toBe(false);
    });

    it('퇴사 목록 조회 실패 시 에러를 저장한다', async () => {
      mockGetNewTQCResignations.mockRejectedValueOnce(new Error('Resignation error'));

      await useNewTQCStore.getState().fetchResignations();

      expect(useNewTQCStore.getState().error).toBe('Resignation error');
    });
  });

  describe('createResignation', () => {
    it('퇴사를 기록하고 교육생 상태를 RESIGNED로 변경한다', async () => {
      useNewTQCStore.setState({ trainees: [mockTrainee] });
      const input: NewTQCResignationInput = {
        trainee_id: 'trainee-1',
        resign_date: '2024-01-20',
        reason_category: 'DISTANCE',
      };
      mockCreateNewTQCResignation.mockResolvedValueOnce(mockResignation);

      const result = await useNewTQCStore.getState().createResignation(input);

      expect(result.resignation_id).toBe('resign-1');
      const state = useNewTQCStore.getState();
      expect(state.trainees[0].status).toBe('RESIGNED');
      expect(state.resignations).toHaveLength(1);
      expect(state.loading.saving).toBe(false);
    });

    it('퇴사 기록 실패 시 에러를 저장하고 throw한다', async () => {
      mockCreateNewTQCResignation.mockRejectedValueOnce(new Error('Resign failed'));

      await expect(
        useNewTQCStore.getState().createResignation({
          trainee_id: 'trainee-1',
          resign_date: '2024-01-20',
          reason_category: 'OTHER',
        })
      ).rejects.toThrow('Resign failed');

      expect(useNewTQCStore.getState().error).toBe('Resign failed');
    });
  });

  describe('fetchResignationAnalysis', () => {
    it('퇴사 분석 데이터를 가져온다', async () => {
      mockGetNewTQCResignationAnalysis.mockResolvedValueOnce(mockResignationAnalysis);

      await useNewTQCStore.getState().fetchResignationAnalysis();

      const state = useNewTQCStore.getState();
      expect(state.resignationAnalysis).toEqual(mockResignationAnalysis);
      expect(state.loading.analysis).toBe(false);
    });

    it('퇴사 분석 실패 시 에러를 저장한다', async () => {
      mockGetNewTQCResignationAnalysis.mockRejectedValueOnce(new Error('Analysis error'));

      await useNewTQCStore.getState().fetchResignationAnalysis();

      expect(useNewTQCStore.getState().error).toBe('Analysis error');
      expect(useNewTQCStore.getState().loading.analysis).toBe(false);
    });
  });

  // ========== Dashboard Actions ==========

  describe('fetchDashboardStats', () => {
    it('대시보드 통계를 가져온다', async () => {
      mockGetNewTQCDashboardStats.mockResolvedValueOnce(mockDashboardStats);

      await useNewTQCStore.getState().fetchDashboardStats();

      const state = useNewTQCStore.getState();
      expect(state.dashboardStats).toEqual(mockDashboardStats);
      expect(state.dashboardStats?.totalTrainees).toBe(20);
      expect(state.loading.dashboard).toBe(false);
    });

    it('대시보드 통계 조회 실패 시 에러를 저장한다', async () => {
      mockGetNewTQCDashboardStats.mockRejectedValueOnce(new Error('Dashboard error'));

      await useNewTQCStore.getState().fetchDashboardStats();

      expect(useNewTQCStore.getState().error).toBe('Dashboard error');
      expect(useNewTQCStore.getState().loading.dashboard).toBe(false);
    });
  });

  // ========== Error Handling ==========

  describe('clearError', () => {
    it('에러 상태를 초기화한다', () => {
      useNewTQCStore.setState({ error: '이전 에러' });

      useNewTQCStore.getState().clearError();

      expect(useNewTQCStore.getState().error).toBeNull();
    });
  });

  describe('non-Error 객체 에러 처리', () => {
    it('Error가 아닌 객체가 throw되면 기본 메시지를 사용한다', async () => {
      mockGetNewTQCTeams.mockRejectedValueOnce('string error');

      await useNewTQCStore.getState().fetchTeams();

      expect(useNewTQCStore.getState().error).toBe('Failed to fetch teams');
    });

    it('교육생 조회에서 Error가 아닌 객체가 throw되면 기본 메시지를 사용한다', async () => {
      mockGetNewTQCTrainees.mockRejectedValueOnce(42);

      await useNewTQCStore.getState().fetchTrainees();

      expect(useNewTQCStore.getState().error).toBe('Failed to fetch trainees');
    });
  });

  // ========== Filter Actions ==========

  describe('setMeetingFilters', () => {
    it('미팅 필터를 설정한다', () => {
      const filters = { meetingType: '1WEEK' as const };

      useNewTQCStore.getState().setMeetingFilters(filters);

      expect(useNewTQCStore.getState().meetingFilters).toEqual(filters);
    });
  });

  describe('setResignationFilters', () => {
    it('퇴사 필터를 설정한다', () => {
      const filters = { reasonCategory: 'DISTANCE' as const };

      useNewTQCStore.getState().setResignationFilters(filters);

      expect(useNewTQCStore.getState().resignationFilters).toEqual(filters);
    });
  });
});
