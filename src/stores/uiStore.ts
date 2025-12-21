import { create } from 'zustand';
import type { Language, ToastMessage } from '@/types';

interface UIState {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Modals
  activeModal: string | null;
  modalData: unknown;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;

  // Search
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Language - default to Vietnamese
  language: 'vi',
  setLanguage: (lang) => {
    set({ language: lang });
    localStorage.setItem('q-train-language', lang);
  },

  // Sidebar - default open on desktop
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Toast notifications
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newToast: ToastMessage = { ...toast, id };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Modals
  activeModal: null,
  modalData: null,
  openModal: (modalId, data = null) =>
    set({ activeModal: modalId, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Search
  globalSearchQuery: '',
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
}));

// Initialize language from localStorage
if (typeof window !== 'undefined') {
  const savedLanguage = localStorage.getItem('q-train-language') as Language;
  if (savedLanguage && ['vi', 'ko', 'en'].includes(savedLanguage)) {
    useUIStore.getState().setLanguage(savedLanguage);
  }
}
