import {
  db,
  doc,
  collection,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from '@/services/firebase';
import type { Category } from '@/types/project';
import { COLLECTIONS, generateId, convertDocumentDates } from './common';
import { logger } from '@/utils/logger';

export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CATEGORIES),
      where('isActive', '==', true),
      orderBy('order', 'asc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Category
    );
  } catch (error) {
    logger.error('[categoryService] getCategories failed:', error);
    throw error;
  }
};

export const createCategory = async (
  name: string,
  color: string,
  type: 'event' | 'task',
  icon?: string
): Promise<Category> => {
  try {
    const categoryId = generateId('cat');
    const now = serverTimestamp();

    const q = query(
      collection(db, COLLECTIONS.CATEGORIES),
      orderBy('order', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    const maxOrder = snapshot.docs.length > 0 ? snapshot.docs[0].data().order : 0;

    const categoryData = {
      name,
      color,
      type,
      icon,
      order: maxOrder + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId), categoryData);

    return {
      id: categoryId,
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Category;
  } catch (error) {
    logger.error('[categoryService] createCategory failed:', error);
    throw error;
  }
};

export const updateCategory = async (
  categoryId: string,
  data: Partial<Pick<Category, 'name' | 'color' | 'icon' | 'order' | 'isActive'>>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[categoryService] updateCategory failed:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[categoryService] deleteCategory failed:', error);
    throw error;
  }
};
