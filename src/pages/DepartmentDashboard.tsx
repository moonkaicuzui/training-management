import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/common/LoadingSpinner';
import {
  DepartmentKPICards,
  DepartmentCharts,
  EmployeeListTable,
  RankedEmployeeTable,
} from '@/components/department';
import type { EmployeeStats } from '@/components/department';
import * as api from '@/services/api';
import type {
  Employee,
  TrainingProgram,
  TrainingResultRecord,
} from '@/types';

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
        setError(err instanceof Error ? err.message : t('common.errors.loadFailed'));
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

    const empsWithPass = new Set(
      filteredResults.filter((r) => r.result === 'PASS').map((r) => r.employee_id)
    );
    const completionRate = (empsWithPass.size / totalEmps) * 100;

    const totalResults = filteredResults.length;
    const passResults = filteredResults.filter((r) => r.result === 'PASS').length;
    const passRate = totalResults > 0 ? (passResults / totalResults) * 100 : 0;

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

  // ---------- Employee Stats ----------

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
      <DepartmentKPICards kpis={kpis} />

      {/* Charts Row */}
      <DepartmentCharts
        completionByProgram={completionByProgram}
        passRateTrend={passRateTrend}
      />

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

        <TabsContent value="employees">
          <EmployeeListTable
            employeeStats={employeeStats}
            totalEmployees={filteredEmployees.length}
          />
        </TabsContent>

        <TabsContent value="top">
          <RankedEmployeeTable
            title={t('departmentDashboard.topPerformers')}
            employees={topPerformers}
            variant="top"
          />
        </TabsContent>

        <TabsContent value="risk">
          <RankedEmployeeTable
            title={t('departmentDashboard.atRiskEmployees')}
            employees={atRiskEmployees}
            variant="risk"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
