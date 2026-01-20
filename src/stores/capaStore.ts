/**
 * CAPA Store
 *
 * Zustand store for CAPA (Corrective and Preventive Action) management
 * Handles CRUD operations and workflow state transitions
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type {
  CAPA,
  CAPAInput,
  CAPAUpdate,
  CAPAStageUpdate,
  CAPAFilters,
  CAPADashboardStats,
  CAPAStatus,
} from '@/types/capa';

// ========== Store Interface ==========

interface CAPAState {
  // Data
  capas: CAPA[];
  currentCAPA: CAPA | null;
  dashboardStats: CAPADashboardStats | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: CAPAFilters;

  // Actions
  fetchCAPAs: (filters?: CAPAFilters) => Promise<void>;
  fetchCAPAById: (id: string) => Promise<CAPA | null>;
  createCAPA: (input: CAPAInput) => Promise<string>;
  updateCAPA: (id: string, update: CAPAUpdate) => Promise<void>;
  updateCAPAStage: (id: string, stageUpdate: CAPAStageUpdate) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  setFilters: (filters: CAPAFilters) => void;
  clearError: () => void;
  setCurrentCAPA: (capa: CAPA | null) => void;
}

// ========== Helper Functions ==========

function generateCAPANumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `CAPA-${year}-${random}`;
}

function convertTimestampToDate(timestamp: Timestamp | Date): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
}

function convertCAPAFromFirestore(doc: { id: string; data: () => Record<string, unknown> }): CAPA {
  const data = doc.data() as Record<string, unknown>;
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt ? convertTimestampToDate(data.createdAt as Timestamp) : new Date(),
    updatedAt: data.updatedAt ? convertTimestampToDate(data.updatedAt as Timestamp) : new Date(),
    dueDate: data.dueDate ? convertTimestampToDate(data.dueDate as Timestamp) : undefined,
  } as CAPA;
}

function calculateDashboardStats(capas: CAPA[]): CAPADashboardStats {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const byStatus: Record<CAPAStatus, number> = {
    discovery: 0,
    investigation: 0,
    action: 0,
    verification: 0,
    closed: 0,
    rejected: 0,
  };

  const bySeverity = { critical: 0, major: 0, minor: 0 };
  const byType = { corrective: 0, preventive: 0 };

  let overdue = 0;
  let closedThisMonth = 0;
  let totalResolutionDays = 0;
  let closedCount = 0;
  let effectiveCount = 0;
  let verifiedCount = 0;

  capas.forEach((capa) => {
    // Count by status
    byStatus[capa.status]++;

    // Count by severity
    bySeverity[capa.severity]++;

    // Count by type
    byType[capa.type]++;

    // Check overdue
    if (capa.dueDate && capa.status !== 'closed' && capa.status !== 'rejected') {
      const dueDate = capa.dueDate instanceof Date ? capa.dueDate : (capa.dueDate as Timestamp).toDate();
      if (dueDate < now) {
        overdue++;
      }
    }

    // Closed this month
    if (capa.status === 'closed' && capa.closure?.closedAt) {
      const closedAt = capa.closure.closedAt instanceof Date
        ? capa.closure.closedAt
        : (capa.closure.closedAt as Timestamp).toDate();
      if (closedAt.getMonth() === thisMonth && closedAt.getFullYear() === thisYear) {
        closedThisMonth++;
      }

      // Calculate resolution time
      const createdAt = capa.createdAt instanceof Date
        ? capa.createdAt
        : (capa.createdAt as Timestamp).toDate();
      const days = Math.ceil((closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      totalResolutionDays += days;
      closedCount++;
    }

    // Effectiveness rate
    if (capa.verification) {
      verifiedCount++;
      if (capa.verification.isEffective) {
        effectiveCount++;
      }
    }
  });

  return {
    total: capas.length,
    byStatus,
    bySeverity,
    byType,
    overdue,
    closedThisMonth,
    averageResolutionDays: closedCount > 0 ? Math.round(totalResolutionDays / closedCount) : 0,
    effectivenessRate: verifiedCount > 0 ? Math.round((effectiveCount / verifiedCount) * 100) : 0,
  };
}

// ========== Store ==========

export const useCAPAStore = create<CAPAState>()(
  immer((set, get) => ({
    // Initial State
    capas: [],
    currentCAPA: null,
    dashboardStats: null,
    isLoading: false,
    error: null,
    filters: {},

    // Fetch all CAPAs with optional filters
    fetchCAPAs: async (filters?: CAPAFilters) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
        if (filters) {
          state.filters = filters;
        }
      });

      try {
        const capaRef = collection(db, 'capas');
        let q = query(capaRef, orderBy('createdAt', 'desc'));

        // Apply filters
        const currentFilters = filters || get().filters;

        if (currentFilters.status && currentFilters.status.length > 0) {
          q = query(q, where('status', 'in', currentFilters.status));
        }

        if (currentFilters.type) {
          q = query(q, where('type', '==', currentFilters.type));
        }

        if (currentFilters.severity && currentFilters.severity.length > 0) {
          q = query(q, where('severity', 'in', currentFilters.severity));
        }

        const snapshot = await getDocs(q);
        let capas = snapshot.docs.map(convertCAPAFromFirestore);

        // Client-side filtering for complex filters
        if (currentFilters.search) {
          const searchLower = currentFilters.search.toLowerCase();
          capas = capas.filter(
            (c) =>
              c.title.toLowerCase().includes(searchLower) ||
              c.description.toLowerCase().includes(searchLower) ||
              c.capaNumber.toLowerCase().includes(searchLower)
          );
        }

        if (currentFilters.owner) {
          capas = capas.filter((c) => c.owner === currentFilters.owner);
        }

        set((state) => {
          state.capas = capas;
          state.isLoading = false;
        });
      } catch (error) {
        logger.error('[CAPA Store] Failed to fetch CAPAs:', error);
        set((state) => {
          state.error = 'CAPA 목록을 불러오는데 실패했습니다.';
          state.isLoading = false;
        });
      }
    },

    // Fetch single CAPA by ID
    fetchCAPAById: async (id: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const docRef = doc(db, 'capas', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          set((state) => {
            state.error = 'CAPA를 찾을 수 없습니다.';
            state.isLoading = false;
          });
          return null;
        }

        const capa = convertCAPAFromFirestore({
          id: docSnap.id,
          data: () => docSnap.data(),
        });

        set((state) => {
          state.currentCAPA = capa;
          state.isLoading = false;
        });

        return capa;
      } catch (error) {
        logger.error('[CAPA Store] Failed to fetch CAPA:', error);
        set((state) => {
          state.error = 'CAPA를 불러오는데 실패했습니다.';
          state.isLoading = false;
        });
        return null;
      }
    },

    // Create new CAPA
    createCAPA: async (input: CAPAInput) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const now = Timestamp.now();
        const capaData = {
          capaNumber: generateCAPANumber(),
          title: input.title,
          description: input.description,
          type: input.type,
          status: 'discovery' as CAPAStatus,
          severity: input.severity,
          priority: input.priority,
          source: input.source,
          discovery: {
            ...input.discovery,
            discoveredAt: now,
          },
          owner: input.owner,
          team: input.team || [],
          relatedTrainingPrograms: input.relatedTrainingPrograms || [],
          createdBy: input.owner,
          createdAt: now,
          updatedAt: now,
          dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
        };

        const docRef = await addDoc(collection(db, 'capas'), capaData);

        logger.log('[CAPA Store] Created CAPA:', docRef.id);

        // Refresh list
        await get().fetchCAPAs();

        set((state) => {
          state.isLoading = false;
        });

        return docRef.id;
      } catch (error) {
        logger.error('[CAPA Store] Failed to create CAPA:', error);
        set((state) => {
          state.error = 'CAPA 생성에 실패했습니다.';
          state.isLoading = false;
        });
        throw error;
      }
    },

    // Update CAPA basic info
    updateCAPA: async (id: string, update: CAPAUpdate) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const docRef = doc(db, 'capas', id);
        await updateDoc(docRef, {
          ...update,
          updatedAt: Timestamp.now(),
          dueDate: update.dueDate ? Timestamp.fromDate(update.dueDate) : undefined,
        });

        logger.log('[CAPA Store] Updated CAPA:', id);

        // Refresh current CAPA if it's the one being edited
        if (get().currentCAPA?.id === id) {
          await get().fetchCAPAById(id);
        }

        // Refresh list
        await get().fetchCAPAs();

        set((state) => {
          state.isLoading = false;
        });
      } catch (error) {
        logger.error('[CAPA Store] Failed to update CAPA:', error);
        set((state) => {
          state.error = 'CAPA 업데이트에 실패했습니다.';
          state.isLoading = false;
        });
        throw error;
      }
    },

    // Update CAPA stage (workflow transition)
    updateCAPAStage: async (id: string, stageUpdate: CAPAStageUpdate) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const now = Timestamp.now();
        const updateData: Record<string, unknown> = {
          status: stageUpdate.status,
          updatedAt: now,
        };

        // Add stage-specific data
        if (stageUpdate.investigation) {
          updateData.investigation = {
            ...stageUpdate.investigation,
            investigatedAt: now,
          };
        }

        if (stageUpdate.action) {
          updateData.action = {
            ...stageUpdate.action,
            plannedAt: now,
          };
        }

        if (stageUpdate.verification) {
          updateData.verification = {
            ...stageUpdate.verification,
            verifiedAt: now,
          };
        }

        if (stageUpdate.closure) {
          updateData.closure = {
            ...stageUpdate.closure,
            closedAt: now,
          };
        }

        const docRef = doc(db, 'capas', id);
        await updateDoc(docRef, updateData);

        logger.log('[CAPA Store] Updated CAPA stage:', id, stageUpdate.status);

        // Refresh current CAPA
        await get().fetchCAPAById(id);

        // Refresh list
        await get().fetchCAPAs();

        set((state) => {
          state.isLoading = false;
        });
      } catch (error) {
        logger.error('[CAPA Store] Failed to update CAPA stage:', error);
        set((state) => {
          state.error = 'CAPA 단계 업데이트에 실패했습니다.';
          state.isLoading = false;
        });
        throw error;
      }
    },

    // Fetch dashboard statistics
    fetchDashboardStats: async () => {
      try {
        const capaRef = collection(db, 'capas');
        const snapshot = await getDocs(capaRef);
        const capas = snapshot.docs.map(convertCAPAFromFirestore);
        const stats = calculateDashboardStats(capas);

        set((state) => {
          state.dashboardStats = stats;
        });
      } catch (error) {
        logger.error('[CAPA Store] Failed to fetch dashboard stats:', error);
      }
    },

    // Set filters
    setFilters: (filters: CAPAFilters) => {
      set((state) => {
        state.filters = filters;
      });
    },

    // Clear error
    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    // Set current CAPA
    setCurrentCAPA: (capa: CAPA | null) => {
      set((state) => {
        state.currentCAPA = capa;
      });
    },
  }))
);

// Selector hooks for common data access patterns
export const selectCAPAsByStatus = (status: CAPAStatus) => (state: CAPAState) =>
  state.capas.filter((c) => c.status === status);

export const selectOverdueCAPAs = (state: CAPAState) => {
  const now = new Date();
  return state.capas.filter((c) => {
    if (c.status === 'closed' || c.status === 'rejected') return false;
    if (!c.dueDate) return false;
    const dueDate = c.dueDate instanceof Date ? c.dueDate : (c.dueDate as Timestamp).toDate();
    return dueDate < now;
  });
};
