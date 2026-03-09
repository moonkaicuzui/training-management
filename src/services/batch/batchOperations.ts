// ============================================================
// Q-TRAIN Batch Service - Core Batch Operations
// ============================================================

import {
  db,
  doc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { BatchOperation, BatchResult } from './types';

// ============================================================
// Constants
// ============================================================

/** Maximum operations per Firestore writeBatch (under 500 limit) */
const BATCH_CHUNK_SIZE = 450;

const CERTIFICATES_COLLECTION = 'certificates';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Generate a unique document ID with prefix
 */
const generateDocId = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
};

// ============================================================
// Core Batch Operations
// ============================================================

/**
 * Execute a list of batch operations in Firestore batches of 450.
 *
 * Each operation is tracked individually for success/failure.
 * If a batch chunk fails, all operations in that chunk are marked as failed,
 * but subsequent chunks are still attempted.
 *
 * @param operations - Array of create/update/delete operations
 * @returns BatchResult with success/failure counts and per-operation errors
 */
export const executeBatch = async (
  operations: BatchOperation[]
): Promise<BatchResult> => {
  const startTime = performance.now();
  const result: BatchResult = {
    total: operations.length,
    success: 0,
    failed: 0,
    errors: [],
    duration: 0,
  };

  if (operations.length === 0) {
    result.duration = Math.round(performance.now() - startTime);
    return result;
  }

  // Process in chunks of BATCH_CHUNK_SIZE
  for (let chunkStart = 0; chunkStart < operations.length; chunkStart += BATCH_CHUNK_SIZE) {
    const chunkEnd = Math.min(chunkStart + BATCH_CHUNK_SIZE, operations.length);
    const chunk = operations.slice(chunkStart, chunkEnd);
    const batch = writeBatch(db);
    const chunkErrors: Array<{ index: number; error: string; operation: BatchOperation }> = [];

    for (let i = 0; i < chunk.length; i++) {
      const op = chunk[i];
      const globalIndex = chunkStart + i;

      try {
        switch (op.type) {
          case 'create': {
            const docId = op.docId || doc(collection(db, op.collection)).id;
            const docRef = doc(db, op.collection, docId);
            batch.set(docRef, {
              ...op.data,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });
            break;
          }

          case 'update': {
            if (!op.docId) {
              chunkErrors.push({
                index: globalIndex,
                error: 'docId is required for update operations',
                operation: op,
              });
              continue;
            }
            const updateRef = doc(db, op.collection, op.docId);
            batch.update(updateRef, {
              ...op.data,
              updated_at: serverTimestamp(),
            });
            break;
          }

          case 'delete': {
            if (!op.docId) {
              chunkErrors.push({
                index: globalIndex,
                error: 'docId is required for delete operations',
                operation: op,
              });
              continue;
            }
            const deleteRef = doc(db, op.collection, op.docId);
            batch.delete(deleteRef);
            break;
          }

          default:
            chunkErrors.push({
              index: globalIndex,
              error: `Unknown operation type: ${(op as BatchOperation).type}`,
              operation: op,
            });
        }
      } catch (err) {
        chunkErrors.push({
          index: globalIndex,
          error: err instanceof Error ? err.message : String(err),
          operation: op,
        });
      }
    }

    // If there are pre-commit errors, record them before attempting commit
    if (chunkErrors.length > 0) {
      result.errors.push(...chunkErrors);
      result.failed += chunkErrors.length;
    }

    // Attempt to commit the batch
    const validOpsInChunk = chunk.length - chunkErrors.length;
    if (validOpsInChunk > 0) {
      try {
        await batch.commit();
        result.success += validOpsInChunk;
        logger.log(
          `[batchService] Committed chunk ${Math.floor(chunkStart / BATCH_CHUNK_SIZE) + 1}: ${validOpsInChunk} operations`
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`[batchService] Batch commit failed for chunk:`, err);

        // Mark all valid operations in this chunk as failed
        for (let i = 0; i < chunk.length; i++) {
          const globalIndex = chunkStart + i;
          const alreadyFailed = chunkErrors.some((e) => e.index === globalIndex);
          if (!alreadyFailed) {
            result.errors.push({
              index: globalIndex,
              error: `Batch commit failed: ${errorMsg}`,
              operation: chunk[i],
            });
          }
        }
        result.failed += validOpsInChunk;
        result.success -= 0; // no-op, just for clarity
      }
    }
  }

  result.duration = Math.round(performance.now() - startTime);
  logger.log(
    `[batchService] executeBatch complete: ${result.success}/${result.total} succeeded in ${result.duration}ms`
  );

  return result;
};

