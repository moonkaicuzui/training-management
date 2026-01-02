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
  getFirestore,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

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

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Enable offline persistence for Firestore (optional but recommended)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence
    console.warn('Firestore persistence not supported by browser');
  }
});

// Initialize Analytics (only in browser, not SSR)
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

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
    console.error('Email sign-in error:', error);
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
    console.error('Sign out error:', error);
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
 * Subscribe to auth state changes
 */
export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Export Firebase instances
export { app, auth, db, analytics };
export type { FirebaseUser };
