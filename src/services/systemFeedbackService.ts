/**
 * 시스템 피드백 Firestore 서비스
 *
 * system_feedback 컬렉션 CRUD + Firebase Storage 스크린샷 업로드
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  query,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
} from '@/services/firebase';
import { storage } from '@/services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '@/utils/imageCompression';
import type {
  SystemFeedback,
  CreateFeedbackInput,
  UpdateFeedbackInput,
  FeedbackComment,
  FeedbackStatus,
} from '@/types/systemFeedback';

const COLLECTION = 'system_feedback';

/** ID 생성 */
const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `SF_${timestamp}_${random}`;
};

/** Firestore 문서 → SystemFeedback 변환 */
const docToFeedback = (id: string, data: Record<string, unknown>): SystemFeedback => {
  const toDate = (val: unknown): Date => {
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    return new Date(val as string);
  };

  const rawComments = (data.comments as Array<Record<string, unknown>>) || [];
  const comments: FeedbackComment[] = rawComments.map((c) => ({
    author: (c.author as string) || '',
    text: (c.text as string) || '',
    createdAt: toDate(c.createdAt),
  }));

  return {
    id,
    title: (data.title as string) || '',
    category: (data.category as SystemFeedback['category']) || 'OTHER',
    description: (data.description as string) || '',
    priority: (data.priority as SystemFeedback['priority']) || 'MEDIUM',
    status: (data.status as SystemFeedback['status']) || 'SUBMITTED',
    screenshots: (data.screenshots as string[]) || [],
    submittedBy: (data.submittedBy as string) || '',
    assignedTo: data.assignedTo as string | undefined,
    comments,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

/** 전체 목록 조회 (최신순) */
export const getAllFeedback = async (): Promise<SystemFeedback[]> => {
  const q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToFeedback(d.id, d.data() as Record<string, unknown>));
};

/** 상세 조회 */
export const getFeedback = async (id: string): Promise<SystemFeedback | null> => {
  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return docToFeedback(snapshot.id, snapshot.data() as Record<string, unknown>);
};

/** 생성 */
export const createFeedback = async (data: CreateFeedbackInput): Promise<SystemFeedback> => {
  const feedbackId = generateId();
  const now = serverTimestamp();

  const feedbackData = {
    title: data.title,
    category: data.category,
    description: data.description,
    priority: data.priority,
    status: 'SUBMITTED' as FeedbackStatus,
    screenshots: data.screenshots,
    submittedBy: data.submittedBy,
    comments: [],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTION, feedbackId), feedbackData);

  return {
    id: feedbackId,
    ...feedbackData,
    status: 'SUBMITTED',
    createdAt: new Date(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
    updatedAt: new Date(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
  };
};

/** 수정 */
export const updateFeedback = async (
  id: string,
  data: UpdateFeedbackInput
): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/** 상태 변경 */
export const updateFeedbackStatus = async (
  id: string,
  status: FeedbackStatus
): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

/** 댓글 추가 */
export const addComment = async (
  id: string,
  comment: { author: string; text: string }
): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  const newComment = {
    author: comment.author,
    text: comment.text,
    createdAt: serverTimestamp(),
  };

  await updateDoc(docRef, {
    comments: arrayUnion(newComment),
    updatedAt: serverTimestamp(),
  });
};

/** 스크린샷 업로드 (압축 + Storage) */
export const uploadScreenshot = async (file: File): Promise<string> => {
  const { compressedFile } = await compressImage(file);
  const filename = `system-feedback/screenshots/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, compressedFile);
  return getDownloadURL(storageRef);
};

/** 복수 스크린샷 업로드 */
export const uploadScreenshots = async (
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadScreenshot(files[i]);
    urls.push(url);
    onProgress?.(i + 1, files.length);
  }
  return urls;
};
