/**
 * 품질 블로그 Firestore 서비스
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { storage } from '@/services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '@/utils/imageCompression';
import type {
  QualityBlogPost,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  BlogFilters,
} from '@/types/qualityBlog';

const COLLECTION = 'quality_blog_posts';
const PAGE_SIZE = 20;

/** ID 생성 */
const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
};

/** Firestore 문서 → BlogPost 변환 */
const docToPost = (id: string, data: Record<string, unknown>): QualityBlogPost => {
  const toDate = (val: unknown): Date => {
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    return new Date(val as string);
  };

  return {
    id,
    title: (data.title as string) || '',
    content: (data.content as string) || '',
    summary: (data.summary as string) || '',
    coverImage: data.coverImage as string | undefined,
    images: (data.images as string[]) || [],
    author: data.author as QualityBlogPost['author'],
    tags: (data.tags as string[]) || [],
    category: (data.category as QualityBlogPost['category']) || 'general',
    status: (data.status as QualityBlogPost['status']) || 'draft',
    viewCount: (data.viewCount as number) || 0,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    publishedAt: data.publishedAt ? toDate(data.publishedAt) : undefined,
  };
};

/** 목록 조회 (published만, 필터 적용) */
export const getPosts = async (
  filters?: BlogFilters
): Promise<QualityBlogPost[]> => {
  const q = filters?.category
    ? query(
        collection(db, COLLECTION),
        where('status', '==', 'published'),
        where('category', '==', filters.category),
        orderBy('publishedAt', 'desc'),
        limit(PAGE_SIZE)
      )
    : query(
        collection(db, COLLECTION),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(PAGE_SIZE)
      );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToPost(d.id, d.data() as Record<string, unknown>));
};

/** 모든 게시물 조회 (draft 포함, 관리자용) */
export const getAllPosts = async (): Promise<QualityBlogPost[]> => {
  const q = query(
    collection(db, COLLECTION),
    orderBy('updatedAt', 'desc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToPost(d.id, d.data() as Record<string, unknown>));
};

/** 상세 조회 */
export const getPost = async (id: string): Promise<QualityBlogPost | null> => {
  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return docToPost(snapshot.id, snapshot.data() as Record<string, unknown>);
};

/** 작성 */
export const createPost = async (data: CreateBlogPostInput): Promise<QualityBlogPost> => {
  const postId = generateId('blog');
  const now = serverTimestamp();

  const postData = {
    ...data,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: data.status === 'published' ? now : null,
  };

  await setDoc(doc(db, COLLECTION, postId), postData);

  return {
    id: postId,
    ...data,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: data.status === 'published' ? new Date() : undefined,
  };
};

/** 수정 */
export const updatePost = async (
  id: string,
  data: UpdateBlogPostInput
): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  // draft → published 전환 시 publishedAt 설정
  if (data.status === 'published') {
    const existing = await getDoc(docRef);
    if (existing.exists() && existing.data()?.status === 'draft') {
      updateData.publishedAt = serverTimestamp();
    }
  }

  await updateDoc(docRef, updateData);
};

/** 삭제 */
export const deletePost = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

/** 조회수 증가 */
export const incrementViewCount = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const currentCount = (snapshot.data()?.viewCount as number) || 0;
    await updateDoc(docRef, { viewCount: currentCount + 1 });
  }
};

/** Firebase Storage에 이미지 업로드 (압축 적용) */
export const uploadImage = async (file: File): Promise<string> => {
  const { compressedFile } = await compressImage(file);
  const filename = `quality-blog/images/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, compressedFile);
  return getDownloadURL(storageRef);
};

/** 복수 이미지 압축 + 순차 업로드 → URL 배열 반환 */
export const uploadImages = async (
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadImage(files[i]);
    urls.push(url);
    onProgress?.(i + 1, files.length);
  }
  return urls;
};
