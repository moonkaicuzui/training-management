/**
 * 품질 블로그 Zustand 스토어
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as blogService from '@/services/qualityBlogService';
import i18n from '@/i18n';
import type {
  QualityBlogPost,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  BlogFilters,
} from '@/types/qualityBlog';

interface QualityBlogState {
  posts: QualityBlogPost[];
  selectedPost: QualityBlogPost | null;
  isLoading: boolean;
  error: string | null;
  filters: BlogFilters;
  lastFetchedAt: number;
}

interface QualityBlogActions {
  fetchPosts: () => Promise<void>;
  fetchPost: (id: string) => Promise<void>;
  createPost: (data: CreateBlogPostInput) => Promise<QualityBlogPost>;
  updatePost: (id: string, data: UpdateBlogPostInput) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  setFilters: (filters: BlogFilters) => void;
  setSelectedPost: (post: QualityBlogPost | null) => void;
  clearError: () => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5분

export const useQualityBlogStore = create<QualityBlogState & QualityBlogActions>()(
  devtools(
    (set, get) => ({
      posts: [],
      selectedPost: null,
      isLoading: false,
      error: null,
      filters: {},
      lastFetchedAt: 0,

      fetchPosts: async () => {
        const now = Date.now();
        if (now - get().lastFetchedAt < CACHE_TTL && get().posts.length > 0) return;

        set({ isLoading: true, error: null });
        try {
          const posts = await blogService.getAllPosts();
          set({ posts, isLoading: false, lastFetchedAt: now });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      fetchPost: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const post = await blogService.getPost(id);
          if (post) {
            await blogService.incrementViewCount(id);
            set({ selectedPost: { ...post, viewCount: post.viewCount + 1 }, isLoading: false });
          } else {
            set({ error: i18n.t('errors.blog.postNotFound'), isLoading: false });
          }
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      createPost: async (data: CreateBlogPostInput) => {
        set({ isLoading: true, error: null });
        try {
          const post = await blogService.createPost(data);
          set((state) => ({
            posts: [post, ...state.posts],
            isLoading: false,
            lastFetchedAt: 0,
          }));
          return post;
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      updatePost: async (id: string, data: UpdateBlogPostInput) => {
        set({ isLoading: true, error: null });
        try {
          await blogService.updatePost(id, data);
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === id ? { ...p, ...data, updatedAt: new Date() } : p
            ),
            selectedPost:
              state.selectedPost?.id === id
                ? { ...state.selectedPost, ...data, updatedAt: new Date() }
                : state.selectedPost,
            isLoading: false,
            lastFetchedAt: 0,
          }));
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      deletePost: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await blogService.deletePost(id);
          set((state) => ({
            posts: state.posts.filter((p) => p.id !== id),
            selectedPost: state.selectedPost?.id === id ? null : state.selectedPost,
            isLoading: false,
          }));
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      setFilters: (filters: BlogFilters) => set({ filters }),
      setSelectedPost: (post) => set({ selectedPost: post }),
      clearError: () => set({ error: null }),
    }),
    { name: 'quality-blog-store' }
  )
);
