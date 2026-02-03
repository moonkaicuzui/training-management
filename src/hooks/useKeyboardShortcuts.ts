import { useEffect, useCallback, useRef } from 'react';

type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  /** If true, the shortcut works even when an input/textarea is focused */
  global?: boolean;
}

/**
 * Global keyboard shortcuts hook.
 * Supports modifier keys and sequential key combos (e.g., g then d).
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const sequenceRef = useRef<{ key: string; time: number } | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        if (!shortcut.global && isInput) continue;

        const metaOrCtrl = shortcut.meta || shortcut.ctrl;

        // Handle modifier shortcuts (Cmd+K, Ctrl+K, etc.)
        if (metaOrCtrl) {
          const modifierPressed = e.metaKey || e.ctrlKey;
          if (
            modifierPressed &&
            e.key.toLowerCase() === shortcut.key.toLowerCase() &&
            (!shortcut.shift || e.shiftKey)
          ) {
            e.preventDefault();
            shortcut.handler();
            return;
          }
          continue;
        }

        // Handle sequential shortcuts (g+d, g+e, etc.)
        if (shortcut.key.includes('+') && !shortcut.meta && !shortcut.ctrl) {
          const [firstKey, secondKey] = shortcut.key.split('+');
          if (
            sequenceRef.current &&
            sequenceRef.current.key === firstKey &&
            Date.now() - sequenceRef.current.time < 500 &&
            e.key.toLowerCase() === secondKey.toLowerCase()
          ) {
            e.preventDefault();
            sequenceRef.current = null;
            shortcut.handler();
            return;
          }
          continue;
        }

        // Handle single key shortcuts (?, Escape)
        if (
          e.key === shortcut.key &&
          !e.metaKey &&
          !e.ctrlKey &&
          (!shortcut.shift || e.shiftKey)
        ) {
          // For Escape, always allow
          if (shortcut.key === 'Escape') {
            shortcut.handler();
            return;
          }
          // For other single keys, block when in input
          if (isInput) continue;
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }

      // Track first key of sequences
      if (!isInput && !e.metaKey && !e.ctrlKey && e.key.length === 1) {
        sequenceRef.current = { key: e.key.toLowerCase(), time: Date.now() };
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
