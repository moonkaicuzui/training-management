/**
 * GlobalSearch Component
 *
 * Command palette / global search using cmdk.
 * Triggered by Ctrl+K / Cmd+K.
 * Shows categorized search results with relevance scoring.
 * Navigates to the selected result using react-router-dom.
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Command } from 'cmdk';
import {
  Search,
  Users,
  BookOpen,
  GraduationCap,
  FolderOpen,
  ShieldCheck,
  FolderKanban,
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  FileBarChart,
  Award,
  Bell,
  BarChart3,
  Grid3X3,
  Plus,
  Settings,
  Loader2,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSearch } from '@/hooks/useSearch';
import type { SearchResult } from '@/services/searchService';

// ============================================================
// Type Icon Mapping
// ============================================================

const TYPE_ICONS: Record<SearchResult['type'], React.ComponentType<{ className?: string }>> = {
  employee: Users,
  program: BookOpen,
  trainer: GraduationCap,
  material: FolderOpen,
  capa: ShieldCheck,
  project: FolderKanban,
  session: Calendar,
  result: ClipboardCheck,
};

const TYPE_LABEL_KEYS: Record<SearchResult['type'], string> = {
  employee: 'nav.employees',
  program: 'nav.programs',
  trainer: 'nav.trainers',
  material: 'nav.materials',
  capa: 'sidebar.capa',
  project: 'sidebar.projects',
  session: 'nav.schedule',
  result: 'nav.results',
};

// ============================================================
// Page Navigation Items
// ============================================================

interface PageItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  category: 'pages' | 'actions';
}

const PAGE_ITEMS: PageItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard', category: 'pages' },
  { id: 'employees', labelKey: 'nav.employees', icon: Users, href: '/employees', category: 'pages' },
  { id: 'programs', labelKey: 'nav.programs', icon: BookOpen, href: '/programs', category: 'pages' },
  { id: 'progress', labelKey: 'nav.progress', icon: Grid3X3, href: '/progress', category: 'pages' },
  { id: 'schedule', labelKey: 'nav.schedule', icon: Calendar, href: '/schedule', category: 'pages' },
  { id: 'results', labelKey: 'nav.results', icon: ClipboardCheck, href: '/results', category: 'pages' },
  { id: 'retraining', labelKey: 'nav.retraining', icon: AlertTriangle, href: '/retraining', category: 'pages' },
  { id: 'reports', labelKey: 'nav.reports', icon: FileBarChart, href: '/reports', category: 'pages' },
  { id: 'certificates', labelKey: 'nav.certificates', icon: Award, href: '/certificates', category: 'pages' },
  { id: 'notifications', labelKey: 'nav.notifications', icon: Bell, href: '/notifications', category: 'pages' },
  { id: 'evaluation', labelKey: 'nav.evaluation', icon: BarChart3, href: '/evaluation', category: 'pages' },
  { id: 'materials', labelKey: 'nav.materials', icon: FolderOpen, href: '/materials', category: 'pages' },
  { id: 'projects', labelKey: 'nav.projects.dashboard', icon: FolderKanban, href: '/projects/dashboard', category: 'pages' },
  { id: 'capa', labelKey: 'nav.capa.dashboard', icon: ShieldCheck, href: '/capa', category: 'pages' },
];

const QUICK_ACTION_ITEMS: PageItem[] = [
  { id: 'new-training', labelKey: 'dashboard.newTraining', icon: Plus, href: '/schedule', category: 'actions' },
  { id: 'enter-results', labelKey: 'dashboard.enterResults', icon: ClipboardCheck, href: '/results', category: 'actions' },
  { id: 'new-capa', labelKey: 'nav.capa.new', icon: Plus, href: '/capa/new', category: 'actions' },
  { id: 'settings', labelKey: 'header.settings', icon: Settings, href: '/new-tqc/settings', category: 'actions' },
];

// ============================================================
// Component Props
// ============================================================

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================
// Component
// ============================================================

export const GlobalSearch = memo(function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { results, isLoading, groupedResults } = useSearch(query, {
    debounceMs: 200,
    limit: 20,
    enabled: open,
  });

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setQuery('');
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  const handleSelect = useCallback(
    (route: string) => {
      onOpenChange(false);
      navigate(route);
    },
    [onOpenChange, navigate]
  );

  // Determine which result type groups have items
  const hasSearchResults = results.length > 0;
  const showSearchResults = query.trim().length >= 2;

  // Order of result type groups to display
  const typeOrder: SearchResult['type'][] = [
    'employee',
    'program',
    'trainer',
    'material',
    'capa',
    'project',
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-lg [&>button]:hidden">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          shouldFilter={!showSearchResults}
          label={t('common.aria.globalSearch')}
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder={t('commandPalette.searchPlaceholder')}
              value={query}
              onValueChange={setQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isLoading && (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            )}
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {isLoading
                ? t('common.loading', 'Loading...')
                : t('commandPalette.noResults')}
            </Command.Empty>

            {/* Unified Search Results (categorized by type) */}
            {showSearchResults &&
              hasSearchResults &&
              typeOrder.map((type) => {
                const typeResults = groupedResults[type];
                if (!typeResults || typeResults.length === 0) return null;

                const Icon = TYPE_ICONS[type];
                const groupLabel = t(TYPE_LABEL_KEYS[type]);

                return (
                  <Command.Group key={type} heading={groupLabel}>
                    {typeResults.map((result) => (
                      <Command.Item
                        key={`${result.type}-${result.id}`}
                        value={`${result.type}-${result.title}-${result.id}`}
                        onSelect={() => handleSelect(result.route)}
                        className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                        <span className="ml-auto text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
                          {result.score}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}

            {/* Page Navigation */}
            {!showSearchResults && (
              <Command.Group heading={t('commandPalette.pages')}>
                {PAGE_ITEMS.map((page) => (
                  <Command.Item
                    key={page.id}
                    value={t(page.labelKey)}
                    onSelect={() => handleSelect(page.href)}
                    className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <page.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{t(page.labelKey)}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Quick Actions */}
            {!showSearchResults && (
              <Command.Group heading={t('commandPalette.quickActions')}>
                {QUICK_ACTION_ITEMS.map((action) => (
                  <Command.Item
                    key={action.id}
                    value={t(action.labelKey)}
                    onSelect={() => handleSelect(action.href)}
                    className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <action.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{t(action.labelKey)}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Pages and Quick Actions also shown when search yields results */}
            {showSearchResults && hasSearchResults && (
              <>
                <Command.Group heading={t('commandPalette.pages')}>
                  {PAGE_ITEMS.map((page) => (
                    <Command.Item
                      key={`page-${page.id}`}
                      value={`page-${t(page.labelKey)}`}
                      onSelect={() => handleSelect(page.href)}
                      className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <page.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{t(page.labelKey)}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading={t('commandPalette.quickActions')}>
                  {QUICK_ACTION_ITEMS.map((action) => (
                    <Command.Item
                      key={`action-${action.id}`}
                      value={`action-${t(action.labelKey)}`}
                      onSelect={() => handleSelect(action.href)}
                      className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <action.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{t(action.labelKey)}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </>
            )}
          </Command.List>

          {/* Footer with keyboard hint */}
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">&uarr;&darr;</span>
              </kbd>
              <span>{t('commandPalette.navigate', 'Navigate')}</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                &crarr;
              </kbd>
              <span>{t('commandPalette.select', 'Select')}</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Esc
              </kbd>
              <span>{t('commandPalette.close', 'Close')}</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
});
