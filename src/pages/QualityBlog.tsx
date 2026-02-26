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
  Newspaper,
  Plus,
  Eye,
  Calendar,
  User,
  Tag,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Camera,
  Search,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  FileText,
  Languages,
} from 'lucide-react';

import { useQualityBlogStore } from '@/stores/qualityBlogStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import * as blogService from '@/services/qualityBlogService';
import { MultiImageUpload } from '@/components/common/MultiImageUpload';
import { ImageGallery } from '@/components/common/ImageGallery';
import type {
  QualityBlogPost,
  BlogCategory,
  BlogStatus,
  CreateBlogPostInput,
} from '@/types/qualityBlog';
import {
  BLOG_CATEGORY_LABELS,
  BLOG_CATEGORY_COLORS,
} from '@/types/qualityBlog';

// 카테고리 탭 값 (라벨은 i18n에서)
const CATEGORY_TAB_VALUES: (BlogCategory | 'all')[] = [
  'all', 'qa_activity', 'benchmarking', 'sop', 'quality', 'safety', 'improvement', 'report', 'general',
];

// 정렬 옵션
type SortOption = 'newest' | 'oldest' | 'mostViewed' | 'mostImages';

// AI 번역 지원 언어
const TRANSLATE_LANGS = [
  { code: 'ko', flag: '🇰🇷', label: 'KO' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'vi', flag: '🇻🇳', label: 'VI' },
];

