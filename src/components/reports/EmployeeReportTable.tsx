import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EmployeeExportItem } from './types';

interface EmployeeReportTableProps {
  data: EmployeeExportItem[];
  departments: Array<{ value: string; label: string }>;
  positions: Array<{ value: string; label: string }>;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  selectedPosition: string;
  onPositionChange: (value: string) => void;
}

export function EmployeeReportTable({
  data,
  departments,
  positions,
  selectedDepartment,
  onDepartmentChange,
  selectedPosition,
  onPositionChange,
}: EmployeeReportTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <div>
          <CardTitle>{t('reports.empTitle')}</CardTitle>
          <CardDescription>{t('reports.empDescription')}</CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('reports.empAllDepartments')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reports.empAllDepartments')}</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPosition} onValueChange={onPositionChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('reports.empAllPositions')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reports.empAllPositions')}</SelectItem>
              {positions.map((pos) => (
                <SelectItem key={pos.value} value={pos.value}>
                  {pos.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reports.colEmployeeId')}</TableHead>
              <TableHead>{t('reports.colEmployeeName')}</TableHead>
              <TableHead>{t('reports.colDepartment')}</TableHead>
              <TableHead>{t('reports.empFilterPosition')}</TableHead>
              <TableHead>{t('reports.colBuilding')}</TableHead>
              <TableHead>{t('reports.colLine')}</TableHead>
              <TableHead className="text-right">{t('reports.colPassCount')}</TableHead>
              <TableHead className="text-right">{t('reports.colTotalTrainings')}</TableHead>
              <TableHead className="text-right">{t('reports.colCompletionRateEmp')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((emp) => {
              const completionRate = emp.totalCount > 0
                ? Math.round((emp.passCount / emp.totalCount) * 100)
                : 0;
              return (
                <TableRow key={emp.employee_id}>
                  <TableCell>
                    <Badge variant="outline">{emp.employee_id}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{emp.employee_name}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{emp.building}</TableCell>
                  <TableCell>{emp.line}</TableCell>
                  <TableCell className="text-right text-green-600">{emp.passCount}</TableCell>
                  <TableCell className="text-right">{emp.totalCount}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={completionRate >= 80 ? 'success' : completionRate >= 50 ? 'warning' : 'destructive'}>
                      {completionRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
