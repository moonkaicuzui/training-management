/**
 * 시스템 피드백 페이지 — 이슈 등록 / 시스템 개선 요청
 *
 * 기능:
 * - 이슈/개선 요청 등록 폼 (제목, 카테고리, 설명, 우선순위, 스크린샷)
 * - 등록된 이슈 목록 (상태별 필터)
 * - 각 이슈에 댓글/답변 기능
 * - 이슈 상태 변경 (관리자만)
 */

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko, vi, enUS } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  MessageSquarePlus,
  Plus,
  Search,
  AlertTriangle,
  Loader2,
  Bug,
  Lightbulb,
  Sparkles,
  Palette,
  Database,
  HelpCircle,
  Send,
  Image as ImageIcon,
  Clock,
  User,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import * as feedbackService from '@/services/systemFeedbackService';
import { MultiImageUpload } from '@/components/common/MultiImageUpload';
import { ImageGallery } from '@/components/common/ImageGallery';
import type {
  SystemFeedback as SystemFeedbackType,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
  CreateFeedbackInput,
} from '@/types/systemFeedback';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from '@/types/systemFeedback';

// 카테고리 아이콘 매핑
const CATEGORY_ICONS: Record<FeedbackCategory, React.ComponentType<{ className?: string }>> = {
  BUG: Bug,
  IMPROVEMENT: Lightbulb,
  NEW_FEATURE: Sparkles,
  UI_UX: Palette,
  DATA: Database,
  OTHER: HelpCircle,
};

// 상태 필터 탭 (ALL 포함)
const STATUS_TABS: (FeedbackStatus | 'ALL')[] = ['ALL', ...FEEDBACK_STATUSES];

// 폼 상태
interface FeedbackFormData {
  title: string;
  category: FeedbackCategory;
  description: string;
  priority: FeedbackPriority;
  screenshotFiles: File[];
}

const defaultForm: FeedbackFormData = {
  title: '',
  category: 'BUG',
  description: '',
  priority: 'MEDIUM',
  screenshotFiles: [],
};

