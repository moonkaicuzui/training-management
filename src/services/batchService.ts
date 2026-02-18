/**
 * Batch Processing Service
 *
 * Centralized batch operations for Firestore:
 * - Generic batch create/update/delete with chunking (450 per batch)
 * - Bulk certificate generation with duplicate checking
 * - CSV/Excel import with field mapping and validation
 * - CSV export with filters
 *
 * All operations respect Firestore's 500-operation batch limit by
 * processing in chunks of 450 to leave headroom.
 */

import {
  db,
  doc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from '@/services/firebase';
import type { WhereFilterOp } from 'firebase/firestore';
import { logger } from '@/utils/logger';

// ============================================================
// Constants
// ============================================================

/** Maximum operations per Firestore writeBatch (under 500 limit) */
const BATCH_CHUNK_SIZE = 450;

const CERTIFICATES_COLLECTION = 'certificates';

// ============================================================
// Types
// ============================================================

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string; // for update/delete
  data?: Record<string, unknown>; // for create/update
}

export interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ index: number; error: string; operation: BatchOperation }>;
  duration: number; // ms
}

export interface ImportConfig {
  collection: string;
  fieldMapping: Record<string, string>; // csvField -> firestoreField
  uniqueKey: string; // field to check for duplicates
  mode: 'insert' | 'upsert' | 'update_only';
  validateFn?: (row: Record<string, unknown>) => { valid: boolean; errors: string[] };
}

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

/**
 * Parse a CSV string into an array of records.
 * Handles quoted fields (including commas and newlines within quotes).
 */
const parseCSV = (csvData: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvData.length; i++) {
    const char = csvData[i];
    const nextChar = csvData[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.length > 0 && currentRow.some((f) => f !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        if (char === '\r') i++; // skip \n in \r\n
      } else {
        currentField += char;
      }
    }
  }

  // Push last field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return []; // Need at least header + 1 data row

  const headers = rows[0];
  const records: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = rows[i][j] || '';
    }
    records.push(record);
  }

  return records;
};

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

/**
 * Map source fields to Firestore fields using config.fieldMapping
 */
const mapFields = (
  row: Record<string, unknown>,
  fieldMapping: Record<string, string>
): Record<string, unknown> => {
  const mapped: Record<string, unknown> = {};
  for (const [sourceField, firestoreField] of Object.entries(fieldMapping)) {
    if (sourceField in row) {
      mapped[firestoreField] = row[sourceField];
    }
  }
  return mapped;
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

// ============================================================
// CSV Import
// ============================================================

/**
 * Import data from a CSV string into a Firestore collection.
 *
 * Workflow:
 * 1. Parse CSV string into records
 * 2. Map fields per ImportConfig.fieldMapping
 * 3. Validate each row with optional validateFn
 * 4. Check for duplicates based on uniqueKey
 * 5. Insert/upsert/update based on mode
 *
 * @param csvData - Raw CSV string (with headers in first row)
 * @param config - Import configuration with field mapping, mode, and validation
 * @returns BatchResult with per-row error tracking
 */
export const importFromCSV = async (
  csvData: string,
  config: ImportConfig
): Promise<BatchResult> => {
  const startTime = performance.now();

  // Parse CSV
  const records = parseCSV(csvData);

  if (records.length === 0) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      duration: Math.round(performance.now() - startTime),
    };
  }

  logger.log(`[batchService] Parsed ${records.length} records from CSV`);

  // Delegate to the shared import logic
  return importRecords(records, config, startTime);
};

// ============================================================
// Excel Import
// ============================================================

/**
 * Import data from a pre-parsed array (e.g., from xlsx library) into Firestore.
 *
 * Same logic as importFromCSV but skips the CSV parsing step.
 *
 * @param data - Array of records (already parsed from Excel)
 * @param config - Import configuration
 * @returns BatchResult with per-row error tracking
 */
export const importFromExcel = async (
  data: Record<string, unknown>[],
  config: ImportConfig
): Promise<BatchResult> => {
  const startTime = performance.now();

  if (data.length === 0) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      duration: Math.round(performance.now() - startTime),
    };
  }

  logger.log(`[batchService] Processing ${data.length} records from Excel`);

  return importRecords(data, config, startTime);
};

// ============================================================
// Shared Import Logic
// ============================================================

/**
 * Internal: Shared import logic for both CSV and Excel imports.
 *
 * Handles field mapping, validation, duplicate checking, and batch execution.
 */
