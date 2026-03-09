/**
 * Events + Categories actions for ProjectStore
 */

import type { Category, CalendarEvent } from '@/types/project';
import * as projectService from '@/services/projectService';
import type { StoreSet, StoreGet } from './types';
import { isCacheValid, cache } from './cacheConfig';
import i18n from '@/i18n';

export const createCalendarActions = (set: StoreSet, get: StoreGet) => ({
  // ============================================================
  // Category Actions
  // ============================================================

  fetchCategories: async () => {
    if (isCacheValid(cache.categoriesLastFetched, get().categories.length)) return;
    set({ isLoading: true, error: null });
    try {
      const categories = await projectService.getCategories();
      cache.categoriesLastFetched = Date.now();
      set({ categories, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.fetchCategoriesFailed'),
        isLoading: false,
      });
    }
  },

  createCategory: async (name: string, color: string, type: 'event' | 'task', icon?: string) => {
    set({ isLoading: true, error: null });
    try {
      const category = await projectService.createCategory(name, color, type, icon);
      set((state) => ({
        categories: [...state.categories, category],
        isLoading: false,
      }));
      return category;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.createCategoryFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  updateCategory: async (categoryId: string, data: Partial<Category>) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.updateCategory(categoryId, data);
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId ? { ...c, ...data, updatedAt: new Date() } : c
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.updateCategoryFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  deleteCategory: async (categoryId: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteCategory(categoryId);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.deleteCategoryFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  // ============================================================
  // Event Actions
  // ============================================================

  fetchEvents: async (startDate: Date, endDate: Date) => {
    const rangeStart = startDate.getTime();
    const rangeEnd = endDate.getTime();
    if (
      isCacheValid(cache.eventsLastFetched, get().events.length) &&
      cache.eventsLastRange &&
      cache.eventsLastRange.start === rangeStart &&
      cache.eventsLastRange.end === rangeEnd
    ) return;
    set({ isLoading: true, error: null });
    try {
      const events = await projectService.getEventsByDateRange(startDate, endDate);
      cache.eventsLastFetched = Date.now();
      cache.eventsLastRange = { start: rangeStart, end: rangeEnd };
      set({ events, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.fetchEventsFailed'),
        isLoading: false,
      });
    }
  },

  fetchEventsByDateRange: async (startDate: Date, endDate: Date) => {
    set({ isLoading: true, error: null });
    try {
      const events = await projectService.getEventsByDateRange(startDate, endDate);
      set({ events, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.fetchEventsFailed'),
        isLoading: false,
      });
    }
  },

  createEvent: async (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const event = await projectService.createEvent(data);
      set((state) => ({
        events: [...state.events, event],
        isLoading: false,
      }));
      return event;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.createEventFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  updateEvent: async (eventId: string, data: Partial<CalendarEvent>) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.updateEvent(eventId, data);
      set((state) => ({
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, ...data, updatedAt: new Date() } : e
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.updateEventFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  deleteEvent: async (eventId: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteEvent(eventId);
      set((state) => ({
        events: state.events.filter((e) => e.id !== eventId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.deleteEventFailed'),
        isLoading: false,
      });
      throw error;
    }
  },
});
