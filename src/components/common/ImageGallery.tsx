/**
 * 이미지 갤러리 + 라이트박스 컴포넌트
 *
 * - 썸네일 그리드 (기본 2x2, 초과 시 "+N" 오버레이)
 * - 클릭 → 전체 화면 라이트박스 (shadcn Dialog)
 * - Prev/Next 화살표 + 키보드 (←/→/Esc)
 * - 이미지 카운터 ("3 / 7")
 */

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  maxVisible?: number;
  className?: string;
}

export function ImageGallery({ images, maxVisible = 4, className }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleImages = images.slice(0, maxVisible);
  const extraCount = images.length - maxVisible;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // 키보드 지원
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, goNext, goPrev]);

  if (images.length === 0) return null;

  return (
    <>
      {/* 썸네일 그리드 */}
      <div className={cn('grid grid-cols-2 gap-1.5 rounded-lg overflow-hidden', className)}>
        {visibleImages.map((url, i) => (
          <div
            key={i}
            className="relative aspect-square cursor-pointer overflow-hidden bg-muted"
            onClick={() => openLightbox(i)}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
            {/* "+N" 오버레이 (마지막 이미지에만) */}
            {i === maxVisible - 1 && extraCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-lg font-bold">+{extraCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 라이트박스 */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 bg-black/95 border-none [&>button]:hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* 이미지 카운터 */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/80 text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>

            {/* 이전 버튼 */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10 text-white hover:bg-white/20 h-10 w-10"
                onClick={goPrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {/* 메인 이미지 */}
            <img
              src={images[currentIndex]}
              alt=""
              className="max-w-full max-h-[75vh] object-contain select-none"
            />

            {/* 다음 버튼 */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10 text-white hover:bg-white/20 h-10 w-10"
                onClick={goNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
