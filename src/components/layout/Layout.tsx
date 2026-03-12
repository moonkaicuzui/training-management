import { useState, lazy, Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Lazy-load: Dialog UI (~25KB source) only needed when user presses '?'
const KeyboardShortcutsDialog = lazy(() =>
  import('@/components/common/KeyboardShortcutsDialog').then(m => ({ default: m.KeyboardShortcutsDialog }))
);

export default function Layout() {
  const navigate = useNavigate();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Global keyboard shortcuts for navigation
  useKeyboardShortcuts([
    { key: '?', handler: () => setShortcutsOpen(true) },
    { key: 'g+d', handler: () => navigate('/dashboard') },
    { key: 'g+e', handler: () => navigate('/employees') },
    { key: 'g+p', handler: () => navigate('/programs') },
    { key: 'g+r', handler: () => navigate('/results') },
    { key: 'g+s', handler: () => navigate('/schedule') },
    { key: 'Escape', handler: () => setShortcutsOpen(false), global: true },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:top-2 focus:left-2">
        Skip to main content
      </a>
      <Header />
      <div className="flex">
        <Sidebar />
        <main id="main-content" className="flex-1 overflow-auto">
          {/* Add bottom padding on mobile to account for bottom nav */}
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Keyboard Shortcuts Dialog (lazy-loaded) */}
      {shortcutsOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        </Suspense>
      )}
    </div>
  );
}
