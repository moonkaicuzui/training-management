/**
 * New TQC Firebase Service
 *
 * Firestore CRUD operations for all New TQC collections:
 * - tqc_teams, tqc_trainees, tqc_training_stages,
 *   tqc_color_blind_tests, tqc_meetings, tqc_resignations
 *
 * Pure data access layer - NO business logic (that stays in api.ts).
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  writeBatch,
  limit,
  Timestamp,
} from '@/services/firebase';
import type {
  NewTQCTeam,
  NewTQCTeamInput,
  NewTQCTeamUpdate,
  NewTQCTrainee,
  NewTQCTraineeFilters,
  NewTQCTrainingStage,
  NewTQCColorBlindTest,
  NewTQCMeeting,
  NewTQCMeetingFilters,
  NewTQCResignation,
  NewTQCResignationFilters,
} from '@/types';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names
// ============================================================

const COLLECTIONS = {
  TEAMS: 'tqc_teams',
  TRAINEES: 'tqc_trainees',
  STAGES: 'tqc_training_stages',
  COLOR_BLIND: 'tqc_color_blind_tests',
  MEETINGS: 'tqc_meetings',
  RESIGNATIONS: 'tqc_resignations',
} as const;

// ============================================================
// Helper Functions
// ============================================================

/** Timestamp를 ISO string으로 변환 */
const convertTimestamp = (
  timestamp: Timestamp | string | undefined | null
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

/** Firestore 문서를 NewTQCTeam 타입으로 변환 */
const docToTeam = (docId: string, data: Record<string, unknown>): NewTQCTeam => ({
  team_id: (data.team_id as string) || docId,
  team_name: (data.team_name as string) || '',
  team_name_vn: data.team_name_vn as string | undefined,
  team_name_kr: data.team_name_kr as string | undefined,
  factory: data.factory as string | undefined,
  line: data.line as string | undefined,
  is_active: data.is_active !== false,
  created_at: convertTimestamp(data.created_at as Timestamp | string | undefined),
  updated_at: convertTimestamp(data.updated_at as Timestamp | string | undefined),
});

/** Firestore 문서를 NewTQCTrainee 타입으로 변환 */
const docToTrainee = (docId: string, data: Record<string, unknown>): NewTQCTrainee => ({
  trainee_id: (data.trainee_id as string) || docId,
  employee_id: data.employee_id as string | undefined,
  name: (data.name as string) || '',
  team_id: (data.team_id as string) || '',
  trainer_id: (data.trainer_id as string) || '',
  start_week: (data.start_week as number) || 0,
  start_date: (data.start_date as string) || '',
  expected_end_date: data.expected_end_date as string | undefined,
  training_end_date: data.training_end_date as string | undefined,
  introducer: data.introducer as string | undefined,
  building: data.building as string | undefined,
  working_area: data.working_area as string | undefined,
  status: (data.status as NewTQCTrainee['status']) || 'IN_TRAINING',
  color_blind_status: (data.color_blind_status as NewTQCTrainee['color_blind_status']) ?? null,
  progress_percentage: (data.progress_percentage as number) || 0,
  final_test_score: data.final_test_score as number | undefined,
  final_grade: data.final_grade as string | undefined,
  final_result: data.final_result as NewTQCTrainee['final_result'] | undefined,
  certificate_issued: data.certificate_issued as boolean | undefined,
  certificate_date: data.certificate_date as string | undefined,
  meeting_1week_date: data.meeting_1week_date as string | undefined,
  meeting_1month_date: data.meeting_1month_date as string | undefined,
  meeting_3month_date: data.meeting_3month_date as string | undefined,
  notes: data.notes as string | undefined,
  created_at: convertTimestamp(data.created_at as Timestamp | string | undefined),
  updated_at: convertTimestamp(data.updated_at as Timestamp | string | undefined),
  created_by: data.created_by as string | undefined,
});

/** Firestore 문서를 NewTQCTrainingStage 타입으로 변환 */
const docToStage = (docId: string, data: Record<string, unknown>): NewTQCTrainingStage => ({
  stage_id: (data.stage_id as string) || docId,
  trainee_id: (data.trainee_id as string) || '',
  stage_name: (data.stage_name as string) || '',
  stage_order: (data.stage_order as number) || 0,
  start_date: data.start_date as string | undefined,
  end_date: data.end_date as string | undefined,
  status: (data.status as NewTQCTrainingStage['status']) || 'PENDING',
  notes: data.notes as string | undefined,
  updated_at: convertTimestamp(data.updated_at as Timestamp | string | undefined),
  updated_by: data.updated_by as string | undefined,
});

/** Firestore 문서를 NewTQCColorBlindTest 타입으로 변환 */
const docToColorBlindTest = (docId: string, data: Record<string, unknown>): NewTQCColorBlindTest => ({
  test_id: (data.test_id as string) || docId,
  trainee_id: (data.trainee_id as string) || '',
  test_date: (data.test_date as string) || '',
  result: (data.result as NewTQCColorBlindTest['result']) || 'PASS',
  notes: data.notes as string | undefined,
  tested_by: (data.tested_by as string) || '',
  created_at: convertTimestamp(data.created_at as Timestamp | string | undefined),
});

/** Firestore 문서를 NewTQCMeeting 타입으로 변환 */
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

/** Firestore 문서를 NewTQCResignation 타입으로 변환 */
const docToResignation = (docId: string, data: Record<string, unknown>): NewTQCResignation => ({
  resignation_id: (data.resignation_id as string) || docId,
  trainee_id: (data.trainee_id as string) || '',
  resign_date: (data.resign_date as string) || '',
  reason_category: (data.reason_category as NewTQCResignation['reason_category']) || 'OTHER',
  reason_detail: data.reason_detail as string | undefined,
  training_duration_days: (data.training_duration_days as number) || 0,
  last_completed_stage: data.last_completed_stage as string | undefined,
  created_at: convertTimestamp(data.created_at as Timestamp | string | undefined),
  created_by: data.created_by as string | undefined,
});

// ============================================================
// Teams
// ============================================================

/**
 * 팀 목록 조회
 * @param includeInactive true면 비활성 팀도 포함
 */
export const getTeams = async (
  includeInactive?: boolean
): Promise<NewTQCTeam[]> => {
  const constraints = [];

  if (!includeInactive) {
    constraints.push(where('is_active', '==', true));
  }

  constraints.push(orderBy('team_name', 'asc'));
  constraints.push(limit(100));

  const q = query(collection(db, COLLECTIONS.TEAMS), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) =>
    docToTeam(d.id, d.data() as Record<string, unknown>)
  );
};

