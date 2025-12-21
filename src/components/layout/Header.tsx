import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, Globe, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { globalSearch } from '@/services/api';
import type { Employee, TrainingProgram, Language } from '@/types';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function Header() {
  const navigate = useNavigate();
  const { language, setLanguage, toggleSidebar } = useUIStore();
  const { retrainingTargets } = useTrainingStore();

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
            placeholder="직원 ID 또는 이름으로 검색..."
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
                  직원
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
                  교육 프로그램
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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {retrainingTargets.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {retrainingTargets.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>알림</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {retrainingTargets.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                새로운 알림이 없습니다
              </div>
            ) : (
              retrainingTargets.slice(0, 5).map((target, index) => (
                <DropdownMenuItem
                  key={index}
                  className="flex flex-col items-start cursor-pointer"
                  onClick={() => handleSelectEmployee(target.employee.employee_id)}
                >
                  <div className="font-medium">{target.employee.employee_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {target.program.program_name} 재교육 필요
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
                  모든 알림 보기 ({retrainingTargets.length}건)
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>언어 / Language</DropdownMenuLabel>
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
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>관리자</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>설정</DropdownMenuItem>
            <DropdownMenuItem>도움말</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
