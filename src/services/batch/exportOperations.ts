// ============================================================
// Q-TRAIN Batch Service - Export Operations
// ============================================================

import {
  db,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from '@/services/firebase';
import type { WhereFilterOp } from 'firebase/firestore';
import { logger } from '@/utils/logger';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Convert a value to CSV-safe string (escape quotes and commas)
 */
const escapeCSVField = (value: unknown): string => {
  if (value === null || value === undefined) return '';

  const str = value instanceof Timestamp
    ? value.toDate().toISOString()
    : String(value);

  // Escape if field contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// ============================================================
// CSV Export
// ============================================================

/**
 * Export documents from a Firestore collection as a CSV string.
 *
 * @param collectionName - Source Firestore collection
 * @param fields - Array of field names to include in the export
 * @param filters - Optional array of query filters ({field, op, value})
 * @returns CSV string with headers and data rows
 */
export const exportToCSV = async (
  collectionName: string,
  fields: string[],
  filters?: Array<{ field: string; op: string; value: unknown }>
): Promise<string> => {
  const startTime = performance.now();

  // Build query constraints
  const constraints = [];
  if (filters && filters.length > 0) {
    for (const filter of filters) {
      constraints.push(where(filter.field, filter.op as WhereFilterOp, filter.value));
    }
  }

  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    logger.log(`[batchService] Export: no documents found in ${collectionName}`);
    return fields.join(',') + '\n';
  }

  // Build CSV header
  const csvLines: string[] = [fields.map(escapeCSVField).join(',')];

  // Build CSV data rows
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const row = fields.map((field) => escapeCSVField(data[field]));
    csvLines.push(row.join(','));
  });

  const duration = Math.round(performance.now() - startTime);
  logger.log(
    `[batchService] Exported ${snapshot.docs.length} rows from ${collectionName} in ${duration}ms`
  );

  return csvLines.join('\n') + '\n';
};
