/**
 * Shared helpers for ProjectStore slices
 */

import { useAuthStore } from '@/stores/authStore';

/** Get current authenticated user ID */
export const getCurrentUserId = (): string => {
  const user = useAuthStore.getState().user;
  return user?.id || 'unknown';
};
