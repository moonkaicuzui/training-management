import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Upload } from 'lucide-react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { Button } from '@/components/ui/button';
import { ExportDropdown } from '@/components/common/ExportDropdown';
import { EmployeeSyncStatus } from '@/components/employee/EmployeeSyncStatus';
import { EmployeeFilters } from '@/components/employee/EmployeeFilters';
import { EmployeeTableCard } from '@/components/employee/EmployeeTableCard';
import { EmployeeImportDialog } from '@/components/employee/EmployeeImportDialog';
import { EmployeeCreateDialog } from '@/components/employee/EmployeeCreateDialog';
import { useExport } from '@/hooks/useExport';
import { useEmployeesData, useNormalizedTrainingStore } from '@/stores/normalizedStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import type { Department, Position, Building, EmployeeStatus } from '@/types';

export default function Employees() {
  const { t } = useTranslation();
  const { employees, loading } = useEmployeesData();
  const fetchEmployees = useNormalizedTrainingStore((state) => state.fetchEmployees);
  const createEmployee = useTrainingStore((s) => s.createEmployee);
  const addToast = useUIStore((s) => s.addToast);
  const { exporting, exportExcel, exportPDF } = useExport();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // URL 기반 필터 상태 관리
  const { filters, setFilter } = useUrlFilters({
    defaults: {
      search: '',
      department: 'all',
      position: 'all',
      building: 'all',
      status: 'ACTIVE',
    },
  });

  const { search: searchQuery, department: departmentFilter, position: positionFilter, building: buildingFilter, status: statusFilter } = filters;

  useEffect(() => {
    fetchEmployees({
      search: searchQuery || undefined,
      department: departmentFilter !== 'all' ? departmentFilter as Department : undefined,
      position: positionFilter !== 'all' ? positionFilter as Position : undefined,
      building: buildingFilter !== 'all' ? buildingFilter as Building : undefined,
      status: statusFilter !== 'all' ? statusFilter as EmployeeStatus : undefined,
    });
    // fetchEmployees는 Zustand store에서 제공하는 안정적인 함수이므로 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, departmentFilter, positionFilter, buildingFilter, statusFilter]);

  const handleCreateEmployee = async (formData: {
    employee_id: string;
    employee_name: string;
    department: Department;
    position: Position;
    building: Building;
    line: string;
    hire_date: string;
    status: EmployeeStatus;
  }) => {
    if (!formData.employee_id || !formData.employee_name) {
      addToast({ type: 'error', title: t('messages.requiredFields') });
      return;
    }
    try {
      await createEmployee(formData);
      addToast({ type: 'success', title: t('messages.saveSuccess') });
      setCreateDialogOpen(false);
      fetchEmployees({});
    } catch {
      addToast({ type: 'error', title: t('messages.saveError') });
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('employee.title')}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground">
              {t('employee.description')}
            </p>
            <EmployeeSyncStatus />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportDropdown
            onExportExcel={() =>
              exportExcel(employees as unknown as Record<string, unknown>[], {
                sheetName: 'Employees',
                filename: 'employees',
              })
            }
            onExportPDF={() =>
              exportPDF(
                employees as unknown as Record<string, unknown>[],
                [
                  { header: t('employee.id'), dataKey: 'employee_id' },
                  { header: t('employee.name'), dataKey: 'employee_name' },
                  { header: t('employee.department'), dataKey: 'department' },
                  { header: t('employee.position'), dataKey: 'position' },
                  { header: t('employee.building'), dataKey: 'building' },
                  { header: t('common.status'), dataKey: 'status' },
                ],
                { title: t('employee.title'), filename: 'employees' }
              )
            }
            loading={exporting}
          />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {t('employee.importCsv')}
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('employee.addEmployee')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <EmployeeFilters
        searchQuery={searchQuery}
        departmentFilter={departmentFilter}
        positionFilter={positionFilter}
        buildingFilter={buildingFilter}
        statusFilter={statusFilter}
        onFilterChange={setFilter}
      />

      {/* Employees Table */}
      <EmployeeTableCard
        employees={employees}
        onAddEmployee={() => setCreateDialogOpen(true)}
      />

      {/* CSV Import Dialog */}
      <EmployeeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={() => fetchEmployees({})}
      />

      {/* Create Employee Dialog */}
      <EmployeeCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateEmployee={handleCreateEmployee}
      />
    </div>
  );
}
