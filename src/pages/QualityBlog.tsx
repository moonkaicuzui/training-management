/**
 * 품질 블로그 페이지
 *
 * 게시판형 블로그 CRUD — 게시판 목록 + 상세 보기 + 작성/수정 다이얼로그
 * QA 활동 게시판 확장: 복수 이미지 첨부 + 이미지 압축
 * v3.0: 게시판(테이블) 레이아웃, i18n 완전 적용, 이미지 레이아웃 개선, AI 번역 placeholder
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, Plus, AlertTriangle, Loader2 } from 'lucide-react';

import { useShallow } from 'zustand/react/shallow';
import { useQualityBlogStore } from '@/stores/qualityBlogStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import * as blogService from '@/services/qualityBlogService';
import type { QualityBlogPost, BlogCategory, CreateBlogPostInput } from '@/types/qualityBlog';
import { BLOG_CATEGORY_LABELS } from '@/types/qualityBlog';

import { BlogToolbar, type SortOption } from '@/components/quality-blog/BlogToolbar';
import { BlogPostTable, BlogDetailDialog } from '@/components/quality-blog/BlogPostCard';
import { BlogPostEditor, defaultBlogForm, type BlogFormData } from '@/components/quality-blog/BlogPostEditor';

// Timestamp → Date 변환
const toDate = (val: Date | { toDate: () => Date }): Date => {
  if (val instanceof Date) return val;
  if (typeof val === 'object' && 'toDate' in val) return val.toDate();
  return new Date(val as unknown as string);
};

export default function QualityBlog() {
  const { t } = useTranslation();
  const language = useUIStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const {
    posts,
    isLoading,
    error,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
  } = useQualityBlogStore(useShallow((state) => ({ posts: state.posts, isLoading: state.isLoading, error: state.error, fetchPosts: state.fetchPosts, createPost: state.createPost, updatePost: state.updatePost, deletePost: state.deletePost })));

  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') as BlogCategory | null;

  const [activeTab, setActiveTab] = useState<BlogCategory | 'all'>(
    initialCategory && Object.keys(BLOG_CATEGORY_LABELS).includes(initialCategory)
      ? initialCategory
      : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<QualityBlogPost | null>(null);
  const [viewingPost, setViewingPost] = useState<QualityBlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(defaultBlogForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchPosts();
    }
  }, [fetchPosts]);

  // URL 쿼리 파라미터 변경 시 탭 자동 선택
  useEffect(() => {
    if (initialCategory && Object.keys(BLOG_CATEGORY_LABELS).includes(initialCategory)) {
      setActiveTab(initialCategory);
    }
  }, [initialCategory]);

  // 필터 + 정렬된 포스트
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeTab !== 'all') {
      result = result.filter((p) => p.category === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    const sorted = [...result];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime());
        break;
      case 'mostViewed':
        sorted.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'mostImages':
        sorted.sort((a, b) => b.images.length - a.images.length);
        break;
    }
    return sorted;
  }, [posts, activeTab, searchQuery, sortBy]);

  // 새 글 작성 열기
  const openCreateForm = () => {
    setEditingPost(null);
    setFormData({
      ...defaultBlogForm,
      category: activeTab !== 'all' ? activeTab : 'quality',
    });
    setIsFormOpen(true);
  };

  // 수정 열기
  const openEditForm = (post: QualityBlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      summary: post.summary,
      content: post.content,
      category: post.category,
      tags: post.tags.join(', '),
      status: post.status,
      coverImageFile: null,
      imageFiles: [],
      existingImages: [...post.images],
    });
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  // 상세 보기
  const openDetail = (post: QualityBlogPost) => {
    setViewingPost(post);
    setIsDetailOpen(true);
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    setIsSubmitting(true);
    setUploadProgress('');

    try {
      let coverImage = editingPost?.coverImage;

      if (formData.coverImageFile) {
        setUploadProgress(t('blog.form.uploadingCover'));
        coverImage = await blogService.uploadImage(formData.coverImageFile);
      }

      let newImageUrls: string[] = [];
      if (formData.imageFiles.length > 0) {
        newImageUrls = await blogService.uploadImages(
          formData.imageFiles,
          (completed, total) => {
            setUploadProgress(t('blog.form.uploadingImages', { completed, total }));
          }
        );
      }

      const images = [...formData.existingImages, ...newImageUrls];
      if (!coverImage && images.length > 0) {
        coverImage = images[0];
      }

      const tags = formData.tags
        .split(',')
        .map((tg) => tg.trim())
        .filter(Boolean);

      const authorName = user?.name || (user?.email ? user.email.split('@')[0].toUpperCase() : t('blog.anonymous'));

      if (editingPost) {
        await updatePost(editingPost.id, {
          title: formData.title,
          summary: formData.summary,
          content: formData.content,
          category: formData.category,
          tags,
          status: formData.status,
          coverImage,
          images,
        });
      } else {
        const input: CreateBlogPostInput = {
          title: formData.title,
          content: formData.content,
          summary: formData.summary,
          coverImage,
          images,
          author: {
            id: user?.id || '',
            name: authorName,
            department: user?.department,
          },
          tags,
          category: formData.category,
          status: formData.status,
        };
        await createPost(input);
      }

      setIsFormOpen(false);
      setFormData(defaultBlogForm);
      setEditingPost(null);
    } catch {
      // handled by store
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  // 삭제
  const handleDelete = async (post: QualityBlogPost) => {
    if (!confirm(t('blog.deleteConfirm', { title: post.title }))) return;
    await deletePost(post.id);
    setIsDetailOpen(false);
    setViewingPost(null);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            {t('blog.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('blog.description')}
          </p>
        </div>
        <Button onClick={openCreateForm} className="shrink-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {t('blog.newPost')}
        </Button>
      </div>

      {/* 에러 */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 카테고리 탭 + 검색 + 정렬 */}
      <BlogToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        posts={posts}
      />

      {/* 로딩 */}
      {isLoading && posts.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && filteredPosts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Newspaper className="h-8 w-8 opacity-30" />
          </div>
          <p className="text-muted-foreground mb-2">
            {activeTab === 'all'
              ? t('blog.empty.noPostsAll')
              : t('blog.empty.noPostsCategory', { category: t(`blog.categories.${activeTab}`) })}
          </p>
          <Button variant="outline" size="sm" onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-1" /> {t('blog.empty.writeFirst')}
          </Button>
        </div>
      )}

      {/* 게시판 테이블 */}
      {filteredPosts.length > 0 && (
        <BlogPostTable
          posts={filteredPosts}
          language={language}
          onViewDetail={openDetail}
        />
      )}

      {/* 상세 보기 다이얼로그 */}
      <BlogDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        post={viewingPost}
        language={language}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />

      {/* 작성/수정 다이얼로그 */}
      <BlogPostEditor
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        formData={formData}
        onFormDataChange={setFormData}
        isEditing={!!editingPost}
        isSubmitting={isSubmitting}
        uploadProgress={uploadProgress}
        hasCoverImage={!!editingPost?.coverImage}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
