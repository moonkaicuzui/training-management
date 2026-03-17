import { useState, useCallback, useMemo, useEffect, memo } from 'react';
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
  Newspaper,
  Gauge,
  Package,
  FileCheck,
  Camera,
  Sticker,
  MessageSquarePlus,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useShallow } from 'zustand/react/shallow';
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
  { titleKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { titleKey: 'nav.executive', href: '/executive', icon: Building2 },
  { titleKey: 'nav.department', href: '/department', icon: BarChart3 },
  { titleKey: 'nav.reports', href: '/reports', icon: FileBarChart },
  { titleKey: 'nav.qualityBlog', href: '/quality-blog', icon: Newspaper },
  { titleKey: 'nav.qaActivityBoard', href: '/quality-blog?category=qa_activity', icon: Camera },
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
  { titleKey: 'nav.trainerDirectives', href: '/trainer-directives', icon: FileBarChart },
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
  { titleKey: 'nav.inspectorStickers', href: '/inspector-stickers', icon: Sticker },
];

// 8. Equipment Compliance (금속 탐지기 등)
const equipmentComplianceItems: NavItem[] = [
  { titleKey: 'nav.equipment.mdDashboard', href: '/equipment/metal-detector', icon: Gauge },
  { titleKey: 'nav.equipment.mdInput', href: '/equipment/metal-detector/input', icon: ClipboardList },
  { titleKey: 'nav.equipment.mdHistory', href: '/equipment/metal-detector/history', icon: History },
  { titleKey: 'nav.equipment.mdReport', href: '/equipment/metal-detector/report', icon: FileBarChart },
];

// 9. TECH / NEW MODEL
const techItems: NavItem[] = [
  { titleKey: 'nav.tech.models', href: '/tech/models', icon: Package },
  { titleKey: 'nav.tech.reviewGuidelines', href: '/tech/review-guidelines', icon: FileCheck },
];

// 10. System Admin
const systemAdminItems: NavItem[] = [
  { titleKey: 'nav.notifications', href: '/notifications', icon: Bell },
  { titleKey: 'nav.audit', href: '/audit', icon: Shield },
  { titleKey: 'nav.auditLog', href: '/audit-log', icon: History },
  { titleKey: 'nav.materials', href: '/materials', icon: FolderOpen },
  { titleKey: 'nav.dataSync', href: '/data-sync', icon: RefreshCcw },
  { titleKey: 'nav.hrSync', href: '/hr-sync', icon: UserCog },
  { titleKey: 'nav.hrAnalytics', href: '/hr-analytics', icon: BarChart3 },
  { titleKey: 'nav.systemFeedback', href: '/system-feedback', icon: MessageSquarePlus },
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
      { titleKey: 'sidebar.equipmentCompliance', items: equipmentComplianceItems },
      { titleKey: 'sidebar.techNewModel', items: techItems },
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

/** 경로가 네비게이션 아이템에 매칭되는지 확인 (경로 세그먼트 기반) */
function isPathMatch(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  // href에서 쿼리 파라미터 제거 후 비교
  const hrefPath = href.split('?')[0];
  // 정확한 매칭 또는 하위 경로 매칭 (세그먼트 단위)
  return pathname === hrefPath || pathname.startsWith(hrefPath + '/');
}

function findSectionForPath(pathname: string): string | null {
  let bestMatch: { titleKey: string; pathLength: number } | null = null;

  for (const category of categories) {
    for (const section of category.sections) {
      for (const item of section.items) {
        if (isPathMatch(pathname, item.href)) {
          // 가장 긴 (=가장 구체적인) 경로 매칭을 선택
          if (!bestMatch || item.href.length > bestMatch.pathLength) {
            bestMatch = { titleKey: section.titleKey, pathLength: item.href.length };
          }
        }
      }
    }
  }
  return bestMatch?.titleKey ?? null;
}

// ─── Component ───────────────────────────────────────

export const Sidebar = memo(function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useUIStore(useShallow((state) => ({ sidebarOpen: state.sidebarOpen, setSidebarOpen: state.setSidebarOpen })));

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

  // 라우트 변경 시 해당 섹션 자동 열기
  useEffect(() => {
    if (activeSectionKey && !openSections.has(activeSectionKey)) {
      setOpenSections((prev) => {
        const next = new Set(prev);
        next.add(activeSectionKey);
        saveOpenSections(next);
        return next;
      });
    }
  }, [activeSectionKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
        aria-label={t('common.aria.sidebar')}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              QT
            </div>
            <span className="font-semibold">QIP</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            aria-label={t('common.aria.closeSidebar')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="h-[calc(100vh-4rem)] md:h-screen py-2 overflow-y-auto overflow-x-hidden scrollbar-thin">
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
                  (item) => isPathMatch(location.pathname, item.href)
                );

                return (
                  <div
                    key={section.titleKey}
                    className={cn(
                      'transition-colors duration-200',
                      isOpen && 'bg-blue-50 dark:bg-blue-950/30'
                    )}
                  >
                    <button
                      onClick={() => toggleSection(section.titleKey)}
                      className={cn(
                        'flex w-full items-center justify-between px-5 py-1.5 text-xs font-semibold tracking-tight transition-colors',
                        isOpen
                          ? 'text-blue-600 dark:text-blue-400'
                          : hasActiveItem
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-expanded={isOpen}
                    >
                      <span className="truncate">{t(section.titleKey)}</span>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                          isOpen ? 'rotate-0' : '-rotate-90'
                        )}
                      />
                    </button>

                    {isOpen && (
                      <nav className="space-y-0.5 px-3 pb-1 border-l-2 border-blue-400 dark:border-blue-500 ml-4 mr-1">
                        {section.items.map((item) => (
                          <NavLink
                            key={item.href}
                            to={item.href}
                            end={item.href === '/'}
                            onClick={() => handleNavClick(section.titleKey)}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300'
                              )
                            }
                            aria-current={isPathMatch(location.pathname, item.href) ? 'page' : undefined}
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
                    )}
                  </div>
                );
              })}
            </div>
          ))}

        </div>
      </aside>
    </>
  );
});
