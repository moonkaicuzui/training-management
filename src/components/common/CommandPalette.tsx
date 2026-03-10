import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Grid3X3,
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  FileBarChart,
  Award,
  Bell,
  BarChart3,
  FolderOpen,
  FolderKanban,
  ShieldCheck,
  Search,
  Plus,
  Settings,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Employee, TrainingProgram } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PageItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  category: string;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    employees: Employee[];
    programs: TrainingProgram[];
  }>({ employees: [], programs: [] });

  // Page navigation items
  const pages: PageItem[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, href: '/dashboard', category: 'pages' },
    { id: 'employees', label: t('nav.employees'), icon: Users, href: '/employees', category: 'pages' },
    { id: 'programs', label: t('nav.programs'), icon: BookOpen, href: '/programs', category: 'pages' },
    { id: 'progress', label: t('nav.progress'), icon: Grid3X3, href: '/progress', category: 'pages' },
    { id: 'schedule', label: t('nav.schedule'), icon: Calendar, href: '/schedule', category: 'pages' },
    { id: 'results', label: t('nav.results'), icon: ClipboardCheck, href: '/results', category: 'pages' },
    { id: 'retraining', label: t('nav.retraining'), icon: AlertTriangle, href: '/retraining', category: 'pages' },
    { id: 'reports', label: t('nav.reports'), icon: FileBarChart, href: '/reports', category: 'pages' },
    { id: 'certificates', label: t('nav.certificates'), icon: Award, href: '/certificates', category: 'pages' },
    { id: 'notifications', label: t('nav.notifications'), icon: Bell, href: '/notifications', category: 'pages' },
    { id: 'evaluation', label: t('nav.evaluation'), icon: BarChart3, href: '/evaluation', category: 'pages' },
    { id: 'materials', label: t('nav.materials'), icon: FolderOpen, href: '/materials', category: 'pages' },
    { id: 'projects', label: t('nav.projects.dashboard'), icon: FolderKanban, href: '/projects/dashboard', category: 'pages' },
    { id: 'capa', label: t('nav.capa.dashboard'), icon: ShieldCheck, href: '/capa', category: 'pages' },
  ];

  const quickActions: PageItem[] = [
    { id: 'new-training', label: t('dashboard.newTraining'), icon: Plus, href: '/schedule', category: 'actions' },
    { id: 'enter-results', label: t('dashboard.enterResults'), icon: ClipboardCheck, href: '/results', category: 'actions' },
    { id: 'new-capa', label: t('nav.capa.new'), icon: Plus, href: '/capa/new', category: 'actions' },
    { id: 'settings', label: t('header.settings'), icon: Settings, href: '/new-tqc/settings', category: 'actions' },
  ];

  // Debounced search
  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults({ employees: [], programs: [] });
      return;
    }
    const { globalSearch } = await import('@/services/api');
    const results = await globalSearch(q);
    setSearchResults(results);
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => performSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, open, performSearch]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setQuery('');
      setSearchResults({ employees: [], programs: [] });
    }
    onOpenChange(isOpen);
  };

  const handleSelect = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-lg [&>button]:hidden">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5" label={t('common.aria.commandPalette')}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder={t('commandPalette.searchPlaceholder')}
              value={query}
              onValueChange={setQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {t('commandPalette.noResults')}
            </Command.Empty>

            {/* Search Results - Employees */}
            {searchResults.employees.length > 0 && (
              <Command.Group heading={t('header.employees')}>
                {searchResults.employees.slice(0, 5).map((emp) => (
                  <Command.Item
                    key={emp.employee_id}
                    value={`employee-${emp.employee_name}-${emp.employee_id}`}
                    onSelect={() => handleSelect(`/employees/${emp.employee_id}`)}
                    className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{emp.employee_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {emp.employee_id} · {emp.department}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results - Programs */}
            {searchResults.programs.length > 0 && (
              <Command.Group heading={t('header.programs')}>
                {searchResults.programs.slice(0, 5).map((prog) => (
                  <Command.Item
                    key={prog.program_code}
                    value={`program-${prog.program_name}-${prog.program_code}`}
                    onSelect={() => handleSelect(`/programs/${prog.program_code}`)}
                    className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{prog.program_name}</div>
                      <div className="text-xs text-muted-foreground">{prog.program_code}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Pages */}
            <Command.Group heading={t('commandPalette.pages')}>
              {pages.map((page) => (
                <Command.Item
                  key={page.id}
                  value={page.label}
                  onSelect={() => handleSelect(page.href)}
                  className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <page.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{page.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Quick Actions */}
            <Command.Group heading={t('commandPalette.quickActions')}>
              {quickActions.map((action) => (
                <Command.Item
                  key={action.id}
                  value={action.label}
                  onSelect={() => handleSelect(action.href)}
                  className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{action.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
