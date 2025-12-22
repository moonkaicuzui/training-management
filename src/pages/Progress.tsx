import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
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
import { PageLoading } from '@/components/common/LoadingSpinner';
import { buildings, departments, positions, categories } from '@/data/mockData';
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

  if (loading) {
    return <PageLoading />;
  }

  const employees = progressMatrix?.employees || [];
  const programs = progressMatrix?.programs || [];
  const matrix = progressMatrix?.matrix || {};

  // Calculate stats
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

  const handleCellClick = (
    employee: NormalizedEmployee,
    program: NormalizedTrainingProgram
  ) => {
    const employeeMatrix = matrix[employee.employee_id as EmployeeId];
    const cell = employeeMatrix?.[program.program_code as ProgramCode];
    setSelectedCell({ employee, program, cell });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('progress.title')}</h1>
          <p className="text-muted-foreground">
            직원별 교육 이수 현황을 한눈에 확인하세요
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('common.export')}
        </Button>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium">범례:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-status-pass/20 text-status-pass text-sm">✓</span>
              <span className="text-sm">합격</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-destructive/20 text-destructive text-sm">✗</span>
              <span className="text-sm">불합격</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-status-warning/20 text-status-warning text-sm">⚠</span>
              <span className="text-sm">만료 임박</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-status-expired/20 text-status-expired text-sm">⏰</span>
              <span className="text-sm">만료됨</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">−</span>
              <span className="text-sm">미이수</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-pass">{passCount}</div>
            <p className="text-xs text-muted-foreground">합격</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{failCount}</div>
            <p className="text-xs text-muted-foreground">불합격</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-warning">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">만료 임박</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-expired">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">만료됨</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-muted-foreground">{notTakenCount}</div>
            <p className="text-xs text-muted-foreground">미이수</p>
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
          <CardTitle>교육 진도 매트릭스</CardTitle>
          <CardDescription>
            {employees.length}명의 직원 × {programs.length}개의 프로그램
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 || programs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.noData')}
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 bg-background border p-2 text-left min-w-[150px]">
                        직원
                      </th>
                      {programs.map((program) => (
                        <TooltipProvider key={program.program_code}>
                          <Tooltip>
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
                                {t(`category.${program.category}`)} · {program.passing_score}점 이상
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
          )}
        </CardContent>
      </Card>

      {/* Cell Detail Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>교육 이력 상세</DialogTitle>
            <DialogDescription>
              {selectedCell?.employee.employee_name} - {selectedCell?.program.program_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">직원</p>
                <p className="font-medium">{selectedCell?.employee.employee_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCell?.employee.employee_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">프로그램</p>
                <p className="font-medium">{selectedCell?.program.program_code}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCell?.program.program_name}
                </p>
              </div>
            </div>

            {selectedCell?.cell ? (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">최근 결과</span>
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
                    <span className="text-sm text-muted-foreground">점수</span>
                    <span className="font-medium">{selectedCell.cell.last_score}점</span>
                  </div>
                )}
                {selectedCell.cell.last_grade && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">등급</span>
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
                    <span className="text-sm text-muted-foreground">교육일</span>
                    <span>
                      {format(new Date(selectedCell.cell.last_training_date), 'yyyy-MM-dd')}
                    </span>
                  </div>
                )}
                {selectedCell.cell.expiration_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">만료일</span>
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
                      {selectedCell.cell.status === 'EXPIRED' && ' (만료됨)'}
                      {selectedCell.cell.status === 'EXPIRING' && ' (만료 임박)'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">총 이수 횟수</span>
                  <span>{selectedCell.cell.completion_count}회</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                교육 이력이 없습니다
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/employees/${selectedCell?.employee.employee_id}`)
                }
              >
                직원 상세
              </Button>
              <Button onClick={() => setSelectedCell(null)}>닫기</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
