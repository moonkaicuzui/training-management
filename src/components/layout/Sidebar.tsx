import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Grid3X3,
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  X,
  UserCheck,
  FileBarChart,
  Award,
  GraduationCap,
  CalendarClock,
  History,
  Bell,
  BarChart3,
  FolderOpen,
  UserPlus,
  UserMinus,
  Settings,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/stores/uiStore';

interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    titleKey: 'nav.dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    titleKey: 'nav.programs',
    href: '/programs',
    icon: BookOpen,
  },
  {
    titleKey: 'nav.progress',
    href: '/progress',
    icon: Grid3X3,
  },
  {
    titleKey: 'nav.schedule',
    href: '/schedule',
    icon: Calendar,
  },
  {
    titleKey: 'nav.attendance',
    href: '/attendance',
    icon: UserCheck,
  },
  {
    titleKey: 'nav.results',
    href: '/results',
    icon: ClipboardCheck,
  },
  {
    titleKey: 'nav.employees',
    href: '/employees',
    icon: Users,
  },
];

const secondaryItems: NavItem[] = [
  {
    titleKey: 'nav.retraining',
    href: '/retraining',
    icon: AlertTriangle,
  },
  {
    titleKey: 'nav.certificates',
    href: '/certificates',
    icon: Award,
  },
  {
    titleKey: 'nav.reports',
    href: '/reports',
    icon: FileBarChart,
  },
  {
    titleKey: 'nav.notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    titleKey: 'nav.evaluation',
    href: '/evaluation',
    icon: BarChart3,
  },
  {
    titleKey: 'nav.materials',
    href: '/materials',
    icon: FolderOpen,
  },
];

const adminItems: NavItem[] = [
  {
    titleKey: 'nav.trainers',
    href: '/trainers',
    icon: GraduationCap,
  },
  {
    titleKey: 'nav.trainingPlan',
    href: '/training-plan',
    icon: CalendarClock,
  },
  {
    titleKey: 'nav.auditLog',
    href: '/audit-log',
    icon: History,
  },
];

// New TQC (신입 TQC 교육) 메뉴
const newTQCItems: NavItem[] = [
  {
    titleKey: 'nav.newTQC.dashboard',
    href: '/new-tqc/dashboard',
    icon: LayoutDashboard,
  },
  {
    titleKey: 'nav.newTQC.trainees',
    href: '/new-tqc/trainees',
    icon: UserPlus,
  },
  {
    titleKey: 'nav.newTQC.meetings',
    href: '/new-tqc/meetings',
    icon: CalendarDays,
  },
  {
    titleKey: 'nav.newTQC.resignations',
    href: '/new-tqc/resignations',
    icon: UserMinus,
  },
  {
    titleKey: 'nav.newTQC.settings',
    href: '/new-tqc/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r bg-background transition-transform duration-300 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              QT
            </div>
            <span className="font-semibold">Q-TRAIN</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] md:h-screen py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              {t('sidebar.mainMenu')}
            </h2>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive || (item.href === '/' && location.pathname === '/')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.titleKey)}
                  {item.badge && (
                    <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <Separator className="my-4" />

          {/* New TQC Section */}
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              {t('sidebar.newTQC')}
            </h2>
            <nav className="space-y-1">
              {newTQCItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.titleKey)}
                </NavLink>
              ))}
            </nav>
          </div>

          <Separator className="my-4" />

          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              {t('sidebar.management')}
            </h2>
            <nav className="space-y-1">
              {secondaryItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.titleKey)}
                </NavLink>
              ))}
            </nav>
          </div>

          <Separator className="my-4" />

          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              {t('sidebar.admin')}
            </h2>
            <nav className="space-y-1">
              {adminItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.titleKey)}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="mt-auto px-3 py-4">
            <Separator className="mb-4" />
            <div className="rounded-lg bg-muted p-4">
              <h3 className="text-sm font-semibold mb-2">{t('sidebar.quickStats')}</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('sidebar.monthlyTrainings')}</span>
                  <span className="font-medium text-foreground">12</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('sidebar.passRate')}</span>
                  <span className="font-medium text-status-pass">95%</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('sidebar.retrainingNeeded')}</span>
                  <span className="font-medium text-destructive">3</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
