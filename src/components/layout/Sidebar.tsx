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

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

// 1. Dashboards
const dashboardItems: NavItem[] = [
  { titleKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { titleKey: 'nav.executive', href: '/executive', icon: Building2 },
  { titleKey: 'nav.department', href: '/department', icon: BarChart3 },
];

// 2. Training Operations
const trainingOpsItems: NavItem[] = [
  { titleKey: 'nav.programIntro', href: '/program-intro', icon: BookOpenCheck },
  { titleKey: 'nav.programs', href: '/programs', icon: BookOpen },
  { titleKey: 'nav.schedule', href: '/schedule', icon: Calendar },
  { titleKey: 'nav.attendance', href: '/attendance', icon: UserCheck },
  { titleKey: 'nav.results', href: '/results', icon: ClipboardCheck },
  { titleKey: 'nav.progress', href: '/progress', icon: Grid3X3 },
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

// 6. Projects
const projectItems: NavItem[] = [
  { titleKey: 'nav.projects.dashboard', href: '/projects/dashboard', icon: FolderKanban },
  { titleKey: 'nav.projects.members', href: '/projects/members', icon: Users },
  { titleKey: 'nav.projects.tasks', href: '/projects/tasks', icon: CheckCircle2 },
  { titleKey: 'nav.projects.calendar', href: '/projects/calendar', icon: CalendarDays },
  { titleKey: 'nav.projects.settings', href: '/projects/settings', icon: Settings },
];

// 7. Inspection Training (검사 교육)
const inspectionItems: NavItem[] = [
  { titleKey: 'nav.inspection.dashboard', href: '/inspection/dashboard', icon: Microscope },
  { titleKey: 'nav.inspection.result', href: '/inspection/result', icon: ClipboardCheck },
  { titleKey: 'nav.inspection.enrollments', href: '/inspection/enrollments', icon: UserCheck },
  { titleKey: 'nav.inspection.history', href: '/inspection/history', icon: History },
];

// 8. Quality Improvement (CAPA + 5PRS + AQL)
const qualityItems: NavItem[] = [
  { titleKey: 'nav.capa.dashboard', href: '/capa', icon: ShieldCheck },
  { titleKey: 'nav.capa.new', href: '/capa/new', icon: FileWarning },
  { titleKey: 'nav.fivePrs.dashboard', href: '/five-prs', icon: Search },
  { titleKey: 'nav.fivePrs.trainingRecommendations', href: '/five-prs/training-recommendations', icon: GraduationCap },
  { titleKey: 'nav.aql.dashboard', href: '/aql', icon: ClipboardCheck },
  { titleKey: 'nav.aql.trainingRecommendations', href: '/aql/training-recommendations', icon: GraduationCap },
];

// 8. Analytics & Reports
const analyticsItems: NavItem[] = [
  { titleKey: 'nav.reports', href: '/reports', icon: FileBarChart },
  { titleKey: 'nav.executiveReport', href: '/executive-report', icon: FileBarChart },
  { titleKey: 'nav.trainingPlan', href: '/training-plan', icon: CalendarClock },
  { titleKey: 'nav.notifications', href: '/notifications', icon: Bell },
];

// 9. System Admin
const systemAdminItems: NavItem[] = [
  { titleKey: 'nav.audit', href: '/audit', icon: Shield },
  { titleKey: 'nav.auditLog', href: '/audit-log', icon: History },
  { titleKey: 'nav.materials', href: '/materials', icon: FolderOpen },
  { titleKey: 'nav.dataSync', href: '/data-sync', icon: RefreshCcw },
];

const sections: NavSection[] = [
  { titleKey: 'sidebar.dashboards', items: dashboardItems },
  { titleKey: 'sidebar.trainingOps', items: trainingOpsItems },
  { titleKey: 'sidebar.followUp', items: followUpItems },
  { titleKey: 'sidebar.peopleCompetency', items: peopleItems },
  { titleKey: 'sidebar.newTQC', items: newTQCItems },
  { titleKey: 'sidebar.projects', items: projectItems },
  { titleKey: 'sidebar.inspection', items: inspectionItems },
  { titleKey: 'sidebar.qualityImprovement', items: qualityItems },
  { titleKey: 'sidebar.analyticsReports', items: analyticsItems },
  { titleKey: 'sidebar.systemAdmin', items: systemAdminItems },
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
          {sections.map((section, idx) => (
            <div key={section.titleKey}>
              {idx > 0 && <Separator className="my-3" />}
              <div className="px-3 py-1">
                <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                  {t(section.titleKey)}
                </h2>
                <nav className="space-y-1">
                  {section.items.map((item) => (
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
            </div>
          ))}

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
