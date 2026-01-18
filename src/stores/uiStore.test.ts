/**
 * UI Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useUIStore } from './uiStore';

// Mock i18n
vi.mock('@/i18n', () => ({
  default: {
    changeLanguage: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useUIStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    // Reset to initial state
    useUIStore.setState({
      language: 'vi',
      sidebarOpen: true,
      isLoading: false,
      toasts: [],
      activeModal: null,
      modalData: null,
      globalSearchQuery: '',
    });

    // Clear mock calls
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('language', () => {
    it('should have default language as vi', () => {
      const { language } = useUIStore.getState();
      expect(language).toBe('vi');
    });

    it('should change language', () => {
      const { setLanguage } = useUIStore.getState();

      setLanguage('en');

      expect(useUIStore.getState().language).toBe('en');
    });

    it('should save language to localStorage', () => {
      const { setLanguage } = useUIStore.getState();

      setLanguage('ko');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('q-train-language', 'ko');
    });
  });

  describe('sidebar', () => {
    it('should have sidebar open by default', () => {
      const { sidebarOpen } = useUIStore.getState();
      expect(sidebarOpen).toBe(true);
    });

    it('should set sidebar state', () => {
      const { setSidebarOpen } = useUIStore.getState();

      setSidebarOpen(false);

      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it('should toggle sidebar', () => {
      const { toggleSidebar } = useUIStore.getState();

      expect(useUIStore.getState().sidebarOpen).toBe(true);

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('loading', () => {
    it('should have loading false by default', () => {
      const { isLoading } = useUIStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should set loading state', () => {
      const { setLoading } = useUIStore.getState();

      setLoading(true);
      expect(useUIStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useUIStore.getState().isLoading).toBe(false);
    });
  });

  describe('toasts', () => {
    it('should have empty toasts by default', () => {
      const { toasts } = useUIStore.getState();
      expect(toasts).toEqual([]);
    });

    it('should add a toast', () => {
      const { addToast } = useUIStore.getState();

      addToast({
        type: 'success',
        title: 'Success',
        message: 'Test message',
      });

      const { toasts } = useUIStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Success');
      expect(toasts[0].id).toBeDefined();
    });

    it('should add multiple toasts', () => {
      const { addToast } = useUIStore.getState();

      addToast({ type: 'success', title: 'Success' });
      addToast({ type: 'error', title: 'Error' });
      addToast({ type: 'info', title: 'Info' });

      const { toasts } = useUIStore.getState();
      expect(toasts).toHaveLength(3);
    });

    it('should remove a toast by id', () => {
      const { addToast, removeToast } = useUIStore.getState();

      // Add a toast with duration 0 to prevent auto-removal
      addToast({ type: 'success', title: 'Test', duration: 0 });

      const toastId = useUIStore.getState().toasts[0].id;

      removeToast(toastId);

      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('should auto-remove toast after duration', async () => {
      vi.useFakeTimers();

      const { addToast } = useUIStore.getState();

      addToast({ type: 'success', title: 'Test', duration: 1000 });

      expect(useUIStore.getState().toasts).toHaveLength(1);

      // Fast-forward time
      vi.advanceTimersByTime(1001);

      expect(useUIStore.getState().toasts).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should not auto-remove toast when duration is 0', async () => {
      vi.useFakeTimers();

      const { addToast } = useUIStore.getState();

      addToast({ type: 'success', title: 'Persistent', duration: 0 });

      // Fast-forward a lot of time
      vi.advanceTimersByTime(60000);

      expect(useUIStore.getState().toasts).toHaveLength(1);

      vi.useRealTimers();
    });
  });

  describe('modals', () => {
    it('should have no active modal by default', () => {
      const { activeModal, modalData } = useUIStore.getState();
      expect(activeModal).toBeNull();
      expect(modalData).toBeNull();
    });

    it('should open a modal', () => {
      const { openModal } = useUIStore.getState();

      openModal('confirm-delete');

      expect(useUIStore.getState().activeModal).toBe('confirm-delete');
    });

    it('should open a modal with data', () => {
      const { openModal } = useUIStore.getState();
      const testData = { id: 123, name: 'Test' };

      openModal('edit-item', testData);

      expect(useUIStore.getState().activeModal).toBe('edit-item');
      expect(useUIStore.getState().modalData).toEqual(testData);
    });

    it('should close modal and clear data', () => {
      const { openModal, closeModal } = useUIStore.getState();

      openModal('test-modal', { someData: true });

      closeModal();

      expect(useUIStore.getState().activeModal).toBeNull();
      expect(useUIStore.getState().modalData).toBeNull();
    });
  });

  describe('global search', () => {
    it('should have empty search query by default', () => {
      const { globalSearchQuery } = useUIStore.getState();
      expect(globalSearchQuery).toBe('');
    });

    it('should set search query', () => {
      const { setGlobalSearchQuery } = useUIStore.getState();

      setGlobalSearchQuery('test search');

      expect(useUIStore.getState().globalSearchQuery).toBe('test search');
    });

    it('should clear search query', () => {
      const { setGlobalSearchQuery } = useUIStore.getState();

      setGlobalSearchQuery('something');
      setGlobalSearchQuery('');

      expect(useUIStore.getState().globalSearchQuery).toBe('');
    });
  });
});
