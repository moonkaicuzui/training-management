import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Eye } from 'lucide-react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExportDropdown } from '@/components/common/ExportDropdown';
import { useExport } from '@/hooks/useExport';
import { useEmployeesData, useNormalizedTrainingStore } from '@/stores/normalizedStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { VirtualTable, type VirtualTableColumn } from '@/components/common/VirtualTable';
import { departments, positions, buildings } from '@/data/constants';
import { format } from 'date-fns';
import type { Employee, Department, Position, Building, EmployeeStatus } from '@/types';

const emptyEmployeeForm = {
  employee_id: '',
  employee_name: '',
  department: 'ASSEMBLY' as Department,
  position: 'QIP_TQC' as Position,
  building: 'BUILDING_A' as Building,
  line: '',
  hire_date: new Date().toISOString().split('T')[0],
  status: 'ACTIVE' as EmployeeStatus,
};

export default function Employees() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employees, loading } = useEmployeesData();
  const fetchEmployees = useNormalizedTrainingStore((state) => state.fetchEmployees);
  const { createEmployee } = useTrainingStore();
  const { addToast } = useUIStore();
  const { exporting, exportExcel, exportPDF } = useExport();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyEmployeeForm);

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

  const handleCreateEmployee = async () => {
    if (!formData.employee_id || !formData.employee_name) {
      addToast({ type: 'error', title: t('messages.requiredFields') });
      return;
    }
    try {
      await createEmployee(formData);
      addToast({ type: 'success', title: t('messages.saveSuccess') });
      setCreateDialogOpen(false);
      setFormData(emptyEmployeeForm);
      fetchEmployees({});
    } catch {
      addToast({ type: 'error', title: t('messages.saveError') });
    }
  };

  // Define table columns for VirtualTable
  const columns: VirtualTableColumn<Employee>[] = useMemo(() => [
    {
      key: 'employee_id',
      header: t('employee.id'),
      render: (employee) => (
        <span className="font-mono font-medium">{employee.employee_id}</span>
      ),
    },
    {
      key: 'employee_name',
      header: t('employee.name'),
      render: (employee) => (
        <span className="font-medium">{employee.employee_name}</span>
      ),
    },
    {
      key: 'department',
      header: t('employee.department'),
      render: (employee) => (
        <Badge variant="outline">{employee.department}</Badge>
      ),
    },
    {
      key: 'position',
      header: t('employee.position'),
      render: (employee) => t(`position.${employee.position}`),
    },
    {
      key: 'building',
      header: t('employee.building'),
      render: (employee) => t(`building.${employee.building}`),
    },
    {
      key: 'line',
      header: t('employee.line'),
      render: (employee) => employee.line,
    },
    {
      key: 'hire_date',
      header: t('employee.hireDate'),
      render: (employee) => format(new Date(employee.hire_date), 'yyyy-MM-dd'),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (employee) => (
        <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'inactive'}>
          {employee.status === 'ACTIVE' ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      width: '80px',
      render: (employee) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/employees/${employee.employee_id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ], [t, navigate]);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('employee.title')}</h1>
          <p className="text-muted-foreground">
            {t('employee.description')}
          </p>
        </div>
        <div className="flex gap-2">
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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('employee.addEmployee')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('employee.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setFilter('search', e.target.value)}
              />
            </div>
            <Select value={departmentFilter} onValueChange={(v) => setFilter('department', v)}>
              <SelectTrigger>
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
            <Select value={positionFilter} onValueChange={(v) => setFilter('position', v)}>
              <SelectTrigger>
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
            <Select value={buildingFilter} onValueChange={(v) => setFilter('building', v)}>
              <SelectTrigger>
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
            <Select value={statusFilter} onValueChange={(v) => setFilter('status', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
                <SelectItem value="INACTIVE">{t('common.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table with Virtual Scrolling */}
      <Card>
        <CardHeader>
          <CardTitle>{t('employee.list')}</CardTitle>
          <CardDescription>{t('employee.count', { count: employees.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          <VirtualTable
            data={employees}
            columns={columns}
            rowKey={(employee) => employee.employee_id}
            maxHeight={600}
            emptyMessage={t('common.noData')}
            onRowClick={(employee) => navigate(`/employees/${employee.employee_id}`)}
            virtualizationThreshold={50}
          />
        </CardContent>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('employee.addEmployee')}</DialogTitle>
            <DialogDescription>{t('employee.createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('employee.id')} *</Label>
                <Input
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="618030XXX"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('employee.name')} *</Label>
                <Input
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('employee.department')}</Label>
                <Select
                  value={formData.department}
                  onValueChange={(v) => setFormData({ ...formData, department: v as Department })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('employee.position')}</Label>
                <Select
                  value={formData.position}
                  onValueChange={(v) => setFormData({ ...formData, position: v as Position })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {t(`position.${pos.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('employee.building')}</Label>
                <Select
                  value={formData.building}
                  onValueChange={(v) => setFormData({ ...formData, building: v as Building })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((bldg) => (
                      <SelectItem key={bldg.value} value={bldg.value}>
                        {t(`building.${bldg.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('employee.line')}</Label>
                <Input
                  value={formData.line}
                  onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                  placeholder="LINE 1-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('employee.hireDate')}</Label>
              <Input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateEmployee}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
