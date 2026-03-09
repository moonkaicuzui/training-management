/**
 * 다중 이미지 업로드 컴포넌트
 *
 * - 클릭/드래그로 이미지 선택
 * - 썸네일 미리보기 그리드
 * - 이미지별 삭제 (신규 + 기존 URL)
 * - 최대 10장 제한
 * - 압축 상태 표시
 */

import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { compressImages, formatFileSize } from '@/utils/imageCompression';
import type { CompressionResult } from '@/utils/imageCompression';

interface MultiImageUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingImages?: string[];
  onRemoveExisting?: (index: number) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function MultiImageUpload({
  files,
  onFilesChange,
  existingImages = [],
  onRemoveExisting,
  maxFiles = 10,
  disabled = false,
}: MultiImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult[] | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const totalCount = existingImages.length + files.length;
  const remainingSlots = maxFiles - totalCount;

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const imageFiles = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
      const slotAvailable = maxFiles - existingImages.length - files.length;
      const filesToAdd = imageFiles.slice(0, slotAvailable);

      if (filesToAdd.length === 0) return;

      setIsCompressing(true);
      try {
        const results = await compressImages(filesToAdd);
        setCompressionInfo((prev) => [...(prev || []), ...results]);
        const compressed = results.map((r) => r.compressedFile);
        onFilesChange([...files, ...compressed]);
      } finally {
        setIsCompressing(false);
      }
    },
    [files, existingImages.length, maxFiles, onFilesChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onFilesChange(next);
    if (compressionInfo) {
      setCompressionInfo(compressionInfo.filter((_, i) => i !== index));
    }
  };

  // 압축 통계 요약
  const totalOriginal = compressionInfo?.reduce((s, r) => s + r.originalSize, 0) || 0;
  const totalCompressed = compressionInfo?.reduce((s, r) => s + r.compressedSize, 0) || 0;
  const totalSavings = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* 드래그 & 드롭 영역 */}
      {remainingSlots > 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isCompressing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('common.imageCompressing')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('common.imageUploadHint')}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {t('common.imageUploadLimit', { max: maxFiles, remaining: remainingSlots })}
              </p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
            disabled={disabled}
          />
        </div>
      )}

      {/* 압축 통계 */}
      {compressionInfo && compressionInfo.length > 0 && totalSavings > 0 && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          {formatFileSize(totalOriginal)} → {formatFileSize(totalCompressed)}, {totalSavings}% 절약
        </p>
      )}

      {/* 썸네일 그리드 */}
      {(existingImages.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-5 gap-2">
          {/* 기존 이미지 (URL) */}
          {existingImages.map((url, i) => (
            <div key={`existing-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {onRemoveExisting && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onRemoveExisting(i); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {/* 신규 파일 */}
          {files.map((file, i) => (
            <div key={`new-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-full object-cover"
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
