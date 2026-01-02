/**
 * useToast hook
 * shadcn/ui 호환 toast 인터페이스를 제공합니다.
 */

import { useUIStore } from '@/stores/uiStore';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const addToast = useUIStore((state) => state.addToast);

  const toast = (options: ToastOptions) => {
    const type = options.variant === 'destructive' ? 'error' : 'success';
    addToast({
      type,
      title: options.title,
      message: options.description,
    });
  };

  return { toast };
}
