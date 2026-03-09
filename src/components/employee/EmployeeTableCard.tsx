import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { VirtualTable, type VirtualTableColumn } from '@/components/common/VirtualTable';
import { EmptyState } from '@/components/common/EmptyState';
import { format } from 'date-fns';
import type { Employee } from '@/types';

interface EmployeeTableCardProps {
  employees: Employee[];
  onAddEmployee: () => void;
}

export function EmployeeTableCard({
  employees,
  onAddEmployee,
}: EmployeeTableCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('employee.list')}</CardTitle>
        <CardDescription>{t('employee.count', { count: employees.length })}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <VirtualTable
          data={employees}
          columns={columns}
          rowKey={(employee) => employee.employee_id}
          maxHeight={600}
          emptyMessage={
            <EmptyState
              icon={Users}
              title={t('employee.emptyTitle')}
              description={t('employee.emptyDescription')}
              actionLabel={t('employee.addEmployee')}
              onAction={onAddEmployee}
            />
          }
          onRowClick={(employee) => navigate(`/employees/${employee.employee_id}`)}
          virtualizationThreshold={50}
        />
      </CardContent>
    </Card>
  );
}
