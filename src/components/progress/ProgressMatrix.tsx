import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  NormalizedEmployee,
  NormalizedTrainingProgram,
  NormalizedProgressCell,
} from '@/types/normalized';
import type { EmployeeId, ProgramCode } from '@/types/branded';
import { getDisplayStatus, getCellDisplay } from './types';

interface ProgressMatrixProps {
  employees: readonly NormalizedEmployee[];
  programs: readonly NormalizedTrainingProgram[];
  matrix: Record<string, Record<string, NormalizedProgressCell>>;
  onCellClick: (employee: NormalizedEmployee, program: NormalizedTrainingProgram) => void;
  onEmployeeClick: (employeeId: string) => void;
}

export default function ProgressMatrix({
  employees,
  programs,
  matrix,
  onCellClick,
  onEmployeeClick,
}: ProgressMatrixProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('progress.matrixTitle')}</CardTitle>
        <CardDescription>
          {t('progress.matrixDescription', { employees: employees.length, programs: programs.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {employees.length === 0 || programs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.noData')}
          </div>
        ) : (
          <TooltipProvider delayDuration={300}>
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 bg-background border p-2 text-left min-w-[150px]">
                        {t('progress.employee')}
                      </th>
                      {programs.map((program) => (
                        <Tooltip key={program.program_code}>
                          <TooltipTrigger asChild>
                            <th className="border p-2 text-center min-w-[60px] cursor-help">
                              <div className="text-xs font-medium">
                                {program.program_code}
                              </div>
                            </th>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{program.program_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t(`category.${program.category}`)} · {t('progress.passingScoreAbove', { score: program.passing_score })}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.employee_id}>
                        <td className="sticky left-0 z-10 bg-background border p-2">
                          <div
                            className="cursor-pointer hover:text-primary"
                            onClick={() => onEmployeeClick(employee.employee_id)}
                          >
                            <div className="font-medium text-sm">
                              {employee.employee_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {employee.employee_id}
                            </div>
                          </div>
                        </td>
                        {programs.map((program) => {
                          const employeeMatrix = matrix[employee.employee_id as EmployeeId];
                          const cell = employeeMatrix?.[program.program_code as ProgramCode];
                          const displayStatus = cell ? getDisplayStatus(cell.status) : 'not_taken';
                          const display = getCellDisplay(displayStatus);
                          return (
                            <td
                              key={program.program_code}
                              className="border p-1 text-center"
                            >
                              <button
                                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${display.className}`}
                                onClick={() => onCellClick(employee, program)}
                              >
                                {display.symbol}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