/**
 * 단일 팀 조회
 */
export const getTeamById = async (
  teamId: string
): Promise<NewTQCTeam | null> => {
  const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToTeam(docSnap.id, docSnap.data() as Record<string, unknown>);
};

/**
 * 팀 생성
 * team_id는 team_name을 대문자 + 공백→언더스코어로 생성
 */
export const createTeam = async (
  input: NewTQCTeamInput
): Promise<NewTQCTeam> => {
  try {
    const teamId = input.team_name.toUpperCase().replace(/\s+/g, '_');
    const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
    const now = serverTimestamp();

    const teamData = {
      team_id: teamId,
      team_name: input.team_name,
      team_name_vn: input.team_name_vn || null,
      team_name_kr: input.team_name_kr || null,
      factory: input.factory || null,
      line: input.line || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    await setDoc(docRef, teamData);

    return {
      team_id: teamId,
      team_name: input.team_name,
      team_name_vn: input.team_name_vn,
      team_name_kr: input.team_name_kr,
      factory: input.factory,
      line: input.line,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`[tqcService] createTeam failed for ${input.team_name}:`, error);
    throw error;
  }
};

/**
 * 팀 수정
 */
export const updateTeam = async (
  input: NewTQCTeamUpdate
): Promise<NewTQCTeam | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.TEAMS, input.team_id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const { team_id: _id, ...updateFields } = input;
    void _id;

    // Remove undefined fields
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await updateDoc(docRef, {
      ...cleanUpdates,
      updated_at: serverTimestamp(),
    });

    // Re-read to return updated data
    const updatedSnap = await getDoc(docRef);
    return docToTeam(updatedSnap.id, updatedSnap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error(`[tqcService] updateTeam failed for ${input.team_id}:`, error);
    throw error;
  }
};

