import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, Search, Download } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTrainingStore } from '@/stores/trainingStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { buildings, departments, categories } from '@/data/mockData';
import { format } from 'date-fns';

export default function Retraining() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { retrainingTargets, expiringTrainings, loading, fetchRetrainingTargets, fetchExpiringTrainings } = useTrainingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchRetrainingTargets();
    fetchExpiringTrainings(30);
  }, []);

  // Filter retraining targets
  const filteredRetrainingTargets = retrainingTargets.filter(target => {
    const matchesSearch = searchQuery === '' ||
      target.employee.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      target.employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      target.program.program_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBuilding = buildingFilter === 'all' || target.employee.building === buildingFilter;
    const matchesDepartment = departmentFilter === 'all' || target.employee.department === departmentFilter;
    const matchesCategory = categoryFilter === 'all' || target.program.category === categoryFilter;
    return matchesSearch && matchesBuilding && matchesDepartment && matchesCategory;
  });

  // Filter expiring trainings
  const filteredExpiringTrainings = expiringTrainings.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.employee.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.program.program_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBuilding = buildingFilter === 'all' || item.employee.building === buildingFilter;
    const matchesDepartment = departmentFilter === 'all' || item.employee.department === departmentFilter;
    const matchesCategory = categoryFilter === 'all' || item.program.category === categoryFilter;
    return matchesSearch && matchesBuilding && matchesDepartment && matchesCategory;
  });

  if (loading.retraining) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('retraining.title')}</h1>
          <p className="text-muted-foreground">
            재교육이 필요한 직원과 만료 예정인 교육을 관리하세요
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('common.export')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">재교육 필요</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {retrainingTargets.length}명
            </div>
            <p className="text-xs text-muted-foreground">
              불합격으로 인한 재교육 대상자
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">만료 예정</CardTitle>
            <Clock className="h-4 w-4 text-status-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-warning">
              {expiringTrainings.length}건
            </div>
            <p className="text-xs text-muted-foreground">
              30일 이내 만료 예정 교육
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="사번, 이름, 프로그램 검색..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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

      {/* Tabs */}
      <Tabs defaultValue="failed">
        <TabsList>
          <TabsTrigger value="failed">
            <AlertTriangle className="h-4 w-4 mr-2" />
            불합격 재교육 ({filteredRetrainingTargets.length})
          </TabsTrigger>
          <TabsTrigger value="expiring">
            <Clock className="h-4 w-4 mr-2" />
            만료 예정 ({filteredExpiringTrainings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="failed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('retraining.failed')}</CardTitle>
              <CardDescription>
                불합격으로 인해 재교육이 필요한 직원 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRetrainingTargets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  재교육이 필요한 직원이 없습니다
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>사번</TableHead>
                      <TableHead>{t('employee.name')}</TableHead>
                      <TableHead>{t('employee.building')}</TableHead>
                      <TableHead>{t('employee.department')}</TableHead>
                      <TableHead>프로그램</TableHead>
                      <TableHead>불합격일</TableHead>
                      <TableHead className="text-center">점수</TableHead>
                      <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRetrainingTargets.map((target, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {target.employee.employee_id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {target.employee.employee_name}
                        </TableCell>
                        <TableCell>
                          {t(`building.${target.employee.building}`)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{target.employee.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="mb-1">
                              {target.program.program_code}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {target.program.program_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(target.lastResult.training_date), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">
                            {target.lastResult.score ?? 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/employees/${target.employee.employee_id}`)}
                          >
                            상세
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('progress.expiring')}</CardTitle>
              <CardDescription>
                30일 이내에 교육 유효기간이 만료되는 직원 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExpiringTrainings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  만료 예정인 교육이 없습니다
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>사번</TableHead>
                      <TableHead>{t('employee.name')}</TableHead>
                      <TableHead>{t('employee.building')}</TableHead>
                      <TableHead>{t('employee.department')}</TableHead>
                      <TableHead>프로그램</TableHead>
                      <TableHead>교육일</TableHead>
                      <TableHead>만료일</TableHead>
                      <TableHead>남은 일수</TableHead>
                      <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpiringTrainings.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {item.employee.employee_id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.employee.employee_name}
                        </TableCell>
                        <TableCell>
                          {t(`building.${item.employee.building}`)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.employee.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="mb-1">
                              {item.program.program_code}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {item.program.program_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.lastPassDate), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.expirationDate), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.daysUntilExpiry <= 7 ? 'destructive' : 'warning'}
                          >
                            {item.daysUntilExpiry}일
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/employees/${item.employee.employee_id}`)}
                          >
                            상세
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
