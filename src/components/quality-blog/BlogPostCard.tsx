/**
 * BlogPostCard — 게시판 테이블 행 + 상세 보기 다이얼로그
 */

import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko, vi, enUS } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Eye,
  Calendar,
  User,
  Tag,
  Trash2,
  Edit3,
  Camera,
  FileText,
  Languages,
} from 'lucide-react';
import { ImageGallery } from '@/components/common/ImageGallery';
import type { QualityBlogPost } from '@/types/qualityBlog';
import { BLOG_CATEGORY_COLORS } from '@/types/qualityBlog';

// AI 번역 지원 언어
const TRANSLATE_LANGS = [
  { code: 'ko', flag: '🇰🇷', label: 'KO' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'vi', flag: '🇻🇳', label: 'VI' },
];

// Timestamp → Date 변환
const toDate = (val: Date | { toDate: () => Date }): Date => {
  if (val instanceof Date) return val;
  if (typeof val === 'object' && 'toDate' in val) return val.toDate();
  return new Date(val as unknown as string);
};

interface BlogPostTableProps {
  posts: QualityBlogPost[];
  language: string;
  onViewDetail: (post: QualityBlogPost) => void;
}

export function BlogPostTable({ posts, language, onViewDetail }: BlogPostTableProps) {
  const { t } = useTranslation();

  const getLocale = () => {
    switch (language) {
      case 'ko': return ko;
      case 'vi': return vi;
      default: return enUS;
    }
  };

  return (
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
          {posts.map((post, index) => (
            <tr
              key={post.id}
              className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => onViewDetail(post)}
            >
              {/* 번호 */}
              <td className="text-center px-3 py-2.5 text-muted-foreground hidden sm:table-cell">
                {posts.length - index}
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
  );
}

// 상세 보기 다이얼로그
interface BlogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: QualityBlogPost | null;
  language: string;
  onEdit: (post: QualityBlogPost) => void;
  onDelete: (post: QualityBlogPost) => void;
}

export function BlogDetailDialog({
  open,
  onOpenChange,
  post,
  language,
  onEdit,
  onDelete,
}: BlogDetailDialogProps) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {post && (() => {
          // 모든 이미지 합치기 (중복 제거)
          const allImages = post.coverImage
            ? [post.coverImage, ...post.images.filter(img => img !== post.coverImage)]
            : [...post.images];
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
                    style={{ backgroundColor: BLOG_CATEGORY_COLORS[post.category] }}
                  >
                    {t(`blog.categories.${post.category}`)}
                  </Badge>
                  {post.status === 'draft' && (
                    <Badge variant="outline">{t('blog.draft')}</Badge>
                  )}
                </div>

                {/* 제목 */}
                <DialogTitle className="text-2xl leading-tight">
                  {post.title}
                </DialogTitle>

                {/* 메타데이터 */}
                <DialogDescription asChild>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-3 border-b">
                    <span className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-primary/60" />
                      </div>
                      <span className="font-medium text-foreground/80">{post.author.name}</span>
                      {post.author.department && (
                        <span className="text-muted-foreground">· {post.author.department}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(toDate(post.createdAt), 'PPP', { locale: getLocale() })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {t('blog.detail.views', { count: post.viewCount })}
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

              {/* 히어로 이미지 */}
              {heroImage && (
                <div className="rounded-xl overflow-hidden my-4 bg-muted/50">
                  <img
                    src={heroImage}
                    alt={post.title}
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
              {post.summary && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 my-4 flex gap-3">
                  <FileText className="h-5 w-5 text-primary/50 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80 italic leading-relaxed">
                    {post.summary}
                  </p>
                </div>
              )}

              {/* 본문 */}
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap leading-relaxed my-4">
                {post.content}
              </div>

              {/* 태그 */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {post.tags.map((tag) => (
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
                  onClick={() => onDelete(post)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('blog.detail.delete')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(post)}
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
  );
}
