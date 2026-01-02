/**
 * Bottom Navigation Component
 * 모바일 전용 하단 내비게이션 바
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 하단 네비게이션에 표시할 주요 메뉴 (4개 + 더보기)
const bottomNavItems: NavItem[] = [
  {
    titleKey: 'nav.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    titleKey: 'nav.programs',
    href: '/programs',
    icon: BookOpen,
  },
  {
    titleKey: 'nav.schedule',
    href: '/schedule',
    icon: Calendar,
  },
  {
    titleKey: 'nav.employees',
    href: '/employees',
    icon: Users,
  },
];

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setSidebarOpen } = useUIStore();

  // Check if current path matches any main nav item
  const isOnMainPage = bottomNavItems.some(item =>
    location.pathname === item.href ||
    (item.href === '/dashboard' && location.pathname === '/')
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t safe-area-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-5 h-16">
        {bottomNavItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href === '/dashboard' && location.pathname === '/');

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-transform',
                  isActive && 'scale-110'
                )}
              />
              <span className="truncate max-w-[64px]">{t(item.titleKey)}</span>
            </NavLink>
          );
        })}

        {/* More Button - Opens Sidebar */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
            !isOnMainPage
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label={t('common.viewAll')}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="truncate max-w-[64px]">{t('common.viewAll')}</span>
        </button>
      </div>
    </nav>
  );
}