export default function SystemFeedback() {
  const { t } = useTranslation();
  const language = useUIStore((s) => s.language);
  const { user, hasPermission } = useAuthStore(
    useShallow((s) => ({ user: s.user, hasPermission: s.hasPermission }))
  );
  const isAdmin = hasPermission('canManageUsers');

  // Data state
  const [feedbackList, setFeedbackList] = useState<SystemFeedbackType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingFeedback, setViewingFeedback] = useState<SystemFeedbackType | null>(null);
  const [formData, setFormData] = useState<FeedbackFormData>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const initializedRef = useRef(false);

  // date-fns locale
  const getLocale = useCallback(() => {
    switch (language) {
      case 'ko': return ko;
      case 'vi': return vi;
      default: return enUS;
    }
  }, [language]);

  // 데이터 로드
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await feedbackService.getAllFeedback();
      setFeedbackList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  // Timestamp → Date 변환
  const toDate = (val: Date | { toDate: () => Date }): Date => {
    if (val instanceof Date) return val;
    if (typeof val === 'object' && 'toDate' in val) return val.toDate();
    return new Date(val as unknown as string);
  };

  // 필터링된 목록
  const filteredList = useMemo(() => {
    let result = feedbackList;
    if (statusFilter !== 'ALL') {
      result = result.filter((f) => f.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.submittedBy.toLowerCase().includes(q)
      );
    }
    return result;
  }, [feedbackList, statusFilter, searchQuery]);

  // 상태별 카운트
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: feedbackList.length };
    FEEDBACK_STATUSES.forEach((s) => {
      counts[s] = feedbackList.filter((f) => f.status === s).length;
    });
    return counts;
  }, [feedbackList]);

  // 폼 열기
  const openCreateForm = () => {
    setFormData(defaultForm);
    setIsFormOpen(true);
  };

  // 상세 보기
  const openDetail = (feedback: SystemFeedbackType) => {
    setViewingFeedback(feedback);
    setCommentText('');
    setIsDetailOpen(true);
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) return;
    setIsSubmitting(true);
    setUploadProgress('');

    try {
      // 스크린샷 업로드
      let screenshotUrls: string[] = [];
      if (formData.screenshotFiles.length > 0) {
        screenshotUrls = await feedbackService.uploadScreenshots(
          formData.screenshotFiles,
          (completed, total) => {
            setUploadProgress(t('systemFeedback.form.uploadingScreenshots', { completed, total }));
          }
        );
      }

      const input: CreateFeedbackInput = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        screenshots: screenshotUrls,
        submittedBy: user?.email || '',
      };

      await feedbackService.createFeedback(input);
      setIsFormOpen(false);
      setFormData(defaultForm);
      await fetchData();
    } catch {
      // error handled
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  // 상태 변경 (관리자만)
  const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      await feedbackService.updateFeedbackStatus(feedbackId, newStatus);
      await fetchData();
      // 상세 보기 갱신
      if (viewingFeedback?.id === feedbackId) {
        const updated = await feedbackService.getFeedback(feedbackId);
        if (updated) setViewingFeedback(updated);
      }
    } catch {
      // error handled
    }
  };

  // 댓글 추가
  const handleAddComment = async () => {
    if (!commentText.trim() || !viewingFeedback) return;
    setIsAddingComment(true);

    try {
      await feedbackService.addComment(viewingFeedback.id, {
        author: user?.email || '',
        text: commentText.trim(),
      });
      setCommentText('');
      // 상세 데이터 갱신
      const updated = await feedbackService.getFeedback(viewingFeedback.id);
      if (updated) setViewingFeedback(updated);
      await fetchData();
    } catch {
      // error handled
    } finally {
      setIsAddingComment(false);
    }
  };

  // 댓글 토글
  const toggleComments = (feedbackId: string) => {
    setExpandedComments((prev) => ({ ...prev, [feedbackId]: !prev[feedbackId] }));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquarePlus className="h-6 w-6" aria-hidden="true" />
            {t('systemFeedback.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('systemFeedback.description')}
          </p>
        </div>
        <Button onClick={openCreateForm} className="shrink-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          {t('systemFeedback.newFeedback')}
        </Button>
      </div>

      {/* 에러 */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 상태 필터 탭 + 검색 */}
      <div className="space-y-3">
        {/* 상태 탭 - 가로 스크롤 */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-max min-w-full" role="tablist" aria-label={t('systemFeedback.statusFilter')}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={statusFilter === tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`systemFeedback.status.${tab}`)}
                {statusCounts[tab] > 0 && (
                  <span className="text-[10px] ml-1 opacity-60">
                    ({statusCounts[tab]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t('systemFeedback.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
            aria-label={t('systemFeedback.searchPlaceholder')}
          />
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && feedbackList.length === 0 && (
        <div className="flex items-center justify-center py-20" role="status" aria-label={t('common.loading')}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && filteredList.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <MessageSquarePlus className="h-8 w-8 opacity-30" />
          </div>
          <p className="text-muted-foreground mb-2">
            {t('systemFeedback.empty')}
          </p>
          <Button variant="outline" size="sm" onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> {t('systemFeedback.newFeedback')}
          </Button>
        </div>
      )}

      {/* 이슈 목록 - 카드 레이아웃 */}
      {filteredList.length > 0 && (
        <div className="space-y-3">
          {filteredList.map((feedback) => {
            const CategoryIcon = CATEGORY_ICONS[feedback.category];
            const isExpanded = expandedComments[feedback.id];
            return (
              <Card
                key={feedback.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-4">
                  {/* 상단: 카테고리 + 제목 + 우선순위 + 상태 */}
                  <div
                    className="flex items-start gap-3"
                    onClick={() => openDetail(feedback)}
                    role="button"
                    tabIndex={0}
                    aria-label={t('systemFeedback.openDetail', { title: feedback.title })}
                    onKeyDown={(e) => { if (e.key === 'Enter') openDetail(feedback); }}
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
                        onClick={(e) => { e.stopPropagation(); toggleComments(feedback.id); }}
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
          })}
        </div>
      )}

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingFeedback && (() => {
            const CategoryIcon = CATEGORY_ICONS[viewingFeedback.category];
            return (
              <>
                <DialogHeader className="space-y-3">
                  {/* 카테고리 + 상태 + 우선순위 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">
                        {t(`systemFeedback.category.${viewingFeedback.category}`)}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-white border-0"
                      style={{ backgroundColor: STATUS_COLORS[viewingFeedback.status] }}
                    >
                      {t(`systemFeedback.status.${viewingFeedback.status}`)}
                    </Badge>
                    <Badge
                      variant="outline"
                      style={{ color: PRIORITY_COLORS[viewingFeedback.priority], borderColor: PRIORITY_COLORS[viewingFeedback.priority] }}
                    >
                      {t(`systemFeedback.priority.${viewingFeedback.priority}`)}
                    </Badge>
                  </div>

                  <DialogTitle className="text-xl leading-tight">
                    {viewingFeedback.title}
                  </DialogTitle>

                  <DialogDescription asChild>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-3 border-b">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" aria-hidden="true" />
                        {viewingFeedback.submittedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {format(toDate(viewingFeedback.createdAt), 'PPP', { locale: getLocale() })}
                      </span>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                {/* 관리자: 상태 변경 */}
                {isAdmin && (
                  <div className="flex items-center gap-2 py-2 border-b">
                    <Label className="text-sm shrink-0">{t('systemFeedback.changeStatus')}:</Label>
                    <Select
                      value={viewingFeedback.status}
                      onValueChange={(v) => handleStatusChange(viewingFeedback.id, v as FeedbackStatus)}
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
                  {viewingFeedback.description}
                </div>

                {/* 스크린샷 */}
                {viewingFeedback.screenshots.length > 0 && (
                  <div className="my-4">
                    <Label className="text-sm mb-2 block">{t('systemFeedback.screenshots')}</Label>
                    <ImageGallery images={viewingFeedback.screenshots} maxVisible={4} />
                  </div>
                )}

                {/* 댓글 섹션 */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {t('systemFeedback.comments')}
                    {viewingFeedback.comments.length > 0 && (
                      <span className="text-muted-foreground">({viewingFeedback.comments.length})</span>
                    )}
                  </h4>

                  {/* 기존 댓글 */}
                  {viewingFeedback.comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {viewingFeedback.comments.map((comment, idx) => (
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

                  {viewingFeedback.comments.length === 0 && (
                    <p className="text-sm text-muted-foreground mb-4">{t('systemFeedback.noComments')}</p>
                  )}

                  {/* 댓글 입력 */}
                  <div className="flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t('systemFeedback.commentPlaceholder')}
                      rows={2}
                      className="resize-none flex-1"
                      aria-label={t('systemFeedback.commentPlaceholder')}
                    />
                    <Button
                      size="sm"
                      className="shrink-0 self-end"
                      onClick={handleAddComment}
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

      {/* 등록 폼 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('systemFeedback.form.titlePlaceholder')}
              />
            </div>

            {/* 카테고리 + 우선순위 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('systemFeedback.form.categoryLabel')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as FeedbackCategory })}
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
                  onValueChange={(v) => setFormData({ ...formData, priority: v as FeedbackPriority })}
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                onFilesChange={(files) => setFormData({ ...formData, screenshotFiles: files })}
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
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
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
    </div>
  );
}
