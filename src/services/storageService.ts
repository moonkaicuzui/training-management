/**
 * Firebase Storage Service
 *
 * File upload, download, delete, and metadata operations
 * for the Q-TRAIN application using Firebase Storage.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
} from 'firebase/storage';
import type { UploadTaskSnapshot } from 'firebase/storage';
import { storage } from '@/services/firebase';
import { logger } from '@/utils/logger';

// ============================================================
// Types
// ============================================================

export interface UploadOptions {
  /** Storage path prefix, e.g., 'materials', 'certificates' */
  folder?: string;
  /** Maximum file size in bytes. Default: 10MB */
  maxSizeBytes?: number;
  /** Allowed MIME types, e.g., ['application/pdf', 'image/png'] */
  allowedTypes?: string[];
  /** Whether to generate a thumbnail (reserved for future use) */
  generateThumbnail?: boolean;
  /** Custom metadata key-value pairs */
  metadata?: Record<string, string>;
}

export interface UploadResult {
  /** Generated unique file name stored in Firebase */
  fileName: string;
  /** Original file name from the user's file system */
  originalName: string;
  /** Public download URL */
  downloadURL: string;
  /** Full storage path (used for delete/metadata operations) */
  storagePath: string;
  /** File size in bytes */
  size: number;
  /** MIME content type */
  contentType: string;
  /** ISO timestamp of when the upload completed */
  uploadedAt: string;
}

export interface UploadProgress {
  /** Bytes transferred so far */
  bytesTransferred: number;
  /** Total bytes to transfer */
  totalBytes: number;
  /** Upload progress percentage (0-100) */
  percentage: number;
  /** Current upload state */
  state: 'running' | 'paused' | 'success' | 'error';
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// ============================================================
// Helpers
// ============================================================

/**
 * Generate a unique filename using timestamp and random string.
 * Preserves the original file extension.
 */
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  const extension = originalName.includes('.')
    ? originalName.substring(originalName.lastIndexOf('.'))
    : '';
  return `${timestamp}_${randomPart}${extension}`;
};

/**
 * Map Firebase upload task state to our UploadProgress state.
 */
const mapTaskState = (
  state: string
): UploadProgress['state'] => {
  switch (state) {
    case 'running':
      return 'running';
    case 'paused':
      return 'paused';
    case 'success':
      return 'success';
    case 'error':
    case 'canceled':
      return 'error';
    default:
      return 'running';
  }
};

/**
 * Build an UploadProgress object from a Firebase snapshot.
 */
const snapshotToProgress = (snapshot: UploadTaskSnapshot): UploadProgress => {
  const { bytesTransferred, totalBytes } = snapshot;
  return {
    bytesTransferred,
    totalBytes,
    percentage: totalBytes > 0 ? Math.round((bytesTransferred / totalBytes) * 100) : 0,
    state: mapTaskState(snapshot.state),
  };
};

// ============================================================
// Validation
// ============================================================

/**
 * Validate file against size and type constraints.
 * Throws an error with a descriptive message if validation fails.
 */
const validateFile = (file: File, options?: UploadOptions): void => {
  const maxSize = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File "${file.name}" exceeds maximum size of ${maxMB}MB (actual: ${fileMB}MB)`
    );
  }

  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      throw new Error(
        `File type "${file.type || 'unknown'}" is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
      );
    }
  }
};

// ============================================================
// Upload Operations
// ============================================================

/**
 * Upload a single file to Firebase Storage with progress tracking.
 *
 * @param file - The File object to upload
 * @param options - Upload configuration options
 * @param onProgress - Optional callback for upload progress updates
 * @returns Promise resolving to upload result with download URL and metadata
 *
 * @example
 * ```ts
 * const result = await uploadFile(file, {
 *   folder: 'materials',
 *   maxSizeBytes: 5 * 1024 * 1024,
 *   allowedTypes: ['application/pdf', 'image/png'],
 *   metadata: { uploadedBy: 'user@example.com' },
 * }, (progress) => {
 *   console.log(`${progress.percentage}% uploaded`);
 * });
 * ```
 */
