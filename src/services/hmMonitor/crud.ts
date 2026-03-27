/**
 * 온도-습도 모니터링 장치 — CRUD 서비스
 */

import {
  db, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, writeBatch,
} from '@/services/firebase';
import type { HMDevice, HMInspection, HMCheckResult, HMFilters } from '@/types/humidityMonitor';
import {
  DEVICES_COLLECTION, INSPECTIONS_COLLECTION,
  docToDevice, docToInspection, calculateSummary,
} from './helpers';
import { logger } from '@/utils/logger';

// ─── Device CRUD ─────────────────────────────────────────────

export async function getDevices(): Promise<HMDevice[]> {
  try {
    const q = query(
      collection(db, DEVICES_COLLECTION),
      where('isActive', '==', true),
      orderBy('number', 'asc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToDevice(d.id, d.data()));
  } catch (error) {
    logger.error('[HMMonitor] getDevices failed', error);
    throw error;
  }
}

export async function createDevice(
  data: Omit<HMDevice, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<HMDevice> {
  try {
    const docRef = await addDoc(collection(db, DEVICES_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const snap = await getDoc(docRef);
    return docToDevice(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error('[HMMonitor] createDevice failed', error);
    throw error;
  }
}

export async function updateDevice(
  id: string,
  data: Partial<HMDevice>,
): Promise<void> {
  try {
    const ref = doc(db, DEVICES_COLLECTION, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[HMMonitor] updateDevice failed', error);
    throw error;
  }
}

export async function deleteDevice(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, DEVICES_COLLECTION, id), {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[HMMonitor] deleteDevice failed', error);
    throw error;
  }
}

export async function seedDevices(
  devices: Omit<HMDevice, 'id' | 'createdAt' | 'updatedAt'>[],
): Promise<number> {
  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const device of devices) {
      const ref = doc(collection(db, DEVICES_COLLECTION));
      batch.set(ref, {
        ...device,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }

    await batch.commit();
    return count;
  } catch (error) {
    logger.error('[HMMonitor] seedDevices failed', error);
    throw error;
  }
}

// ─── Inspection CRUD ─────────────────────────────────────────

export async function getInspections(filters?: HMFilters): Promise<HMInspection[]> {
  try {
    const constraints = [];

    if (filters?.dateFrom) {
      constraints.push(where('inspectionDate', '>=', filters.dateFrom));
    }
    if (filters?.dateTo) {
      constraints.push(where('inspectionDate', '<=', filters.dateTo));
    }

    constraints.push(orderBy('inspectionDate', 'desc'));

    const q = query(collection(db, INSPECTIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToInspection(d.id, d.data()));
  } catch (error) {
    logger.error('[HMMonitor] getInspections failed', error);
    throw error;
  }
}

export async function getInspectionById(id: string): Promise<HMInspection | null> {
  try {
    const snap = await getDoc(doc(db, INSPECTIONS_COLLECTION, id));
    if (!snap.exists()) return null;
    return docToInspection(snap.id, snap.data());
  } catch (error) {
    logger.error('[HMMonitor] getInspectionById failed', error);
    throw error;
  }
}

export async function createInspection(
  inspectionDate: string,
  inspector: string,
  results: HMCheckResult[],
): Promise<HMInspection> {
  try {
    const summary = calculateSummary(results);

    const docRef = await addDoc(collection(db, INSPECTIONS_COLLECTION), {
      inspectionDate,
      inspector,
      results,
      summary,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const snap = await getDoc(docRef);
    return docToInspection(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error('[HMMonitor] createInspection failed', error);
    throw error;
  }
}

export async function updateInspection(
  id: string,
  results: HMCheckResult[],
  inspector?: string,
): Promise<void> {
  try {
    const summary = calculateSummary(results);
    const ref = doc(db, INSPECTIONS_COLLECTION, id);
    const updateData: Record<string, unknown> = {
      results,
      summary,
      updatedAt: serverTimestamp(),
    };
    if (inspector) updateData.inspector = inspector;
    await updateDoc(ref, updateData);
  } catch (error) {
    logger.error('[HMMonitor] updateInspection failed', error);
    throw error;
  }
}

export async function deleteInspection(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, INSPECTIONS_COLLECTION, id));
  } catch (error) {
    logger.error('[HMMonitor] deleteInspection failed', error);
    throw error;
  }
}
