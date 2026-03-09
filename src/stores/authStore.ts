/**
 * Authentication Store
 * Firebase Auth 기반 인증 상태 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';
import type {
  User,
  UserRole,
  AuthState,
  RolePermissions,
} from '@/types/auth';
import { ROLE_PERMISSIONS, ALLOWED_EMAIL_DOMAINS, ADMIN_EMAILS } from '@/types/auth';
import {
  signInWithEmail,
  signOut as firebaseSignOut,
  subscribeToAuthState,
  syncUserRole
} from '@/services/firebase';
import type { FirebaseUser } from '@/services/firebase';

// 로컬 스토리지 키
const AUTH_STORAGE_KEY = 'q-train-auth';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
  getPermissions: () => RolePermissions | null;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  initializeAuthListener: () => () => void;

  // Role helpers
  isAdmin: () => boolean;
  isTrainer: () => boolean;
  isViewer: () => boolean;

  // Internal
  setUser: (firebaseUser: FirebaseUser | null) => void;
}

// 이메일 도메인 검증
function isAllowedEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((allowed) => domain === allowed.toLowerCase());
}

// 역할 결정
function determineRole(email: string): UserRole {
  if (ADMIN_EMAILS.some((admin) => admin.toLowerCase() === email.toLowerCase())) {
    return 'ADMIN';
  }
  return 'TRAINER';
}

// Firebase User를 앱 User로 변환
function convertFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email || 'Unknown',
    picture: firebaseUser.photoURL || undefined,
    role: determineRole(firebaseUser.email || ''),
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start with loading true until auth state is resolved
      error: null,

      // Set user from Firebase auth state
      setUser: (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // Validate email domain
          if (firebaseUser.email && !isAllowedEmail(firebaseUser.email)) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: i18n.t('errors.auth.invalidDomain'),
            });
            return;
          }

          const user = convertFirebaseUser(firebaseUser);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Initialize Firebase auth state listener
      initializeAuthListener: () => {
        const unsubscribe = subscribeToAuthState((firebaseUser) => {
          get().setUser(firebaseUser);
          // Sync role on auth state restoration (e.g., page refresh)
          if (firebaseUser) {
            syncUserRole(firebaseUser).catch(() => {});
          }
        });
        return unsubscribe;
      },

      // Login with email and password via Firebase
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const firebaseUser = await signInWithEmail(email, password);
          const user = convertFirebaseUser(firebaseUser);

          // Sync role to Firestore for rules enforcement
          await syncUserRole(firebaseUser);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          let errorMessage = i18n.t('errors.auth.loginFailed');
          if (error instanceof Error) {
            if (error.message.includes('user-not-found')) {
              errorMessage = i18n.t('errors.auth.userNotFound');
            } else if (error.message.includes('wrong-password') || error.message.includes('invalid-credential')) {
              errorMessage = i18n.t('errors.auth.wrongPassword');
            } else if (error.message.includes('invalid-email')) {
              errorMessage = i18n.t('errors.auth.invalidEmail');
            } else {
              errorMessage = error.message;
            }
          }
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Logout via Firebase
      logout: async () => {
        try {
          await firebaseSignOut();

          // Clear service worker caches to prevent stale sensitive data
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map((name) => caches.delete(name))
            );
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          logger.error('Logout error:', error);
          // Still clear local state even if Firebase logout fails
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Check if still authenticated
      checkAuth: () => {
        const { user, isAuthenticated } = get();
        return isAuthenticated && user !== null;
      },

      // Get current user's permissions
      getPermissions: () => {
        const { user } = get();
        if (!user) return null;
        return ROLE_PERMISSIONS[user.role];
      },

      // Check specific permission
      hasPermission: (permission: keyof RolePermissions) => {
        const permissions = get().getPermissions();
        return permissions ? permissions[permission] : false;
      },

      // Role helpers
      isAdmin: () => get().user?.role === 'ADMIN',
      isTrainer: () => get().user?.role === 'TRAINER',
      isViewer: () => get().user?.role === 'VIEWER',
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 비인증 상태에서 사용할 기본 권한
export const GUEST_PERMISSIONS: RolePermissions = {
  canViewDashboard: false,
  canViewProgress: false,
  canViewPrograms: false,
  canEditPrograms: false,
  canViewResults: false,
  canEditResults: false,
  canViewEmployees: false,
  canEditEmployees: false,
  canViewSchedule: false,
  canEditSchedule: false,
  canViewRetraining: false,
  canManageUsers: false,
};
