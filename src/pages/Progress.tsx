import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProgressMatrixData, useNormalizedTrainingStore } from '@/stores/normalizedStore';
import { useExport } from '@/hooks/useExport';
import { PageLoading } from '@/components/common/LoadingSpinner';
import {
  ProgressLegend,
  ProgressStatsCards,
  ProgressFilters,
  ProgressMatrix,
  CellDetailDialog,
} from '@/components/progress';
import type { SelectedCellData, ProgressStats } from '@/components/progress';
import type {
  NormalizedEmployee,
  NormalizedTrainingProgram,
} from '@/types/normalized';
import type { EmployeeId, ProgramCode } from '@/types/branded';
import type { Building, Department, Position, ProgramCategory } from '@/types';

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
  const [selectedCell, setSelectedCell] = useState<SelectedCellData | null>(null);

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
  const stats = useMemo((): ProgressStats => {
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
          [t('progress.export.employeeId')]: emp.employee_id,
          [t('progress.export.name')]: emp.employee_name,
          [t('progress.export.department')]: emp.department,
          [t('progress.export.program')]: prog.program_name,
          [t('progress.export.status')]: cell?.status || 'NOT_TAKEN',
          [t('progress.export.score')]: cell?.last_score ?? '',
          [t('progress.export.grade')]: cell?.last_grade ?? '',
          [t('progress.export.trainingDate')]: cell?.last_training_date ?? '',
        };
      })
    );
    exportExcel(exportData, { filename: 'progress-matrix', sheetName: t('progress.export.sheetName') });
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('progress.title')}</h1>
          <p className="text-muted-foreground">
            {t('progress.description')}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? t('progress.export.loading') : t('common.export')}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <ProgressLegend />

      <ProgressStatsCards stats={stats} />

      <ProgressFilters
        buildingFilter={buildingFilter}
        onBuildingFilterChange={setBuildingFilter}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={setDepartmentFilter}
        positionFilter={positionFilter}
        onPositionFilterChange={setPositionFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      <ProgressMatrix
        employees={employees}
        programs={programs}
        matrix={matrix}
        onCellClick={handleCellClick}
        onEmployeeClick={(employeeId: string) => navigate(`/employees/${employeeId}`)}
      />

      <CellDetailDialog
        selectedCell={selectedCell}
        onClose={() => setSelectedCell(null)}
        onEmployeeDetail={(employeeId: string) => navigate(`/employees/${employeeId}`)}
      />
    </div>
  );
}
