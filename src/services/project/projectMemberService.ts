/**
 * 프로젝트 멤버 관리 서비스
 *
 * 팀원 CRUD, 실시간 구독, 통계 계산, Auth 연결
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from '@/services/firebase';
import type {
  ProjectMember,
  CreateMemberInput,
  UpdateMemberInput,
  Task,
  MemberStats,
} from '@/types/project';
import { COLLECTIONS, generateId, convertDocumentDates } from './common';
import { logger } from '@/utils/logger';

// ============================================================
// Member (팀원) Service
// ============================================================

/** 모든 팀원 조회 */
export const getMembers = async (): Promise<ProjectMember[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.MEMBERS),
      orderBy('name', 'asc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectMember
    );
  } catch (error) {
    logger.error('[projectMemberService] getMembers failed:', error);
    throw error;
  }
};

/** 활성 팀원만 조회 */
export const getActiveMembers = async (): Promise<ProjectMember[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.MEMBERS),
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectMember
    );
  } catch (error) {
    logger.error('[projectMemberService] getActiveMembers failed:', error);
    throw error;
  }
};

/** 단일 팀원 조회 */
export const getMember = async (memberId: string): Promise<ProjectMember | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return convertDocumentDates({ id: docSnap.id, ...docSnap.data() }) as ProjectMember;
  } catch (error) {
    logger.error('[projectMemberService] getMember failed:', error);
    throw error;
  }
};

/** 팀원 생성 */
export const createMember = async (input: CreateMemberInput): Promise<ProjectMember> => {
  try {
    const memberId = generateId('member');
    const now = serverTimestamp();

    const memberData: Omit<ProjectMember, 'id' | 'stats'> = {
      ...input,
      status: 'active',
      createdAt: now as unknown as Timestamp,
      updatedAt: now as unknown as Timestamp,
    };

    await setDoc(doc(db, COLLECTIONS.MEMBERS, memberId), memberData);

    return {
      id: memberId,
      ...memberData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as ProjectMember;
  } catch (error) {
    logger.error('[projectMemberService] createMember failed:', error);
    throw error;
  }
};

/** 팀원 수정 */
export const updateMember = async (
  memberId: string,
  input: UpdateMemberInput
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    await updateDoc(docRef, {
      ...input,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectMemberService] updateMember failed:', error);
    throw error;
  }
};

/** 팀원 삭제 (비활성화) */
export const deactivateMember = async (memberId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    await updateDoc(docRef, {
      status: 'inactive',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectMemberService] deactivateMember failed:', error);
    throw error;
  }
};

/** 팀원 완전 삭제 */
export const deleteMember = async (memberId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error('[projectMemberService] deleteMember failed:', error);
    throw error;
  }
};

/** 팀원 실시간 구독 */
export const subscribeMembersRealtime = (
  callback: (members: ProjectMember[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    orderBy('name', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectMember
    );
    callback(members);
  });
};

/** 팀원 통계 계산 */
export const calculateMemberStats = async (memberId: string): Promise<MemberStats> => {
  try {
    // 할당된 과제 조회
    const assignedQuery = query(
      collection(db, COLLECTIONS.TASKS),
      where('assignees', 'array-contains', memberId)
    );
    const assignedSnapshot = await getDocs(assignedQuery);

    const tasks = assignedSnapshot.docs.map((doc) => doc.data() as Task);
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const totalTasks = tasks.length;

    // 메시지 응답 시간 계산 (간략화)
    // 실제로는 더 복잡한 로직이 필요
    const averageResponseTime = 2.5; // 기본값 2.5시간

    // 소통 점수 계산 (간략화)
    const communicationScore = Math.min(100, totalTasks * 5 + completedTasks * 10);

    return {
      assignedTasks: totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      averageResponseTime,
      communicationScore,
    };
  } catch (error) {
    logger.error('[projectMemberService] calculateMemberStats failed:', error);
    throw error;
  }
};

// ============================================================
// Member-Auth Linking Service
// ============================================================

/** 이메일로 팀원 조회 */
export const getMemberByEmail = async (email: string): Promise<ProjectMember | null> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.MEMBERS),
      where('email', '==', email),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return convertDocumentDates({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() }) as ProjectMember;
  } catch (error) {
    logger.error('[projectMemberService] getMemberByEmail failed:', error);
    throw error;
  }
};

/** uid로 팀원 조회 */
export const getMemberByUid = async (uid: string): Promise<ProjectMember | null> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.MEMBERS),
      where('uid', '==', uid),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return convertDocumentDates({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() }) as ProjectMember;
  } catch (error) {
    logger.error('[projectMemberService] getMemberByUid failed:', error);
    throw error;
  }
};

/** 팀원에 Firebase Auth uid 연결 */
export const linkMemberToAuth = async (memberId: string, uid: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    await updateDoc(docRef, {
      uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectMemberService] linkMemberToAuth failed:', error);
    throw error;
  }
};

/** uid로 배정된 과제 조회 (uid -> memberId -> 과제) */
export const getTasksByAssigneeUid = async (uid: string): Promise<Task[]> => {
  try {
    const member = await getMemberByUid(uid);
    if (!member) return [];

    const q = query(
      collection(db, COLLECTIONS.TASKS),
      where('assignees', 'array-contains', member.id),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Task
    );
  } catch (error) {
    logger.error('[projectMemberService] getTasksByAssigneeUid failed:', error);
    throw error;
  }
};
