/**
 * FeedbackFormDialog — 피드백 등록 폼 다이얼로그
 */

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
import { Loader2 } from 'lucide-react';
import { MultiImageUpload } from '@/components/common/MultiImageUpload';
import { CATEGORY_ICONS } from './FeedbackCard';
import type { FeedbackCategory, FeedbackPriority } from '@/types/systemFeedback';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_PRIORITIES,
  PRIORITY_COLORS,
} from '@/types/systemFeedback';

// 폼 상태
export interface FeedbackFormData {
  title: string;
  category: FeedbackCategory;
  description: string;
  priority: FeedbackPriority;
  screenshotFiles: File[];
}

export const defaultFeedbackForm: FeedbackFormData = {
  title: '',
  category: 'BUG',
  description: '',
  priority: 'MEDIUM',
  screenshotFiles: [],
};

interface FeedbackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FeedbackFormData;
  onFormDataChange: (data: FeedbackFormData) => void;
  isSubmitting: boolean;
  uploadProgress: string;
  onSubmit: () => void;
}

export function FeedbackFormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  isSubmitting,
  uploadProgress,
  onSubmit,
}: FeedbackFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('systemFeedback.form.title')}</DialogTitle>
          <DialogDescription>{t('systemFeedback.form.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label htmlFor="feedback-title">{t('systemFeedback.form.titleLabel')}</Label>
            <Input
              id="feedback-title"
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder={t('systemFeedback.form.titlePlaceholder')}
            />
          </div>

          {/* 카테고리 + 우선순위 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('systemFeedback.form.categoryLabel')}</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => onFormDataChange({ ...formData, category: v as FeedbackCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_CATEGORIES.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {t(`systemFeedback.category.${cat}`)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('systemFeedback.form.priorityLabel')}</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => onFormDataChange({ ...formData, priority: v as FeedbackPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PRIORITY_COLORS[p] }}
                        />
                        {t(`systemFeedback.priority.${p}`)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label htmlFor="feedback-description">{t('systemFeedback.form.descriptionLabel')}</Label>
            <Textarea
              id="feedback-description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder={t('systemFeedback.form.descriptionPlaceholder')}
              rows={6}
              className="resize-y"
            />
          </div>

          {/* 스크린샷 */}
          <div className="space-y-1.5">
            <Label>{t('systemFeedback.form.screenshotsLabel')}</Label>
            <p className="text-xs text-muted-foreground">{t('systemFeedback.form.screenshotsHint')}</p>
            <MultiImageUpload
              files={formData.screenshotFiles}
              onFilesChange={(files) => onFormDataChange({ ...formData, screenshotFiles: files })}
              existingImages={[]}
              onRemoveExisting={() => {}}
              disabled={isSubmitting}
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
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.title.trim() || !formData.description.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                {t('systemFeedback.form.submitting')}
              </>
            ) : (
              t('systemFeedback.form.submit')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
