import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useTrainingStore } from '@/stores/trainingStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { departments, positions, buildings } from '@/data/mockData';
import { format } from 'date-fns';

export default function Employees() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employees, loading, fetchEmployees } = useTrainingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  useEffect(() => {
    fetchEmployees({
      search: searchQuery || undefined,
      department: departmentFilter !== 'all' ? departmentFilter as any : undefined,
      position: positionFilter !== 'all' ? positionFilter as any : undefined,
      building: buildingFilter !== 'all' ? buildingFilter as any : undefined,
      status: statusFilter !== 'all' ? statusFilter as any : undefined,
    });
  }, [searchQuery, departmentFilter, positionFilter, buildingFilter, statusFilter]);

  if (loading.employees) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('employee.title')}</h1>
          <p className="text-muted-foreground">
            직원 정보 및 교육 이력을 관리하세요
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('employee.addEmployee')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="사번 또는 이름..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
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
            <Select value={positionFilter} onValueChange={setPositionFilter}>
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
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>직원 목록</CardTitle>
          <CardDescription>{employees.length}명의 직원</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employee.id')}</TableHead>
                <TableHead>{t('employee.name')}</TableHead>
                <TableHead>{t('employee.department')}</TableHead>
                <TableHead>{t('employee.position')}</TableHead>
                <TableHead>{t('employee.building')}</TableHead>
                <TableHead>{t('employee.line')}</TableHead>
                <TableHead>{t('employee.hireDate')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.employee_id}>
                    <TableCell className="font-mono font-medium">
                      {employee.employee_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {employee.employee_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.department}</Badge>
                    </TableCell>
                    <TableCell>{t(`position.${employee.position}`)}</TableCell>
                    <TableCell>{t(`building.${employee.building}`)}</TableCell>
                    <TableCell>{employee.line}</TableCell>
                    <TableCell>
                      {format(new Date(employee.hire_date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'inactive'}>
                        {employee.status === 'ACTIVE' ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/employees/${employee.employee_id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
