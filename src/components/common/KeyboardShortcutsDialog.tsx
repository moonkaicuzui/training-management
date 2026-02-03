import { useTranslation } from 'react-i18next';
import { Command } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  keys: string[];
  labelKey: string;
}

const shortcuts: { category: string; items: ShortcutItem[] }[] = [
  {
    category: 'shortcuts.general',
    items: [
      { keys: ['Cmd', 'K'], labelKey: 'shortcuts.openSearch' },
      { keys: ['?'], labelKey: 'shortcuts.showShortcuts' },
      { keys: ['Esc'], labelKey: 'shortcuts.closeDialog' },
    ],
  },
  {
    category: 'shortcuts.navigation',
    items: [
      { keys: ['g', 'd'], labelKey: 'shortcuts.goToDashboard' },
      { keys: ['g', 'e'], labelKey: 'shortcuts.goToEmployees' },
      { keys: ['g', 'p'], labelKey: 'shortcuts.goToPrograms' },
      { keys: ['g', 'r'], labelKey: 'shortcuts.goToResults' },
      { keys: ['g', 's'], labelKey: 'shortcuts.goToSchedule' },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('shortcuts.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {t(group.category)}
              </h4>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div
                    key={item.labelKey}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{t(item.labelKey)}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                          <KeyBadge>
                            {key === 'Cmd' ? (
                              <Command className="h-3 w-3" />
                            ) : (
                              key
                            )}
                          </KeyBadge>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