export const uploadFile = (
  file: File,
  options?: UploadOptions,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Validate file before starting upload
      validateFile(file, options);

      const uniqueFileName = generateUniqueFileName(file.name);
      const folder = options?.folder ?? 'uploads';
      const storagePath = `${folder}/${uniqueFileName}`;
      const storageRef = ref(storage, storagePath);

      // Build custom metadata
      const customMetadata: Record<string, string> = {
        originalName: file.name,
        ...(options?.metadata ?? {}),
      };

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata,
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Report progress
          if (onProgress) {
            onProgress(snapshotToProgress(snapshot));
          }
        },
        (error) => {
          // Upload failed
          logger.error(`[storageService] Upload failed for "${file.name}":`, error);
          if (onProgress) {
            onProgress({
              bytesTransferred: 0,
              totalBytes: file.size,
              percentage: 0,
              state: 'error',
            });
          }
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            const result: UploadResult = {
              fileName: uniqueFileName,
              originalName: file.name,
              downloadURL,
              storagePath,
              size: file.size,
              contentType: file.type || 'application/octet-stream',
              uploadedAt: new Date().toISOString(),
            };

            if (onProgress) {
              onProgress({
                bytesTransferred: file.size,
                totalBytes: file.size,
                percentage: 100,
                state: 'success',
              });
            }

            logger.info(`[storageService] Upload complete: ${storagePath}`);
            resolve(result);
          } catch (error) {
            logger.error(`[storageService] Failed to get download URL for "${file.name}":`, error);
            reject(error);
          }
        }
      );
    } catch (error) {
      // Validation or setup error
      reject(error);
    }
  });
};

/**
 * Upload multiple files sequentially with per-file progress tracking.
 *
 * @param files - Array of File objects to upload
 * @param options - Upload configuration options (applied to all files)
 * @param onProgress - Optional callback receiving fileIndex and progress for each file
 * @returns Promise resolving to an array of upload results
 *
 * @example
 * ```ts
 * const results = await uploadFiles(fileList, {
 *   folder: 'materials',
 * }, (fileIndex, progress) => {
 *   console.log(`File ${fileIndex + 1}: ${progress.percentage}%`);
 * });
 * ```
 */
export const uploadFiles = async (
  files: File[],
  options?: UploadOptions,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(
      file,
      options,
      onProgress ? (progress) => onProgress(i, progress) : undefined
    );
    results.push(result);
  }

  return results;
};

// ============================================================
// Delete Operations
// ============================================================

/**
 * Delete a file from Firebase Storage.
 *
 * @param storagePath - Full storage path of the file to delete
 *
 * @example
 * ```ts
 * await deleteFile('materials/1707123456_abc123.pdf');
 * ```
 */
export const deleteFile = async (storagePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    logger.info(`[storageService] Deleted file: ${storagePath}`);
  } catch (error) {
    logger.error(`[storageService] Delete failed for "${storagePath}":`, error);
    throw error;
  }
};

// ============================================================
// Metadata Operations
// ============================================================

/**
 * Get metadata for a file stored in Firebase Storage.
 *
 * @param storagePath - Full storage path of the file
 * @returns Promise resolving to an UploadResult with metadata and download URL
 *
 * @example
 * ```ts
 * const metadata = await getFileMetadata('materials/1707123456_abc123.pdf');
 * console.log(metadata.originalName, metadata.size);
 * ```
 */
export const getFileMetadata = async (storagePath: string): Promise<UploadResult> => {
  try {
    const storageRef = ref(storage, storagePath);
    const [metadata, downloadURL] = await Promise.all([
      getMetadata(storageRef),
      getDownloadURL(storageRef),
    ]);

    return {
      fileName: metadata.name,
      originalName: metadata.customMetadata?.originalName ?? metadata.name,
      downloadURL,
      storagePath: metadata.fullPath,
      size: metadata.size,
      contentType: metadata.contentType ?? 'application/octet-stream',
      uploadedAt: metadata.timeCreated,
    };
  } catch (error) {
    logger.error(`[storageService] getFileMetadata failed for "${storagePath}":`, error);
    throw error;
  }
};

// ============================================================
// List Operations
// ============================================================

/**
 * List all files in a given storage folder.
 *
 * @param folder - Storage folder path to list, e.g., 'materials'
 * @returns Promise resolving to an array of UploadResult objects
 *
 * @example
 * ```ts
 * const files = await listFiles('materials');
 * files.forEach(f => console.log(f.originalName, f.size));
 * ```
 */
export const listFiles = async (folder: string): Promise<UploadResult[]> => {
  try {
    const folderRef = ref(storage, folder);
    const listResult = await listAll(folderRef);

    const results: UploadResult[] = await Promise.all(
      listResult.items.map(async (itemRef) => {
        const [metadata, downloadURL] = await Promise.all([
          getMetadata(itemRef),
          getDownloadURL(itemRef),
        ]);

        return {
          fileName: metadata.name,
          originalName: metadata.customMetadata?.originalName ?? metadata.name,
          downloadURL,
          storagePath: metadata.fullPath,
          size: metadata.size,
          contentType: metadata.contentType ?? 'application/octet-stream',
          uploadedAt: metadata.timeCreated,
        };
      })
    );

    logger.info(`[storageService] Listed ${results.length} files in "${folder}"`);
    return results;
  } catch (error) {
    logger.error(`[storageService] listFiles failed for "${folder}":`, error);
    throw error;
  }
};
