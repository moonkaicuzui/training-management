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
  limit,
  Timestamp,
} from '@/services/firebase';
import type {
  NewTQCTeam,
  NewTQCTeamInput,
  NewTQCTeamUpdate,
} from '@/types';
import { logger } from '@/utils/logger';
import { COLLECTIONS, convertTimestamp } from './constants';

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

export const getTeamById = async (
  teamId: string
): Promise<NewTQCTeam | null> => {
  const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToTeam(docSnap.id, docSnap.data() as Record<string, unknown>);
};

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
      created_at: new Date().toISOString(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
      updated_at: new Date().toISOString(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
    };
  } catch (error) {
    logger.error(`[tqcService] createTeam failed for ${input.team_name}:`, error);
    throw error;
  }
};

export const updateTeam = async (
  input: NewTQCTeamUpdate
): Promise<NewTQCTeam | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.TEAMS, input.team_id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const { team_id: _id, ...updateFields } = input;
    void _id;

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

    const updatedSnap = await getDoc(docRef);
    return docToTeam(updatedSnap.id, updatedSnap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error(`[tqcService] updateTeam failed for ${input.team_id}:`, error);
    throw error;
  }
};

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
