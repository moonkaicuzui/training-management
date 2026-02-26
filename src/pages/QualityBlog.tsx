/**
 * 품질 블로그 페이지
 *
 * 보고서형 블로그 CRUD — 카드 그리드 + 상세 보기 + 작성/수정 다이얼로그
 * QA 활동 게시판 확장: 복수 이미지 첨부 + 이미지 압축
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

  // 필터된 포스트
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
    return result;
  }, [posts, activeTab, searchQuery]);

  // 새 글 작성 열기
  const openCreateForm = () => {
    setEditingPost(null);
    setFormData(defaultForm);
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

      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

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
            name: user?.name || user?.email || '익명',
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

  const toDate = (val: Date | { toDate: () => Date }): Date => {
    if (val instanceof Date) return val;
    if (typeof val === 'object' && 'toDate' in val) return val.toDate();
    return new Date(val as unknown as string);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            품질 블로그
          </h1>
          <p className="text-muted-foreground mt-1">
            품질 관련 보고서, 개선 사례, 안전 소식을 공유합니다
          </p>
        </div>
        <Button onClick={openCreateForm}>
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

      {/* 카테고리 탭 + 검색 */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-0.5 flex-wrap">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && posts.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* 카드 그리드 */}
      {!isLoading && filteredPosts.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>게시글이 없습니다</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPosts.map((post) => (
          <Card
            key={post.id}
            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden group"
            onClick={() => openDetail(post)}
          >
            {/* 커버 이미지 */}
            {post.coverImage && (
              <div className="h-40 overflow-hidden relative">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* 이미지 개수 배지 */}
                {post.images.length > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    {post.images.length}
                  </div>
                )}
              </div>
            )}
            <CardContent className={post.coverImage ? 'pt-3' : 'pt-5'}>
              {/* 카테고리 + 상태 */}
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: BLOG_CATEGORY_COLORS[post.category] + '20',
                    color: BLOG_CATEGORY_COLORS[post.category],
                  }}
                >
                  {BLOG_CATEGORY_LABELS[post.category]}
                </Badge>
                {post.status === 'draft' && (
                  <Badge variant="outline" className="text-xs">초안</Badge>
                )}
                {/* 이미지 개수 (커버 이미지 없는 경우) */}
                {!post.coverImage && post.images.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Camera className="h-3 w-3" />
                    {post.images.length}
                  </span>
                )}
              </div>

              {/* 제목 */}
              <h3 className="font-semibold text-base line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
                {post.title}
              </h3>

              {/* 요약 */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {post.summary}
              </p>

              {/* 태그 */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{post.tags.length - 3}</span>
                  )}
                </div>
              )}

              {/* 메타 */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {post.author.name}
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(toDate(post.createdAt), 'M/d', { locale: ko })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {viewingPost && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    style={{
                      backgroundColor: BLOG_CATEGORY_COLORS[viewingPost.category] + '20',
                      color: BLOG_CATEGORY_COLORS[viewingPost.category],
                    }}
                  >
                    {BLOG_CATEGORY_LABELS[viewingPost.category]}
                  </Badge>
                  {viewingPost.status === 'draft' && (
                    <Badge variant="outline">초안</Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl">{viewingPost.title}</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {viewingPost.author.name}
                      {viewingPost.author.department && ` (${viewingPost.author.department})`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(toDate(viewingPost.createdAt), 'yyyy년 M월 d일', { locale: ko })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {viewingPost.viewCount}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* 커버 이미지 */}
              {viewingPost.coverImage && (
                <div className="rounded-lg overflow-hidden my-4">
                  <img
                    src={viewingPost.coverImage}
                    alt={viewingPost.title}
                    className="w-full max-h-80 object-cover"
                  />
                </div>
              )}

              {/* 이미지 갤러리 */}
              {viewingPost.images.length > 0 && (
                <div className="my-4">
                  <ImageGallery images={viewingPost.images} />
                </div>
              )}

              {/* 요약 */}
              {viewingPost.summary && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm italic text-muted-foreground mb-4">
                  {viewingPost.summary}
                </div>
              )}

              {/* 본문 */}
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {viewingPost.content}
              </div>

              {/* 태그 */}
              {viewingPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {viewingPost.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
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
          )}
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