/**
 * 팀 삭제 (soft delete: is_active=false)
 */
export const deleteTeam = async (
  teamId: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;

    await updateDoc(docRef, {
      is_active: false,
      updated_at: serverTimestamp(),
    });

    return true;
  } catch (error) {
    logger.error(`[tqcService] deleteTeam failed for ${teamId}:`, error);
    throw error;
  }
};

// ============================================================
// Trainees
// ============================================================

/**
 * 교육생 목록 조회 (필터 지원)
 * status, team_id → Firestore where()
 * search, trainer, startWeek, colorBlindStatus → 클라이언트 사이드
 */
export const getTrainees = async (
  filters?: NewTQCTraineeFilters
): Promise<NewTQCTrainee[]> => {
  const constraints = [];

  // Firestore where() conditions
  if (filters?.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.team && filters.team !== 'all') {
    constraints.push(where('team_id', '==', filters.team));
  }

  constraints.push(limit(500));

  const q = query(collection(db, COLLECTIONS.TRAINEES), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToTrainee(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (t) =>
        t.trainee_id.toLowerCase().includes(searchLower) ||
        t.name.toLowerCase().includes(searchLower) ||
        (t.employee_id && t.employee_id.toLowerCase().includes(searchLower))
    );
  }

  if (filters?.trainer && filters.trainer !== 'all') {
    results = results.filter((t) => t.trainer_id === filters.trainer);
  }

  if (filters?.startWeek) {
    const weekNum = parseInt(filters.startWeek, 10);
    if (!isNaN(weekNum)) {
      results = results.filter((t) => t.start_week === weekNum);
    }
  }

  if (filters?.colorBlindStatus && filters.colorBlindStatus !== 'all') {
    if (filters.colorBlindStatus === 'pending') {
      results = results.filter((t) => t.color_blind_status === null);
    } else {
      results = results.filter((t) => t.color_blind_status === filters.colorBlindStatus);
    }
  }

  return results;
};

/**
 * 단일 교육생 조회
 */
export const getTraineeById = async (
  traineeId: string
): Promise<NewTQCTrainee | null> => {
  const docRef = doc(db, COLLECTIONS.TRAINEES, traineeId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToTrainee(docSnap.id, docSnap.data() as Record<string, unknown>);
};

/**
 * 교육생 생성 (api.ts에서 전체 객체를 구성하여 전달)
 */
export const createTrainee = async (
  data: NewTQCTrainee
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TRAINEES, data.trainee_id);
    await setDoc(docRef, {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] createTrainee failed for ${data.trainee_id}:`, error);
    throw error;
  }
};

/**
 * 교육생 수정
 */
export const updateTrainee = async (
  traineeId: string,
  updates: Partial<NewTQCTrainee>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TRAINEES, traineeId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] updateTrainee failed for ${traineeId}:`, error);
    throw error;
  }
};

// ============================================================
// Training Stages
// ============================================================

/**
 * 교육생별 단계 목록 조회 (stage_order ASC)
 */
