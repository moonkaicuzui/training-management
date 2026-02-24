import { useState, useCallback, useMemo } from 'react';
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
  Building2,
  Shield,
  FolderKanban,
  CheckCircle2,
  ShieldCheck,
  FileWarning,
  RefreshCcw,
  Search,
  BookOpenCheck,
  Microscope,
  ClipboardList,
  ListChecks,
  FileSearch,
  PieChart,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUIStore } from '@/stores/uiStore';

// ─── Types ───────────────────────────────────────────

interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

interface NavCategory {
  labelKey: string;
  sections: NavSection[];
}

// ─── Navigation Data ─────────────────────────────────

// 1. Overview & Reports
const overviewItems: NavItem[] = [
  { titleKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { titleKey: 'nav.executive', href: '/executive', icon: Building2 },
  { titleKey: 'nav.department', href: '/department', icon: BarChart3 },
  { titleKey: 'nav.reports', href: '/reports', icon: FileBarChart },
  { titleKey: 'nav.executiveReport', href: '/executive-report', icon: PieChart },
  { titleKey: 'nav.trainingPlan', href: '/training-plan', icon: CalendarClock },
];

// 2. Training Operations
const trainingOpsItems: NavItem[] = [
  { titleKey: 'nav.programIntro', href: '/program-intro', icon: BookOpenCheck },
  { titleKey: 'nav.programs', href: '/programs', icon: BookOpen },
  { titleKey: 'nav.schedule', href: '/schedule', icon: Calendar },
  { titleKey: 'nav.attendance', href: '/attendance', icon: UserCheck },
  { titleKey: 'nav.results', href: '/results', icon: ClipboardCheck },
  { titleKey: 'nav.progress', href: '/progress', icon: Grid3X3 },
  { titleKey: 'nav.inspection.enrollments', href: '/inspection/enrollments', icon: ClipboardList },
];

// 3. Follow-up Management
const followUpItems: NavItem[] = [
  { titleKey: 'nav.retraining', href: '/retraining', icon: AlertTriangle },
  { titleKey: 'nav.certificates', href: '/certificates', icon: Award },
  { titleKey: 'nav.evaluation', href: '/evaluation', icon: BarChart3 },
];

// 4. People & Competency
const peopleItems: NavItem[] = [
  { titleKey: 'nav.employees', href: '/employees', icon: Users },
  { titleKey: 'nav.trainers', href: '/trainers', icon: GraduationCap },
  { titleKey: 'nav.competency', href: '/competency', icon: Grid3X3 },
  { titleKey: 'nav.skillGap', href: '/skill-gap', icon: BarChart3 },
];

// 5. New TQC Training
const newTQCItems: NavItem[] = [
  { titleKey: 'nav.newTQC.dashboard', href: '/new-tqc/dashboard', icon: LayoutDashboard },
  { titleKey: 'nav.newTQC.trainees', href: '/new-tqc/trainees', icon: UserPlus },
  { titleKey: 'nav.newTQC.meetings', href: '/new-tqc/meetings', icon: CalendarDays },
  { titleKey: 'nav.newTQC.finalResult', href: '/new-tqc/final-result', icon: ClipboardCheck },
  { titleKey: 'nav.newTQC.certificates', href: '/new-tqc/certificates', icon: Award },
  { titleKey: 'nav.newTQC.resignations', href: '/new-tqc/resignations', icon: UserMinus },
  { titleKey: 'nav.newTQC.settings', href: '/new-tqc/settings', icon: Settings },
];

// 6. Projects & CAPA
const projectsCapaItems: NavItem[] = [
  { titleKey: 'nav.projects.dashboard', href: '/projects/dashboard', icon: FolderKanban },
  { titleKey: 'nav.projects.members', href: '/projects/members', icon: Users },
  { titleKey: 'nav.projects.tasks', href: '/projects/tasks', icon: CheckCircle2 },
  { titleKey: 'nav.projects.calendar', href: '/projects/calendar', icon: CalendarDays },
  { titleKey: 'nav.projects.settings', href: '/projects/settings', icon: Settings },
  { titleKey: 'nav.capa.dashboard', href: '/capa', icon: ShieldCheck },
  { titleKey: 'nav.capa.new', href: '/capa/new', icon: FileWarning },
];

// 7. Inspection Training AQL/5PRS
const inspectionItems: NavItem[] = [
  { titleKey: 'nav.inspection.dashboard', href: '/inspection/dashboard', icon: Microscope },
  { titleKey: 'nav.inspection.result', href: '/inspection/result', icon: ClipboardCheck },
  { titleKey: 'nav.inspection.history', href: '/inspection/history', icon: History },
  { titleKey: 'nav.aql.dashboard', href: '/aql', icon: ListChecks },
  { titleKey: 'nav.aql.trainingRecommendations', href: '/aql/training-recommendations', icon: GraduationCap },
  { titleKey: 'nav.fivePrs.dashboard', href: '/five-prs', icon: FileSearch },
  { titleKey: 'nav.fivePrs.trainingRecommendations', href: '/five-prs/training-recommendations', icon: Search },
];

// 8. System Admin
const systemAdminItems: NavItem[] = [
  { titleKey: 'nav.notifications', href: '/notifications', icon: Bell },
  { titleKey: 'nav.audit', href: '/audit', icon: Shield },
  { titleKey: 'nav.auditLog', href: '/audit-log', icon: History },
  { titleKey: 'nav.materials', href: '/materials', icon: FolderOpen },
  { titleKey: 'nav.dataSync', href: '/data-sync', icon: RefreshCcw },
];

// ─── Categories (역할별 상위 그룹) ────────────────────

const categories: NavCategory[] = [
  {
    labelKey: 'sidebar.cat.overview',
    sections: [
      { titleKey: 'sidebar.overview', items: overviewItems },
    ],
  },
  {
    labelKey: 'sidebar.cat.training',
    sections: [
      { titleKey: 'sidebar.trainingOps', items: trainingOpsItems },
      { titleKey: 'sidebar.followUp', items: followUpItems },
    ],
  },
  {
    labelKey: 'sidebar.cat.people',
    sections: [
      { titleKey: 'sidebar.peopleCompetency', items: peopleItems },
      { titleKey: 'sidebar.newTQC', items: newTQCItems },
    ],
  },
  {
    labelKey: 'sidebar.cat.quality',
    sections: [
      { titleKey: 'sidebar.projectsCapa', items: projectsCapaItems },
      { titleKey: 'sidebar.inspectionAqlFivePrs', items: inspectionItems },
    ],
  },
  {
    labelKey: 'sidebar.cat.system',
    sections: [
      { titleKey: 'sidebar.systemAdmin', items: systemAdminItems },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────

const STORAGE_KEY = 'q-train-sidebar-sections';

function loadOpenSections(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch { /* ignore */ }
  return new Set<string>();
}

function saveOpenSections(sections: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...sections]));
}

function findSectionForPath(pathname: string): string | null {
  for (const category of categories) {
    for (const section of category.sections) {
      for (const item of section.items) {
        if (item.href === '/' && pathname === '/') return section.titleKey;
        if (item.href !== '/' && pathname.startsWith(item.href)) return section.titleKey;
      }
    }
  }
  return null;
}

// ─── Component ───────────────────────────────────────

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const activeSectionKey = useMemo(
    () => findSectionForPath(location.pathname),
    [location.pathname]
  );

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const saved = loadOpenSections();
    // 현재 라우트에 해당하는 섹션은 항상 열기
    if (activeSectionKey) saved.add(activeSectionKey);
    // 저장된 것이 하나도 없으면 첫 섹션(overview) 열기
    if (saved.size === 0) saved.add('sidebar.overview');
    return saved;
  });

  const toggleSection = useCallback((titleKey: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(titleKey)) {
        next.delete(titleKey);
      } else {
        next.add(titleKey);
      }
      saveOpenSections(next);
      return next;
    });
  }, []);

  // NavLink 클릭 시 해당 섹션이 닫혀 있으면 자동으로 열기
  const handleNavClick = useCallback((sectionKey: string) => {
    setSidebarOpen(false);
    if (!openSections.has(sectionKey)) {
      setOpenSections((prev) => {
        const next = new Set(prev);
        next.add(sectionKey);
        saveOpenSections(next);
        return next;
      });
    }
  }, [openSections, setSidebarOpen]);

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

        <ScrollArea className="h-[calc(100vh-4rem)] md:h-screen py-2">
          {categories.map((category, catIdx) => (
            <div key={category.labelKey}>
              {/* Category Label */}
              <div className={cn('px-5 pt-4 pb-1', catIdx === 0 && 'pt-2')}>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">
                  {t(category.labelKey)}
                </span>
              </div>

              {/* Sections within category */}
              {category.sections.map((section) => {
                const isOpen = openSections.has(section.titleKey);
                const hasActiveItem = section.items.some(
                  (item) =>
                    (item.href === '/' && location.pathname === '/') ||
                    (item.href !== '/' && location.pathname.startsWith(item.href))
                );

                return (
                  <Collapsible
                    key={section.titleKey}
                    open={isOpen}
                    onOpenChange={() => toggleSection(section.titleKey)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          'flex w-full items-center justify-between px-5 py-1.5 text-xs font-semibold tracking-tight transition-colors',
                          isOpen || hasActiveItem
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span className="truncate">{t(section.titleKey)}</span>
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                            isOpen ? 'rotate-0' : '-rotate-90'
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <nav className="space-y-0.5 px-3 pb-1">
                        {section.items.map((item) => (
                          <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={() => handleNavClick(section.titleKey)}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                isActive || (item.href === '/' && location.pathname === '/')
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-primary/70 hover:bg-primary/10 hover:text-primary'
                              )
                            }
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{t(item.titleKey)}</span>
                            {item.badge && (
                              <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        ))}
                      </nav>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          ))}

          {/* Quick Stats */}
          <div className="px-3 py-4">
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
