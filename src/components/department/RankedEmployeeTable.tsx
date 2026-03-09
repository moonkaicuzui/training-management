import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
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
import { Badge } from '@/components/ui/badge';
import type { EmployeeStats } from './types';

interface RankedEmployeeTableProps {
  title: string;
  employees: EmployeeStats[];
  variant: 'top' | 'risk';
}

export function RankedEmployeeTable({ title, employees, variant }: RankedEmployeeTableProps) {
  const { t } = useTranslation();

  const badgeVariant = variant === 'top' ? 'default' : 'destructive';
  const badgeTextClass = variant === 'top' ? 'text-emerald-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('employee.name')}</TableHead>
                <TableHead>{t('employee.position')}</TableHead>
                <TableHead className="text-center">
                  {t('departmentDashboard.completedTrainings')}
                </TableHead>
                <TableHead className="text-center">
                  {t('departmentDashboard.passRate')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t('departmentDashboard.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((stat, idx) => (
                  <TableRow key={stat.employee.employee_id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {stat.employee.employee_name}
                    </TableCell>
                    <TableCell>
                      {t(`position.${stat.employee.position}`, stat.employee.position)}
                    </TableCell>
                    <TableCell className="text-center">{stat.completedCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={badgeVariant}>
                        <span className={badgeTextClass}>{stat.passRate}%</span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
