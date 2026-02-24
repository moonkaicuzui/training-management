/**
 * 품질 블로그 타입 정의
 */

import { Timestamp } from 'firebase/firestore';

/** 블로그 카테고리 */
export type BlogCategory = 'quality' | 'safety' | 'improvement' | 'report' | 'general';

/** 블로그 상태 */
export type BlogStatus = 'draft' | 'published';

/** 블로그 작성자 */
export interface BlogAuthor {
  id: string;
  name: string;
  department?: string;
}

/** 품질 블로그 포스트 */
export interface QualityBlogPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  coverImage?: string;
  images: string[];
  author: BlogAuthor;
  tags: string[];
  category: BlogCategory;
  status: BlogStatus;
  viewCount: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  publishedAt?: Date | Timestamp;
}

/** 블로그 생성 입력 */
export interface CreateBlogPostInput {
  title: string;
  content: string;
  summary: string;
  coverImage?: string;
  images: string[];
  author: BlogAuthor;
  tags: string[];
  category: BlogCategory;
  status: BlogStatus;
}

/** 블로그 수정 입력 */
export interface UpdateBlogPostInput {
  title?: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  category?: BlogCategory;
  status?: BlogStatus;
}

/** 블로그 필터 */
export interface BlogFilters {
  category?: BlogCategory;
  status?: BlogStatus;
  search?: string;
}

/** 카테고리 라벨 */
export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  quality: '품질',
  safety: '안전',
  improvement: '개선',
  report: '보고서',
  general: '일반',
};

/** 카테고리 색상 */
export const BLOG_CATEGORY_COLORS: Record<BlogCategory, string> = {
  quality: '#3B82F6',
  safety: '#EF4444',
  improvement: '#10B981',
  report: '#8B5CF6',
  general: '#6B7280',
};
