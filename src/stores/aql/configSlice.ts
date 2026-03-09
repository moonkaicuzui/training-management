import * as aqlService from '@/services/aqlService';
import * as recommendationService from '@/services/recommendationService';
import * as api from '@/services/api';
import type { StoreSet, StoreGet } from './types';
import { isFresh, cache } from './cache';

export const createConfigActions = (set: StoreSet, get: StoreGet) => ({
  fetchConfig: async () => {
    if (get().employees.length > 0 && isFresh(cache.configAt)) return;

    set((state) => {
      state.isLoadingConfig = true;
      state.error = null;
    });

    try {
      const [mappings, aqlLinks, supervisorLinks, employees, programs] = await Promise.all([
        recommendationService.getMappings(),
        aqlService.getAqlEmployeeLinks(),
        aqlService.getSupervisorLinks(),
        api.getEmployees(),
        api.getPrograms(),
      ]);
      cache.configAt = Date.now();

      set((state) => {
        state.mappings = mappings;
        state.aqlLinks = aqlLinks;
        state.supervisorLinks = supervisorLinks;
        state.employees = employees;
        state.programs = programs;
        state.isLoadingConfig = false;
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Failed to load AQL config';
        state.isLoadingConfig = false;
      });
    }
  },
});
