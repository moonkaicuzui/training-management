/**
 * SkillMatrix Component
 * Heat map grid: employees x competencies
 * Color-coded by competency level
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Employee } from '@/types';
import type {
  Competency,
  EmployeeCompetency,
  CompetencyLevel,
  CompetencyCategory,
} from '@/types/curriculum';
import { COMPETENCY_LEVEL_VALUES } from '@/types/curriculum';

interface SkillMatrixProps {
  employees: Employee[];
  competencies: Competency[];
  employeeCompetencies: EmployeeCompetency[];
  departmentFilter?: string;
  categoryFilter?: CompetencyCategory;
  onCellClick?: (employeeId: string, competencyId: string, currentLevel: CompetencyLevel) => void;
}

const LEVEL_COLORS: Record<CompetencyLevel, string> = {
  NOVICE: 'bg-red-500 text-white',
  BEGINNER: 'bg-orange-400 text-white',
  COMPETENT: 'bg-yellow-400 text-gray-900',
  PROFICIENT: 'bg-blue-500 text-white',
  EXPERT: 'bg-green-500 text-white',
};

const LEVEL_BG_LIGHT: Record<CompetencyLevel, string> = {
  NOVICE: 'bg-red-100 hover:bg-red-200',
  BEGINNER: 'bg-orange-100 hover:bg-orange-200',
  COMPETENT: 'bg-yellow-100 hover:bg-yellow-200',
  PROFICIENT: 'bg-blue-100 hover:bg-blue-200',
  EXPERT: 'bg-green-100 hover:bg-green-200',
};

const LEVEL_SHORT: Record<CompetencyLevel, string> = {
  NOVICE: '1',
  BEGINNER: '2',
  COMPETENT: '3',
  PROFICIENT: '4',
  EXPERT: '5',
};

export function SkillMatrix({
  employees,
  competencies,
  employeeCompetencies,
  departmentFilter,
  categoryFilter,
  onCellClick,
}: SkillMatrixProps) {
  const { t } = useTranslation();
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Filter employees by department
  const filteredEmployees = useMemo(() => {
    if (!departmentFilter || departmentFilter === 'all') return employees;
    return employees.filter((e) => e.department === departmentFilter);
  }, [employees, departmentFilter]);

  // Filter competencies by category
  const filteredCompetencies = useMemo(() => {
    let result = competencies.filter((c) => c.is_active);
    if (categoryFilter && categoryFilter !== ('all' as CompetencyCategory)) {
      result = result.filter((c) => c.category === categoryFilter);
    }
    return result;
  }, [competencies, categoryFilter]);

  // Build lookup map for fast cell access
  const competencyMap = useMemo(() => {
    const map = new Map<string, EmployeeCompetency>();
    for (const ec of employeeCompetencies) {
      map.set(`${ec.employee_id}_${ec.competency_id}`, ec);
    }
    return map;
  }, [employeeCompetencies]);

  const getCellData = (employeeId: string, competencyId: string) => {
    return competencyMap.get(`${employeeId}_${competencyId}`);
  };

  if (filteredEmployees.length === 0 || filteredCompetencies.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        {t('common.noData')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium text-muted-foreground">
          {t('competency.matrix.legend')}:
        </span>
        {(Object.keys(LEVEL_COLORS) as CompetencyLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-1">
            <div
              className={cn(
                'w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold',
                LEVEL_COLORS[level]
              )}
            >
              {LEVEL_SHORT[level]}
            </div>
            <span className="text-muted-foreground">
              {t(`competency.level.${level}`)}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400">
            -
          </div>
          <span className="text-muted-foreground">
            {t('competency.matrix.notAssessed')}
          </span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium border-b border-r min-w-[150px]">
                {t('competency.matrix.employee')}
              </th>
              {filteredCompetencies.map((comp) => (
                <th
                  key={comp.competency_id}
                  className="px-1 py-2 text-center font-medium border-b min-w-[40px] max-w-[60px]"
                  title={comp.name}
                >
                  <div className="truncate writing-mode-vertical text-[10px]">
                    {comp.competency_code}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.employee_id} className="hover:bg-muted/20">
                <td className="sticky left-0 z-10 bg-background px-3 py-1.5 border-b border-r font-medium whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs">{emp.employee_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {emp.employee_id}
                    </span>
                  </div>
                </td>
                {filteredCompetencies.map((comp) => {
                  const cellData = getCellData(
                    emp.employee_id,
                    comp.competency_id
                  );
                  const cellKey = `${emp.employee_id}_${comp.competency_id}`;
                  const level = cellData?.current_level;
                  const gap = cellData
                    ? COMPETENCY_LEVEL_VALUES[cellData.target_level] -
                      COMPETENCY_LEVEL_VALUES[cellData.current_level]
                    : 0;

                  return (
                    <TooltipProvider key={cellKey} delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <td
                            className={cn(
                              'px-0.5 py-0.5 border-b text-center cursor-pointer transition-colors',
                              hoveredCell === cellKey && 'ring-2 ring-primary ring-inset',
                              level
                                ? LEVEL_BG_LIGHT[level]
                                : 'bg-gray-50 hover:bg-gray-100'
                            )}
                            onClick={() =>
                              onCellClick?.(
                                emp.employee_id,
                                comp.competency_id,
                                level || 'NOVICE'
                              )
                            }
                            onMouseEnter={() => setHoveredCell(cellKey)}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {level ? (
                              <div
                                className={cn(
                                  'w-6 h-6 mx-auto rounded text-[10px] flex items-center justify-center font-bold',
                                  LEVEL_COLORS[level]
                                )}
                              >
                                {LEVEL_SHORT[level]}
                              </div>
                            ) : (
                              <div className="w-6 h-6 mx-auto rounded border border-dashed border-gray-300 text-[10px] flex items-center justify-center text-gray-300">
                                -
                              </div>
                            )}
                          </td>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {emp.employee_name} - {comp.name}
                            </div>
                            {cellData ? (
                              <>
                                <div>
                                  {t('competency.matrix.current')}:{' '}
                                  {t(`competency.level.${cellData.current_level}`)}
                                </div>
                                <div>
                                  {t('competency.matrix.target')}:{' '}
                                  {t(`competency.level.${cellData.target_level}`)}
                                </div>
                                {gap > 0 && (
                                  <div className="text-destructive font-medium">
                                    {t('competency.matrix.gap')}: -{gap}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-muted-foreground">
                                {t('competency.matrix.notAssessed')}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
