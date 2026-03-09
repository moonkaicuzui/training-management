/**
 * Member CRUD actions for ProjectStore
 */

import type { CreateMemberInput, UpdateMemberInput } from '@/types/project';
import * as projectService from '@/services/projectService';
import type { StoreSet, StoreGet } from './types';
import { isCacheValid, cache } from './cacheConfig';
import i18n from '@/i18n';

export const createMemberActions = (set: StoreSet, get: StoreGet) => ({
  fetchMembers: async () => {
    if (isCacheValid(cache.membersLastFetched, get().members.length)) return;
    set({ isMembersLoading: true, error: null });
    try {
      const members = await projectService.getMembers();
      cache.membersLastFetched = Date.now();
      set({ members, isMembersLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.fetchMembersFailed'),
        isMembersLoading: false,
      });
    }
  },

  createMember: async (input: CreateMemberInput) => {
    set({ isLoading: true, error: null });
    try {
      const member = await projectService.createMember(input);
      set((state) => ({
        members: [...state.members, member],
        isLoading: false,
      }));
      return member;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.createMemberFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  updateMember: async (memberId: string, input: UpdateMemberInput) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.updateMember(memberId, input);
      set((state) => ({
        members: state.members.map((m) =>
          m.id === memberId ? { ...m, ...input, updatedAt: new Date() } : m
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.updateMemberFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  deleteMember: async (memberId: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deactivateMember(memberId);
      set((state) => ({
        members: state.members.map((m) =>
          m.id === memberId ? { ...m, status: 'inactive' as const } : m
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.deleteMemberFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  subscribeMembersRealtime: () => {
    const unsubscribe = projectService.subscribeMembersRealtime((members) => {
      set({ members });
    });
    set((state) => ({
      unsubscribeFunctions: [...state.unsubscribeFunctions, unsubscribe],
    }));
  },
});
