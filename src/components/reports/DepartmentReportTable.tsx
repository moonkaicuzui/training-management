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
import type { DepartmentReport } from './types';

interface DepartmentReportTableProps {
  reports: DepartmentReport[];
  departments: Array<{ value: string; label: string }>;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
}

export function DepartmentReportTable({
  reports,
  departments,
  selectedDepartment,
  onDepartmentChange,
}: DepartmentReportTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('reports.deptTitle')}</CardTitle>
          <CardDescription>{t('reports.deptDescription')}</CardDescription>
        </div>
        <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('reports.allDepartments')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reports.allDepartments')}</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.value} value={dept.value}>
                {dept.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reports.colDepartment')}</TableHead>
              <TableHead className="text-right">{t('reports.colEmployeeCount')}</TableHead>
              <TableHead className="text-right">{t('reports.colCompleted')}</TableHead>
              <TableHead className="text-right">{t('reports.colIncomplete')}</TableHead>
              <TableHead className="text-right">{t('reports.colCompletionRate')}</TableHead>
              <TableHead className="text-right">{t('reports.colAvgScore')}</TableHead>
              <TableHead className="text-right">{t('reports.colPassRate')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.department}>
                <TableCell className="font-medium">{report.department}</TableCell>
                <TableCell className="text-right">{report.totalEmployees}</TableCell>
                <TableCell className="text-right">{report.completedTrainings}</TableCell>
                <TableCell className="text-right">{report.pendingTrainings}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={report.completionRate >= 80 ? 'success' : report.completionRate >= 50 ? 'warning' : 'destructive'}>
                    {report.completionRate}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{report.averageScore}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={report.passRate >= 80 ? 'success' : report.passRate >= 50 ? 'warning' : 'destructive'}>
                    {report.passRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