// ============================================================
// Certificate Batch Operations
// ============================================================

/**
 * Bulk create certificates for multiple employees.
 *
 * - Queries existing valid (ISSUED) certificates for the given program
 * - Skips employees who already have a valid certificate
 * - Creates certificate records with auto-generated IDs
 *
 * @param employeeIds - Array of employee IDs to create certificates for
 * @param programCode - The training program code
 * @param issuedBy - The user who is issuing the certificates
 * @returns BatchResult with details on created/skipped certificates
 */
export const batchCreateCertificates = async (
  employeeIds: string[],
  programCode: string,
  issuedBy: string
): Promise<BatchResult> => {
  const startTime = performance.now();
  const result: BatchResult = {
    total: employeeIds.length,
    success: 0,
    failed: 0,
    errors: [],
    duration: 0,
  };

  if (employeeIds.length === 0) {
    result.duration = Math.round(performance.now() - startTime);
    return result;
  }

  // Step 1: Query existing valid certificates for this program
  const existingQuery = query(
    collection(db, CERTIFICATES_COLLECTION),
    where('program_code', '==', programCode),
    where('status', '==', 'ISSUED')
  );
  const existingSnapshot = await getDocs(existingQuery);

  const existingEmployeeIds = new Set<string>();
  existingSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.employee_id) {
      existingEmployeeIds.add(data.employee_id as string);
    }
  });

  logger.log(
    `[batchService] Found ${existingEmployeeIds.size} existing valid certificates for program ${programCode}`
  );

  // Step 2: Filter out employees who already have valid certificates
  const newEmployeeIds = employeeIds.filter((id) => !existingEmployeeIds.has(id));
  const skippedCount = employeeIds.length - newEmployeeIds.length;

  if (skippedCount > 0) {
    logger.log(
      `[batchService] Skipping ${skippedCount} employees with existing valid certificates`
    );
  }

  // Step 3: Build batch operations for new certificates
  const now = new Date().toISOString();
  const operations: BatchOperation[] = newEmployeeIds.map((employeeId) => {
    const certId = generateDocId('CERT');
    return {
      type: 'create' as const,
      collection: CERTIFICATES_COLLECTION,
      docId: certId,
      data: {
        certificate_id: certId,
        certificate_number: certId,
        employee_id: employeeId,
        program_code: programCode,
        issue_date: now.split('T')[0],
        issued_by: issuedBy,
        status: 'ISSUED',
      },
    };
  });

  // Step 4: Execute the batch
  if (operations.length > 0) {
    const batchResult = await executeBatch(operations);
    result.success = batchResult.success;
    result.failed = batchResult.failed + skippedCount;
    result.errors = [
      ...batchResult.errors,
      ...employeeIds
        .filter((id) => existingEmployeeIds.has(id))
        .map((id, idx) => ({
          index: newEmployeeIds.length + idx,
          error: `Employee ${id} already has a valid certificate for program ${programCode}`,
          operation: {
            type: 'create' as const,
            collection: CERTIFICATES_COLLECTION,
            data: { employee_id: id, program_code: programCode },
          },
        })),
    ];
  } else {
    // All employees already have certificates
    result.failed = skippedCount;
    result.errors = employeeIds.map((id, idx) => ({
      index: idx,
      error: `Employee ${id} already has a valid certificate for program ${programCode}`,
      operation: {
        type: 'create' as const,
        collection: CERTIFICATES_COLLECTION,
        data: { employee_id: id, program_code: programCode },
      },
    }));
  }

  result.duration = Math.round(performance.now() - startTime);
  logger.log(
    `[batchService] batchCreateCertificates: ${result.success} created, ${skippedCount} skipped in ${result.duration}ms`
  );

  return result;
};

// ============================================================
// Batch Status Update
// ============================================================

/**
 * Update the status field for multiple documents in a collection.
 *
 * @param collectionName - Target Firestore collection
 * @param docIds - Array of document IDs to update
 * @param status - New status value to set
 * @returns BatchResult with per-document success/failure tracking
 */
export const batchUpdateStatus = async (
  collectionName: string,
  docIds: string[],
  status: string
): Promise<BatchResult> => {
  const operations: BatchOperation[] = docIds.map((docId) => ({
    type: 'update' as const,
    collection: collectionName,
    docId,
    data: { status },
  }));

  return executeBatch(operations);
};
