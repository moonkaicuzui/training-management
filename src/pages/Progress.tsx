import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProgressMatrixData, useNormalizedTrainingStore } from '@/stores/normalizedStore';
import { useExport } from '@/hooks/useExport';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { buildings, departments, positions, categories } from '@/data/constants';
import { format } from 'date-fns';
import type {
  NormalizedProgressCell,
  NormalizedEmployee,
  NormalizedTrainingProgram,
  TrainingStatus,
} from '@/types/normalized';
import type { EmployeeId, ProgramCode } from '@/types/branded';
import type { Building, Department, Position, ProgramCategory } from '@/types';

type CellDisplayStatus = 'pass' | 'fail' | 'expiring' | 'expired' | 'not_taken';

function getDisplayStatus(status: TrainingStatus): CellDisplayStatus {
  switch (status) {
    case 'PASS': return 'pass';
    case 'FAIL': return 'fail';
    case 'EXPIRING': return 'expiring';
    case 'EXPIRED': return 'expired';
    case 'NOT_TAKEN':
    default: return 'not_taken';
  }
}

function getCellDisplay(status: CellDisplayStatus): { symbol: string; className: string } {
  switch (status) {
    case 'pass':
      return { symbol: '✓', className: 'bg-status-pass/20 text-status-pass hover:bg-status-pass/30' };
    case 'fail':
      return { symbol: '✗', className: 'bg-destructive/20 text-destructive hover:bg-destructive/30' };
    case 'expiring':
      return { symbol: '⚠', className: 'bg-status-warning/20 text-status-warning hover:bg-status-warning/30' };
    case 'expired':
      return { symbol: '⏰', className: 'bg-status-expired/20 text-status-expired hover:bg-status-expired/30' };
    case 'not_taken':
    default:
      return { symbol: '−', className: 'bg-muted/50 text-muted-foreground hover:bg-muted' };
  }
}

