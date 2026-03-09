import { useTranslation } from 'react-i18next';
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
import { Badge } from '@/components/ui/badge';
import type { EmployeeStats } from './types';
import { getPassRateColor, getPassRateBadge } from './types';

interface EmployeeListTableProps {
  employeeStats: EmployeeStats[];
  totalEmployees: number;
}

export function EmployeeListTable({ employeeStats, totalEmployees }: EmployeeListTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('departmentDashboard.employeeList')}</CardTitle>
        <CardDescription>
          {totalEmployees} {t('departmentDashboard.totalEmployees').toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employee.name')}</TableHead>
                <TableHead>{t('employee.position')}</TableHead>
                <TableHead>{t('employee.building')}</TableHead>
                <TableHead>{t('employee.line')}</TableHead>
                <TableHead className="text-center">
                  {t('departmentDashboard.completedTrainings')}
                </TableHead>
                <TableHead className="text-center">
                  {t('departmentDashboard.passRate')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t('departmentDashboard.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                employeeStats.map((stat) => (
                  <TableRow key={stat.employee.employee_id}>
                    <TableCell className="font-medium">
                      {stat.employee.employee_name}
                    </TableCell>
                    <TableCell>
                      {t(`position.${stat.employee.position}`, stat.employee.position)}
                    </TableCell>
                    <TableCell>
                      {t(`building.${stat.employee.building}`, stat.employee.building)}
                    </TableCell>
                    <TableCell>{stat.employee.line}</TableCell>
                    <TableCell className="text-center">{stat.completedCount}</TableCell>
                    <TableCell className="text-center">
                      {stat.totalResults > 0 ? (
                        <Badge variant={getPassRateBadge(stat.passRate)}>
                          <span className={getPassRateColor(stat.passRate)}>
                            {stat.passRate}%
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
