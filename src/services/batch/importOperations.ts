// ============================================================
// Q-TRAIN Batch Service - Import Operations (CSV & Excel)
// ============================================================

import {
  db,
  collection,
  query,
  where,
  getDocs,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { BatchOperation, BatchResult, ImportConfig } from './types';
import { executeBatch } from './batchOperations';

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
