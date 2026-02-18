import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  RefreshCcw,
  Building2,
} from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import { PageLoading } from '@/components/common/LoadingSpinner';
import * as api from '@/services/api';
import type {
  Employee,
  TrainingProgram,
  TrainingResultRecord,
} from '@/types';

// ---------- Helpers ----------

function getPassRateColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-600';
  if (rate >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getPassRateBadge(rate: number): 'default' | 'secondary' | 'destructive' {
  if (rate >= 80) return 'default';
  if (rate >= 60) return 'secondary';
  return 'destructive';
}

interface EmployeeStats {
  employee: Employee;
  completedCount: number;
  passRate: number;
  totalResults: number;
  passResults: number;
}

// ---------- Component ----------

export default function DepartmentDashboard() {
  const { t } = useTranslation();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [results, setResults] = useState<TrainingResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('__all__');

  // Fetch all data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [emps, progs, res] = await Promise.all([
          api.getEmployees(),
          api.getPrograms(),
          api.getResults(),
        ]);
        setEmployees(emps);
        setPrograms(progs);
        setResults(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Extract unique departments
  const departments = useMemo(() => {
    const deptSet = new Set(employees.map((e) => e.department));
    return Array.from(deptSet).sort();
  }, [employees]);

  // Filter employees by department
  const filteredEmployees = useMemo(() => {
    if (selectedDepartment === '__all__') return employees.filter((e) => e.status === 'ACTIVE');
    return employees.filter(
      (e) => e.department === selectedDepartment && e.status === 'ACTIVE'
    );
  }, [employees, selectedDepartment]);

  // Results for filtered employees
  const filteredResults = useMemo(() => {
    const empIds = new Set(filteredEmployees.map((e) => e.employee_id));
    return results.filter((r) => empIds.has(r.employee_id));
  }, [filteredEmployees, results]);

  // ---------- KPI Calculations ----------

  const kpis = useMemo(() => {
    const totalEmps = filteredEmployees.length;
    if (totalEmps === 0) {
      return {
        totalEmployees: 0,
        completionRate: 0,
        passRate: 0,
        expiringCerts: 0,
        retrainingNeeded: 0,
      };
    }

    // Completion rate: employees with at least one PASS result
    const empsWithPass = new Set(
      filteredResults.filter((r) => r.result === 'PASS').map((r) => r.employee_id)
    );
    const completionRate = (empsWithPass.size / totalEmps) * 100;

    // Pass rate: pass results / total results
    const totalResults = filteredResults.length;
    const passResults = filteredResults.filter((r) => r.result === 'PASS').length;
    const passRate = totalResults > 0 ? (passResults / totalResults) * 100 : 0;

    // Expiring certifications: employees with PASS results that expire within 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const programMap = new Map(programs.map((p) => [p.program_code, p]));

    let expiringCount = 0;
    const expiringEmps = new Set<string>();
    filteredResults
      .filter((r) => r.result === 'PASS')
      .forEach((r) => {
        const program = programMap.get(r.program_code);
        if (program?.validity_months && r.training_date) {
          const trainingDate = new Date(r.training_date);
          const expirationDate = new Date(trainingDate);
          expirationDate.setMonth(expirationDate.getMonth() + program.validity_months);
          if (expirationDate >= now && expirationDate <= thirtyDaysFromNow) {
            if (!expiringEmps.has(r.employee_id)) {
              expiringEmps.add(r.employee_id);
              expiringCount++;
            }
          }
        }
      });

    // Retraining needed: employees with needs_retraining=true in their latest result
    const latestResultMap = new Map<string, TrainingResultRecord>();
    filteredResults.forEach((r) => {
      const key = `${r.employee_id}_${r.program_code}`;
      const existing = latestResultMap.get(key);
      if (!existing || r.training_date > existing.training_date) {
        latestResultMap.set(key, r);
      }
    });
    const retrainingNeeded = new Set(
      Array.from(latestResultMap.values())
        .filter((r) => r.needs_retraining)
        .map((r) => r.employee_id)
    ).size;

    return {
      totalEmployees: totalEmps,
      completionRate: Math.round(completionRate * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      expiringCerts: expiringCount,
      retrainingNeeded,
    };
  }, [filteredEmployees, filteredResults, programs]);

  // ---------- Completion by Program Chart Data ----------

  const completionByProgram = useMemo(() => {
    const programMap = new Map(programs.map((p) => [p.program_code, p]));
    const totalEmps = filteredEmployees.length;
    if (totalEmps === 0) return [];

    // Group results by program
    const programResults = new Map<string, Set<string>>();
    filteredResults
      .filter((r) => r.result === 'PASS')
      .forEach((r) => {
        if (!programResults.has(r.program_code)) {
          programResults.set(r.program_code, new Set());
        }
        programResults.get(r.program_code)!.add(r.employee_id);
      });

    return Array.from(programResults.entries())
      .map(([code, passedEmps]) => {
        const program = programMap.get(code);
        return {
          name: program?.program_name || code,
          completionRate: Math.round((passedEmps.size / totalEmps) * 100),
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10);
  }, [filteredEmployees, filteredResults, programs]);

  // ---------- Pass Rate Trend (Monthly, Last 6 Months) ----------

  const passRateTrend = useMemo(() => {
    const now = new Date();
    const months: { label: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }

    return months.map(({ label, year, month }) => {
      const monthResults = filteredResults.filter((r) => {
        if (!r.training_date) return false;
        const d = new Date(r.training_date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const total = monthResults.length;
      const passed = monthResults.filter((r) => r.result === 'PASS').length;
      return {
        name: label,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        total,
      };
    });
  }, [filteredResults]);

  // ---------- Employee Stats Table ----------

  const employeeStats: EmployeeStats[] = useMemo(() => {
    const resultsByEmployee = new Map<string, TrainingResultRecord[]>();
    filteredResults.forEach((r) => {
      if (!resultsByEmployee.has(r.employee_id)) {
        resultsByEmployee.set(r.employee_id, []);
      }
      resultsByEmployee.get(r.employee_id)!.push(r);
    });

    return filteredEmployees.map((emp) => {
      const empResults = resultsByEmployee.get(emp.employee_id) || [];
      const totalResults = empResults.length;
      const passResults = empResults.filter((r) => r.result === 'PASS').length;
      const passRate = totalResults > 0 ? (passResults / totalResults) * 100 : 0;
      // Count unique programs with PASS
      const completedPrograms = new Set(
        empResults.filter((r) => r.result === 'PASS').map((r) => r.program_code)
      );
      return {
        employee: emp,
        completedCount: completedPrograms.size,
        passRate: Math.round(passRate * 10) / 10,
        totalResults,
        passResults,
      };
    });
  }, [filteredEmployees, filteredResults]);

  // Top performers and at-risk
  const topPerformers = useMemo(
    () =>
      [...employeeStats]
        .filter((e) => e.totalResults > 0)
        .sort((a, b) => b.passRate - a.passRate)
        .slice(0, 5),
    [employeeStats]
  );

  const atRiskEmployees = useMemo(
    () =>
      [...employeeStats]
        .filter((e) => e.totalResults > 0 && e.passRate < 60)
        .sort((a, b) => a.passRate - b.passRate)
        .slice(0, 5),
    [employeeStats]
  );

  // ---------- Render ----------

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {t('departmentDashboard.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('departmentDashboard.description')}
          </p>
        </div>
        <div className="w-full sm:w-[280px]">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder={t('departmentDashboard.selectDepartment')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {t('departmentDashboard.allDepartments')}
              </SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {t(`department.${dept}`, dept)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('departmentDashboard.totalEmployees')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('departmentDashboard.completionRate')}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.completionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('departmentDashboard.passRate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.passRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('departmentDashboard.expiringCerts')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.expiringCerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('departmentDashboard.retrainingNeeded')}
            </CardTitle>
            <RefreshCcw className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.retrainingNeeded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion by Program */}
        <Card>
          <CardHeader>
            <CardTitle>{t('departmentDashboard.completionByProgram')}</CardTitle>
          </CardHeader>
          <CardContent>
            {completionByProgram.length > 0 ? (
              <LazyBarChart
                data={completionByProgram}
                height={300}
                bars={[
                  {
                    dataKey: 'completionRate',
                    name: t('departmentDashboard.completionRate'),
                    fill: '#3b82f6',
                    radius: [4, 4, 0, 0],
                  },
                ]}
                xAxisKey="name"
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t('departmentDashboard.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pass Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t('departmentDashboard.passRateTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            {passRateTrend.some((m) => m.total > 0) ? (
              <LazyBarChart
                data={passRateTrend}
                height={300}
                bars={[
                  {
                    dataKey: 'passRate',
                    name: t('departmentDashboard.passRate'),
                    fill: '#10b981',
                    radius: [4, 4, 0, 0],
                  },
                ]}
                xAxisKey="name"
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t('departmentDashboard.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Employee List / Top Performers / At-Risk */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">
            {t('departmentDashboard.employeeList')}
          </TabsTrigger>
          <TabsTrigger value="top">
            {t('departmentDashboard.topPerformers')}
          </TabsTrigger>
          <TabsTrigger value="risk">
            {t('departmentDashboard.atRiskEmployees')}
          </TabsTrigger>
        </TabsList>

        {/* Employee List */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>{t('departmentDashboard.employeeList')}</CardTitle>
              <CardDescription>
                {filteredEmployees.length} {t('departmentDashboard.totalEmployees').toLowerCase()}
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
        </TabsContent>

        {/* Top Performers */}
        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle>{t('departmentDashboard.topPerformers')}</CardTitle>
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
                    {topPerformers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {t('departmentDashboard.noData')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      topPerformers.map((stat, idx) => (
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
                            <Badge variant="default">
                              <span className="text-emerald-600">{stat.passRate}%</span>
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
        </TabsContent>

        {/* At-Risk Employees */}
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>{t('departmentDashboard.atRiskEmployees')}</CardTitle>
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
                    {atRiskEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {t('departmentDashboard.noData')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      atRiskEmployees.map((stat, idx) => (
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
                            <Badge variant="destructive">
                              <span className="text-red-600">{stat.passRate}%</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
