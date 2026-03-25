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

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Plus, AlertTriangle, Loader2 } from 'lucide-react';

import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useToast } from '@/hooks/use-toast';
import {
  getAllFeedback,
  getFeedback,
  createFeedback,
  updateFeedbackStatus,
  addFeedbackComment,
  uploadFeedbackScreenshots,
} from '@/services/api';
import type {
  SystemFeedback as SystemFeedbackType,
  FeedbackStatus,
  CreateFeedbackInput,
} from '@/types/systemFeedback';
import { FEEDBACK_STATUSES } from '@/types/systemFeedback';

import { FeedbackToolbar } from '@/components/feedback/FeedbackToolbar';
import { FeedbackCardItem, FeedbackDetailDialog } from '@/components/feedback/FeedbackCard';
import { FeedbackFormDialog, defaultFeedbackForm, type FeedbackFormData } from '@/components/feedback/FeedbackFormDialog';

export default function SystemFeedback() {
  const { t } = useTranslation();
  const { toast } = useToast();
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
  const [formData, setFormData] = useState<FeedbackFormData>(defaultFeedbackForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const initializedRef = useRef(false);

  // 데이터 로드
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllFeedback();
      setFeedbackList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errors.loadFailed'));
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
    setFormData(defaultFeedbackForm);
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
      let screenshotUrls: string[] = [];
      if (formData.screenshotFiles.length > 0) {
        try {
          screenshotUrls = await uploadFeedbackScreenshots(
            formData.screenshotFiles,
            (completed, total) => {
              setUploadProgress(t('systemFeedback.form.uploadingScreenshots', { completed, total }));
            }
          );
        } catch {
          toast({
            title: t('systemFeedback.form.uploadFailed'),
            description: t('systemFeedback.form.uploadFailedDesc'),
            variant: 'destructive',
          });
          return;
        }
      }

      const input: CreateFeedbackInput = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        screenshots: screenshotUrls,
        submittedBy: user?.email || '',
      };

      await createFeedback(input);
      setIsFormOpen(false);
      setFormData(defaultFeedbackForm);
      await fetchData();
    } catch {
      toast({
        title: t('systemFeedback.form.submitFailed'),
        description: t('systemFeedback.form.submitFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  // 상태 변경 (관리자만)
  const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      await updateFeedbackStatus(feedbackId, newStatus);
      await fetchData();
      if (viewingFeedback?.id === feedbackId) {
        const updated = await getFeedback(feedbackId);
        if (updated) setViewingFeedback(updated);
      }
    } catch {
      toast({
        title: t('systemFeedback.statusChangeFailed', 'Failed to change status'),
        variant: 'destructive',
      });
    }
  };

  // 댓글 추가
  const handleAddComment = async () => {
    if (!commentText.trim() || !viewingFeedback) return;
    setIsAddingComment(true);

    try {
      await addFeedbackComment(viewingFeedback.id, {
        author: user?.email || '',
        text: commentText.trim(),
      });
      setCommentText('');
      const updated = await getFeedback(viewingFeedback.id);
      if (updated) setViewingFeedback(updated);
      await fetchData();
    } catch {
      toast({
        title: t('systemFeedback.commentFailed', 'Failed to add comment'),
        variant: 'destructive',
      });
    } finally {
      setIsAddingComment(false);
    }
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
      <FeedbackToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusCounts={statusCounts}
      />

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
          {filteredList.map((feedback) => (
            <FeedbackCardItem
              key={feedback.id}
              feedback={feedback}
              language={language}
              onViewDetail={openDetail}
            />
          ))}
        </div>
      )}

      {/* 상세 보기 다이얼로그 */}
      <FeedbackDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        feedback={viewingFeedback}
        language={language}
        isAdmin={isAdmin}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        isAddingComment={isAddingComment}
        onAddComment={handleAddComment}
        onStatusChange={handleStatusChange}
      />

      {/* 등록 폼 다이얼로그 */}
      <FeedbackFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        formData={formData}
        onFormDataChange={setFormData}
        isSubmitting={isSubmitting}
        uploadProgress={uploadProgress}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
