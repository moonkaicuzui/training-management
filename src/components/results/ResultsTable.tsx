import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, differenceInMonths } from 'date-fns';
import type { Employee, TrainingResultRecord } from '@/types';

interface ResultsTableProps {
  results: TrainingResultRecord[];
  employees: Employee[];
  isLoading: boolean;
  onEditResult: (result: TrainingResultRecord) => void;
}

export function ResultsTable({
  results,
  employees,
  isLoading,
  onEditResult,
}: ResultsTableProps) {
  const { t } = useTranslation();

  const getEmployee = (employeeId: string): Employee | undefined => {
    return employees.find(e => e.employee_id === employeeId);
  };

  const getWorkExperience = (hireDate: string | undefined): string => {
    if (!hireDate) return '-';
    try {
      const totalMonths = differenceInMonths(new Date(), new Date(hireDate));
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      return t('results.yearsMonths', { years, months });
    } catch {
      return '-';
    }
  };

  const formatTestAttempt = (attempt: number | undefined): string => {
    if (attempt == null) return '-';
    return t('results.nthAttempt', { n: attempt });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('common.noData')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('training.date')}</TableHead>
            <TableHead>{t('results.employeeId')}</TableHead>
            <TableHead>{t('results.area')}</TableHead>
            <TableHead>{t('results.position')}</TableHead>
            <TableHead>{t('results.entranceDate')}</TableHead>
            <TableHead>{t('results.workExperience')}</TableHead>
            <TableHead>{t('results.programLabel')}</TableHead>
            <TableHead className="text-center">{t('training.score')}</TableHead>
            <TableHead className="text-center">{t('training.grade')}</TableHead>
            <TableHead className="text-center">{t('training.result')}</TableHead>
            <TableHead className="text-center">{t('results.testAttempt')}</TableHead>
            <TableHead>{t('results.stopWorkingDate')}</TableHead>
            <TableHead>{t('training.trainer')}</TableHead>
            <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.slice(0, 20).map((result) => {
            const emp = getEmployee(result.employee_id);
            return (
              <TableRow key={result.result_id}>
                <TableCell>
                  {format(new Date(result.training_date), 'yyyy-MM-dd')}
                </TableCell>
                <TableCell className="font-mono">{result.employee_id}</TableCell>
                <TableCell>
                  {emp ? t(`building.${emp.building}`, { defaultValue: emp.building }) : '-'}
                </TableCell>
                <TableCell>
                  {emp ? t(`position.${emp.position}`, { defaultValue: emp.position }) : '-'}
                </TableCell>
                <TableCell>
                  {emp?.hire_date ? format(new Date(emp.hire_date), 'yyyy-MM-dd') : '-'}
                </TableCell>
                <TableCell>
                  {getWorkExperience(emp?.hire_date)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{result.program_code}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {result.score !== null ? t('results.scoreWithUnit', { score: result.score }) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {result.grade && (
                    <Badge
                      variant={
                        result.grade === 'AA'
                          ? 'gradeAA'
                          : result.grade === 'A'
                          ? 'gradeA'
                          : result.grade === 'B'
                          ? 'gradeB'
                          : 'gradeC'
                      }
                    >
                      {result.grade}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      result.result === 'PASS'
                        ? 'success'
                        : result.result === 'FAIL'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {result.result === 'PASS'
                      ? t('training.pass')
                      : result.result === 'FAIL'
                      ? t('training.fail')
                      : t('training.absent')}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {formatTestAttempt(result.test_attempt)}
                </TableCell>
                <TableCell>
                  {result.stop_working_date
                    ? format(new Date(result.stop_working_date), 'yyyy-MM-dd')
                    : '-'}
                </TableCell>
                <TableCell>{result.evaluated_by}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditResult(result)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
