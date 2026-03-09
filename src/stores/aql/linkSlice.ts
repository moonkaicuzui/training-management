import type { AqlSupervisorLink } from '@/types/aql';
import * as aqlService from '@/services/aqlService';
import { parseManpowerCsv } from '@/utils/manpowerCsvParser';
import type { StoreSet, StoreGet } from './types';

export const createLinkActions = (set: StoreSet, _get: StoreGet) => ({
  createAqlLink: async (input: Omit<import('@/types/aql').AqlEmployeeLink, 'link_id' | 'created_at'>) => {
    try {
      const created = await aqlService.createAqlEmployeeLink(input);
      set((state) => {
        state.aqlLinks.push(created);
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Failed to create AQL link';
      });
    }
  },

  deleteAqlLink: async (linkId: string) => {
    try {
      await aqlService.deleteAqlEmployeeLink(linkId);
      set((state) => {
        state.aqlLinks = state.aqlLinks.filter((l) => l.link_id !== linkId);
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Failed to delete AQL link';
      });
    }
  },

  importSupervisorLinks: async (csvText: string, fileName: string) => {
    set((state) => {
      state.isImporting = true;
      state.error = null;
    });

    try {
      const result = parseManpowerCsv(csvText);

      if (result.links.length === 0) {
        set((state) => {
          state.isImporting = false;
          state.error = 'No valid supervisor links found in CSV';
        });
        return { success: 0, errors: result.errors };
      }

      await aqlService.clearSupervisorLinks();
      const imported = await aqlService.batchImportSupervisorLinks(result.links, fileName);

      const refreshed = await aqlService.getSupervisorLinks();

      set((state) => {
        state.supervisorLinks = refreshed;
        state.isImporting = false;
      });

      return { success: imported, errors: result.errors };
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Import failed';
        state.isImporting = false;
      });
      return { success: 0, errors: [{ row: 0, message: error instanceof Error ? error.message : 'Import failed' }] };
    }
  },

  autoImportSupervisorLinks: async () => {
    set((state) => {
      state.isImporting = true;
      state.error = null;
    });

    try {
      const response = await aqlService.fetchAqlManpower();

      if (!response.data || response.data.length === 0) {
        set((state) => {
          state.isImporting = false;
          state.error = 'No manpower data found in Google Drive';
        });
        return { success: 0, errors: [{ row: 0, message: 'No manpower data found' }] };
      }

      const nameToEmpNo = new Map<string, string>();
      for (const row of response.data) {
        const normalizedName = row.full_name.toLowerCase().trim();
        if (!nameToEmpNo.has(normalizedName)) {
          nameToEmpNo.set(normalizedName, row.employee_no);
        }
      }

      const links: Omit<AqlSupervisorLink, 'link_id' | 'imported_at' | 'source_file'>[] = [];
      const errors: Array<{ row: number; message: string }> = [];

      for (let i = 0; i < response.data.length; i++) {
        const row = response.data[i];
        if (!row.direct_boss_name) continue;

        const supervisorNo = nameToEmpNo.get(row.direct_boss_name.toLowerCase().trim());

        if (!supervisorNo) {
          errors.push({
            row: i + 2,
            message: `Supervisor "${row.direct_boss_name}" not found for ${row.employee_no}`,
          });
          continue;
        }

        links.push({
          employee_no: row.employee_no,
          employee_name: row.full_name,
          supervisor_no: supervisorNo,
          supervisor_name: row.direct_boss_name,
          building: row.building || '',
        });
      }

      if (links.length === 0) {
        set((state) => {
          state.isImporting = false;
          state.error = 'No valid supervisor links resolved from manpower data';
        });
        return { success: 0, errors };
      }

      await aqlService.clearSupervisorLinks();
      const imported = await aqlService.batchImportSupervisorLinks(links, 'auto-import-from-drive');

      const refreshed = await aqlService.getSupervisorLinks();

      set((state) => {
        state.supervisorLinks = refreshed;
        state.isImporting = false;
      });

      return { success: imported, errors };
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Auto-import failed';
        state.isImporting = false;
      });
      return { success: 0, errors: [{ row: 0, message: error instanceof Error ? error.message : 'Auto-import failed' }] };
    }
  },

  fetchLogs: async () => {
    set((state) => {
      state.isLoadingLogs = true;
      state.error = null;
    });

    try {
      const logs = await aqlService.getAqlEnrollmentLogs();
      set((state) => {
        state.enrollmentLogs = logs;
        state.isLoadingLogs = false;
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Failed to load enrollment logs';
        state.isLoadingLogs = false;
      });
    }
  },
});
