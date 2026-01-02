import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Building, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTrainingStore } from '@/stores/trainingStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    selectedEmployee,
    employeeHistory,
    loading,
    fetchEmployee,
    fetchEmployeeHistory,
  } = useTrainingStore();

  useEffect(() => {
    if (id) {
      fetchEmployee(id);
      fetchEmployeeHistory(id);
    }
  }, [id]);

  if (loading.employees || !selectedEmployee) {
    return <PageLoading />;
  }

  const passedResults = employeeHistory.filter((r) => r.result === 'PASS');
  const failedResults = employeeHistory.filter((r) => r.result === 'FAIL');

  // Calculate working years (memo to avoid impure Date.now() during render)
  const workingYears = useMemo(() => {
    const now = new Date();
    const hireDate = new Date(selectedEmployee.hire_date);
    return Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }, [selectedEmployee.hire_date]);
  const avgScore =
    employeeHistory.filter((r) => r.score !== null).length > 0
      ? Math.round(
          employeeHistory
            .filter((r) => r.score !== null)
            .reduce((sum, r) => sum + (r.score || 0), 0) /
            employeeHistory.filter((r) => r.score !== null).length
        )
      : 0;

  const gradeDistribution = employeeHistory.reduce(
    (acc, r) => {
      if (r.grade) {
        acc[r.grade] = (acc[r.grade] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/employees')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {selectedEmployee.employee_name}
          </h1>
          <p className="text-muted-foreground">
            {selectedEmployee.employee_id} · {t(`position.${selectedEmployee.position}`)}
          </p>
        </div>
        <Badge
          variant={selectedEmployee.status === 'ACTIVE' ? 'success' : 'inactive'}
          className="ml-auto"
        >
          {selectedEmployee.status === 'ACTIVE' ? t('common.active') : t('common.inactive')}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('employee.department')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{selectedEmployee.department}</div>
            <p className="text-xs text-muted-foreground">
              {t(`building.${selectedEmployee.building}`)} · {selectedEmployee.line}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('employee.hireDate')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {format(new Date(selectedEmployee.hire_date), 'yyyy-MM-dd')}
            </div>
            <p className="text-xs text-muted-foreground">
              {workingYears}년 근무
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">교육 이수</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {passedResults.length}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {employeeHistory.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              합격률{' '}
              {employeeHistory.length > 0
                ? Math.round((passedResults.length / employeeHistory.length) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{avgScore}점</div>
            <div className="flex gap-1 mt-1">
              {Object.entries(gradeDistribution).map(([grade, count]) => (
                <Badge
                  key={grade}
                  variant={
                    grade === 'AA'
                      ? 'gradeAA'
                      : grade === 'A'
                      ? 'gradeA'
                      : grade === 'B'
                      ? 'gradeB'
                      : 'gradeC'
                  }
                  className="text-xs"
                >
                  {grade}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training History Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>{t('employee.trainingHistory')}</CardTitle>
          <CardDescription>
            모든 교육 이력이 표시됩니다. 이 데이터는 삭제할 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">전체 ({employeeHistory.length})</TabsTrigger>
              <TabsTrigger value="pass">
                합격 ({passedResults.length})
              </TabsTrigger>
              <TabsTrigger value="fail">
                불합격 ({failedResults.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <TrainingHistoryTable results={employeeHistory} />
            </TabsContent>

            <TabsContent value="pass" className="mt-4">
              <TrainingHistoryTable results={passedResults} />
            </TabsContent>

            <TabsContent value="fail" className="mt-4">
              <TrainingHistoryTable results={failedResults} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function TrainingHistoryTable({
  results,
}: {
  results: ReturnType<typeof useTrainingStore.getState>['employeeHistory'];
}) {
  const { t } = useTranslation();

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('common.noData')}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('training.date')}</TableHead>
          <TableHead>프로그램</TableHead>
          <TableHead className="text-center">{t('training.score')}</TableHead>
          <TableHead className="text-center">{t('training.grade')}</TableHead>
          <TableHead className="text-center">{t('training.result')}</TableHead>
          <TableHead>{t('training.trainer')}</TableHead>
          <TableHead>{t('training.remarks')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <TableRow key={result.result_id}>
            <TableCell>
              {format(new Date(result.training_date), 'yyyy-MM-dd')}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{result.program_code}</Badge>
            </TableCell>
            <TableCell className="text-center font-medium">
              {result.score !== null ? `${result.score}점` : '-'}
            </TableCell>
            <TableCell className="text-center">
              {result.grade && (
                <Badge
                  variant={
                    result.grade === 'AA'
                      ? 'gradeAA'
                      : result.grade === 'A'
                      ? 'gradeA'
                      : result.grade === 'B'
                      ? 'gradeB'
                      : 'gradeC'
                  }
                >
                  {result.grade}
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-center">
              <Badge
                variant={
                  result.result === 'PASS'
                    ? 'success'
                    : result.result === 'FAIL'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {result.result === 'PASS'
                  ? t('training.pass')
                  : result.result === 'FAIL'
                  ? t('training.fail')
                  : t('training.absent')}
              </Badge>
            </TableCell>
            <TableCell>{result.evaluated_by}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {result.remarks || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
