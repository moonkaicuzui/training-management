/**
 * BlogPostEditor — 작성/수정 폼 다이얼로그
 */

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { MultiImageUpload } from '@/components/common/MultiImageUpload';
import type { BlogCategory, BlogStatus } from '@/types/qualityBlog';
import { BLOG_CATEGORY_LABELS, BLOG_CATEGORY_COLORS } from '@/types/qualityBlog';

// 폼 상태
export interface BlogFormData {
  title: string;
  summary: string;
  content: string;
  category: BlogCategory;
  tags: string;
  status: BlogStatus;
  coverImageFile: File | null;
  imageFiles: File[];
  existingImages: string[];
}

export const defaultBlogForm: BlogFormData = {
  title: '',
  summary: '',
  content: '',
  category: 'quality',
  tags: '',
  status: 'published',
  coverImageFile: null,
  imageFiles: [],
  existingImages: [],
};

interface BlogPostEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: BlogFormData;
  onFormDataChange: (data: BlogFormData) => void;
  isEditing: boolean;
  isSubmitting: boolean;
  uploadProgress: string;
  hasCoverImage: boolean; // editingPost?.coverImage 존재 여부
  onSubmit: () => void;
}

export function BlogPostEditor({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  isEditing,
  isSubmitting,
  uploadProgress,
  hasCoverImage,
  onSubmit,
}: BlogPostEditorProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('blog.form.editTitle') : t('blog.form.newTitle')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('blog.form.editDesc') : t('blog.form.newDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label>{t('blog.form.titleLabel')}</Label>
            <Input
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder={t('blog.form.titlePlaceholder')}
            />
          </div>

          {/* 요약 */}
          <div className="space-y-1.5">
            <Label>{t('blog.form.summaryLabel')}</Label>
            <Input
              value={formData.summary}
              onChange={(e) => onFormDataChange({ ...formData, summary: e.target.value })}
              placeholder={t('blog.form.summaryPlaceholder')}
            />
          </div>

          {/* 카테고리 + 상태 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('blog.form.categoryLabel')}</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => onFormDataChange({ ...formData, category: v as BlogCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(BLOG_CATEGORY_LABELS).map((key) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: BLOG_CATEGORY_COLORS[key as BlogCategory] }}
                        />
                        {t(`blog.categories.${key}`)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('blog.form.statusLabel')}</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => onFormDataChange({ ...formData, status: v as BlogStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">{t('blog.form.statusPublished')}</SelectItem>
                  <SelectItem value="draft">{t('blog.form.statusDraft')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 커버 이미지 */}
          <div className="space-y-1.5">
            <Label>{t('blog.form.coverImage')}</Label>
            <p className="text-xs text-muted-foreground">{t('blog.form.coverImageHint')}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                {formData.coverImageFile ? formData.coverImageFile.name : t('blog.form.selectImage')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onFormDataChange({ ...formData, coverImageFile: file });
                }}
              />
              {hasCoverImage && !formData.coverImageFile && (
                <span className="text-xs text-muted-foreground">{t('blog.form.keepExisting')}</span>
              )}
            </div>
          </div>

          {/* 추가 이미지 (다중 업로드) */}
          <div className="space-y-1.5">
            <Label>{t('blog.form.additionalImages')}</Label>
            <MultiImageUpload
              files={formData.imageFiles}
              onFilesChange={(files) => onFormDataChange({ ...formData, imageFiles: files })}
              existingImages={formData.existingImages}
              onRemoveExisting={(index) => {
                const next = formData.existingImages.filter((_, i) => i !== index);
                onFormDataChange({ ...formData, existingImages: next });
              }}
              disabled={isSubmitting}
            />
          </div>

          {/* 태그 */}
          <div className="space-y-1.5">
            <Label>{t('blog.form.tagsLabel')}</Label>
            <Input
              value={formData.tags}
              onChange={(e) => onFormDataChange({ ...formData, tags: e.target.value })}
              placeholder={t('blog.form.tagsPlaceholder')}
            />
          </div>

          {/* 본문 */}
          <div className="space-y-1.5">
            <Label>{t('blog.form.contentLabel')}</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => onFormDataChange({ ...formData, content: e.target.value })}
              placeholder={t('blog.form.contentPlaceholder')}
              rows={12}
              className="resize-y"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {uploadProgress && (
            <span className="text-xs text-muted-foreground mr-auto flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {uploadProgress}
            </span>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('blog.form.cancel')}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                {t('blog.form.saving')}
              </>
            ) : isEditing ? (
              t('blog.form.update')
            ) : (
              t('blog.form.submit')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
