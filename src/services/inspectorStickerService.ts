/**
 * Inspector Sticker Firebase Service
 *
 * 제품 검사원 정품 인증 스티커 마스터 데이터 CRUD.
 * Firestore 'inspector_stickers' 컬렉션 관리.
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
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import type {
  InspectorSticker,
  InspectorStickerInput,
  InspectorStickerUpdate,
} from '@/types/inspectorSticker';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';

const COLLECTION = 'inspector_stickers';

function convertTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function docToSticker(data: Record<string, unknown>, id: string): InspectorSticker {
  return {
    id,
    sticker_id: (data.sticker_id as string) || '',
    employee_id: (data.employee_id as string) || '',
    employee_name: (data.employee_name as string) || '',
    department: data.department as string | undefined,
    building: data.building as string | undefined,
    line: data.line as string | undefined,
    status: (data.status as InspectorSticker['status']) || 'ACTIVE',
    notes: data.notes as string | undefined,
    created_at: convertTimestamp(data.created_at),
    updated_at: convertTimestamp(data.updated_at),
  };
}

export async function getStickers(status?: string): Promise<InspectorSticker[]> {
  try {
    let q;
    if (status && status !== 'all') {
      q = query(collection(db, COLLECTION), where('status', '==', status), orderBy('sticker_id'));
    } else {
      q = query(collection(db, COLLECTION), orderBy('sticker_id'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToSticker(d.data(), d.id));
  } catch (error) {
    logger.error('[inspectorStickerService] getStickers failed:', error);
    throw error;
  }
}

export async function getSticker(id: string): Promise<InspectorSticker | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return docToSticker(snapshot.data(), snapshot.id);
  } catch (error) {
    logger.error('[inspectorStickerService] getSticker failed:', error);
    throw error;
  }
}

export async function getStickerByStickerID(stickerId: string): Promise<InspectorSticker | null> {
  try {
    const q = query(collection(db, COLLECTION), where('sticker_id', '==', stickerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const first = snapshot.docs[0];
    return docToSticker(first.data(), first.id);
  } catch (error) {
    logger.error('[inspectorStickerService] getStickerByStickerID failed:', error);
    throw error;
  }
}

export async function createSticker(data: InspectorStickerInput): Promise<InspectorSticker> {
  try {
    // 중복 스티커 ID 검사
    const existing = await getStickerByStickerID(data.sticker_id);
    if (existing) {
      throw new Error(i18n.t('inspectorStickers.duplicateId', { id: data.sticker_id }));
    }

    const docRef = doc(collection(db, COLLECTION));
    const stickerData = {
      ...data,
      status: 'ACTIVE',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    await setDoc(docRef, stickerData);
    return {
      ...data,
      id: docRef.id,
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`[inspectorStickerService] createSticker failed:`, error);
    throw error;
  }
}

export async function updateSticker(id: string, updates: InspectorStickerUpdate): Promise<void> {
  try {
    // 스티커 ID 변경 시 중복 검사
    if (updates.sticker_id) {
      const existing = await getStickerByStickerID(updates.sticker_id);
      if (existing && existing.id !== id) {
        throw new Error(i18n.t('inspectorStickers.duplicateId', { id: updates.sticker_id }));
      }
    }

    await updateDoc(doc(db, COLLECTION, id), {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[inspectorStickerService] updateSticker failed for ${id}:`, error);
    throw error;
  }
}

export async function deleteSticker(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    logger.error(`[inspectorStickerService] deleteSticker failed for ${id}:`, error);
    throw error;
  }
}