const importRecords = async (
  records: Record<string, unknown>[],
  config: ImportConfig,
  startTime: number
): Promise<BatchResult> => {
  const result: BatchResult = {
    total: records.length,
    success: 0,
    failed: 0,
    errors: [],
    duration: 0,
  };

  // Step 1: Map fields and validate
  const mappedRecords: Array<{
    index: number;
    data: Record<string, unknown>;
    uniqueValue: unknown;
  }> = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const mapped = mapFields(row, config.fieldMapping);

    // Validation
    if (config.validateFn) {
      const validation = config.validateFn(mapped);
      if (!validation.valid) {
        result.errors.push({
          index: i,
          error: `Validation failed: ${validation.errors.join('; ')}`,
          operation: {
            type: 'create',
            collection: config.collection,
            data: mapped,
          },
        });
        result.failed++;
        continue;
      }
    }

    // Check uniqueKey exists in mapped data
    const uniqueValue = mapped[config.uniqueKey];
    if (uniqueValue === undefined || uniqueValue === null || uniqueValue === '') {
      result.errors.push({
        index: i,
        error: `Missing unique key field: ${config.uniqueKey}`,
        operation: {
          type: 'create',
          collection: config.collection,
          data: mapped,
        },
      });
      result.failed++;
      continue;
    }

    mappedRecords.push({ index: i, data: mapped, uniqueValue });
  }

  if (mappedRecords.length === 0) {
    result.duration = Math.round(performance.now() - startTime);
    return result;
  }

  // Step 2: Check for existing documents (for upsert and update_only modes)
  const existingDocs = new Map<string, string>(); // uniqueValue -> docId

  if (config.mode === 'upsert' || config.mode === 'update_only') {
    // Query in batches of 30 (Firestore 'in' query limit)
    const uniqueValues = mappedRecords.map((r) => r.uniqueValue);
    const IN_QUERY_LIMIT = 30;

    for (let i = 0; i < uniqueValues.length; i += IN_QUERY_LIMIT) {
      const chunk = uniqueValues.slice(i, i + IN_QUERY_LIMIT);
      const q = query(
        collection(db, config.collection),
        where(config.uniqueKey, 'in', chunk)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const key = String(data[config.uniqueKey] ?? '');
        if (key) {
          existingDocs.set(key, docSnap.id);
        }
      });
    }

    logger.log(
      `[batchService] Found ${existingDocs.size} existing documents for duplicate check`
    );
  }

  // Step 3: Build batch operations
  const operations: BatchOperation[] = [];

  for (const record of mappedRecords) {
    const uniqueStr = String(record.uniqueValue);
    const existingDocId = existingDocs.get(uniqueStr);

    switch (config.mode) {
      case 'insert': {
        if (existingDocId) {
          // Skip duplicate in insert mode - not an error, just skip
          result.errors.push({
            index: record.index,
            error: `Duplicate: document with ${config.uniqueKey}=${uniqueStr} already exists`,
            operation: {
              type: 'create',
              collection: config.collection,
              data: record.data,
            },
          });
          result.failed++;
        } else {
          operations.push({
            type: 'create',
            collection: config.collection,
            docId: generateDocId('IMP'),
            data: record.data,
          });
        }
        break;
      }

      case 'upsert': {
        if (existingDocId) {
          operations.push({
            type: 'update',
            collection: config.collection,
            docId: existingDocId,
            data: record.data,
          });
        } else {
          operations.push({
            type: 'create',
            collection: config.collection,
            docId: generateDocId('IMP'),
            data: record.data,
          });
        }
        break;
      }

      case 'update_only': {
        if (existingDocId) {
          operations.push({
            type: 'update',
            collection: config.collection,
            docId: existingDocId,
            data: record.data,
          });
        } else {
          result.errors.push({
            index: record.index,
            error: `Document not found for update: ${config.uniqueKey}=${uniqueStr}`,
            operation: {
              type: 'update',
              collection: config.collection,
              data: record.data,
            },
          });
          result.failed++;
        }
        break;
      }
    }
  }

  // Step 4: Execute batch operations
  if (operations.length > 0) {
    const batchResult = await executeBatch(operations);
    result.success = batchResult.success;
    result.failed += batchResult.failed;
    result.errors.push(...batchResult.errors);
  }

  result.duration = Math.round(performance.now() - startTime);
  logger.log(
    `[batchService] Import complete: ${result.success}/${result.total} succeeded in ${result.duration}ms`
  );

  return result;
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
