/**
 * Firebase Configuration and Initialization
 *
 * This module initializes Firebase services for the Q-TRAIN application:
 * - Firebase App
 * - Firebase Authentication (Google Provider)
 * - Cloud Firestore Database
 * - Firebase Analytics (optional)
 */

import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { Auth, User as FirebaseUser } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  runTransaction,
  writeBatch,
  doc,
  collection,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  startAfter,
} from 'firebase/firestore';
import type {
  Firestore,
  Transaction,
  WriteBatch,
  DocumentReference,
  CollectionReference,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { logger } from '@/utils/logger';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
let analytics: Analytics | null = null;

// Check if Firebase is already initialized
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth
const auth: Auth = getAuth(app);

// Initialize Storage
const storage: FirebaseStorage = getStorage(app);

// Initialize Firestore with ignoreUndefinedProperties and persistent cache
const db: Firestore = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Initialize Analytics (only in browser, not SSR)
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize App Check (reCAPTCHA Enterprise)
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
if (recaptchaSiteKey) {
  // Enable debug token for localhost development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // @ts-expect-error -- Firebase App Check debug token flag
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  logger.info('App Check initialized with reCAPTCHA Enterprise');
}

// Admin email addresses
const ADMIN_EMAILS = [
  'admin@hwaseung.com',
  'qip.admin@hwaseungvina.com',
  'ksmoon@hsvina.com'
];

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    logger.error('Email sign-in error:', error);
    throw error;
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    logger.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Get user role based on email
 */
export const getUserRole = (email: string | null): 'ADMIN' | 'TRAINER' | 'VIEWER' => {
  if (!email) return 'VIEWER';

  if (ADMIN_EMAILS.includes(email)) {
    return 'ADMIN';
  }

  // Default role for authenticated users
  return 'TRAINER';
};

/**
 * Check if user is admin
 */
export const isAdmin = (email: string | null): boolean => {
  return getUserRole(email) === 'ADMIN';
};

/**
 * Sync user role to Firestore users/{uid} document.
 * This enables isAdmin()/isTrainer() in firestore.rules to work correctly.
 */
export const syncUserRole = async (firebaseUser: FirebaseUser): Promise<void> => {
  if (!firebaseUser.email) return;

  const role = getUserRole(firebaseUser.email);
  const userRef = doc(db, 'users', firebaseUser.uid);

  try {
    const userSnap = await getDoc(userRef);
    const userData = {
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email,
      role,
      last_login: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    if (!userSnap.exists()) {
      await setDoc(userRef, { ...userData, created_at: serverTimestamp() });
    } else {
      // Only update if role changed or on login
      await setDoc(userRef, userData, { merge: true });
    }
  } catch (error) {
    // Log but don't block login — role sync is best-effort
    logger.error('Failed to sync user role to Firestore:', error);
  }
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================================
// Firestore Transaction & Batch Utilities
// ============================================================

/**
 * Execute a Firestore transaction
 * Use for atomic read-write operations that need consistency
 */
export const executeTransaction = async <T>(
  updateFunction: (transaction: Transaction) => Promise<T>
): Promise<T> => {
  return runTransaction(db, updateFunction);
};

/**
 * Create a new write batch for atomic multi-document writes
 */
export const createBatch = (): WriteBatch => {
  return writeBatch(db);
};

/**
 * Get a document reference
 */
export const getDocRef = (
  collectionName: string,
  docId: string
): DocumentReference<DocumentData> => {
  return doc(db, collectionName, docId);
};

/**
 * Get a collection reference
 */
export const getCollectionRef = (
  collectionName: string
): CollectionReference<DocumentData> => {
  return collection(db, collectionName);
};

/**
 * Batch create multiple documents atomically
 * @param items Array of { collection, id, data } objects
 */
export const batchCreate = async (
  items: Array<{ collection: string; id: string; data: DocumentData }>
): Promise<void> => {
  const batch = writeBatch(db);

  items.forEach(({ collection: collectionName, id, data }) => {
    const docRef = doc(db, collectionName, id);
    batch.set(docRef, {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });

  await batch.commit();
};

/**
 * Batch update multiple documents atomically
 * @param items Array of { collection, id, data } objects
 */
export const batchUpdate = async (
  items: Array<{ collection: string; id: string; data: Partial<DocumentData> }>
): Promise<void> => {
  const batch = writeBatch(db);

  items.forEach(({ collection: collectionName, id, data }) => {
    const docRef = doc(db, collectionName, id);
    batch.update(docRef, {
      ...data,
      updated_at: serverTimestamp(),
    });
  });

  await batch.commit();
};

/**
 * Create a trainee with stages and meetings atomically
 * This ensures all related documents are created together or none at all
 */
export const createTraineeWithRelations = async (
  trainee: DocumentData,
  stages: Array<{ id: string; data: DocumentData }>,
  meetings: Array<{ id: string; data: DocumentData }>
): Promise<void> => {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  // Create trainee document
  const traineeRef = doc(db, 'tqc_trainees', trainee.trainee_id);
  batch.set(traineeRef, { ...trainee, created_at: now, updated_at: now });

  // Create stage documents
  stages.forEach(({ id, data }) => {
    const stageRef = doc(db, 'tqc_training_stages', id);
    batch.set(stageRef, { ...data, updated_at: now });
  });

  // Create meeting documents
  meetings.forEach(({ id, data }) => {
    const meetingRef = doc(db, 'tqc_meetings', id);
    batch.set(meetingRef, { ...data, created_at: now, updated_at: now });
  });

  await batch.commit();
};

/**
 * Update training result with edit log atomically
 * Ensures result update and log creation happen together
 */
export const updateResultWithLog = async (
  resultId: string,
  resultData: Partial<DocumentData>,
  logData: DocumentData
): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    const resultRef = doc(db, 'training_results', resultId);
    const resultSnap = await transaction.get(resultRef);

    if (!resultSnap.exists()) {
      throw new Error(`Training result ${resultId} not found`);
    }

    // Update the result
    transaction.update(resultRef, {
      ...resultData,
      updated_at: serverTimestamp(),
    });

    // Create the edit log
    const logRef = doc(collection(db, 'result_edit_logs'));
    transaction.set(logRef, {
      ...logData,
      result_id: resultId,
      previous_data: resultSnap.data(),
      created_at: serverTimestamp(),
    });
  });
};

/**
 * Create retraining entry with status update atomically
 */
export const createRetrainingWithStatusUpdate = async (
  retrainingData: DocumentData,
  employeeId: string
): Promise<void> => {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  // Create retraining entry
  const retrainingRef = doc(collection(db, 'retraining_targets'));
  batch.set(retrainingRef, { ...retrainingData, created_at: now });

  // Update employee's retraining status if needed
  const employeeRef = doc(db, 'employees', employeeId);
  batch.update(employeeRef, {
    needs_retraining: true,
    updated_at: now,
  });

  await batch.commit();
};

// Export Firebase instances
export { app, auth, db, storage, analytics };
export type { FirebaseUser };

// Export Firestore utilities
export {
  runTransaction,
  writeBatch,
  doc,
  collection,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  startAfter,
};
export type { Transaction, WriteBatch, DocumentReference, CollectionReference, DocumentData, QueryConstraint };
