/**
 * 이미지 압축 유틸리티
 *
 * browser-image-compression 래퍼로 Firebase Storage 비용 최소화를 위해
 * 업로드 전 이미지를 자동 압축합니다.
 */

import imageCompression, { type Options } from 'browser-image-compression';

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}

const DEFAULT_OPTIONS: Options = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.75,
};

/** 단일 이미지 압축. 실패 시 원본 반환 (graceful fallback) */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  try {
    const compressedFile = await imageCompression(file, DEFAULT_OPTIONS);
    const compressedSize = compressedFile.size;

    return {
      compressedFile: new File([compressedFile], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
      }),
      originalSize,
      compressedSize,
      savingsPercent: Math.round((1 - compressedSize / originalSize) * 100),
    };
  } catch {
    // 압축 실패 시 원본 반환
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      savingsPercent: 0,
    };
  }
}

/** 복수 이미지 압축. onProgress 콜백으로 진행 상태 전달 */
export async function compressImages(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i]);
    results.push(result);
    onProgress?.(i + 1, files.length);
  }

  return results;
}

/** 바이트를 사람이 읽기 좋은 형태로 변환 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
