/**
 * 검사자 검색/선택 드롭다운
 * - HR 직원 목록이 있으면 검색+선택 UI, 없으면 이름 직접 입력
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Employee } from '@/types';

interface MDInspectorSelectorProps {
  inspectorId: string;
  inspectorName: string;
  employees: Employee[];
  employeesLoading: boolean;
  onSelect: (id: string, name: string) => void;
}

export default function MDInspectorSelector({
  inspectorId,
  inspectorName,
  employees,
  employeesLoading,
  onSelect,
}: MDInspectorSelectorProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees.slice(0, 50);
    const query = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.employee_id.toLowerCase().includes(query) ||
        e.employee_name.toLowerCase().includes(query) ||
        e.department.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [employees, search]);

  return (
    <div className="space-y-1">
      <Label>{t('metalDetector.input.inspectorId')}</Label>
      {employeesLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : employees.length > 0 ? (
        <div className="relative">
          <Input
            placeholder={t('metalDetector.input.inspectorSearch')}
            value={inspectorId ? `${inspectorId} - ${inspectorName}` : search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDropdownOpen(true);
              if (inspectorId) {
                onSelect('', '');
              }
            }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
          />
          {inspectorId && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                onSelect('', '');
                setSearch('');
                setDropdownOpen(true);
              }}
            >
              <span className="text-xs">{'\u2715'}</span>
            </button>
          )}
          {dropdownOpen && !inspectorId && (
            <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <button
                    key={emp.employee_id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(emp.employee_id, emp.employee_name);
                      setSearch('');
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="font-mono font-medium">{emp.employee_id}</span>
                    <span className="mx-1">-</span>
                    <span>{emp.employee_name}</span>
                    <span className="text-muted-foreground ml-1">({emp.department})</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">{t('common.noResults')}</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <Input
          value={inspectorName}
          onChange={(e) => onSelect('', e.target.value)}
          placeholder={t('metalDetector.input.inspectorNameFallback')}
        />
      )}
    </div>
  );
}