export default function Progress() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { progressMatrix, loading } = useProgressMatrixData();
  const fetchProgressMatrix = useNormalizedTrainingStore((state) => state.fetchProgressMatrix);
  const error = useNormalizedTrainingStore((state) => state.error);
  const { exportExcel, exporting } = useExport();

  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<{
    employee: NormalizedEmployee;
    program: NormalizedTrainingProgram;
    cell: NormalizedProgressCell | undefined;
  } | null>(null);

  useEffect(() => {
    fetchProgressMatrix({
      building: buildingFilter !== 'all' ? buildingFilter as Building : undefined,
      department: departmentFilter !== 'all' ? departmentFilter as Department : undefined,
      position: positionFilter !== 'all' ? positionFilter as Position : undefined,
      category: categoryFilter !== 'all' ? categoryFilter as ProgramCategory : undefined,
    });
  }, [buildingFilter, departmentFilter, positionFilter, categoryFilter, fetchProgressMatrix]);

  const employees = progressMatrix?.employees || [];
  const programs = progressMatrix?.programs || [];
  const matrix = progressMatrix?.matrix || {};

  // Memoize stats calculation to prevent recalculation on every render
  // This is critical for large matrices (e.g., 490 employees × 50 programs = 24,500 cells)
  const stats = useMemo(() => {
    const totalCells = employees.length * programs.length;
    let passCount = 0;
    let failCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    Object.values(matrix).forEach((employeeData) => {
      Object.values(employeeData).forEach((cell) => {
        if (cell) {
          switch (cell.status) {
            case 'EXPIRED': expiredCount++; break;
            case 'EXPIRING': expiringCount++; break;
            case 'PASS': passCount++; break;
            case 'FAIL': failCount++; break;
          }
        }
      });
    });

    const notTakenCount = totalCells - passCount - failCount - expiredCount - expiringCount;

    return {
      totalCells,
      passCount,
      failCount,
      expiringCount,
      expiredCount,
      notTakenCount,
    };
  }, [employees.length, programs.length, matrix]);

  const { passCount, failCount, expiringCount, expiredCount, notTakenCount } = stats;

  const handleCellClick = (
    employee: NormalizedEmployee,
    program: NormalizedTrainingProgram
  ) => {
    const employeeMatrix = matrix[employee.employee_id as EmployeeId];
    const cell = employeeMatrix?.[program.program_code as ProgramCode];
    setSelectedCell({ employee, program, cell });
  };

  const handleExport = () => {
    const exportData = employees.flatMap((emp) =>
      programs.map((prog) => {
        const cell = matrix[emp.employee_id as EmployeeId]?.[prog.program_code as ProgramCode];
        return {
          사번: emp.employee_id,
          이름: emp.employee_name,
          부서: emp.department,
          프로그램: prog.program_name,
          상태: cell?.status || 'NOT_TAKEN',
          점수: cell?.last_score ?? '',
          등급: cell?.last_grade ?? '',
          교육일: cell?.last_training_date ?? '',
        };
      })
    );
    exportExcel(exportData, { filename: 'progress-matrix', sheetName: '이수현황' });
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('progress.title')}</h1>
          <p className="text-muted-foreground">
            {t('progress.description')}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? '내보내는 중...' : t('common.export')}
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium">{t('progress.legend')}:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-status-pass/20 text-status-pass text-sm">✓</span>
              <span className="text-sm">{t('progress.pass')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-destructive/20 text-destructive text-sm">✗</span>
              <span className="text-sm">{t('progress.fail')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-status-warning/20 text-status-warning text-sm">⚠</span>
              <span className="text-sm">{t('progress.expiring')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-status-expired/20 text-status-expired text-sm">⏰</span>
              <span className="text-sm">{t('progress.expired')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">−</span>
              <span className="text-sm">{t('progress.notTaken')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-pass">{passCount}</div>
            <p className="text-xs text-muted-foreground">{t('progress.pass')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{failCount}</div>
            <p className="text-xs text-muted-foreground">{t('progress.fail')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-warning">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">{t('progress.expiring')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-expired">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">{t('progress.expired')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-muted-foreground">{notTakenCount}</div>
            <p className="text-xs text-muted-foreground">{t('progress.notTaken')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('employee.building')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {buildings.map((bldg) => (
                  <SelectItem key={bldg.value} value={bldg.value}>
                    {t(`building.${bldg.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('employee.department')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('employee.position')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos.value} value={pos.value}>
                    {t(`position.${pos.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('program.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {t(`category.${cat.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Progress Matrix */}
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
                            onClick={() => navigate(`/employees/${employee.employee_id}`)}
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
                                onClick={() => handleCellClick(employee, program)}
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

      {/* Cell Detail Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('progress.historyDetail')}</DialogTitle>
            <DialogDescription>
              {selectedCell?.employee.employee_name} - {selectedCell?.program.program_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('progress.employee')}</p>
                <p className="font-medium">{selectedCell?.employee.employee_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCell?.employee.employee_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('common.program')}</p>
                <p className="font-medium">{selectedCell?.program.program_code}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCell?.program.program_name}
                </p>
              </div>
            </div>

            {selectedCell?.cell ? (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('progress.latestResult')}</span>
                  <Badge
                    variant={
                      selectedCell.cell.last_result === 'PASS'
                        ? 'success'
                        : selectedCell.cell.last_result === 'FAIL'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {selectedCell.cell.last_result === 'PASS'
                      ? t('training.pass')
                      : selectedCell.cell.last_result === 'FAIL'
                      ? t('training.fail')
                      : t('training.absent')}
                  </Badge>
                </div>
                {selectedCell.cell.last_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('training.score')}</span>
                    <span className="font-medium">{selectedCell.cell.last_score}{t('program.scoreUnit')}</span>
                  </div>
                )}
                {selectedCell.cell.last_grade && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('training.grade')}</span>
                    <Badge
                      variant={
                        selectedCell.cell.last_grade === 'AA'
                          ? 'gradeAA'
                          : selectedCell.cell.last_grade === 'A'
                          ? 'gradeA'
                          : selectedCell.cell.last_grade === 'B'
                          ? 'gradeB'
                          : 'gradeC'
                      }
                    >
                      {selectedCell.cell.last_grade}
                    </Badge>
                  </div>
                )}
                {selectedCell.cell.last_training_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('training.date')}</span>
                    <span>
                      {format(new Date(selectedCell.cell.last_training_date), 'yyyy-MM-dd')}
                    </span>
                  </div>
                )}
                {selectedCell.cell.expiration_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('progress.expirationDate')}</span>
                    <span
                      className={
                        selectedCell.cell.status === 'EXPIRED'
                          ? 'text-status-expired'
                          : selectedCell.cell.status === 'EXPIRING'
                          ? 'text-status-warning'
                          : ''
                      }
                    >
                      {format(new Date(selectedCell.cell.expiration_date), 'yyyy-MM-dd')}
                      {selectedCell.cell.status === 'EXPIRED' && ` ${t('progress.statusExpired')}`}
                      {selectedCell.cell.status === 'EXPIRING' && ` ${t('progress.statusExpiring')}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('progress.totalCompletions')}</span>
                  <span>{t('progress.completionCount', { count: selectedCell.cell.completion_count })}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t('progress.noHistory')}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/employees/${selectedCell?.employee.employee_id}`)
                }
              >
                {t('progress.employeeDetail')}
              </Button>
              <Button onClick={() => setSelectedCell(null)}>{t('common.close')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
