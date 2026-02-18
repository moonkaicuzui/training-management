/**
 * useFileUpload Hook
 *
 * React hook for uploading files to Firebase Storage with
 * progress tracking, error handling, and state management.
 */

import { useState, useCallback, useRef } from 'react';
import {
  uploadFile,
  uploadFiles,
} from '@/services/storageService';
import type {
  UploadOptions,
  UploadResult,
  UploadProgress,
} from '@/services/storageService';

export interface UseFileUploadReturn {
  /** Upload a single file */
  upload: (file: File) => Promise<UploadResult>;
  /** Upload multiple files sequentially */
  uploadMultiple: (files: File[]) => Promise<UploadResult[]>;
  /** Current upload progress (for the active file) */
  progress: UploadProgress | null;
  /** True while any upload operation is in progress */
  isUploading: boolean;
  /** Error from the most recent upload attempt, if any */
  error: Error | null;
  /** Result of the most recent single-file upload */
  result: UploadResult | null;
  /** Results of the most recent multi-file upload */
  results: UploadResult[];
  /** Reset the hook state (error, result, progress) */
  reset: () => void;
}

/**
 * Hook for uploading files to Firebase Storage.
 *
 * @param options - Default upload options applied to all uploads
 * @returns Object with upload functions, progress state, and results
 *
 * @example
 * ```tsx
 * function FileUploader() {
 *   const { upload, progress, isUploading, error, result } = useFileUpload({
 *     folder: 'materials',
 *     maxSizeBytes: 5 * 1024 * 1024,
 *     allowedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
 *   });
 *
 *   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (!file) return;
 *
 *     try {
 *       const uploaded = await upload(file);
 *       console.log('Uploaded:', uploaded.downloadURL);
 *     } catch (err) {
 *       console.error('Upload failed:', err);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={handleFileChange} disabled={isUploading} />
 *       {isUploading && progress && <p>Uploading: {progress.percentage}%</p>}
 *       {error && <p>Error: {error.message}</p>}
 *       {result && <p>Uploaded: {result.originalName}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFileUpload(options?: UploadOptions): UseFileUploadReturn {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);

  // Use ref to keep the latest options without causing re-renders
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const reset = useCallback(() => {
    setProgress(null);
    setError(null);
    setResult(null);
    setResults([]);
  }, []);

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const uploadResult = await uploadFile(
        file,
        optionsRef.current,
        (p) => setProgress(p)
      );
      setResult(uploadResult);
      return uploadResult;
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error(String(err));
      setError(uploadError);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    setIsUploading(true);
    setError(null);
    setResults([]);
    setProgress(null);

    try {
      const uploadResults = await uploadFiles(
        files,
        optionsRef.current,
        (_fileIndex, p) => setProgress(p)
      );
      setResults(uploadResults);
      return uploadResults;
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error(String(err));
      setError(uploadError);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    upload,
    uploadMultiple,
    progress,
    isUploading,
    error,
    result,
    results,
    reset,
  };
}
