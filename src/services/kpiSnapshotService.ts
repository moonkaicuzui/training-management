/**
 * KPI Snapshot Service
 *
 * Firestore CRUD for `kpi_snapshots` collection.
 * Each snapshot stores pre-calculated KPI metrics for a given month,
 * enabling historical comparison and anomaly detection.
 *
 * Collection: kpi_snapshots (snake_case per project convention)
 */

import {
  db,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
} from '@/services/firebase';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Name (snake_case per convention)
// ============================================================

const KPI_SNAPSHOTS = 'kpi_snapshots';

// ============================================================
// Types
// ============================================================

export interface KPISnapshot {
  snapshot_id: string;
  year_month: string;          // YYYY-MM format
  overallCompletionRate: number;
  passRate: number;
  firstTimePassRate: number;
  averageScore: number;
  retrainingCount: number;
  expiringCount: number;
  totalEmployees: number;
  monthlyCompletions: number;
  calculated_at: string;       // ISO date string
}

// ============================================================
// Service Functions
// ============================================================

/**
 * Get KPI snapshots ordered by year_month descending.
 * Optionally limits to the most recent N months.
 *
 * @param months - Number of recent months to retrieve (default: all)
 * @returns Array of KPISnapshot sorted newest-first
 */
export async function getKPISnapshots(months?: number): Promise<KPISnapshot[]> {
  try {
    const q = months && months > 0
      ? query(collection(db, KPI_SNAPSHOTS), orderBy('year_month', 'desc'), limit(months))
      : query(collection(db, KPI_SNAPSHOTS), orderBy('year_month', 'desc'));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      logger.log('[kpiSnapshotService] No KPI snapshots found');
      return [];
    }

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        snapshot_id: (data.snapshot_id as string) || docSnap.id,
        year_month: (data.year_month as string) || '',
        overallCompletionRate: (data.overallCompletionRate as number) || 0,
        passRate: (data.passRate as number) || 0,
        firstTimePassRate: (data.firstTimePassRate as number) || 0,
        averageScore: (data.averageScore as number) || 0,
        retrainingCount: (data.retrainingCount as number) || 0,
        expiringCount: (data.expiringCount as number) || 0,
        totalEmployees: (data.totalEmployees as number) || 0,
        monthlyCompletions: (data.monthlyCompletions as number) || 0,
        calculated_at: (data.calculated_at as string) || '',
      };
    });
  } catch (error) {
    logger.error('[kpiSnapshotService] getKPISnapshots error:', error);
    return [];
  }
}

/**
 * Get the most recent KPI snapshot.
 *
 * @returns The latest KPISnapshot or null if none exist
 */
export async function getLatestSnapshot(): Promise<KPISnapshot | null> {
  try {
    const q = query(
      collection(db, KPI_SNAPSHOTS),
      orderBy('year_month', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      logger.log('[kpiSnapshotService] No KPI snapshots found');
      return null;
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    return {
      snapshot_id: (data.snapshot_id as string) || docSnap.id,
      year_month: (data.year_month as string) || '',
      overallCompletionRate: (data.overallCompletionRate as number) || 0,
      passRate: (data.passRate as number) || 0,
      firstTimePassRate: (data.firstTimePassRate as number) || 0,
      averageScore: (data.averageScore as number) || 0,
      retrainingCount: (data.retrainingCount as number) || 0,
      expiringCount: (data.expiringCount as number) || 0,
      totalEmployees: (data.totalEmployees as number) || 0,
      monthlyCompletions: (data.monthlyCompletions as number) || 0,
      calculated_at: (data.calculated_at as string) || '',
    };
  } catch (error) {
    logger.error('[kpiSnapshotService] getLatestSnapshot error:', error);
    return null;
  }
}

/**
 * Get a specific KPI snapshot by its document ID.
 *
 * @param snapshotId - The document ID of the snapshot
 * @returns The KPISnapshot or null if not found
 */
export async function getKPISnapshotById(snapshotId: string): Promise<KPISnapshot | null> {
  try {
    const docRef = doc(db, KPI_SNAPSHOTS, snapshotId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      snapshot_id: (data.snapshot_id as string) || docSnap.id,
      year_month: (data.year_month as string) || '',
      overallCompletionRate: (data.overallCompletionRate as number) || 0,
      passRate: (data.passRate as number) || 0,
      firstTimePassRate: (data.firstTimePassRate as number) || 0,
      averageScore: (data.averageScore as number) || 0,
      retrainingCount: (data.retrainingCount as number) || 0,
      expiringCount: (data.expiringCount as number) || 0,
      totalEmployees: (data.totalEmployees as number) || 0,
      monthlyCompletions: (data.monthlyCompletions as number) || 0,
      calculated_at: (data.calculated_at as string) || '',
    };
  } catch (error) {
    logger.error('[kpiSnapshotService] getKPISnapshotById error:', error);
    return null;
  }
}
