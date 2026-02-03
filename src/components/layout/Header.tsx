import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Menu, Globe, User, LogOut, Shield, BookOpen, Eye, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { CommandPalette } from '@/components/common/CommandPalette';
import { NotificationCenter } from '@/components/common/NotificationCenter';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Language } from '@/types';
import type { UserRole } from '@/types/auth';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'vi', name: 'Tiếng Việt', flag: '\u{1F1FB}\u{1F1F3}' },
  { code: 'ko', name: '\uD55C\uAD6D\uC5B4', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'en', name: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
];

// 역할별 아이콘 및 표시 정보
const roleConfig: Record<UserRole, { icon: typeof Shield; label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  ADMIN: { icon: Shield, label: 'auth.admin', variant: 'default' },
  TRAINER: { icon: BookOpen, label: 'auth.trainer', variant: 'secondary' },
  VIEWER: { icon: Eye, label: 'auth.viewer', variant: 'outline' },
};

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage, toggleSidebar } = useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Register global Cmd+K shortcut
  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      handler: () => setCommandPaletteOpen(true),
      global: true,
    },
  ]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
            QT
          </div>
          <span className="hidden font-semibold md:inline-block">Q-TRAIN</span>
        </div>

        {/* Search Trigger (opens Command Palette) */}
        <Button
          variant="outline"
          className="relative flex-1 max-w-md justify-start text-muted-foreground"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline-flex">{t('header.searchPlaceholder')}</span>
          <span className="sm:hidden">{t('common.search')}</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        <div className="flex items-center gap-2">
          {/* Notification Center */}
          <NotificationCenter />

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('header.language')}>
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('header.language')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={language === lang.code ? 'bg-accent' : ''}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('auth.profile')}>
                {isAuthenticated && user ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.picture} alt={user.name} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isAuthenticated && user ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    {(() => {
                      const config = roleConfig[user.role];
                      const RoleIcon = config.icon;
                      return (
                        <>
                          <RoleIcon className="h-4 w-4" />
                          <span>{t('auth.role')}:</span>
                          <Badge variant={config.variant} className="ml-auto text-xs">
                            {t(config.label)}
                          </Badge>
                        </>
                      );
                    })()}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>{t('header.settings')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('header.help')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive gap-2"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>{t('auth.login')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/login')}>
                    {t('auth.login')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </>
  );
}
