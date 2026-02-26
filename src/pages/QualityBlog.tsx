/**
 * 품질 블로그 페이지
 *
 * 보고서형 블로그 CRUD — 카드 그리드 + 상세 보기 + 작성/수정 다이얼로그
 * QA 활동 게시판 확장: 복수 이미지 첨부 + 이미지 압축
 * v2.0: 카드 디자인 개선, 상세뷰 리디자인, 검색/필터 강화
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
} from 'lucide-react';

import { useQualityBlogStore } from '@/stores/qualityBlogStore';
import { useAuthStore } from '@/stores/authStore';
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

// 카테고리 탭
const CATEGORY_TABS: { value: BlogCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'qa_activity', label: 'QA 활동' },
  { value: 'benchmarking', label: '벤치마킹' },
  { value: 'sop', label: 'SOP' },
  { value: 'quality', label: '품질' },
  { value: 'safety', label: '안전' },
  { value: 'improvement', label: '개선' },
  { value: 'report', label: '보고서' },
  { value: 'general', label: '일반' },
];

// 카테고리별 기본 그라데이션 배경 (이미지 없는 카드용)
const CATEGORY_GRADIENTS: Record<BlogCategory, string> = {
  qa_activity: 'from-amber-400 to-orange-500',
  benchmarking: 'from-cyan-400 to-blue-500',
  sop: 'from-pink-400 to-rose-500',
  quality: 'from-blue-400 to-indigo-500',
  safety: 'from-red-400 to-rose-500',
  improvement: 'from-emerald-400 to-green-500',
  report: 'from-purple-400 to-violet-500',
  general: 'from-gray-400 to-slate-500',
};

// 카테고리별 아이콘 (이미지 없는 카드용)
const CATEGORY_ICONS: Record<BlogCategory, string> = {
  qa_activity: '\uD83D\uDD0D',
  benchmarking: '\uD83D\uDCCA',
  sop: '\uD83D\uDCCB',
  quality: '\u2705',
  safety: '\uD83D\uDEE1\uFE0F',
  improvement: '\uD83D\uDCC8',
  report: '\uD83D\uDCDD',
  general: '\uD83D\uDCCC',
};

// 정렬 옵션
type SortOption = 'newest' | 'oldest' | 'mostViewed' | 'mostImages';

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
        setUploadProgress('커버 이미지 업로드 중...');
        coverImage = await blogService.uploadImage(formData.coverImageFile);
      }

      // 복수 이미지 업로드
      let newImageUrls: string[] = [];
      if (formData.imageFiles.length > 0) {
        newImageUrls = await blogService.uploadImages(
          formData.imageFiles,
          (completed, total) => {
            setUploadProgress(`이미지 업로드 중... (${completed}/${total})`);
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
        .map((t) => t.trim())
        .filter(Boolean);

      // 작성자 이름: displayName 우선, 없으면 이메일에서 추출
      const authorName = user?.name || (user?.email ? user.email.split('@')[0].toUpperCase() : '익명');

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
    if (!confirm(`"${post.title}" 글을 삭제하시겠습니까?`)) return;
    await deletePost(post.id);
    setIsDetailOpen(false);
    setViewingPost(null);
  };

  // 카드 이미지 결정: coverImage → images[0] → null
  const getCardImage = (post: QualityBlogPost): string | null => {
    return post.coverImage || (post.images.length > 0 ? post.images[0] : null);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            품질 블로그
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            품질 관련 보고서, 개선 사례, 안전 소식을 공유합니다
          </p>
        </div>
        <Button onClick={openCreateForm} className="shrink-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          새 글 작성
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
            {CATEGORY_TABS.map((tab) => {
              const count = tab.value === 'all'
                ? posts.length
                : posts.filter((p) => p.category === tab.value).length;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                    activeTab === tab.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.value !== 'all' && count > 0 && (
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
              placeholder="검색..."
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
              <SelectItem value="newest">최신순</SelectItem>
              <SelectItem value="oldest">오래된순</SelectItem>
              <SelectItem value="mostViewed">조회 많은순</SelectItem>
              <SelectItem value="mostImages">사진 많은순</SelectItem>
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
              ? '게시글이 없습니다'
              : `${CATEGORY_TABS.find((t) => t.value === activeTab)?.label} 카테고리에 게시글이 없습니다`}
          </p>
          <Button variant="outline" size="sm" onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-1" /> 첫 번째 글 작성하기
          </Button>
        </div>
      )}

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPosts.map((post) => {
          const cardImage = getCardImage(post);
          return (
            <Card
              key={post.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group border-0 shadow-sm"
              onClick={() => openDetail(post)}
            >
              {/* 이미지 영역 - 항상 표시 */}
              <div className="h-48 overflow-hidden relative">
                {cardImage ? (
                  <img
                    src={cardImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[post.category]} flex items-center justify-center`}>
                    <span className="text-5xl opacity-40">{CATEGORY_ICONS[post.category]}</span>
                  </div>
                )}
                {/* 카테고리 뱃지 (이미지 위 오버레이) */}
                <div className="absolute top-3 left-3">
                  <Badge
                    className="text-white text-[11px] font-medium shadow-md border-0"
                    style={{ backgroundColor: BLOG_CATEGORY_COLORS[post.category] }}
                  >
                    {BLOG_CATEGORY_LABELS[post.category]}
                  </Badge>
                </div>
                {/* 초안 뱃지 */}
                {post.status === 'draft' && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="text-[11px] bg-black/50 text-white border-0">
                      초안
                    </Badge>
                  </div>
                )}
                {/* 사진 수 뱃지 */}
                {post.images.length > 0 && (
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    {post.images.length}
                  </div>
                )}
                {/* 하단 그라데이션 오버레이 */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              <CardContent className="pt-4 pb-3">
                {/* 제목 */}
                <h3 className="font-semibold text-base line-clamp-2 mb-1.5 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h3>

                {/* 요약 */}
                {post.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {post.summary}
                  </p>
                )}

                {/* 태그 */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[11px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="text-[11px] text-muted-foreground">+{post.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* 메타 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2.5 border-t">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary/60" />
                    </div>
                    <span className="font-medium truncate max-w-[120px]">{post.author.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(toDate(post.createdAt), 'M/d', { locale: ko })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.viewCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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

            return (
              <>
                <DialogHeader className="space-y-3">
                  {/* 카테고리 + 상태 */}
                  <div className="flex items-center gap-2">
                    <Badge
                      className="text-white border-0"
                      style={{ backgroundColor: BLOG_CATEGORY_COLORS[viewingPost.category] }}
                    >
                      {BLOG_CATEGORY_LABELS[viewingPost.category]}
                    </Badge>
                    {viewingPost.status === 'draft' && (
                      <Badge variant="outline">초안</Badge>
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
                        {format(toDate(viewingPost.createdAt), 'yyyy년 M월 d일', { locale: ko })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {viewingPost.viewCount}회
                      </span>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                {/* 히어로 이미지 */}
                {heroImage && (
                  <div className="rounded-xl overflow-hidden my-4">
                    <img
                      src={heroImage}
                      alt={viewingPost.title}
                      className="w-full max-h-96 object-cover"
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
                    삭제
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditForm(viewingPost)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    수정
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
            <DialogTitle>{editingPost ? '글 수정' : '새 글 작성'}</DialogTitle>
            <DialogDescription>
              {editingPost ? '게시글을 수정합니다' : '품질 관련 게시글을 작성합니다'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 제목 */}
            <div className="space-y-1.5">
              <Label>제목 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="게시글 제목"
              />
            </div>

            {/* 요약 */}
            <div className="space-y-1.5">
              <Label>요약</Label>
              <Input
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="카드에 표시될 요약 (2줄 이내)"
              />
            </div>

            {/* 카테고리 + 상태 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as BlogCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BLOG_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: BLOG_CATEGORY_COLORS[key as BlogCategory] }}
                          />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as BlogStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">게시</SelectItem>
                    <SelectItem value="draft">초안</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 커버 이미지 */}
            <div className="space-y-1.5">
              <Label>커버 이미지</Label>
              <p className="text-xs text-muted-foreground">미선택 시 추가 이미지의 첫 번째가 자동으로 커버가 됩니다</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {formData.coverImageFile ? formData.coverImageFile.name : '이미지 선택'}
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
                  <span className="text-xs text-muted-foreground">기존 이미지 유지</span>
                )}
              </div>
            </div>

            {/* 추가 이미지 (다중 업로드) */}
            <div className="space-y-1.5">
              <Label>추가 이미지</Label>
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
              <Label>태그 (쉼표로 구분)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="품질, AQL, 개선사례"
              />
            </div>

            {/* 본문 */}
            <div className="space-y-1.5">
              <Label>본문 *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="게시글 내용을 작성하세요..."
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
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  저장 중...
                </>
              ) : editingPost ? (
                '수정'
              ) : (
                '게시'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