export const getStagesByTrainee = async (
  traineeId: string
): Promise<NewTQCTrainingStage[]> => {
  const q = query(
    collection(db, COLLECTIONS.STAGES),
    where('trainee_id', '==', traineeId),
    orderBy('stage_order', 'asc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) =>
    docToStage(d.id, d.data() as Record<string, unknown>)
  );
};

/**
 * 교육 단계 생성 (api.ts에서 전체 객체를 구성하여 전달)
 */
export const createStage = async (
  data: NewTQCTrainingStage
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.STAGES, data.stage_id);
    await setDoc(docRef, {
      ...data,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] createStage failed for ${data.stage_id}:`, error);
    throw error;
  }
};

/**
 * 교육 단계 수정
 */
export const updateStage = async (
  stageId: string,
  updates: Partial<NewTQCTrainingStage>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.STAGES, stageId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] updateStage failed for ${stageId}:`, error);
    throw error;
  }
};

// ============================================================
// Color Blind Tests
// ============================================================

/**
 * Color Blind 검사 목록 조회
 * @param traineeId 지정 시 해당 교육생만 필터
 */
export const getColorBlindTests = async (
  traineeId?: string
): Promise<NewTQCColorBlindTest[]> => {
  const constraints = [];

  if (traineeId) {
    constraints.push(where('trainee_id', '==', traineeId));
  }

  constraints.push(limit(200));

  const q = query(collection(db, COLLECTIONS.COLOR_BLIND), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) =>
    docToColorBlindTest(d.id, d.data() as Record<string, unknown>)
  );
};

/**
 * Color Blind 검사 생성 (api.ts에서 전체 객체를 구성하여 전달)
 */
export const createColorBlindTest = async (
  data: NewTQCColorBlindTest
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.COLOR_BLIND, data.test_id);
    await setDoc(docRef, {
      ...data,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] createColorBlindTest failed for ${data.test_id}:`, error);
    throw error;
  }
};

// ============================================================
// Meetings
// ============================================================

/**
 * 미팅 목록 조회 (필터 지원)
 * trainee_id → Firestore where()
 * meetingType, status, dateFrom, dateTo → 클라이언트 사이드
 */
export const getMeetings = async (
  filters?: NewTQCMeetingFilters
): Promise<NewTQCMeeting[]> => {
  const constraints = [];

  // Firestore where() conditions
  if (filters?.traineeId) {
    constraints.push(where('trainee_id', '==', filters.traineeId));
  }

  constraints.push(limit(500));

  const q = query(collection(db, COLLECTIONS.MEETINGS), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToMeeting(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters
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

/**
 * 미팅 생성 (api.ts에서 전체 객체를 구성하여 전달)
 */
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

/**
 * 미팅 수정
 */
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

// ============================================================
// Resignations
// ============================================================

/**
 * 퇴사 목록 조회 (필터 지원)
 * 모든 필터는 클라이언트 사이드
 */
export const getResignations = async (
  filters?: NewTQCResignationFilters
): Promise<NewTQCResignation[]> => {
  const constraints = [];

  // Server-side filter: reason_category
  if (filters?.reasonCategory && filters.reasonCategory !== 'all') {
    constraints.push(where('reason_category', '==', filters.reasonCategory));
  }

  constraints.push(limit(500));

  const q = query(collection(db, COLLECTIONS.RESIGNATIONS), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToResignation(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters (date range - Firestore compound query limitation)
  if (filters?.dateFrom) {
    results = results.filter((r) => r.resign_date >= filters.dateFrom!);
  }

  if (filters?.dateTo) {
    results = results.filter((r) => r.resign_date <= filters.dateTo!);
  }

  return results;
};

/**
 * 퇴사 정보 생성 (api.ts에서 전체 객체를 구성하여 전달)
 */
export const createResignation = async (
  data: NewTQCResignation
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.RESIGNATIONS, data.resignation_id);
    await setDoc(docRef, {
      ...data,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] createResignation failed for ${data.resignation_id}:`, error);
    throw error;
  }
};

// ============================================================
// Batch Operations
// ============================================================

/**
 * 교육 단계 + 미팅을 일괄 생성 (writeBatch)
 * 교육생 등록 시 초기 단계와 미팅을 함께 생성할 때 사용
 */
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
