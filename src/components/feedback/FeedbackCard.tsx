/**
 * FeedbackCard — 개별 피드백 카드 + 상세 보기 다이얼로그
 */

import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko, vi, enUS } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Bug,
  Lightbulb,
  Sparkles,
  Palette,
  Database,
  HelpCircle,
  Send,
  Clock,
  User,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { ImageGallery } from '@/components/common/ImageGallery';
import type {
  SystemFeedback as SystemFeedbackType,
  FeedbackCategory,
  FeedbackStatus,
} from '@/types/systemFeedback';
import {
  FEEDBACK_STATUSES,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from '@/types/systemFeedback';

// 카테고리 아이콘 매핑
export const CATEGORY_ICONS: Record<FeedbackCategory, React.ComponentType<{ className?: string }>> = {
  BUG: Bug,
  IMPROVEMENT: Lightbulb,
  NEW_FEATURE: Sparkles,
  UI_UX: Palette,
  DATA: Database,
  OTHER: HelpCircle,
};

// Timestamp → Date 변환
const toDate = (val: Date | { toDate: () => Date }): Date => {
  if (val instanceof Date) return val;
  if (typeof val === 'object' && 'toDate' in val) return val.toDate();
  return new Date(val as unknown as string);
};

// --- 카드 리스트 아이템 ---

interface FeedbackCardItemProps {
  feedback: SystemFeedbackType;
  language: string;
  onViewDetail: (feedback: SystemFeedbackType) => void;
}

export const FeedbackCardItem = memo(function FeedbackCardItem({ feedback, language, onViewDetail }: FeedbackCardItemProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const getLocale = () => {
    switch (language) {
      case 'ko': return ko;
      case 'vi': return vi;
      default: return enUS;
    }
  };

  const CategoryIcon = CATEGORY_ICONS[feedback.category];

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        {/* 상단: 카테고리 + 제목 + 우선순위 + 상태 */}
        <div
          className="flex items-start gap-3"
          onClick={() => onViewDetail(feedback)}
          role="button"
          tabIndex={0}
          aria-label={t('systemFeedback.openDetail', { title: feedback.title })}
          onKeyDown={(e) => { if (e.key === 'Enter') onViewDetail(feedback); }}
        >
          {/* 카테고리 아이콘 */}
          <div className="shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center mt-0.5">
            <CategoryIcon className="h-4.5 w-4.5 text-muted-foreground" />
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className="text-[10px] text-white border-0 shrink-0"
                style={{ backgroundColor: STATUS_COLORS[feedback.status] }}
              >
                {t(`systemFeedback.status.${feedback.status}`)}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] shrink-0"
                style={{ color: PRIORITY_COLORS[feedback.priority], borderColor: PRIORITY_COLORS[feedback.priority] }}
              >
                {t(`systemFeedback.priority.${feedback.priority}`)}
              </Badge>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {t(`systemFeedback.category.${feedback.category}`)}
              </span>
            </div>
            <h3 className="font-medium mt-1 line-clamp-1">{feedback.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {feedback.description}
            </p>
            {/* 메타: 작성자, 날짜, 댓글 수 */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" aria-hidden="true" />
                {feedback.submittedBy.split('@')[0]}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {format(toDate(feedback.createdAt), 'PP', { locale: getLocale() })}
              </span>
              {feedback.comments.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" aria-hidden="true" />
                  {feedback.comments.length}
                </span>
              )}
              {feedback.screenshots.length > 0 && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" aria-hidden="true" />
                  {feedback.screenshots.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 댓글 미리보기 */}
        {feedback.comments.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              aria-expanded={isExpanded}
              aria-label={t('systemFeedback.toggleComments')}
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {t('systemFeedback.commentsCount', { count: feedback.comments.length })}
            </button>
            {isExpanded && (
              <div className="mt-2 space-y-2">
                {feedback.comments.slice(-3).map((comment, idx) => (
                  <div key={idx} className="text-xs bg-muted/50 rounded-lg p-2">
                    <span className="font-medium">{comment.author.split('@')[0]}</span>
                    <span className="text-muted-foreground mx-1">·</span>
                    <span className="text-muted-foreground">
                      {format(toDate(comment.createdAt), 'PP', { locale: getLocale() })}
                    </span>
                    <p className="mt-1 text-foreground/80">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// --- 상세 보기 다이얼로그 ---

interface FeedbackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: SystemFeedbackType | null;
  language: string;
  isAdmin: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  isAddingComment: boolean;
  onAddComment: () => void;
  onStatusChange: (feedbackId: string, status: FeedbackStatus) => void;
}

export function FeedbackDetailDialog({
  open,
  onOpenChange,
  feedback,
  language,
  isAdmin,
  commentText,
  onCommentTextChange,
  isAddingComment,
  onAddComment,
  onStatusChange,
}: FeedbackDetailDialogProps) {
  const { t } = useTranslation();

  const getLocale = () => {
    switch (language) {
      case 'ko': return ko;
      case 'vi': return vi;
      default: return enUS;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {feedback && (() => {
          const CategoryIcon = CATEGORY_ICONS[feedback.category];
          return (
            <>
              <DialogHeader className="space-y-3">
                {/* 카테고리 + 상태 + 우선순위 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <CategoryIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">
                      {t(`systemFeedback.category.${feedback.category}`)}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-white border-0"
                    style={{ backgroundColor: STATUS_COLORS[feedback.status] }}
                  >
                    {t(`systemFeedback.status.${feedback.status}`)}
                  </Badge>
                  <Badge
                    variant="outline"
                    style={{ color: PRIORITY_COLORS[feedback.priority], borderColor: PRIORITY_COLORS[feedback.priority] }}
                  >
                    {t(`systemFeedback.priority.${feedback.priority}`)}
                  </Badge>
                </div>

                <DialogTitle className="text-xl leading-tight">
                  {feedback.title}
                </DialogTitle>

                <DialogDescription asChild>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-3 border-b">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" aria-hidden="true" />
                      {feedback.submittedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {format(toDate(feedback.createdAt), 'PPP', { locale: getLocale() })}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* 관리자: 상태 변경 */}
              {isAdmin && (
                <div className="flex items-center gap-2 py-2 border-b">
                  <Label className="text-sm shrink-0">{t('systemFeedback.changeStatus')}:</Label>
                  <Select
                    value={feedback.status}
                    onValueChange={(v) => onStatusChange(feedback.id, v as FeedbackStatus)}
                  >
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: STATUS_COLORS[s] }}
                            />
                            {t(`systemFeedback.status.${s}`)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 설명 */}
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap leading-relaxed my-4">
                {feedback.description}
              </div>

              {/* 스크린샷 */}
              {feedback.screenshots.length > 0 && (
                <div className="my-4">
                  <Label className="text-sm mb-2 block">{t('systemFeedback.screenshots')}</Label>
                  <ImageGallery images={feedback.screenshots} maxVisible={4} />
                </div>
              )}

              {/* 댓글 섹션 */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {t('systemFeedback.comments')}
                  {feedback.comments.length > 0 && (
                    <span className="text-muted-foreground">({feedback.comments.length})</span>
                  )}
                </h4>

                {/* 기존 댓글 */}
                {feedback.comments.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {feedback.comments.map((comment, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" aria-hidden="true" />
                          <span className="font-medium text-foreground">{comment.author}</span>
                          <span>·</span>
                          <span>{format(toDate(comment.createdAt), 'PPP p', { locale: getLocale() })}</span>
                        </div>
                        <p className="text-sm mt-1.5 text-foreground/80 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {feedback.comments.length === 0 && (
                  <p className="text-sm text-muted-foreground mb-4">{t('systemFeedback.noComments')}</p>
                )}

                {/* 댓글 입력 */}
                <div className="flex gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => onCommentTextChange(e.target.value)}
                    placeholder={t('systemFeedback.commentPlaceholder')}
                    rows={2}
                    className="resize-none flex-1"
                    aria-label={t('systemFeedback.commentPlaceholder')}
                  />
                  <Button
                    size="sm"
                    className="shrink-0 self-end"
                    onClick={onAddComment}
                    disabled={!commentText.trim() || isAddingComment}
                    aria-label={t('systemFeedback.addComment')}
                  >
                    {isAddingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
