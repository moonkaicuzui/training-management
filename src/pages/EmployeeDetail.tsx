import { useEffect, useMemo, useCallback, useRef } from 'react';
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
import { useShallow } from 'zustand/react/shallow';
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
  } = useTrainingStore(useShallow((state) => ({
    selectedEmployee: state.selectedEmployee,
    employeeHistory: state.employeeHistory,
    loading: state.loading,
    fetchEmployee: state.fetchEmployee,
    fetchEmployeeHistory: state.fetchEmployeeHistory,
  })));

  // 데이터 로드 함수 메모이제이션
  const loadEmployeeData = useCallback((employeeId: string) => {
    Promise.all([
      fetchEmployee(employeeId),
      fetchEmployeeHistory(employeeId),
    ]);
  }, [fetchEmployee, fetchEmployeeHistory]);

  // 이전 ID 추적으로 불필요한 재로드 방지
  const prevIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (id && id !== prevIdRef.current) {
      prevIdRef.current = id;
      loadEmployeeData(id);
    }
  }, [id, loadEmployeeData]);

  // Calculate working years (memo to avoid impure Date.now() during render)
  // Moved before conditional return to maintain hooks order
  // 의존성 일관성 수정: selectedEmployee.hire_date 사용
  const hireDate = selectedEmployee?.hire_date;
  const workingYears = useMemo(() => {
    if (!hireDate) return 0;
    const now = new Date();
    const hireDateObj = new Date(hireDate);
    return Math.floor((now.getTime() - hireDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }, [hireDate]);

  if (loading.employees || !selectedEmployee) {
    return <PageLoading />;
  }

  const passedResults = employeeHistory.filter((r) => r.result === 'PASS');
  const failedResults = employeeHistory.filter((r) => r.result === 'FAIL');

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
              {t('employee.yearsWorking', { years: workingYears })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('employee.trainingCompletion')}</CardTitle>
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
              {t('employee.passRate')}{' '}
              {employeeHistory.length > 0
                ? Math.round((passedResults.length / employeeHistory.length) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('employee.avgScore')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{t('employee.scoreUnit', { score: avgScore })}</div>
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
            {t('employee.historyDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">{t('employee.allTab', { count: employeeHistory.length })}</TabsTrigger>
              <TabsTrigger value="pass">
                {t('employee.passTab', { count: passedResults.length })}
              </TabsTrigger>
              <TabsTrigger value="fail">
                {t('employee.failTab', { count: failedResults.length })}
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
          <TableHead>{t('common.program')}</TableHead>
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
              {result.score !== null ? t('employee.scoreUnit', { score: result.score }) : '-'}
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
