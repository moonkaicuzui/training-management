import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { KeyboardShortcutsDialog } from '@/components/common/KeyboardShortcutsDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

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
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {/* Add bottom padding on mobile to account for bottom nav */}
          <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
