/**
 * AQL Service
 *
 * Firestore CRUD operations for AQL training recommendation collections:
 * - aql_employee_links
 * - aql_supervisor_links
 * - aql_enrollment_logs (APPEND-ONLY)
 *
 * Also handles AQL data fetching via Cloud Functions proxy.
 */

import {
  db,
  doc,
  collection,
  setDoc,
  deleteDoc,
  query,
  getDocs,
  orderBy,
  serverTimestamp,
  limit,
  Timestamp,
  writeBatch,
} from '@/services/firebase';
import type {
  AqlMonthsResponse,
  AqlDataResponse,
  AqlEmployeeLink,
  AqlSupervisorLink,
  AqlEnrollmentLog,
} from '@/types/aql';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names (snake_case per project convention)
// ============================================================

const COLLECTIONS = {
  AQL_LINKS: 'aql_employee_links',
  SUPERVISOR_LINKS: 'aql_supervisor_links',
  ENROLLMENT_LOGS: 'aql_enrollment_logs',
} as const;

// ============================================================
// Helpers
// ============================================================

const FETCH_TIMEOUT_MS = 30000;

async function fetchWithTimeout(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithTimeoutStrict(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetchWithTimeout(url, options);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response;
}

const convertTimestamp = (
  timestamp: Timestamp | string | undefined | null
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// ============================================================
// AQL Data API (Cloud Functions proxy)
// ============================================================

export async function fetchAqlMonths(): Promise<AqlMonthsResponse> {
  const res = await fetchWithTimeoutStrict('/api/aql/months');
  return res.json();
}

export async function fetchAqlMonthData(yearMonth: string): Promise<AqlDataResponse> {
  const res = await fetchWithTimeoutStrict(`/api/aql/data/${yearMonth}`);
  return res.json();
}

export interface ManpowerApiRow {
  employee_no: string;
  full_name: string;
  direct_boss_name: string;
  building: string;
}

export interface ManpowerApiResponse {
  success: boolean;
  data: ManpowerApiRow[];
  row_count: number;
}

export async function fetchAqlManpower(): Promise<ManpowerApiResponse> {
  const res = await fetchWithTimeoutStrict('/api/aql/manpower');
  return res.json();
}

// ============================================================
// AQL Employee Links
// ============================================================

export async function getAqlEmployeeLinks(): Promise<AqlEmployeeLink[]> {
  const q = query(
    collection(db, COLLECTIONS.AQL_LINKS),
    orderBy('aql_employee_name', 'asc'),
    limit(500)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      link_id: d.id,
      aql_employee_no: data.aql_employee_no || '',
      aql_employee_name: data.aql_employee_name || '',
      employee_id: data.employee_id || '',
      employee_name: data.employee_name || '',
      created_at: convertTimestamp(data.created_at),
    };
  });
}

export async function createAqlEmployeeLink(
  input: Omit<AqlEmployeeLink, 'link_id' | 'created_at'>
): Promise<AqlEmployeeLink> {
  try {
    const linkId = `AQL-LINK-${input.aql_employee_no}-${input.employee_id}`;
    const docRef = doc(db, COLLECTIONS.AQL_LINKS, linkId);

    await setDoc(docRef, {
      ...input,
      link_id: linkId,
      created_at: serverTimestamp(),
    });

    return {
      ...input,
      link_id: linkId,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[aqlService] createAqlEmployeeLink failed:', error);
    throw error;
  }
}

export async function deleteAqlEmployeeLink(linkId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.AQL_LINKS, linkId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error(`[aqlService] deleteAqlEmployeeLink failed for ${linkId}:`, error);
    throw error;
  }
}

// ============================================================
// Supervisor Links
// ============================================================

export async function getSupervisorLinks(): Promise<AqlSupervisorLink[]> {
  const q = query(
    collection(db, COLLECTIONS.SUPERVISOR_LINKS),
    orderBy('employee_name', 'asc'),
    limit(1000)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      link_id: d.id,
      employee_no: data.employee_no || '',
      employee_name: data.employee_name || '',
      supervisor_no: data.supervisor_no || '',
      supervisor_name: data.supervisor_name || '',
      building: data.building || '',
      imported_at: convertTimestamp(data.imported_at),
      source_file: data.source_file || '',
    };
  });
}

export async function batchImportSupervisorLinks(
  links: Omit<AqlSupervisorLink, 'link_id' | 'imported_at' | 'source_file'>[],
  sourceFile: string
): Promise<number> {
  try {
    const BATCH_SIZE = 500;
    let imported = 0;

    for (let i = 0; i < links.length; i += BATCH_SIZE) {
      const chunk = links.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const link of chunk) {
        const linkId = `SUP-${link.employee_no}-${link.supervisor_no}`;
        const docRef = doc(db, COLLECTIONS.SUPERVISOR_LINKS, linkId);
        batch.set(docRef, {
          ...link,
          link_id: linkId,
          source_file: sourceFile,
          imported_at: serverTimestamp(),
        });
      }

      await batch.commit();
      imported += chunk.length;
    }

    return imported;
  } catch (error) {
    logger.error('[aqlService] batchImportSupervisorLinks failed:', error);
    throw error;
  }
}

export async function clearSupervisorLinks(): Promise<void> {
  try {
    const BATCH_SIZE = 500;
    const colRef = collection(db, COLLECTIONS.SUPERVISOR_LINKS);
    const snapshot = await getDocs(colRef);

    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
      const chunk = snapshot.docs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }
  } catch (error) {
    logger.error('[aqlService] clearSupervisorLinks failed:', error);
    throw error;
  }
}

// ============================================================
// Enrollment Logs (APPEND-ONLY)
// ============================================================

export async function getAqlEnrollmentLogs(): Promise<AqlEnrollmentLog[]> {
  const q = query(
    collection(db, COLLECTIONS.ENROLLMENT_LOGS),
    orderBy('enrolled_at', 'desc'),
    limit(500)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      log_id: d.id,
      aql_employee_no: data.aql_employee_no || '',
      aql_employee_name: data.aql_employee_name || '',
      employee_id: data.employee_id || '',
      employee_name: data.employee_name || '',
      program_code: data.program_code || '',
      program_name: data.program_name || '',
      reason: data.reason || 'INSPECTOR_FAIL',
      defect_types: data.defect_types || [],
      fail_rate: data.fail_rate || 0,
      fail_po_numbers: data.fail_po_numbers || [],
      supervisor_no: data.supervisor_no,
      supervisor_name: data.supervisor_name,
      enrolled_by: data.enrolled_by || '',
      enrolled_at: convertTimestamp(data.enrolled_at),
      year_month: data.year_month || '',
    };
  });
}

export async function createAqlEnrollmentLog(
  input: Omit<AqlEnrollmentLog, 'log_id' | 'enrolled_at'>
): Promise<AqlEnrollmentLog> {
  try {
    const logId = `AQL-ENROLL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const docRef = doc(db, COLLECTIONS.ENROLLMENT_LOGS, logId);

    await setDoc(docRef, {
      ...input,
      log_id: logId,
      enrolled_at: serverTimestamp(),
    });

    return {
      ...input,
      log_id: logId,
      enrolled_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[aqlService] createAqlEnrollmentLog failed:', error);
    throw error;
  }
}
