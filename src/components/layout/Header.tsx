import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Menu, Globe, Bell, User, LogOut, Shield, BookOpen, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useTrainingStore } from '@/stores/trainingStore';
import { useAuthStore } from '@/stores/authStore';
import { globalSearch } from '@/services/api';
import type { Employee, TrainingProgram, Language } from '@/types';
import type { UserRole } from '@/types/auth';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
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
  const { retrainingTargets } = useTrainingStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    employees: Employee[];
    programs: TrainingProgram[];
  }>({ employees: [], programs: [] });
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults({ employees: [], programs: [] });
      return;
    }
    const results = await globalSearch(query);
    setSearchResults(results);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSelectEmployee = (employeeId: string) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/employees/${employeeId}`);
  };

  const handleSelectProgram = (programCode: string) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/programs/${programCode}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.employees.length > 0) {
      handleSelectEmployee(searchResults.employees[0].employee_id);
    }
  };

  return (
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

      {/* Global Search */}
      <div className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('header.searchPlaceholder')}
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && (searchResults.employees.length > 0 || searchResults.programs.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-auto">
            {searchResults.employees.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
                  {t('header.employees')}
                </div>
                {searchResults.employees.map((employee) => (
                  <button
                    key={employee.employee_id}
                    className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                    onClick={() => handleSelectEmployee(employee.employee_id)}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{employee.employee_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {employee.employee_id} · {employee.department} · {employee.position}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchResults.programs.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
                  {t('header.programs')}
                </div>
                {searchResults.programs.map((program) => (
                  <button
                    key={program.program_code}
                    className="w-full px-3 py-2 text-left hover:bg-accent"
                    onClick={() => handleSelectProgram(program.program_code)}
                  >
                    <div className="font-medium">{program.program_code} - {program.program_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'vi' ? program.program_name_vn :
                       language === 'ko' ? program.program_name_kr :
                       program.program_name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={t('header.notifications')}>
              <Bell className="h-5 w-5" />
              {retrainingTargets.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {retrainingTargets.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>{t('header.notifications')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {retrainingTargets.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {t('header.noNotifications')}
              </div>
            ) : (
              retrainingTargets.slice(0, 5).map((target) => (
                <DropdownMenuItem
                  key={`${target.employee.employee_id}-${target.program.program_code}`}
                  className="flex flex-col items-start cursor-pointer"
                  onClick={() => handleSelectEmployee(target.employee.employee_id)}
                >
                  <div className="font-medium">{target.employee.employee_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {target.program.program_name} - {t('header.retrainingNeeded')}
                  </div>
                </DropdownMenuItem>
              ))
            )}
            {retrainingTargets.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center text-primary cursor-pointer"
                  onClick={() => navigate('/retraining')}
                >
                  {t('header.viewAllNotifications')} ({retrainingTargets.length})
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
  );
}