// 폼 상태
interface BlogFormData {
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

const defaultForm: BlogFormData = {
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

export default function QualityBlog() {
  const { t } = useTranslation();
  const { language } = useUIStore();
  const { user } = useAuthStore();
  const {
    posts,
    isLoading,
    error,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
  } = useQualityBlogStore();

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
  const [formData, setFormData] = useState<BlogFormData>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  // date-fns locale 동적 전환
  const getLocale = () => {
    switch (language) {
      case 'ko': return ko;
      case 'vi': return vi;
      default: return enUS;
    }
  };

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

  const toDate = (val: Date | { toDate: () => Date }): Date => {
    if (val instanceof Date) return val;
    if (typeof val === 'object' && 'toDate' in val) return val.toDate();
    return new Date(val as unknown as string);
  };

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
    // 정렬
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

  // 새 글 작성 열기 (현재 탭의 카테고리를 기본값으로)
  const openCreateForm = () => {
    setEditingPost(null);
    setFormData({
      ...defaultForm,
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

      // 커버 이미지 업로드
      if (formData.coverImageFile) {
        setUploadProgress(t('blog.form.uploadingCover'));
        coverImage = await blogService.uploadImage(formData.coverImageFile);
      }

      // 복수 이미지 업로드
      let newImageUrls: string[] = [];
      if (formData.imageFiles.length > 0) {
        newImageUrls = await blogService.uploadImages(
          formData.imageFiles,
          (completed, total) => {
            setUploadProgress(t('blog.form.uploadingImages', { completed, total }));
          }
        );
      }

      // 기존 이미지 + 신규 이미지 합치기
      const images = [...formData.existingImages, ...newImageUrls];

      // 커버 이미지가 없고 추가 이미지가 있으면 첫 번째를 커버로 자동 설정
      if (!coverImage && images.length > 0) {
        coverImage = images[0];
      }

      const tags = formData.tags
        .split(',')
        .map((tg) => tg.trim())
        .filter(Boolean);

      // 작성자 이름
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
      setFormData(defaultForm);
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
      <div className="space-y-3">
        {/* 카테고리 탭 - 가로 스크롤 */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-max min-w-full">
            {CATEGORY_TAB_VALUES.map((tab) => {
              const count = tab === 'all'
                ? posts.length
                : posts.filter((p) => p.category === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                    activeTab === tab
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(`blog.categories.${tab}`)}
                  {tab !== 'all' && count > 0 && (
                    <span className="text-[10px] ml-0.5 opacity-60">
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 검색 + 정렬 */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('blog.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('blog.sort.newest')}</SelectItem>
              <SelectItem value="oldest">{t('blog.sort.oldest')}</SelectItem>
              <SelectItem value="mostViewed">{t('blog.sort.mostViewed')}</SelectItem>
              <SelectItem value="mostImages">{t('blog.sort.mostImages')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-12 hidden sm:table-cell">
                  {t('blog.board.no')}
                </th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-20 hidden md:table-cell">
                  {t('blog.board.category')}
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                  {t('blog.board.titleColumn')}
                </th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-24 hidden sm:table-cell">
                  {t('blog.board.author')}
                </th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-24 hidden md:table-cell">
                  {t('blog.board.date')}
                </th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-16">
                  {t('blog.board.views')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post, index) => (
                <tr
                  key={post.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => openDetail(post)}
                >
                  {/* 번호 */}
                  <td className="text-center px-3 py-2.5 text-muted-foreground hidden sm:table-cell">
                    {filteredPosts.length - index}
                  </td>
                  {/* 카테고리 */}
                  <td className="text-center px-3 py-2.5 hidden md:table-cell">
                    <Badge
                      variant="secondary"
                      className="text-[11px] font-medium text-white border-0"
                      style={{ backgroundColor: BLOG_CATEGORY_COLORS[post.category] }}
                    >
                      {t(`blog.categories.${post.category}`)}
                    </Badge>
                  </td>
                  {/* 제목 */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {/* 모바일에서 카테고리 뱃지 인라인 */}
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-medium text-white border-0 shrink-0 md:hidden"
                        style={{ backgroundColor: BLOG_CATEGORY_COLORS[post.category] }}
                      >
                        {t(`blog.categories.${post.category}`)}
                      </Badge>
                      <span className="font-medium line-clamp-1 hover:text-primary transition-colors">
                        {post.title}
                      </span>
                      {post.status === 'draft' && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {t('blog.draft')}
                        </Badge>
                      )}
                      {post.images.length > 0 && (
                        <span className="text-muted-foreground shrink-0 flex items-center gap-0.5">
                          <Camera className="h-3 w-3" />
                          <span className="text-[11px]">{post.images.length}</span>
                        </span>
                      )}
                      {post.tags.length > 0 && (
                        <span className="text-[11px] text-primary/60 hidden lg:inline">
                          #{post.tags[0]}
                          {post.tags.length > 1 && `+${post.tags.length - 1}`}
                        </span>
                      )}
                    </div>
                    {/* 모바일: 작성자 + 날짜 */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 sm:hidden">
                      <span>{post.author.name}</span>
                      <span>·</span>
                      <span>{format(toDate(post.createdAt), 'M/d', { locale: getLocale() })}</span>
                    </div>
                  </td>
                  {/* 작성자 */}
                  <td className="text-center px-3 py-2.5 hidden sm:table-cell">
                    <span className="text-sm truncate max-w-[100px] inline-block">
                      {post.author.name}
                    </span>
                  </td>
                  {/* 날짜 */}
                  <td className="text-center px-3 py-2.5 text-muted-foreground hidden md:table-cell">
                    {format(toDate(post.createdAt), 'PP', { locale: getLocale() })}
                  </td>
                  {/* 조회수 */}
                  <td className="text-center px-3 py-2.5 text-muted-foreground">
                    {post.viewCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingPost && (() => {
            // 모든 이미지 합치기 (중복 제거)
            const allImages = viewingPost.coverImage
              ? [viewingPost.coverImage, ...viewingPost.images.filter(img => img !== viewingPost.coverImage)]
              : [...viewingPost.images];
            const heroImage = allImages[0] || null;
            const restImages = allImages.slice(1);

            // 현재 UI 언어가 아닌 다른 언어 목록 (번역 버튼용)
            const otherLangs = TRANSLATE_LANGS.filter(l => l.code !== language);

            return (
              <>
                <DialogHeader className="space-y-3">
                  {/* 카테고리 + 상태 */}
                  <div className="flex items-center gap-2">
                    <Badge
                      className="text-white border-0"
                      style={{ backgroundColor: BLOG_CATEGORY_COLORS[viewingPost.category] }}
                    >
                      {t(`blog.categories.${viewingPost.category}`)}
                    </Badge>
                    {viewingPost.status === 'draft' && (
                      <Badge variant="outline">{t('blog.draft')}</Badge>
                    )}
                  </div>

                  {/* 제목 */}
                  <DialogTitle className="text-2xl leading-tight">
                    {viewingPost.title}
                  </DialogTitle>

                  {/* 메타데이터 */}
                  <DialogDescription asChild>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-3 border-b">
                      <span className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-primary/60" />
                        </div>
                        <span className="font-medium text-foreground/80">{viewingPost.author.name}</span>
                        {viewingPost.author.department && (
                          <span className="text-muted-foreground">· {viewingPost.author.department}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(toDate(viewingPost.createdAt), 'PPP', { locale: getLocale() })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {t('blog.detail.views', { count: viewingPost.viewCount })}
                      </span>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                {/* AI 번역 버튼 */}
                <div className="flex items-center gap-2 py-2 border-b">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('blog.translate.button')}:</span>
                  {otherLangs.map((lang) => (
                    <Button
                      key={lang.code}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 opacity-50 cursor-not-allowed"
                      disabled
                      title={t('blog.translate.noTranslation')}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </Button>
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {t('blog.translate.poweredBy')}
                  </span>
                </div>

                {/* 히어로 이미지 — object-contain으로 전체 표시 */}
                {heroImage && (
                  <div className="rounded-xl overflow-hidden my-4 bg-muted/50">
                    <img
                      src={heroImage}
                      alt={viewingPost.title}
                      className="w-full max-h-[500px] object-contain"
                    />
                  </div>
                )}

                {/* 나머지 이미지 그리드 */}
                {restImages.length > 0 && (
                  <div className="my-4">
                    <ImageGallery images={restImages} maxVisible={4} />
                  </div>
                )}

                {/* 요약 박스 */}
                {viewingPost.summary && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 my-4 flex gap-3">
                    <FileText className="h-5 w-5 text-primary/50 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80 italic leading-relaxed">
                      {viewingPost.summary}
                    </p>
                  </div>
                )}

                {/* 본문 */}
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap leading-relaxed my-4">
                  {viewingPost.content}
                </div>

                {/* 태그 */}
                {viewingPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {viewingPost.tags.map((tag) => (
                      <span key={tag} className="text-sm text-primary/70 bg-primary/5 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 액션 */}
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(viewingPost)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('blog.detail.delete')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditForm(viewingPost)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {t('blog.detail.edit')}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 작성/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? t('blog.form.editTitle') : t('blog.form.newTitle')}</DialogTitle>
            <DialogDescription>
              {editingPost ? t('blog.form.editDesc') : t('blog.form.newDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 제목 */}
            <div className="space-y-1.5">
              <Label>{t('blog.form.titleLabel')}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('blog.form.titlePlaceholder')}
              />
            </div>

            {/* 요약 */}
            <div className="space-y-1.5">
              <Label>{t('blog.form.summaryLabel')}</Label>
              <Input
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder={t('blog.form.summaryPlaceholder')}
              />
            </div>

            {/* 카테고리 + 상태 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('blog.form.categoryLabel')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as BlogCategory })}
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
                  onValueChange={(v) => setFormData({ ...formData, status: v as BlogStatus })}
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
                    setFormData({ ...formData, coverImageFile: file });
                  }}
                />
                {editingPost?.coverImage && !formData.coverImageFile && (
                  <span className="text-xs text-muted-foreground">{t('blog.form.keepExisting')}</span>
                )}
              </div>
            </div>

            {/* 추가 이미지 (다중 업로드) */}
            <div className="space-y-1.5">
              <Label>{t('blog.form.additionalImages')}</Label>
              <MultiImageUpload
                files={formData.imageFiles}
                onFilesChange={(files) => setFormData({ ...formData, imageFiles: files })}
                existingImages={formData.existingImages}
                onRemoveExisting={(index) => {
                  const next = formData.existingImages.filter((_, i) => i !== index);
                  setFormData({ ...formData, existingImages: next });
                }}
                disabled={isSubmitting}
              />
            </div>

            {/* 태그 */}
            <div className="space-y-1.5">
              <Label>{t('blog.form.tagsLabel')}</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder={t('blog.form.tagsPlaceholder')}
              />
            </div>

            {/* 본문 */}
            <div className="space-y-1.5">
              <Label>{t('blog.form.contentLabel')}</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              {t('blog.form.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {t('blog.form.saving')}
                </>
              ) : editingPost ? (
                t('blog.form.update')
              ) : (
                t('blog.form.submit')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
